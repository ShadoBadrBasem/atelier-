"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBoardNote, deleteAttachment, deleteBoardNote, updateAttachment, updateBoardNote } from "@/app/admin/(app)/gallery-actions";
import { btnCls, btnGhostCls } from "@/components/ui";

export interface BoardImage {
  kind: "image";
  id: string;
  caption: string | null;
  isPdf: boolean;
  at: number;
}
export interface BoardNoteItem {
  kind: "note";
  id: string;
  text: string;
  tone: string;
  at: number;
}
type Entry = BoardImage | BoardNoteItem;

const TONES = [
  { key: "sand", label: "Sand" },
  { key: "copper", label: "Copper" },
  { key: "olive", label: "Olive" },
  { key: "rose", label: "Rose" },
] as const;

const src = (id: string, v: "thumb" | "opt") => `/api/files/${id}?v=${v}`;

/** A client's inspiration as a mood board: pictures with their own notes, plus loose note cards. */
export function MoodBoard({ clientId, images, notes }: { clientId: string; images: BoardImage[]; notes: BoardNoteItem[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [uploads, setUploads] = useState<{ name: string; error?: string }[]>([]);
  const [composing, setComposing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const entries: Entry[] = [...images, ...notes].sort((a, b) => a.at - b.at);

  const addFiles = useCallback(
    (files: File[]) => {
      const accepted = files.filter((f) => f.type.startsWith("image/") || f.type === "application/pdf");
      if (!accepted.length) return;
      setUploads(accepted.map((f) => ({ name: f.name })));
      const fd = new FormData();
      accepted.forEach((f) => fd.append("files", f));
      fd.append("category", "inspiration");
      fd.append("clientId", clientId);
      fetch("/api/attachments", { method: "POST", body: fd })
        .then(async (r) => {
          const body = await r.json().catch(() => ({}));
          const failed = (body.results ?? []).filter((x: { error?: string }) => x.error);
          setUploads(failed.map((x: { name?: string; error: string }) => ({ name: x.name ?? "File", error: x.error })));
          if (!r.ok && !failed.length) setUploads([{ name: "Upload", error: body.error ?? "Upload failed" }]);
          router.refresh();
        })
        .catch(() => setUploads([{ name: "Upload", error: "Connection problem. Try again." }]));
    },
    [clientId, router],
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if ((e.target as HTMLElement)?.closest("textarea, input")) return;
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) addFiles(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  const opened = images.find((i) => i.id === open);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(Array.from(e.dataTransfer.files)); }}
      className={dragOver ? "mb-drop is-over" : "mb-drop"}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" className={btnCls} onClick={() => fileRef.current?.click()}>Add pictures</button>
        <button type="button" className={btnGhostCls} onClick={() => setComposing(true)}>Add a note</button>
        <span className="at-muted text-sm">Drop or paste pictures anywhere on the board.</span>
        <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" hidden
          onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
      </div>
      {uploads.length > 0 && (
        <ul className="mb-3 text-sm">
          {uploads.map((u, i) => <li key={i} className={u.error ? "text-burnt" : "at-muted"}>{u.name}: {u.error ?? "uploading…"}</li>)}
        </ul>
      )}

      {entries.length === 0 && !composing ? (
        <p className="at-empty">Her board is empty. Add the pictures she sends you and your notes beside them.</p>
      ) : (
        <div className="mb-board">
          {composing && (
            <NoteCard
              initial={{ text: "", tone: "copper" }}
              editing
              onSave={(v) => start(async () => { await createBoardNote(clientId, v); setComposing(false); })}
              onCancel={() => setComposing(false)}
              pending={pending}
            />
          )}
          {entries.map((e) =>
            e.kind === "note" ? (
              <NoteCard
                key={e.id}
                initial={{ text: e.text, tone: e.tone }}
                pending={pending}
                onSave={(v) => start(() => updateBoardNote(e.id, v))}
                onDelete={() => { if (confirm("Delete this note?")) start(() => deleteBoardNote(e.id)); }}
              />
            ) : (
              <ImageCard key={e.id} item={e} pending={pending} onOpen={() => setOpen(e.id)}
                onSave={(caption) => start(() => updateAttachment(e.id, { caption: caption || null }))}
                onDelete={() => { if (confirm("Delete this picture permanently?")) start(() => deleteAttachment(e.id)); }}
              />
            ),
          )}
        </div>
      )}

      {opened && (
        <div className="mb-viewer" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src(opened.id, "opt")} alt={opened.caption ?? ""} />
          {opened.caption && <p>{opened.caption}</p>}
          <button type="button" aria-label="Close" className="mb-viewer-close">×</button>
        </div>
      )}
    </div>
  );
}

function ImageCard({ item, pending, onOpen, onSave, onDelete }: {
  item: BoardImage; pending: boolean; onOpen: () => void; onSave: (caption: string) => void; onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.caption ?? "");
  return (
    <figure className="mb-card mb-photo">
      {item.isPdf ? (
        <a href={`/api/files/${item.id}?v=original`} target="_blank" rel="noreferrer" className="mb-pdf">PDF</a>
      ) : (
        <button type="button" onClick={onOpen} className="block w-full" aria-label="View larger">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src(item.id, "thumb")} alt={item.caption ?? "Inspiration"} loading="lazy" />
        </button>
      )}
      <figcaption>
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea autoFocus rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your note on this picture…" className="mb-input" />
            <div className="flex gap-2">
              <button type="button" disabled={pending} className="mb-link" onClick={() => { onSave(text.trim()); setEditing(false); }}>Save</button>
              <button type="button" className="mb-link" onClick={() => { setText(item.caption ?? ""); setEditing(false); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button type="button" className={`mb-caption ${item.caption ? "" : "is-empty"}`} onClick={() => setEditing(true)}>
            {item.caption ?? "+ Add a note"}
          </button>
        )}
      </figcaption>
      <button type="button" className="mb-remove" aria-label="Delete picture" disabled={pending} onClick={onDelete}>×</button>
    </figure>
  );
}

function NoteCard({ initial, editing: startEditing = false, pending, onSave, onCancel, onDelete }: {
  initial: { text: string; tone: string };
  editing?: boolean;
  pending: boolean;
  onSave: (v: { text: string; tone: "sand" | "copper" | "olive" | "rose" }) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}) {
  const [editing, setEditing] = useState(startEditing);
  const [text, setText] = useState(initial.text);
  const [tone, setTone] = useState(initial.tone);
  return (
    <div className={`mb-card mb-note tone-${tone}`}>
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea autoFocus rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="A note for her board…" className="mb-input" />
          <div className="flex flex-wrap items-center gap-2">
            {TONES.map((t) => (
              <button key={t.key} type="button" aria-label={t.label} aria-pressed={tone === t.key}
                className={`mb-swatch tone-${t.key} ${tone === t.key ? "is-on" : ""}`} onClick={() => setTone(t.key)} />
            ))}
            <span className="ms-auto flex gap-2">
              <button type="button" disabled={pending || !text.trim()} className="mb-link"
                onClick={() => { onSave({ text: text.trim(), tone: tone as "sand" }); if (!onCancel) setEditing(false); }}>Save</button>
              <button type="button" className="mb-link" onClick={() => { if (onCancel) onCancel(); else { setText(initial.text); setTone(initial.tone); setEditing(false); } }}>Cancel</button>
            </span>
          </div>
        </div>
      ) : (
        <button type="button" className="mb-note-text" onClick={() => setEditing(true)}>{initial.text}</button>
      )}
      {onDelete && !editing && <button type="button" className="mb-remove" aria-label="Delete note" disabled={pending} onClick={onDelete}>×</button>}
    </div>
  );
}
