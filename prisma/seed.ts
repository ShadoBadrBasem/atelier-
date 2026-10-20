import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = process.env.OWNER_EMAIL?.toLowerCase();
  const password = process.env.OWNER_PASSWORD;
  if (!email || !password) throw new Error("Set OWNER_EMAIL and OWNER_PASSWORD in .env");

  await db.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: process.env.OWNER_NAME ?? "Owner",
      passwordHash: await bcrypt.hash(password, 12),
    },
  });

  // Sun-Thu, 11:00-18:00, 60 min slots, 30 min buffer. Editable in Settings later.
  for (const weekday of [0, 1, 2, 3, 4]) {
    await db.availabilityRule.upsert({
      where: { weekday },
      update: {},
      create: { weekday, startTime: "11:00", endTime: "18:00", slotMinutes: 60, bufferMinutes: 30, maxPerDay: 4 },
    });
  }
  console.log("Seeded owner and availability.");
}

main().finally(() => db.$disconnect());
