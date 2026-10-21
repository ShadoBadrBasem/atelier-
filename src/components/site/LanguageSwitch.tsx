"use client";
import { Link, usePathname } from "@/i18n/navigation";
export function LanguageSwitch({ locale }: { locale: string }) {
  const pathname = usePathname();
  return <Link className="language-switch" href={pathname} locale={locale === "en" ? "ar" : "en"} lang={locale === "en" ? "ar" : "en"} hrefLang={locale === "en" ? "ar" : "en"}>{locale === "en" ? "العربية" : "EN"}</Link>;
}
