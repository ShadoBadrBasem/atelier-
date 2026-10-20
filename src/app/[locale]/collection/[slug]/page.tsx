import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPublicGown } from "@/lib/public/content";
import { SiteShell } from "@/components/site/SiteShell";
import { Texture } from "@/components/site/Texture";
import type { Metadata } from "next";

export async function generateMetadata({ params }: PageProps<"/[locale]/collection/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const gown = await getPublicGown(slug, locale);
  return { title: gown ? `${gown.title} · Shado Badr` : "Shado Badr", alternates: { languages: { en: `/en/collection/${slug}`, ar: `/ar/collection/${slug}` } } };
}
export default async function GownDetail({ params }: PageProps<"/[locale]/collection/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const gown = await getPublicGown(slug, locale);
  if (!gown) notFound();
  const t = await getTranslations("site");
  return <SiteShell locale={locale}><main id="main" className="gown-detail"><div className="detail-heading"><Link className="text-link" href="/#collection">{t("collection.back")}</Link><p className="eyebrow">{t(`${gown.kind}.label`)} · SHADO BADR</p><h1>{gown.title}</h1></div><div className="detail-layout"><div className="detail-portrait"><Texture tone={gown.placeholderTone} image={gown.coverUrl} label={gown.coverUrl ? gown.title : t("placeholder")} priority /></div><div className="detail-story"><p className="intro-copy">{gown.description}</p>{gown.fabric && <><h2>{t("collection.fabric")}</h2><p>{gown.fabric}</p></>}<h2>{t("collection.craft")}</h2><p>{t("collection.craftNote")}</p><Link className="site-button" href="/book">{t("cta")} <span aria-hidden="true">↗</span></Link></div></div><div className="detail-images">{gown.images.length ? gown.images.map(photo => <Texture key={photo.url} image={photo.url} label={photo.alt} />) : <><Texture tone={gown.placeholderTone} label={t("detailPlaceholder")} /><Texture tone="sand" label={t("detailPlaceholder")} /></>}</div></main></SiteShell>;
}
