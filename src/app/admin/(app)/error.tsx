"use client";

import { btnCls } from "@/components/ui";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const offline = typeof navigator !== "undefined" && !navigator.onLine;
  return (
    <main className="py-10">
      <h1 className="font-display text-2xl">Something didn&apos;t save</h1>
      <p className="mt-2 text-ink-soft">
        {offline
          ? "You're offline. This change needs a connection. Try again once you're back online."
          : "Please check the values you entered and try again."}
      </p>
      {process.env.NODE_ENV !== "production" && <pre className="mt-3 whitespace-pre-wrap text-xs">{error.message}</pre>}
      <button onClick={reset} className={`${btnCls} mt-4`}>Try again</button>
    </main>
  );
}
