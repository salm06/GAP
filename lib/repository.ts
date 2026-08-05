// ============================================================================
// Repository — UNICO contratto di accesso ai dati.
// I componenti importano solo da qui. Oggi l'implementazione è locale
// (Dexie/IndexedDB); domani si potrà sostituire con vere chiamate API
// mantenendo la stessa interfaccia, senza toccare i componenti.
// ============================================================================

import type { Alunno, Attivita, Classe, Sessione } from "./types";
import { getDb } from "./db";
import { seedSeNecessario } from "./seed";

export interface Repository {
  // contenuto (sola lettura per il player)
  listAttivita(): Promise<Attivita[]>;
  getAttivita(id: string): Promise<Attivita | null>;

  // classi
  listClassi(): Promise<Classe[]>;
  getClasse(id: string): Promise<Classe | null>;
  saveClasse(c: Classe): Promise<void>;
  importaAlunniDaTesto(nome: string, testo: string): Promise<Classe>;

  // sessioni
  getSessioneAttiva(): Promise<Sessione | null>;
  getSessione(id: string): Promise<Sessione | null>;
  getSessioniPerAttivita(attivitaId: string): Promise<Sessione[]>;
  listSessioni(): Promise<Sessione[]>;
  creaSessione(attivitaId: string, classeId?: string): Promise<Sessione>;
  aggiornaSessione(s: Sessione): Promise<void>;
  concludiSessione(id: string): Promise<Sessione | null>;
  eliminaSessione(id: string): Promise<void>;
  resetSessione(id: string): Promise<Sessione | null>;

  // sync differita (no-op in locale; hook pronto per la fase API)
  flushSync(): Promise<void>;
}

function nuovoId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Trasforma un elenco incollato (un nome per riga, oppure CSV "nome" /
 * "cognome,nome") in un array di alunni. Niente form con 25 campi.
 */
export function parseElencoAlunni(testo: string): Alunno[] {
  return testo
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter(Boolean)
    .map((riga, i) => {
      // supporta CSV: "Cognome,Nome" o "Nome,Cognome" → ricompone con spazio
      const nome = riga.includes(",")
        ? riga
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean)
            .join(" ")
        : riga;
      return { id: `al-${i + 1}-${Math.random().toString(36).slice(2, 6)}`, nome };
    });
}

class LocalRepository implements Repository {
  private pronto = false;

  private async ensure(): Promise<void> {
    if (!this.pronto) {
      await seedSeNecessario(getDb());
      this.pronto = true;
    }
  }

  async listAttivita(): Promise<Attivita[]> {
    await this.ensure();
    return getDb().attivita.toArray();
  }

  async getAttivita(id: string): Promise<Attivita | null> {
    await this.ensure();
    return (await getDb().attivita.get(id)) ?? null;
  }

  async listClassi(): Promise<Classe[]> {
    await this.ensure();
    return getDb().classi.toArray();
  }

  async getClasse(id: string): Promise<Classe | null> {
    await this.ensure();
    return (await getDb().classi.get(id)) ?? null;
  }

  async saveClasse(c: Classe): Promise<void> {
    await this.ensure();
    await getDb().classi.put(c);
  }

  async importaAlunniDaTesto(nome: string, testo: string): Promise<Classe> {
    await this.ensure();
    const classe: Classe = {
      id: nuovoId("classe"),
      nome: nome.trim() || "Classe senza nome",
      alunni: parseElencoAlunni(testo),
    };
    await getDb().classi.put(classe);
    return classe;
  }

  async getSessioneAttiva(): Promise<Sessione | null> {
    await this.ensure();
    const inCorso = await getDb().sessioni.where("stato").equals("in-corso").toArray();
    if (inCorso.length === 0) return null;
    // la più recente, se per qualche motivo ce ne fosse più d'una
    inCorso.sort((a, b) => b.avviataAlle - a.avviataAlle);
    return inCorso[0];
  }

  async getSessione(id: string): Promise<Sessione | null> {
    await this.ensure();
    return (await getDb().sessioni.get(id)) ?? null;
  }

  async getSessioniPerAttivita(attivitaId: string): Promise<Sessione[]> {
    await this.ensure();
    return getDb().sessioni.where("attivitaId").equals(attivitaId).toArray();
  }

  async creaSessione(attivitaId: string, classeId?: string): Promise<Sessione> {
    await this.ensure();
    const s: Sessione = {
      id: nuovoId("ses"),
      attivitaId,
      classeId,
      avviataAlle: Date.now(),
      stepCorrente: 0,
      tempiReali: [],
      annotazioni: [],
      stato: "preparazione",
      materialiSpuntati: [],
    };
    await getDb().sessioni.put(s);
    return s;
  }

  async aggiornaSessione(s: Sessione): Promise<void> {
    await this.ensure();
    await getDb().sessioni.put(s);
  }

  async concludiSessione(id: string): Promise<Sessione | null> {
    await this.ensure();
    const s = await getDb().sessioni.get(id);
    if (!s) return null;
    const concl: Sessione = { ...s, stato: "conclusa" };
    await getDb().sessioni.put(concl);
    return concl;
  }

  async listSessioni(): Promise<Sessione[]> {
    await this.ensure();
    const all = await getDb().sessioni.toArray();
    return all.sort((a, b) => b.avviataAlle - a.avviataAlle);
  }

  async eliminaSessione(id: string): Promise<void> {
    await this.ensure();
    await getDb().sessioni.delete(id);
  }

  /** Azzera i progressi della sessione (tempi, valutazioni), mantenendo classe e checklist. */
  async resetSessione(id: string): Promise<Sessione | null> {
    await this.ensure();
    const s = await getDb().sessioni.get(id);
    if (!s) return null;
    const reset: Sessione = {
      ...s,
      stepCorrente: 0,
      tempiReali: [],
      annotazioni: [],
      stato: "preparazione",
      pausaDa: undefined,
      msInPausa: 0,
      durateEffettive: undefined,
      valutazioneOverride: undefined,
      feedbackInviato: false,
    };
    await getDb().sessioni.put(reset);
    return reset;
  }

  async flushSync(): Promise<void> {
    // No-op in locale. Punto d'aggancio per la sincronizzazione differita
    // quando la persistenza diventerà remota.
    return;
  }
}

export const repository: Repository = new LocalRepository();
