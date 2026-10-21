"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { str } from "@/lib/form";
import { DEFAULT_TEMPLATES, TEMPLATE_KEYS } from "@/lib/whatsapp/templates";

const key = z.enum(TEMPLATE_KEYS.map((t) => t.key) as [string, ...string[]]);
const lang = z.enum(["en", "ar"]);

/** Saves both languages of one message. Text equal to the default is stored as "no override". */
export async function saveTemplate(templateKey: string, fd: FormData) {
  await requireUser();
  const k = key.parse(templateKey) as keyof typeof DEFAULT_TEMPLATES;
  for (const l of ["en", "ar"] as const) {
    const body = str(fd, l).replace(/\r\n/g, "\n");
    if (!body || body === DEFAULT_TEMPLATES[k][l]) {
      await db.messageTemplate.deleteMany({ where: { key: k, language: l } });
    } else {
      await db.messageTemplate.upsert({
        where: { key_language: { key: k, language: l } },
        update: { body },
        create: { key: k, language: l, body },
      });
    }
  }
  revalidatePath("/admin", "layout");
}

export async function resetTemplate(templateKey: string, language: string) {
  await requireUser();
  await db.messageTemplate.deleteMany({ where: { key: key.parse(templateKey), language: lang.parse(language) } });
  revalidatePath("/admin", "layout");
}
