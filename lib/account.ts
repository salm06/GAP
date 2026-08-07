// ============================================================================
// Stato dell'account — PLACEHOLDER finché non c'è l'autenticazione reale.
// - premium: kit PLUS (player digitale: timer + valutazione in corsa).
// - nome: identità dell'utente corrente (per confrontarla col creatore).
// - admin: admin GAP, può gestire le attività create da chiunque.
// Cambia questi valori per simulare utenti diversi; in futuro arriveranno
// dall'account autenticato.
// ============================================================================

import type { Attivita } from "./types";
import { creatoreDi } from "./creatore";
import { isAttivitaSeed } from "./seed";

export const ACCOUNT = {
  premium: false,
  nome: "GAP - Digital Education",
  admin: true,
};

export function isPremium(): boolean {
  return ACCOUNT.premium;
}

export function utenteCorrente(): string {
  return ACCOUNT.nome;
}

export function isAdminGap(): boolean {
  return ACCOUNT.admin;
}

/**
 * Può modificare/eliminare l'attività? Solo le attività CREATE dal docente
 * (quelle del kit ufficiale sono sola lettura) e solo se sei l'admin GAP
 * oppure il creatore stesso.
 */
export function puoGestireAttivita(a: Attivita): boolean {
  if (isAttivitaSeed(a.id)) return false;
  return isAdminGap() || creatoreDi(a) === utenteCorrente();
}
