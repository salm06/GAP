// ============================================================================
// Scala di valutazione a lettere A–E (sostituisce la vecchia 1–5).
// A = livello più alto (Avanzato) … E = più basso (da consolidare).
// Per aggregare (media) le lettere si mappano su numeri A=5 … E=1.
// ============================================================================

import type { Voto } from "./types";

export const VOTI: Voto[] = ["A", "B", "C", "D", "E"];

const NUM: Record<Voto, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };
// indice 0..4 (numero 1..5) → lettera; 1→E … 5→A
const DA_NUM: Voto[] = ["E", "D", "C", "B", "A"];

export function votoANumero(v: Voto): number {
  return NUM[v];
}

export function numeroAVoto(n: number): Voto {
  const clamp = Math.min(5, Math.max(1, Math.round(n)));
  return DA_NUM[clamp - 1];
}

/** Media di una lista di voti A–E → voto arrotondato, o null se vuota. */
export function mediaVoti(voti: Voto[]): Voto | null {
  if (voti.length === 0) return null;
  const media = voti.reduce((acc, v) => acc + NUM[v], 0) / voti.length;
  return numeroAVoto(media);
}

/** Legenda mostrata nel resoconto. */
export const LEGENDA_VOTI: { voto: Voto; label: string }[] = [
  { voto: "A", label: "Avanzato" },
  { voto: "B", label: "Buono" },
  { voto: "C", label: "Intermedio" },
  { voto: "D", label: "Iniziale" },
  { voto: "E", label: "Da consolidare" },
];
