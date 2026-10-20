import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/Logo";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const other = locale === "en" ? "ar" : "en";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 text-center">
      <Logo size={260} priority />
      <p className="max-w-md font-serif text-2xl italic text-ink-soft">
        {t("hero.tagline")}
      </p>
      <a
        href="#"
        className="bg-burnt px-8 py-3 font-sans text-sm uppercase tracking-[0.25em] text-cream"
      >
        {t("hero.cta")}
      </a>
      <Link href="/" locale={other} className="font-sans text-sm tracking-widest underline">
        {t("lang.switch")}
      </Link>
    </main>
  );
}
