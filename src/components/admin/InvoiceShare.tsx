"use client";

import { useState } from "react";
import { btnCls, btnGhostCls } from "@/components/ui";

/**
 * Share the invoice as a picture. On a phone this opens the share sheet, so it can go
 * straight to the client's WhatsApp chat; elsewhere it downloads the PNG to attach.
 */
export function InvoiceShare({ orderId, code, compact }: { orderId: string; code: string; compact?: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const url = `/api/invoice/${orderId}/image`;
  const fileName = `Shado-Badr-invoice-${code}.png`;

  async function share() {
    setState("busy");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const file = new File([await res.blob()], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Invoice ${code}` }).catch(() => {});
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
      }
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={share} disabled={state === "busy"} className={compact ? btnGhostCls : btnCls}>
        {state === "busy" ? "Preparing…" : "Share invoice picture"}
      </button>
      {!compact && <a href={url} download={fileName} className={btnGhostCls}>Download picture</a>}
      {state === "error" && <span role="alert" className="text-sm text-burnt">Could not make the picture. Try again.</span>}
    </div>
  );
}
