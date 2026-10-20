"use client";
import { useEffect } from "react";
export function CollectionTransition() {
  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>("a[data-gown]");
      const visual = link?.querySelector<HTMLElement>(".texture");
      if (link && visual) { event.preventDefault(); event.stopImmediatePropagation(); document.querySelectorAll<HTMLElement>(".gown-card .texture").forEach(image => { image.style.viewTransitionName = "none"; }); visual.style.viewTransitionName = "gown-portrait"; window.location.assign(link.href); }
    };
    document.addEventListener("click", click, true);
    return () => document.removeEventListener("click", click, true);
  }, []);
  return null;
}
