"use client";

import { useState } from "react";
import { inputCls } from "@/components/ui";

export interface WaOption {
  key: string;
  label: string;
  body: string;
  orderId?: string | null;
}

function logSend(payload: Record<string, unknown>) {
  const data = JSON.stringify(payload);
  // sendBeacon survives the page switching to WhatsApp; fetch keepalive is the fallback.
  if (!navigator.sendBeacon?.("/api/messages", new Blob([data], { type: "application/json" }))) {
    void fetch("/api/messages", { method: "POST", body: data, headers: { "Content-Type": "application/json" }, keepalive: true });
  }
}

/**
 * Pick a message, adjust the text if needed, and open WhatsApp with it filled in.
 * On the founder's phone it sends from her own WhatsApp number.
 */
export function WhatsAppSend({
  to,
  clientId,
  options,
  rtl,
}: {
  to: string;
  clientId?: string | null;
  options: WaOption[];
  rtl?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const [edited, setEdited] = useState<Record<number, string>>({});
  const opt = options[idx];
  const body = edited[idx] ?? opt.body;
  const [sent, setSent] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Message">
        {options.map((o, i) => (
          <button
            key={`${o.key}-${o.orderId ?? ""}`}
            type="button"
            role="tab"
            aria-selected={i === idx}
            onClick={() => setIdx(i)}
            className={`at-pill min-h-9 ${i === idx ? "bg-oxblood text-cream" : "border border-oxblood/40 text-oxblood"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <textarea
        aria-label="Message text"
        dir={rtl ? "rtl" : "ltr"}
        rows={Math.min(14, Math.max(4, body.split("\n").length + 1))}
        value={body}
        onChange={(e) => setEdited({ ...edited, [idx]: e.target.value })}
        className={`${inputCls} font-sans text-[15px] leading-relaxed`}
      />
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={`https://wa.me/${to}?text=${encodeURIComponent(body)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            logSend({ templateKey: opt.key, toPhone: to, body, clientId: clientId ?? null, orderId: opt.orderId ?? null });
            setSent(opt.label);
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-[#1f7a4d] px-5 text-xs uppercase tracking-[0.18em] text-white"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3a.5.5 0 0 0 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z" /></svg>
          Open in WhatsApp
        </a>
        <span className="at-muted text-sm">to +{to}</span>
        {sent && <span role="status" className="text-sm">“{sent}” opened in WhatsApp. Press send there.</span>}
      </div>
    </div>
  );
}

/** One-tap link for lists (e.g. the dashboard): opens WhatsApp with `body` and logs it. */
export function WaQuickLink({
  to,
  body,
  templateKey,
  clientId,
  orderId,
  children,
  className,
}: {
  to: string;
  body: string;
  templateKey: string;
  clientId?: string | null;
  orderId?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={`https://wa.me/${to}?text=${encodeURIComponent(body)}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => logSend({ templateKey, toPhone: to, body, clientId: clientId ?? null, orderId: orderId ?? null })}
      className={className ?? "inline-flex min-h-9 items-center rounded-full bg-[#1f7a4d] px-3 text-[11px] uppercase tracking-[0.14em] text-white"}
    >
      {children}
    </a>
  );
}
