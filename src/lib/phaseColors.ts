// Colour codes for order stages and appointment types, drawn from the brand
// palette and warm extensions of it. A fitting appointment shares its colour
// with the matching order stage, so phases read the same on the board and the calendar.

export interface PhaseColor {
  bg: string;
  fg: string;
}

const C = {
  sand: { bg: "#e5d1a4", fg: "#480903" },
  copper: { bg: "#ce793a", fg: "#480903" },
  olive: { bg: "#7a6a1d", fg: "#ede5d6" },
  cinnamon: { bg: "#8c5a2b", fg: "#ede5d6" },
  rose: { bg: "#d49a8c", fg: "#480903" },
  terracotta: { bg: "#a8432f", fg: "#ede5d6" },
  berry: { bg: "#7d2f45", fg: "#ede5d6" },
  plum: { bg: "#5e3150", fg: "#ede5d6" },
  moss: { bg: "#4e6b3c", fg: "#ede5d6" },
  oxblood: { bg: "#480903", fg: "#ede5d6" },
} satisfies Record<string, PhaseColor>;

export const STAGE_COLORS: Record<string, PhaseColor> = {
  inquiry: C.sand,
  design: C.copper,
  fabric: C.olive,
  pattern: C.cinnamon,
  fitting1: C.rose,
  fitting2: C.terracotta,
  finishing: C.plum,
  ready: C.moss,
  delivered: C.oxblood,
};

export const APPOINTMENT_COLORS: Record<string, PhaseColor> = {
  consultation: C.sand,
  measurements: C.copper,
  fitting1: C.rose,
  fitting2: C.terracotta,
  fitting3: C.berry,
  final_fitting: C.plum,
  delivery: C.moss,
};

const FALLBACK = C.sand;
export const stageColor = (k: string) => STAGE_COLORS[k] ?? FALLBACK;
export const apptColor = (k: string) => APPOINTMENT_COLORS[k] ?? FALLBACK;
