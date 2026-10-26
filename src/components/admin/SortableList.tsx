"use client";

import { useState, useTransition, type ReactNode } from "react";

/**
 * Reorderable list: drag rows by the handle (mouse or touch), or use the arrows.
 * `onReorder` receives the ids in their new order.
 */
export function SortableList({
  items,
  onReorder,
}: {
  items: { id: string; node: ReactNode }[];
  onReorder: (ids: string[]) => Promise<void>;
}) {
  const [order, setOrder] = useState(items.map((i) => i.id));
  const [dragging, setDragging] = useState<string | null>(null);
  const [, start] = useTransition();
  const byId = new Map(items.map((i) => [i.id, i.node]));
  // Keep server updates (new or removed tasks) in step with the local order.
  const ids = [...order.filter((id) => byId.has(id)), ...items.map((i) => i.id).filter((id) => !order.includes(id))];

  const commit = (next: string[]) => {
    setOrder(next);
    start(() => onReorder(next));
  };
  const move = (id: string, by: number) => {
    const from = ids.indexOf(id);
    const to = Math.max(0, Math.min(ids.length - 1, from + by));
    if (from === to) return;
    const next = [...ids];
    next.splice(to, 0, ...next.splice(from, 1));
    commit(next);
  };

  // Pointer dragging works for mouse and touch: the row under the finger swaps in live.
  const onPointerDown = (id: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(id);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-sort-id]");
    const over = el?.dataset.sortId;
    if (!over || over === dragging) return;
    const next = [...ids];
    next.splice(next.indexOf(over), 0, ...next.splice(next.indexOf(dragging), 1));
    setOrder(next);
  };
  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(null);
    start(() => onReorder(ids));
  };

  return (
    <ul className="divide-y divide-olive/20" onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
      {ids.map((id, i) => (
        <li key={id} data-sort-id={id} className={`flex items-start gap-1 ${dragging === id ? "rounded-lg bg-sand/50 shadow-md" : ""}`}>
          <div className="flex shrink-0 flex-col items-center pt-2">
            <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(id, -1)}
              className="h-6 w-8 text-xs text-ink-soft disabled:opacity-25">▲</button>
            <span
              role="button"
              tabIndex={0}
              aria-label="Drag to reorder"
              onPointerDown={onPointerDown(id)}
              onKeyDown={(e) => { if (e.key === "ArrowUp") move(id, -1); if (e.key === "ArrowDown") move(id, 1); }}
              className="cursor-grab touch-none select-none px-2 text-lg leading-none text-ink-soft active:cursor-grabbing"
            >⋮⋮</span>
            <button type="button" aria-label="Move down" disabled={i === ids.length - 1} onClick={() => move(id, 1)}
              className="h-6 w-8 text-xs text-ink-soft disabled:opacity-25">▼</button>
          </div>
          <div className="min-w-0 flex-1">{byId.get(id)}</div>
        </li>
      ))}
    </ul>
  );
}
