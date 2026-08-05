// ============================================================================
// Colori per fase del design thinking — ripresi dal mazzo animato del kit.
// Puramente cosmetici: colorano la "strip" della card dello step e i suoi
// dettagli. Uno step senza `fase` usa lo stile neutro (barra scura), così le
// attività esistenti restano invariate.
// ============================================================================

import type { Fase } from "./types";

export type StileFase = {
  stripBg: string; // sfondo della barra di testata
  stripInk: string; // testo e cronometro sulla barra
  badgeBg: string; // sfondo del badge del cronometro
  numero: string; // colore del numero grande sul corpo bianco
  guidaBg: string; // sfondo tenue del box "frase guida"
  guidaLinea: string; // bordo sinistro del box guida
};

const NEUTRA: StileFase = {
  stripBg: "#1A1A1A",
  stripInk: "#FFFFFF",
  badgeBg: "rgba(255,255,255,.14)",
  numero: "var(--accent-ink)",
  guidaBg: "rgba(255,199,0,.12)",
  guidaLinea: "var(--accent)",
};

const STILI: Record<Fase, StileFase> = {
  setup: NEUTRA,
  pensa: {
    stripBg: "#FFC700",
    stripInk: "#1A1A1A",
    badgeBg: "rgba(0,0,0,.14)",
    numero: "#8A5B00",
    guidaBg: "rgba(255,199,0,.18)",
    guidaLinea: "#8A5B00",
  },
  fai: {
    stripBg: "#FF842F",
    stripInk: "#2A1200",
    badgeBg: "rgba(0,0,0,.16)",
    numero: "#C2450A",
    guidaBg: "rgba(255,132,47,.16)",
    guidaLinea: "#C2450A",
  },
  capisci: {
    stripBg: "#00B8B5",
    stripInk: "#06302F",
    badgeBg: "rgba(0,0,0,.15)",
    numero: "#0A6B68",
    guidaBg: "rgba(0,184,181,.16)",
    guidaLinea: "#0A6B68",
  },
};

export function stileFase(fase?: Fase): StileFase {
  return fase ? STILI[fase] : NEUTRA;
}

/** Etichetta leggibile della fase, per timeline o badge. */
export const NOME_FASE: Record<Fase, string> = {
  setup: "Preparazione",
  pensa: "Pensa",
  fai: "Fai",
  capisci: "Capisci",
};
