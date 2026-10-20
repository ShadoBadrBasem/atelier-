import type { Client } from "@prisma/client";
import { Field, inputCls, btnCls } from "./ui";
import { toDateInput } from "@/lib/cairo";

export function ClientForm({
  client,
  action,
  submitLabel,
}: {
  client?: Client;
  action: (fd: FormData) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <Field label="Name">
        <input name="name" required defaultValue={client?.name} className={inputCls} />
      </Field>
      <Field label="Language">
        <select name="language" defaultValue={client?.language ?? "en"} className={inputCls}>
          <option value="en">English</option>
          <option value="ar">Arabic</option>
        </select>
      </Field>
      <Field label="Phone">
        <input name="phone" type="tel" defaultValue={client?.phone ?? ""} className={inputCls} />
      </Field>
      <Field label="WhatsApp" hint="Leave empty to use the phone number. Egyptian 01… numbers are converted.">
        <input name="whatsapp" type="tel" defaultValue={client?.whatsapp ?? ""} className={inputCls} />
      </Field>
      <Field label="Email">
        <input name="email" type="email" defaultValue={client?.email ?? ""} className={inputCls} />
      </Field>
      <Field label="Occasion">
        <select name="eventType" defaultValue={client?.eventType ?? ""} className={inputCls}>
          <option value="">Not set</option>
          <option value="bridal">Bridal</option>
          <option value="evening">Evening</option>
        </select>
      </Field>
      <Field label="Event date">
        <input name="eventDate" type="date" defaultValue={toDateInput(client?.eventDate)} className={inputCls} />
      </Field>
      <div className="md:col-span-2">
        <Field label="Notes">
          <textarea name="notes" rows={3} defaultValue={client?.notes ?? ""} className={inputCls} />
        </Field>
      </div>
      <div>
        <button className={btnCls}>{submitLabel}</button>
      </div>
    </form>
  );
}
