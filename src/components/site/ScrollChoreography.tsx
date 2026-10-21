"use client";

import { useEffect, useRef } from "react";

export default function ScrollChoreography() {
  const root = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let dispose = () => {};
    let cancelled = false;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(".hero-art", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".site-hero", start: "top top", end: "bottom top", scrub: true } });
        gsap.utils.toArray<HTMLElement>(".maison-copy > p:not(.eyebrow)").forEach((paragraph) => gsap.fromTo(paragraph, { y: 18 }, { y: 0, scrollTrigger: { trigger: paragraph, start: "top 85%", end: "top 55%", scrub: true } }));
        gsap.from(".journey-line", { scaleY: 0, transformOrigin: "top", ease: "none", scrollTrigger: { trigger: "#journey", start: "top 70%", end: "bottom 80%", scrub: true } });
      });
      media.add("(min-width: 1000px) and (prefers-reduced-motion: no-preference)", () => {
        ScrollTrigger.create({ trigger: ".maison-sequence", start: "top 10%", end: "+=350", pin: ".maison-art", pinSpacing: false });
      });
      dispose = () => media.revert();
    });
    return () => { cancelled = true; dispose(); };
  }, []);
  return <span ref={root} hidden />;
}
