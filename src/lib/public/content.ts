// Data contract between the public site (visual work) and the database
// (structure work). Public pages import ONLY from this file for gown data.
// The shape is stable; the implementation may change behind it.
import { db } from "../db";

export interface PublicGown {
  slug: string;
  kind: "bridal" | "evening";
  title: string;
  description: string;
  fabric: string | null;
  /** URL of the cover image, or null when a palette placeholder should render. */
  coverUrl: string | null;
  images: { url: string; alt: string }[];
  /** Palette token for the placeholder block: oxblood | olive | sand | copper | burnt */
  placeholderTone: "oxblood" | "olive" | "sand" | "copper" | "burnt";
}

// TODO: replace — shown until real gowns are added in the admin content manager.
const PLACEHOLDERS: Omit<PublicGown, "title" | "description" | "fabric">[] = [
  { slug: "gown-i", kind: "bridal", coverUrl: null, images: [], placeholderTone: "sand" },
  { slug: "gown-ii", kind: "evening", coverUrl: null, images: [], placeholderTone: "copper" },
  { slug: "gown-iii", kind: "bridal", coverUrl: null, images: [], placeholderTone: "olive" },
  { slug: "gown-iv", kind: "evening", coverUrl: null, images: [], placeholderTone: "burnt" },
];
const PLACEHOLDER_COPY = {
  en: { title: "Gown", description: "TODO: replace with the gown's story, silhouette and craftsmanship notes.", fabric: "TODO: fabric" },
  ar: { title: "فستان", description: "مؤقت: تُستبدل بقصة الفستان وتفاصيل القصّة والحرفة.", fabric: "مؤقت: القماش" },
};
const NUMERALS = ["I", "II", "III", "IV"];

export async function getPublicGowns(locale: string): Promise<PublicGown[]> {
  const ar = locale === "ar";
  const rows = await db.gown.findMany({
    where: { visible: true },
    orderBy: { sortOrder: "asc" },
  });
  if (rows.length === 0) {
    const c = ar ? PLACEHOLDER_COPY.ar : PLACEHOLDER_COPY.en;
    return PLACEHOLDERS.map((p, i) => ({ ...p, title: `${c.title} ${NUMERALS[i]}`, description: c.description, fabric: c.fabric }));
  }
  const tones: PublicGown["placeholderTone"][] = ["sand", "copper", "olive", "burnt", "oxblood"];
  return rows.map((g, i) => ({
    slug: g.slug,
    kind: g.kind === "evening" ? "evening" : "bridal",
    title: ar ? g.titleAr : g.titleEn,
    description: ar ? g.descAr : g.descEn,
    fabric: (ar ? g.fabricAr : g.fabricEn) ?? null,
    coverUrl: null, // public image serving is added with the content manager
    images: [],
    placeholderTone: tones[i % tones.length],
  }));
}

export async function getPublicGown(slug: string, locale: string): Promise<PublicGown | null> {
  return (await getPublicGowns(locale)).find((g) => g.slug === slug) ?? null;
}
