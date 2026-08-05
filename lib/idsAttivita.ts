// ============================================================================
// Elenco degli ID attività, unico punto per le route statiche dell'export.
// `output: export` pre-genera /attivita/[id]/* solo per gli ID qui elencati:
// aggiungendo un nuovo kit basta importarlo qui (oltre che in lib/seed.ts).
// ============================================================================

import attivitaDante from "@/data/dante-ulisse.attivita.json";
import attivitaCommissione from "@/data/commissione-alla-cieca.attivita.json";

export const ATTIVITA_STATIC_PARAMS: { id: string }[] = [
  { id: attivitaCommissione.id },
  { id: attivitaDante.id },
];
