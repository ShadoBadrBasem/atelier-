import { btnCls, btnGhostCls, inputCls } from "@/components/ui";
import { PageTitle, Panel } from "@/components/admin/kit";
import { loadOverrides } from "@/lib/whatsapp/overrides";
import { DEFAULT_TEMPLATES, TEMPLATE_KEYS } from "@/lib/whatsapp/templates";
import { businessPhone } from "@/lib/business";
import { resetTemplate, saveTemplate } from "./actions";

const PLACEHOLDERS = [
  ["{{name}}", "client's first name"],
  ["{{type}}", "appointment type"],
  ["{{date}}", "appointment date"],
  ["{{time}}", "appointment time"],
  ["{{gown}}", "gown title"],
  ["{{code}}", "order code"],
  ["{{amount}}", "amount due"],
  ["{{due}}", "due date"],
  ["{{next}}", "next appointment, or an invitation to book one"],
  ["{{invoice}}", "the itemised invoice"],
];

export default async function MessageSettings() {
  const overrides = await loadOverrides();
  const phone = businessPhone();

  return (
    <main className="flex flex-col gap-5">
      <PageTitle
        eyebrow="Settings"
        title="WhatsApp messages"
        sub={phone ? `Messages open in WhatsApp and send from ${phone} when you use the Atelier on your phone.` : "Messages open in WhatsApp on the device you are using."}
      />

      <Panel title="How it works">
        <ol className="flex list-decimal flex-col gap-1 ps-5 text-sm">
          <li>Choose a message on a client, order or appointment, or from Reminders to send on Today.</li>
          <li>Check the text (you can change it just for that message), then tap Open in WhatsApp.</li>
          <li>WhatsApp opens with the chat and text ready. Press send. The Atelier keeps a record on the client.</li>
        </ol>
        <p className="at-eyebrow mt-4 mb-2">Placeholders filled in for you</p>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {PLACEHOLDERS.map(([p, d]) => <li key={p}><code className="rounded bg-[#f1e6cf] px-1.5 py-0.5">{p}</code> {d}</li>)}
        </ul>
      </Panel>

      {TEMPLATE_KEYS.map((t) => (
        <Panel key={t.key} title={t.label} eyebrow={t.scope === "appointment" ? "Appointments" : "Orders"}>
          <form action={saveTemplate.bind(null, t.key)} className="grid gap-4 lg:grid-cols-2">
            {(["en", "ar"] as const).map((l) => {
              const custom = overrides[`${t.key}:${l}`];
              return (
                <label key={l} className="flex flex-col gap-1.5">
                  <span className="flex items-center justify-between text-xs uppercase tracking-[0.15em] text-ink-soft">
                    {l === "en" ? "English" : "Arabic"}
                    {custom && <span className="at-pill bg-copper text-oxblood">Edited</span>}
                  </span>
                  <textarea
                    name={l}
                    dir={l === "ar" ? "rtl" : "ltr"}
                    rows={5}
                    defaultValue={custom ?? DEFAULT_TEMPLATES[t.key][l]}
                    className={`${inputCls} font-sans text-[15px] leading-relaxed`}
                  />
                </label>
              );
            })}
            <div className="flex flex-wrap gap-2 lg:col-span-2">
              <button className={btnCls}>Save</button>
              {(["en", "ar"] as const).filter((l) => overrides[`${t.key}:${l}`]).map((l) => (
                <button key={l} formAction={resetTemplate.bind(null, t.key, l)} className={btnGhostCls}>
                  Reset {l === "en" ? "English" : "Arabic"}
                </button>
              ))}
            </div>
          </form>
        </Panel>
      ))}
    </main>
  );
}
