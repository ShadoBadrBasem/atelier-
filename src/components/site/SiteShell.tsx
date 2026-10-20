import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageSwitch } from "./LanguageSwitch";
import { Atmosphere } from "./Atmosphere";

export async function SiteShell({ locale, children }: { locale: string; children: React.ReactNode }) {
  const t = await getTranslations("site");
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  return <div className="public-site">
    <a className="skip-link" href="#main">{t("skip")}</a>
    <Atmosphere />
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label={t("home")}>SHADO BADR<span>MAISON DU COUTURE · CAIRO</span></Link>
      <nav aria-label={t("navigation")}><Link href="/#maison">{t("maison.label")}</Link><Link href="/#collection">{t("collection.label")}</Link><Link href="/#journey">{t("journey.label")}</Link></nav>
      <LanguageSwitch locale={locale} />
    </header>
    {children}
    <footer className="site-footer"><p className="footer-invitation">{t("footer.title")}</p><Link className="site-button" href="/book">{t("cta")} <span aria-hidden="true">↗</span></Link><div className="footer-bottom"><span>SHADO BADR · CAIRO</span><Link href="/">{t("home")}</Link><span>{t("footer.note")}</span></div></footer>
    {number && /^\d+$/.test(number) && <a className="concierge" href={`https://wa.me/${number}?text=${encodeURIComponent(t("whatsappMessage"))}`} target="_blank" rel="noopener noreferrer">{t("concierge")} <span aria-hidden="true">↗</span></a>}
  </div>;
}
