"use client";

import { useEffect, useRef } from "react";
import { Logo } from "@/components/Logo";

export function Atmosphere() {
  const entrance = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let stop = false;
    let cleanup = () => {};
    let timer: ReturnType<typeof setTimeout>;
    let seen = true;
    try { seen = sessionStorage.getItem("maison-entered") === "1"; sessionStorage.setItem("maison-entered", "1"); } catch { /* Storage is optional. */ }
    if (!reduced.matches && !seen && entrance.current) {
      entrance.current.hidden = false;
      timer = setTimeout(() => { if (entrance.current) entrance.current.hidden = true; }, 2300);
    }
    const move = (e: PointerEvent) => { if (cursor.current) cursor.current.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`; };
    if (matchMedia("(pointer: fine)").matches && !reduced.matches) window.addEventListener("pointermove", move);
    if (!reduced.matches) void import("lenis").then(({ default: Lenis }) => {
      if (stop || reduced.matches) return;
      const lenis = new Lenis({ autoRaf: true, duration: 1.15, anchors: true });
      cleanup = () => lenis.destroy();
    });
    const change = () => { cleanup(); if (entrance.current) entrance.current.hidden = true; };
    reduced.addEventListener("change", change);
    return () => { stop = true; clearTimeout(timer); cleanup(); window.removeEventListener("pointermove", move); reduced.removeEventListener("change", change); };
  }, []);
  return <><div ref={entrance} hidden className="entrance" aria-hidden="true"><div className="entrance-frame frame"><Logo size={210} priority /></div></div><div ref={cursor} className="atelier-cursor" aria-hidden="true" /><div className="site-grain" aria-hidden="true" /></>;
}
