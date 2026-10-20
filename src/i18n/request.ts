import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

// Messages are split by owner so two people can edit copy without conflicts:
//   site.json -> public website copy (visual/design work)
//   app.json  -> booking, tracking, forms and system strings (structure work)
// Keep top-level namespaces unique across the two files.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  const [site, app] = await Promise.all([
    import(`../../messages/${locale}/site.json`),
    import(`../../messages/${locale}/app.json`),
  ]);
  return {
    locale,
    timeZone: "Africa/Cairo",
    messages: { ...site.default, ...app.default },
  };
});
