// ============================================================================
// GAP Player — tipi condivisi
// Unica fonte di verità dei tipi. I componenti non accedono mai al DB
// direttamente: passano sempre per lib/repository.ts.
// ============================================================================

export type Livello = 1 | 2 | 3 | 4 | 5; // (legacy) usato solo da Osservabile.livello nei dati
export type Voto = "A" | "B" | "C" | "D" | "E"; // scala valutazione competenze: A alto … E basso
export type Elasticita = "essenziale" | "comprimibile" | "tagliabile";

// ---------------------------------------------------------------------------
// ATTIVITÀ (contenuto del kit, sola lettura)
// ---------------------------------------------------------------------------
export type Attivita = {
  id: string;
  titolo: string;
  descrizione?: string; // descrizione breve (~160 caratteri) mostrata sotto il titolo nella card
  obiettivo?: string; // obiettivo dell'attività, mostrato a fianco alla descrizione (riquadro giallo)
  materia: string;
  metodologia: string; // gamification | digital storytelling | PBL | ...
  durataTotaleMin: number; // durata pianificata, es. 100
  immagine?: string; // hero banner contestuale (path in /public), mostrato nella card
  voto?: number; // valutazione media del kit su 10 (fittizia per ora) — badge sulla card
  creatore?: string; // autore della lezione; se assente → CREATORE_DEFAULT (vedi lib/creatore.ts)
  presentazione?: string; // slide teoriche pronte (path in /public), scaricabili dalla card materiali
  // --- scheda di presentazione (mostrata nella card) ---
  ordineScuola?: string; // es. "Secondaria II grado"
  competenzeTarget?: string; // es. "Comprensione del testo, rielaborazione creativa"
  tecnologiaRichiesta?: string; // (legacy) non più mostrato: i materiali coprono questa info
  possibileUdaCon?: string; // (legacy) stringa "Arte e Storia" delle attività seed
  uda?: UdaMateria[]; // UDA interdisciplinare strutturata: materia + come integrarla
  materialiNecessari: Materiale[];
  step: Step[];
  griglia: Griglia;
};

// Materia collegabile per una UDA interdisciplinare + come integrarla in questa attività.
export type UdaMateria = { materia: string; come: string };

export type Materiale = {
  id: string;
  descrizione: string; // "Foglio A3 per ogni gruppo"
  tipo: "fisico" | "digitale" | "tecnico";
  link?: string; // link esterno da aprire (es. account Canva)
  download?: string; // asset digitale già fornito dal creatore (path in /public) → bottone "Scarica"
  critico: boolean; // se manca, l'attività non parte
};

export type Fase = "setup" | "pensa" | "fai" | "capisci";

// Materiale pronto all'uso per il docente, apribile in una nuova scheda
// (immagine da proiettare, documento, link). Generico: riutilizzabile su
// qualunque step dove serva dare al docente qualcosa di pronto.
export type Risorsa = {
  label: string; // etichetta del pulsante, es. "Immagine di aggancio"
  url: string; // path in /public (es. "/materiali/...") o URL esterno
  tipo?: "immagine" | "documento" | "link";
};

export type Step = {
  id: string;
  titolo: string; // etichetta breve, usata come titolo (una riga) della card
  fase: Fase; // schema pensa-fai-capisci — OBBLIGATORIO per ogni lezione GAP (guida il colore della card)
  azione: string; // istruzione operativa dello step: paragrafo di approfondimento sotto il titolo
  cosaDico?: string; // (legacy) frase pronta da dire alla classe
  neuro?: string; // spunto di neurodidattica: perché questo step funziona
  adattamentoBes?: string; // riquadro giallo: indicazioni per l'adattamento BES/DSA di questo step
  domande?: string[]; // domande da porre
  aiuti?: string[]; // cosa fare se la classe si blocca
  durataMin: number;
  elasticita: Elasticita;
  minutiRecuperabili: number; // quanto si può togliere senza romperlo
  fallback?: string; // variante analogica se la tecnologia non funziona
  risorse?: Risorsa[]; // materiali pronti all'uso per il docente, aperti in nuova scheda
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

// Un "criterio" della griglia è una competenza (per le attività GAP: una competenza PECUP).
export type Criterio = {
  id: string;
  nome: string; // etichetta breve per la UI, es. "Comunicazione visiva"
  competenzaMinisteriale?: string; // testo integrale della competenza PECUP
  descrittori?: { voto: Voto; testo: string }[]; // opzionale: descrittori per livello A–E
};

// ---------------------------------------------------------------------------
// CLASSE
// ---------------------------------------------------------------------------
export type Alunno = { id: string; nome: string };
export type Classe = { id: string; nome: string; alunni: Alunno[] };

// Gruppi di lavoro per un'attività che li richiede (creati in fase di avvio).
export type Gruppo = { id: string; nome: string; alunniIds: string[] };

// ---------------------------------------------------------------------------
// SESSIONE (stato di una lezione realmente svolta)
// ---------------------------------------------------------------------------
export type StatoSessione = "preparazione" | "in-corso" | "conclusa";

export type Sessione = {
  id: string;
  attivitaId: string;
  classeId?: string;
  gruppi?: Gruppo[]; // gruppi di lavoro, se l'attività li richiede
  avviataAlle: number; // timestamp di ingresso in modalità Conduci — è il T0 del cronometro totale
  stepCorrente: number; // indice 0-based
  tempiReali: TempoReale[];
  annotazioni: Annotazione[];
  stato: StatoSessione;
  durateEffettive?: Record<string, number>; // override durata step (min) dopo un suggerimento di deriva
  materialiSpuntati?: string[]; // checklist Prepara persistente
  valutazioneOverride?: Record<string, Record<string, Voto>>; // [alunnoId][criterioId] = voto A–E corretto a mano
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
  osservabileId?: string; // id della competenza (criterio) valutata (per tipo 'valutazione')
  alunnoId?: string; // se presente → riguarda il singolo; assente → la classe
  valore?: Voto; // voto A–E (per tipo 'valutazione')
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
  livelloSuggerito: Voto | null; // voto A–E suggerito; null = MAI osservato → cella vuota, nessun default
  numOsservazioni: number;
};

export type RiepilogoCriterioClasse = {
  criterioId: string;
  livelloMedio: Voto | null; // voto A–E medio di classe; null se non osservato
  numOsservazioni: number;
};
