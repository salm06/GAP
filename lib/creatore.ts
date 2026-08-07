// ============================================================================
// Creatore della lezione — per ora è un valore unico ("GAP - Digital Education").
// Quando i kit avranno un autore reale, basterà valorizzare `Attivita.creatore`
// nel JSON: `creatoreDi()` lo userà automaticamente, con questo come fallback.
// ============================================================================

import type { Attivita } from "./types";

export const CREATORE_DEFAULT = "GAP - Digital Education";

export function creatoreDi(a: Pick<Attivita, "creatore">): string {
  return a.creatore?.trim() || CREATORE_DEFAULT;
}
