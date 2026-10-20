// All money is stored as integer piasters (1 EGP = 100 piasters). Never floats.

export type Piasters = number;

export function egp(amount: number): Piasters {
  return Math.round(amount * 100);
}

export function assertMoney(value: number, label = "amount"): Piasters {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} must be an integer number of piasters`);
  }
  return value;
}

export function formatEgp(value: Piasters, locale: string = "en"): string {
  const major = value / 100;
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: value % 100 === 0 ? 0 : 2,
  }).format(major);
}
