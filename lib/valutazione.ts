// ============================================================================
// Aggregazione della valutazione — costruisce la matrice alunni × competenze
// a partire dai voti A–E raccolti durante l'attività.
// Modulo PURO e testabile (lib/__tests__/valutazione.test.ts).
//
// Modello: le competenze (griglia.criteri) sono valutabili in OGNI step, con un
// voto A–E, per la CLASSE (annotazione senza alunnoId) e/o per il singolo ALUNNO
// (annotazione con alunnoId). L'annotazione salva l'id della competenza in
// `osservabileId` e il voto in `valore`. Nel resoconto:
//  - la cella (alunno × competenza) media i voti di QUELL'alunno per quella
//    competenza (su tutti gli step);
//  - il riepilogo di classe media i voti di CLASSE per competenza.
//
// REGOLA NON NEGOZIABILE: mai suggerire un voto non osservato. Una cella senza
// dati resta `null` (vuota), mai un default; si completa a mano nel resoconto.
// ============================================================================

import type {
  Annotazione,
  Attivita,
  CellaValutazione,
  Classe,
  Osservabile,
  RiepilogoCriterioClasse,
  Voto,
} from "./types";
import { mediaVoti } from "./voti";

/** (legacy) Indicizza gli osservabili per id — mantenuto per compatibilità dati. */
export function indicizzaOsservabili(attivita: Attivita): Map<string, Osservabile> {
  const m = new Map<string, Osservabile>();
  for (const step of attivita.step) {
    for (const o of step.osservabili) m.set(o.id, o);
  }
  return m;
}

/** Voti A–E riferiti a una competenza, filtrando le annotazioni con `keep`. */
function votiPerCompetenza(
  annotazioni: Annotazione[],
  criterioId: string,
  keep: (a: Annotazione) => boolean
): Voto[] {
  const out: Voto[] = [];
  for (const a of annotazioni) {
    if (a.tipo !== "valutazione" || a.valore == null) continue;
    if (a.osservabileId !== criterioId) continue;
    if (!keep(a)) continue;
    out.push(a.valore);
  }
  return out;
}

/** Aggrega la cella (alunno × competenza): voto suggerito + numero di osservazioni. */
export function aggregaCella(
  annotazioni: Annotazione[],
  alunnoId: string,
  criterioId: string
): CellaValutazione {
  const voti = votiPerCompetenza(annotazioni, criterioId, (a) => a.alunnoId === alunnoId);
  return {
    alunnoId,
    criterioId,
    livelloSuggerito: mediaVoti(voti),
    numOsservazioni: voti.length,
  };
}

/** Matrice completa alunni × competenze. */
export function costruisciMatrice(
  attivita: Attivita,
  classe: Classe,
  annotazioni: Annotazione[]
): CellaValutazione[] {
  const celle: CellaValutazione[] = [];
  for (const alunno of classe.alunni) {
    for (const criterio of attivita.griglia.criteri) {
      celle.push(aggregaCella(annotazioni, alunno.id, criterio.id));
    }
  }
  return celle;
}

/** Riepilogo per competenza a livello di classe (solo valutazioni della CLASSE, senza alunnoId). */
export function riepilogoClasse(
  attivita: Attivita,
  annotazioni: Annotazione[]
): RiepilogoCriterioClasse[] {
  return attivita.griglia.criteri.map((criterio) => {
    const voti = votiPerCompetenza(annotazioni, criterio.id, (a) => a.alunnoId == null);
    return {
      criterioId: criterio.id,
      livelloMedio: mediaVoti(voti),
      numOsservazioni: voti.length,
    };
  });
}
