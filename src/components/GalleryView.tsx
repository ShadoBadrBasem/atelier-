"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ATTACHMENT_CATEGORIES } from "@/lib/constants";
import { deleteAttachment, setCover, updateAttachment } from "@/app/admin/(app)/gallery-actions";
import { btnCls, btnDangerCls, btnGhostCls, inputCls } from "./ui";

export interface GalleryItem {
  id: string;
  category: string;
  caption: string | null;
  isCover: boolean;
  sharedOnTracking: boolean;
  isPdf: boolean;
  sizeBytes: number;
}

interface QueueEntry {
  key: number;
  file: File;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

const catLabel = (k: string) => ATTACHMENT_CATEGORIES.find((c) => c.key === k)?.label ?? k;
const src = (id: string, v: "thumb" | "opt" | "original") => `/api/files/${id}?v=${v}`;

export function GalleryView({
  items,
  owner,
  allowShare,
  defaultCategory = "other",
}: {
  items: GalleryItem[];
  owner: { orderId?: string; clientId?: string };
  allowShare: boolean;
  defaultCategory?: string;
}) {
  const router = useRouter();
  const [category, setCategory] = useState(defaultCategory);
  const [filter, setFilter] = useState<string>("all");
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [compare, setCompare] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef(0);

  const shown = items.filter((i) => filter === "all" || i.category === filter);

  const upload = useCallback(
    (entry: QueueEntry, cat: string) => {
      const fd = new FormData();
      fd.append("files", entry.file);
      fd.append("category", cat);
      if (owner.orderId) fd.append("orderId", owner.orderId);
      if (owner.clientId) fd.append("clientId", owner.clientId);
      const xhr = new XMLHttpRequest();
      const patchEntry = (p: Partial<QueueEntry>) =>
        setQueue((q) => q.map((e) => (e.key === entry.key ? { ...e, ...p } : e)));
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) patchEntry({ progress: Math.round((ev.loaded / ev.total) * 100) });
      };
      xhr.onload = () => {
        let msg = "Upload failed";
        try {
          const body = JSON.parse(xhr.responseText);
          const r = body.results?.[0];
          if (xhr.status === 200 && r?.id) {
            patchEntry({ status: "done", progress: 100 });
            router.refresh();
            return;
          }
          msg = r?.error ?? body.error ?? msg;
        } catch {}
        patchEntry({ status: "error", error: msg });
      };
      xhr.onerror = () => patchEntry({ status: "error", error: "Connection problem. Check your network and retry." });
      patchEntry({ status: "uploading", progress: 0, error: undefined });
      xhr.open("POST", "/api/attachments");
      xhr.send(fd);
    },
    [owner.orderId, owner.clientId, router],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      const accepted = files.filter((f) => f.type.startsWith("image/") || f.type === "application/pdf" || f.name.endsWith(".pdf"));
      const entries = accepted.map((file) => ({ key: ++keyRef.current, file, progress: 0, status: "uploading" as const }));
      setQueue((q) => [...q, ...entries]);
      entries.forEach((e) => upload(e, category));
    },
    [upload, category],
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) addFiles(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  const pickedItems = picked.map((id) => items.find((i) => i.id === id)).filter(Boolean) as GalleryItem[];

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(Array.from(e.dataTransfer.files)); }}
        className={`mb-4 flex flex-col gap-3 border border-dashed p-3 ${dragOver ? "border-oxblood bg-sand/60" : "border-olive/60"}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputCls} !w-auto`} aria-label="Category for new uploads">
            {ATTACHMENT_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <button type="button" className={btnCls} onClick={() => fileRef.current?.click()}>Choose photos / PDF</button>
          <button type="button" className={btnGhostCls} onClick={() => camRef.current?.click()}>Take photo</button>
        </div>
        <p className="text-xs text-ink-soft">Or drop files here, or paste an image. Up to 25 MB each.</p>
        <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" hidden
          onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
        <input ref={camRef} type="file" accept="image/*" capture="environment" hidden
          onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
        {queue.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm">
            {queue.map((q) => (
              <li key={q.key} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate">{q.file.name}</span>
                {q.status === "uploading" && (
                  <span className="w-24 text-end tabular-nums">{q.progress}%</span>
                )}
                {q.status === "done" && <span className="text-olive">Done</span>}
                {q.status === "error" && (
                  <>
                    <span className="text-burnt">{q.error}</span>
                    <button type="button" className="underline" onClick={() => upload(q, category)}>Retry</button>
                  </>
                )}
                {q.status !== "uploading" && (
                  <button type="button" aria-label="Dismiss" className="px-1" onClick={() => setQueue((x) => x.filter((e) => e.key !== q.key))}>×</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {[{ key: "all", label: "All" }, ...ATTACHMENT_CATEGORIES].map((c) => (
          <button key={c.key} type="button" onClick={() => setFilter(c.key)}
            className={`px-3 py-1.5 text-xs uppercase tracking-wider ${filter === c.key ? "bg-oxblood text-cream" : "border border-olive/50"}`}>
            {c.label}
          </button>
        ))}
        <button type="button" onClick={() => { setCompare((v) => !v); setPicked([]); }}
          className={`ms-auto px-3 py-1.5 text-xs uppercase tracking-wider ${compare ? "bg-copper text-oxblood" : "border border-olive/50"}`}>
          {compare ? "Exit compare" : "Compare"}
        </button>
      </div>

      {compare && <p className="mb-2 text-sm text-ink-soft">Select two images to view side by side ({picked.length}/2).</p>}

      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-soft">No files here yet.</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 md:grid-cols-5">
          {shown.map((it, idx) => (
            <li key={it.id} className="relative aspect-square bg-sand/50">
              <button type="button" className="h-full w-full"
                onClick={() => {
                  if (compare) {
                    if (it.isPdf) return;
                    setPicked((p) => p.includes(it.id) ? p.filter((x) => x !== it.id) : [...p.slice(-1), it.id]);
                  } else setOpen(idx);
                }}>
                {it.isPdf ? (
                  <span className="flex h-full items-center justify-center text-sm uppercase tracking-widest">PDF</span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src(it.id, "thumb")} alt={it.caption ?? catLabel(it.category)} loading="lazy" className="h-full w-full object-cover" />
                )}
              </button>
              {it.isCover && <span className="absolute start-1 top-1 bg-oxblood px-1.5 text-[10px] uppercase text-cream">Cover</span>}
              {it.sharedOnTracking && <span className="absolute end-1 top-1 bg-olive px-1.5 text-[10px] uppercase text-cream">Shared</span>}
              {picked.includes(it.id) && <span className="absolute inset-0 border-4 border-copper" />}
            </li>
          ))}
        </ul>
      )}

      {compare && pickedItems.length === 2 && (
        <div className="fixed inset-0 z-50 flex flex-col bg-oxblood/95 p-3">
          <button type="button" className="mb-2 self-end text-cream" onClick={() => setPicked([])}>Close ×</button>
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
            {pickedItems.map((p) => (
              <figure key={p.id} className="flex min-h-0 flex-col">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src(p.id, "opt")} alt="" className="min-h-0 flex-1 object-contain" />
                <figcaption className="pt-1 text-center text-xs text-cream">{catLabel(p.category)}{p.caption ? ` · ${p.caption}` : ""}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      {open !== null && shown[open] && (
        <Lightbox
          key={shown[open].id}
          item={shown[open]}
          allowShare={allowShare}
          hasPrev={open > 0}
          hasNext={open < shown.length - 1}
          onPrev={() => setOpen((o) => (o! > 0 ? o! - 1 : o))}
          onNext={() => setOpen((o) => (o! < shown.length - 1 ? o! + 1 : o))}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

function Lightbox({
  item, allowShare, hasPrev, hasNext, onPrev, onNext, onClose,
}: {
  item: GalleryItem; allowShare: boolean; hasPrev: boolean; hasNext: boolean;
  onPrev: () => void; onNext: () => void; onClose: () => void;
}) {
  const [pending, start] = useTransition();
  const [caption, setCaption] = useState(item.caption ?? "");
  const touch = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-oxblood/95 text-cream" role="dialog" aria-modal="true">
      <div className="flex items-center justify-between p-3">
        <span className="text-xs uppercase tracking-widest">{catLabel(item.category)}</span>
        <button type="button" onClick={onClose} className="px-2 text-2xl leading-none" aria-label="Close">×</button>
      </div>
      <div
        className="min-h-0 flex-1 overflow-auto"
        style={{ touchAction: "pan-x pan-y pinch-zoom" }}
        onTouchStart={(e) => { touch.current = e.touches.length === 1 ? e.touches[0].clientX : null; }}
        onTouchEnd={(e) => {
          if (touch.current === null || (window.visualViewport?.scale ?? 1) > 1.01) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (dx > 60 && hasPrev) onPrev();
          if (dx < -60 && hasNext) onNext();
          touch.current = null;
        }}
      >
        {item.isPdf ? (
          <iframe src={src(item.id, "original")} title="PDF" className="h-full w-full bg-cream" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src(item.id, "opt")} alt={item.caption ?? ""} className="mx-auto max-h-full max-w-full object-contain" />
        )}
      </div>
      <div className="flex flex-col gap-2 bg-cream p-3 text-oxblood">
        <div className="flex gap-2">
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption" className={inputCls} />
          <button type="button" className={btnCls} disabled={pending}
            onClick={() => start(() => updateAttachment(item.id, { caption: caption.trim() || null }))}>Save</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select defaultValue={item.category} className={`${inputCls} !w-auto`} aria-label="Category"
            onChange={(e) => start(() => updateAttachment(item.id, { category: e.target.value }))}>
            {ATTACHMENT_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          {!item.isPdf && (
            <button type="button" className={btnGhostCls} disabled={pending || item.isCover}
              onClick={() => start(() => setCover(item.id))}>{item.isCover ? "Is cover" : "Make cover"}</button>
          )}
          {allowShare && !item.isPdf && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={item.sharedOnTracking} disabled={pending}
                onChange={(e) => start(() => updateAttachment(item.id, { sharedOnTracking: e.target.checked }))} />
              Share on client progress page
            </label>
          )}
          <a className={btnGhostCls} href={`/api/files/${item.id}?v=original&dl=1`}>Download original</a>
          <button type="button" className={`${btnDangerCls} ms-auto`} disabled={pending}
            onClick={() => { if (confirm("Delete this file permanently?")) { start(async () => { await deleteAttachment(item.id); onClose(); }); } }}>Delete</button>
        </div>
      </div>
    </div>
  );
}
