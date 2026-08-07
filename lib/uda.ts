// ============================================================================
// UDA interdisciplinare — dal campo `possibileUdaCon` (es. "Arte e Storia")
// ricava l'elenco delle materie e, per ciascuna, una breve indicazione su come
// integrarla in un'unità di apprendimento. Testi redazionali per materia, con
// fallback neutro; quando i kit avranno spunti UDA propri, basterà sostituire.
// ============================================================================

import type { UdaMateria } from "./types";

const DESCRIZIONI: Record<string, string> = {
  arte: "Si lavora sul linguaggio visivo — composizione, colore, inquadratura — come strumento per comunicare. Gli studenti imparano a leggere e costruire immagini efficaci, poi lo applicano al prodotto dell’attività.",
  storia:
    "Si colloca il tema nel suo contesto storico — eventi, società e mentalità dell’epoca — e si confronta passato e presente. Il lavoro guadagna profondità e nuovi spunti per il dibattito.",
  tecnologia:
    "Si mettono a fuoco strumenti e materiali: dalla progettazione al prototipo, gli studenti scelgono e usano la tecnologia più adatta allo scopo, ragionando sul metodo.",
  italiano:
    "Si cura la lingua: comprensione del testo, lessico ed esposizione. Gli studenti rielaborano i contenuti e imparano a raccontarli con chiarezza, all’orale e allo scritto.",
  "educazione civica":
    "Si affrontano diritti, responsabilità e cittadinanza attiva: il tema diventa occasione per riflettere su regole, inclusione e bene comune.",
  geografia:
    "Si legge il territorio e lo spazio: luoghi, ambienti e relazioni tra uomo e ambiente diventano una chiave in più per interpretare il tema.",
  matematica:
    "Si portano dentro dati, misure e ragionamento logico: gli studenti quantificano, confrontano e argomentano con rigore ciò che l’attività fa emergere.",
  scienze:
    "Si osserva e si sperimenta: si formulano ipotesi e le si verifica, portando il metodo scientifico dentro il tema dell’attività.",
  musica:
    "Si esplora il suono come linguaggio: ritmo, melodia e colonna sonora amplificano il racconto e le emozioni del prodotto finale.",
  inglese:
    "Si lavora sulla lingua straniera: gli studenti traducono, adattano o presentano il prodotto in inglese, allenando lessico e comunicazione autentica.",
};

const DEFAULT_COME =
  "Cerca i punti di contatto tra i contenuti dell’attività e questa materia: un progetto condiviso rende l’apprendimento più significativo e duraturo.";

/** Materie di una possibile UDA a partire dalla stringa "Arte e Storia" / "Tecnologia, Arte". */
export function materieUda(possibileUdaCon?: string): UdaMateria[] {
  if (!possibileUdaCon) return [];
  return possibileUdaCon
    .split(/\s*,\s*|\s+e\s+/i)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((materia) => ({
      materia,
      come: DESCRIZIONI[materia.toLowerCase()] ?? DEFAULT_COME,
    }));
}
