// ============================================================================
// GAP Player — tipi condivisi
// Unica fonte di verità dei tipi. I componenti non accedono mai al DB
// direttamente: passano sempre per lib/repository.ts.
// ============================================================================

export type Livello = 1 | 2 | 3 | 4 | 5;
export type Elasticita = "essenziale" | "comprimibile" | "tagliabile";

// ---------------------------------------------------------------------------
// ATTIVITÀ (contenuto del kit, sola lettura)
// ---------------------------------------------------------------------------
export type Attivita = {
  id: string;
  titolo: string;
  materia: string;
  metodologia: string; // gamification | digital storytelling | PBL | ...
  durataTotaleMin: number; // durata pianificata, es. 100
  immagine?: string; // hero banner contestuale (path in /public), mostrato nella card
  materialiNecessari: Materiale[];
  step: Step[];
  griglia: Griglia;
};

export type Materiale = {
  id: string;
  descrizione: string; // "Foglio A3 per ogni gruppo"
  tipo: "fisico" | "digitale" | "tecnico";
  link?: string; // link da aprire, se digitale
  critico: boolean; // se manca, l'attività non parte
};

export type Fase = "setup" | "pensa" | "fai" | "capisci";

export type Step = {
  id: string;
  titolo: string; // etichetta breve, usata come titolo (una riga) della card
  fase?: Fase; // fase del design thinking → colore della card (cosmetico, opzionale)
  azione: string; // istruzione operativa dello step: paragrafo di approfondimento sotto il titolo
  cosaDico?: string; // (legacy) frase pronta da dire alla classe
  neuro?: string; // spunto di neurodidattica: perché questo step funziona
  domande?: string[]; // domande da porre
  aiuti?: string[]; // cosa fare se la classe si blocca
  durataMin: number;
  elasticita: Elasticita;
  minutiRecuperabili: number; // quanto si può togliere senza romperlo
  fallback?: string; // variante analogica se la tecnologia non funziona
  osservabili: Osservabile[]; // chip di annotazione rapida di QUESTO step
};

export type Osservabile = {
  id: string;
  label: string; // la "caratteristica" valutabile in questo step (es. "Colgono il senso")
  criterioId: string; // criterio della griglia di cui è sottocategoria
  livello?: Livello; // (legacy, non usato)
  ambito?: "classe" | "alunno"; // (legacy, non usato)
};

// ---------------------------------------------------------------------------
// GRIGLIA DI VALUTAZIONE
// ---------------------------------------------------------------------------
export type Griglia = {
  criteri: Criterio[];
};

export type Criterio = {
  id: string;
  nome: string; // es. "Collaborazione nel gruppo"
  competenzaMinisteriale?: string;
  descrittori: { livello: Livello; testo: string }[];
};

// ---------------------------------------------------------------------------
// CLASSE
// ---------------------------------------------------------------------------
export type Alunno = { id: string; nome: string };
export type Classe = { id: string; nome: string; alunni: Alunno[] };

// ---------------------------------------------------------------------------
// SESSIONE (stato di una lezione realmente svolta)
// ---------------------------------------------------------------------------
export type StatoSessione = "preparazione" | "in-corso" | "conclusa";

export type Sessione = {
  id: string;
  attivitaId: string;
  classeId?: string;
  avviataAlle: number; // timestamp di ingresso in modalità Conduci — è il T0 del cronometro totale
  stepCorrente: number; // indice 0-based
  tempiReali: TempoReale[];
  annotazioni: Annotazione[];
  stato: StatoSessione;
  durateEffettive?: Record<string, number>; // override durata step (min) dopo un suggerimento di deriva
  materialiSpuntati?: string[]; // checklist Prepara persistente
  valutazioneOverride?: Record<string, Record<string, Livello>>; // [alunnoId][criterioId] = livello corretto a mano
  feedbackInviato?: boolean; // il docente ha inviato i tempi reali all'autore
  pausaDa?: number; // timestamp REALE di inizio pausa (undefined = timer in marcia)
  msInPausa?: number; // millisecondi totali già trascorsi in pausa (accumulati)
};

export type TempoReale = { stepId: string; inizio: number; fine?: number };

export type Annotazione = {
  id: string;
  stepId: string;
  timestamp: number;
  tipo: "valutazione" | "vocale" | "testo";
  osservabileId?: string; // caratteristica valutata (per tipo 'valutazione')
  alunnoId?: string; // se presente → riguarda il singolo; assente → la classe
  valore?: Livello; // punteggio 1..5 (per tipo 'valutazione')
  contenuto?: string; // trascrizione o testo libero
};

// ---------------------------------------------------------------------------
// OUTPUT dei moduli puri (lib/tempo.ts, lib/valutazione.ts)
// ---------------------------------------------------------------------------
export type DirezioneDeriva = "ritardo" | "anticipo" | "in-linea";

export type SuggerimentoDeriva = {
  stepId: string;
  stepIndice: number; // 0-based
  stepTitolo: string;
  azione: "comprimi" | "taglia" | "espandi";
  minutiRecuperabili: number;
  testo: string; // "Sei 6' oltre. Lo step 6 è comprimibile → recuperi 5'."
};

export type Deriva = {
  scostamentoMin: number; // + = ritardo, − = anticipo
  direzione: DirezioneDeriva;
  suggerimento?: SuggerimentoDeriva;
};

export type CronometroTotale = {
  rimanentiMs: number; // tempo residuo (può essere negativo se si è sforato)
  decurtatiMs: number; // minuti persi per partenza in ritardo rispetto all'orario dichiarato
  totaleMs: number; // durata pianificata (dopo eventuali override)
};

export type CellaValutazione = {
  alunnoId: string;
  criterioId: string;
  livelloSuggerito: Livello | null; // null = MAI osservato → cella vuota, nessun default
  numOsservazioni: number;
};

export type RiepilogoCriterioClasse = {
  criterioId: string;
  livelloMedio: Livello | null;
  numOsservazioni: number;
};
