// Business details shown on invoices. The phone is the atelier's WhatsApp number
// (NEXT_PUBLIC_WHATSAPP_NUMBER, digits only, international format). The optional
// BUSINESS_ADDRESS, BUSINESS_INSTAGRAM and BUSINESS_WEBSITE appear when set.

export const BUSINESS = {
  name: "Shado Badr",
  tagline: "Maison du Couture",
  city: "Cairo",
};

export function businessPhone(): string | null {
  const n = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!n || !/^\d+$/.test(n)) return null;
  // 201030942434 -> +20 103 094 2434
  return n.startsWith("20") && n.length === 12 ? `+20 ${n.slice(2, 5)} ${n.slice(5, 8)} ${n.slice(8)}` : `+${n}`;
}

export function businessExtras() {
  const ig = process.env.BUSINESS_INSTAGRAM?.trim();
  return {
    address: process.env.BUSINESS_ADDRESS?.trim() || null,
    instagram: ig ? `@${ig.replace(/^@/, "")}` : null,
    website: process.env.BUSINESS_WEBSITE?.trim().replace(/^https?:\/\//, "") || null,
  };
}
