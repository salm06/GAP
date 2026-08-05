// ============================================================================
// Setup IndexedDB con Dexie. Questo file NON deve essere importato dai
// componenti: l'unico accesso ai dati passa da lib/repository.ts.
// ============================================================================

import Dexie, { type Table } from "dexie";
import type { Attivita, Classe, Sessione } from "./types";

export class GapDatabase extends Dexie {
  attivita!: Table<Attivita, string>;
  classi!: Table<Classe, string>;
  sessioni!: Table<Sessione, string>;

  constructor() {
    super("gap-player");
    this.version(1).stores({
      // solo le colonne indicizzate; il resto dell'oggetto è comunque salvato
      attivita: "id, titolo",
      classi: "id, nome",
      sessioni: "id, attivitaId, stato, avviataAlle",
    });
  }
}

let _db: GapDatabase | null = null;

/** Istanza singleton, creata solo lato browser. */
export function getDb(): GapDatabase {
  if (typeof window === "undefined") {
    throw new Error("getDb() può essere usato solo lato client.");
  }
  if (!_db) _db = new GapDatabase();
  return _db;
}
