// Default WhatsApp message wording (EN + AR). The founder can override each
// one in Settings → Messages; overrides live in the MessageTemplate table.
// Placeholders: {{name}} {{type}} {{date}} {{time}} {{gown}} {{code}} {{amount}} {{due}} {{next}} {{invoice}}

export type Lang = "en" | "ar";

export const TEMPLATE_KEYS = [
  { key: "booking_confirmed", label: "Appointment confirmed", scope: "appointment" },
  { key: "reminder_24h", label: "Appointment reminder", scope: "appointment" },
  { key: "deposit_due", label: "Deposit reminder", scope: "order" },
  { key: "balance_due", label: "Balance reminder", scope: "order" },
  { key: "invoice", label: "Invoice", scope: "order" },
  { key: "fitting_ready", label: "Ready for fitting", scope: "order" },
  { key: "delivery_ready", label: "Gown ready for delivery", scope: "order" },
] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number]["key"];
export const templateLabel = (k: string) => TEMPLATE_KEYS.find((t) => t.key === k)?.label ?? (k === "free_text" ? "Message" : k);

export const DEFAULT_TEMPLATES: Record<TemplateKey, Record<Lang, string>> = {
  booking_confirmed: {
    en: "Dear {{name}}, your {{type}} at Shado Badr is confirmed for {{date}} at {{time}}. We look forward to seeing you.\n— Shado Badr, Maison du Couture",
    ar: "عزيزتي {{name}}، تم تأكيد موعد {{type}} في أتيليه شادو بدر يوم {{date}} الساعة {{time}}. في انتظارك.\n— شادو بدر، دار الأزياء الراقية",
  },
  reminder_24h: {
    en: "Dear {{name}}, a gentle reminder of your {{type}} on {{date}} at {{time}}. If you need to change the time, simply reply here.\n— Shado Badr",
    ar: "عزيزتي {{name}}، نذكّرك بموعد {{type}} يوم {{date}} الساعة {{time}}. لو حابة تغيّري الموعد ردّي علينا هنا.\n— شادو بدر",
  },
  deposit_due: {
    en: "Dear {{name}}, to reserve the atelier's time for your {{gown}} ({{code}}), the deposit of {{amount}} is due by {{due}}. Thank you.\n— Shado Badr",
    ar: "عزيزتي {{name}}، لحجز وقت الأتيليه لفستانك {{gown}} ({{code}})، العربون {{amount}} مستحق قبل {{due}}. شكرًا لكِ.\n— شادو بدر",
  },
  balance_due: {
    en: "Dear {{name}}, a kind reminder that the remaining balance of {{amount}} for your {{gown}} ({{code}}) is due by {{due}}. Thank you.\n— Shado Badr",
    ar: "عزيزتي {{name}}، تذكير لطيف بأن المبلغ المتبقي {{amount}} لفستانك {{gown}} ({{code}}) مستحق قبل {{due}}. شكرًا لكِ.\n— شادو بدر",
  },
  invoice: {
    en: "Invoice {{code}} · Shado Badr, Maison du Couture\n\n{{invoice}}\n\nThank you, {{name}}. For any question, simply reply here.",
    ar: "فاتورة {{code}} · شادو بدر، دار الأزياء الراقية\n\n{{invoice}}\n\nشكرًا لكِ يا {{name}}. لأي استفسار ردّي علينا هنا.",
  },
  fitting_ready: {
    en: "Dear {{name}}, your {{gown}} is ready for its next fitting. {{next}}\n— Shado Badr",
    ar: "عزيزتي {{name}}، فستانك {{gown}} جاهز للبروفة القادمة. {{next}}\n— شادو بدر",
  },
  delivery_ready: {
    en: "Dear {{name}}, your {{gown}} is finished and ready for you. {{next}}\n— Shado Badr",
    ar: "عزيزتي {{name}}، فستانك {{gown}} اكتمل وجاهز لكِ. {{next}}\n— شادو بدر",
  },
};

/** Fills {{placeholders}}; unknown ones are left visible so a missing value is noticed. */
export function render(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (m, k: string) => (k in vars ? vars[k] : m));
}
