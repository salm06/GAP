// ============================================================================
// Seed: al primo avvio carica i JSON di /data dentro IndexedDB.
// I file di /data restano la "sorgente kit"; il DB locale è la copia di lavoro.
// Il seed è idempotente per ID: nuovi contenuti seed compaiono anche su un DB
// già inizializzato, senza toccare le classi create dal docente.
// ============================================================================

import type { GapDatabase } from "./db";
import type { Attivita, Classe } from "./types";
import attivitaDante from "@/data/dante-ulisse.attivita.json";
import attivitaCommissione from "@/data/commissione-alla-cieca.attivita.json";
import classe2b from "@/data/2b-informatica.classe.json";
import classe3a from "@/data/3a-liceo.classe.json";

const ATTIVITA_SEED: Attivita[] = [
  attivitaCommissione as Attivita,
  attivitaDante as Attivita,
];
const CLASSI_SEED: Classe[] = [classe2b as Classe, classe3a as Classe];

// Id delle attività del kit ufficiale: sono sola lettura nell'app (ri-seedate a
// ogni avvio), quindi non modificabili/eliminabili dal flusso di gestione.
const SEED_ATTIVITA_IDS = new Set(ATTIVITA_SEED.map((a) => a.id));
export function isAttivitaSeed(id: string): boolean {
  return SEED_ATTIVITA_IDS.has(id);
}

export async function seedSeNecessario(db: GapDatabase): Promise<void> {
  // Attività e classi seed vengono SEMPRE riallineate (hanno ID fissi):
  // così gli aggiornamenti ai kit propagano anche su un DB già inizializzato.
  // Le classi importate dal docente hanno ID generati diversi → restano intatte.
  await db.attivita.bulkPut(ATTIVITA_SEED);
  await db.classi.bulkPut(CLASSI_SEED);
}
