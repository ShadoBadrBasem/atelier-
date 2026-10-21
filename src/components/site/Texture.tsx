import Image from "next/image";

export function Texture({ tone = "sand", label, image, priority = false }: { tone?: string; label: string; image?: string | null; priority?: boolean }) {
  return <div className={`texture tone-${tone}`}>
    {image ? <Image src={image} alt={label} fill sizes="(max-width: 700px) 90vw, 48vw" priority={priority} className="object-cover" /> : <><span className="fabric-fold" aria-hidden="true" /><span className="placeholder-label">{label}</span></>}
  </div>;
}
