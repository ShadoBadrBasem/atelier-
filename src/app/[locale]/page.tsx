import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/Logo";
import { SiteShell } from "@/components/site/SiteShell";
import { Texture } from "@/components/site/Texture";
import { MotionLayer } from "@/components/site/MotionLayer";
import { CollectionTransition } from "@/components/site/CollectionTransition";
import { getPublicGowns } from "@/lib/public/content";

// Public content stays current when gowns are published in the admin.
export const dynamic = "force-dynamic";

type Step = { title: string; body: string };
type Question = { q: string; a: string };

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site");
  const gowns = await getPublicGowns(locale);
  const steps = t.raw("journey.steps") as Step[];
  const studies = t.raw("craft.items") as Step[];
  const questions = t.raw("faq.items") as Question[];
  return <SiteShell locale={locale}>
    <MotionLayer /><CollectionTransition />
    <main id="main">
      <section className="site-hero" aria-labelledby="hero-title">
        <div className="hero-art"><Texture tone="copper" label={t("placeholder")} priority /></div>
        <div className="hero-content"><p className="eyebrow">{t("eyebrow")}</p><h1 id="hero-title">{t("heroTitle")}<em>{t("heroItalic")}</em></h1><p className="hero-note">{t("heroNote")}</p><Link className="site-button" href="/book">{t("cta")} <span aria-hidden="true">↗</span></Link></div>
        <span className="hero-scroll eyebrow">{t("scroll")} <span aria-hidden="true">↓</span></span><span className="hero-index" aria-hidden="true">I — IV</span>
      </section>
      {locale === "ar" && <p className="review-note">{t("arabicReview")}</p>}
      <section id="maison" className="site-section maison-sequence">
        <div className="maison-art"><div className="frame portrait"><Texture tone="sand" label={t("placeholder")} /></div><p className="eyebrow image-caption">{t("maison.caption")}</p></div>
        <div className="maison-copy"><p className="eyebrow">01 / {t("maison.label")}</p><h2>{t("maison.title")}</h2><p className="intro-copy">{t("maison.intro")}</p><p>{t("maison.body")}</p><p className="closing-copy">{t("maison.closing")}</p><p className="eyebrow">{t("maison.founder")}</p><Logo size={110} /></div>
      </section>
      <section id="collection" className="collection-section">
        <div className="section-heading"><div><p className="eyebrow">02 / {t("collection.label")}</p><h2>{t("collection.title")}</h2></div><p>{t("collection.note")}</p></div>
        <p id="gallery-hint" className="eyebrow gallery-hint">{t("collection.hint")}</p>
        <div className="gown-gallery" tabIndex={0} role="region" aria-label={t("collection.label")} aria-describedby="gallery-hint">
          {gowns.map((gown, i) => <Link data-gown key={gown.slug} href={`/collection/${gown.slug}`} className="gown-card"><div className="gown-image"><Texture tone={gown.placeholderTone} image={gown.coverUrl} label={gown.coverUrl ? gown.title : t("placeholder")} /></div><div className="gown-caption"><span className="eyebrow">0{i + 1} / {t(`${gown.kind}.label`)}</span><h3>{gown.title}</h3><span className="gown-discover">{t("collection.explore")} <span aria-hidden="true">↗</span></span></div></Link>)}
        </div>
      </section>
      {(["bridal", "evening"] as const).map((kind, i) => <section key={kind} className={`occasion-section occasion-${kind}`}><div className="occasion-art"><Texture tone={kind === "bridal" ? "sand" : "oxblood"} label={t("placeholder")} /></div><div className="occasion-copy"><p className="eyebrow">0{i + 3} / {t(`${kind}.label`)}</p><h2>{t(`${kind}.title`)}</h2><p>{t(`${kind}.body`)}</p><Link className="text-link" href="/book">{t(`${kind}.link`)} <span aria-hidden="true">↗</span></Link></div></section>)}
      <section id="journey" className="site-section journey-section"><div className="journey-heading"><p className="eyebrow">05 / {t("journey.label")}</p><h2>{t("journey.title")}</h2><p>{t("journey.note")}</p><svg className="journey-sketch" viewBox="0 0 220 300" fill="none" aria-hidden="true"><path d="M85 30Q110 50 135 30L145 80 130 110Q140 180 190 270Q110 295 30 270Q80 180 90 110L75 80Z M90 110Q110 125 130 110 M110 125L100 280 M135 150Q130 210 160 280" stroke="currentColor" strokeWidth="1" /></svg></div><div className="journey-track"><span className="journey-line" aria-hidden="true" /><ol className="journey-steps">{steps.map((step, i) => <li key={step.title}><span className="step-number">0{i + 1}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></li>)}</ol></div></section>
      <section className="craft-section"><div className="section-heading"><div><p className="eyebrow">06 / {t("craft.label")}</p><h2>{t("craft.title")}</h2></div><p>{t("craft.hint")}</p></div><div className="craft-grid">{studies.map((study, i) => <details className={`craft-study study-${i}`} key={study.title}><summary><Texture tone={["sand", "olive", "copper"][i]} label={t("detailPlaceholder")} /><span className="craft-title">{study.title} <span aria-hidden="true">+</span></span></summary><p>{study.body}</p></details>)}</div></section>
      <section className="site-section faq-section"><div><p className="eyebrow">07 / {t("faq.label")}</p><h2>{t("faq.title")}</h2></div><div>{questions.map(q => <details className="faq-item" key={q.q}><summary>{q.q}<span aria-hidden="true">+</span></summary><p>{q.a}</p></details>)}</div></section>
      <section className="visit-section frame"><p className="eyebrow">08 / {t("visit.label")}</p><h2>{t("visit.title")}</h2><p>{t("visit.body")}</p><p>{t("visit.hours")}</p><p>{t("visit.address")}</p><a className="text-link" href="https://www.openstreetmap.org/#map=12/30.0444/31.2357" target="_blank" rel="noopener noreferrer">{t("visit.map")} <span aria-hidden="true">↗</span></a></section>
      <section className="site-section atelier-notes"><p className="eyebrow">09 / {t("notes.label")}</p><div className="notes-grid">{["journal", "instagram", "testimonials"].map(key => <article key={key}><span className="note-rule" aria-hidden="true" /><h3>{t(`notes.${key}`)}</h3><p>{t(`notes.${key}Text`)}</p></article>)}</div></section>
    </main>
  </SiteShell>;
}
