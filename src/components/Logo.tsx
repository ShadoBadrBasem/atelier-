import Image from "next/image";

// Uses the supplied logo file as-is. Never redraw or distort it.
export function Logo({ size = 160, priority = false }: { size?: number; priority?: boolean }) {
  return (
    <Image
      src="/brand/logo-cream.png"
      alt="Shado Badr, Maison du Couture, Cairo"
      width={size}
      height={size}
      priority={priority}
      className="h-auto"
    />
  );
}
