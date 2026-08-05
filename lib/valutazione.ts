// ============================================================================
// Aggregazione della valutazione — costruisce la matrice alunni × criteri
// a partire dalle valutazioni (1..5) raccolte durante l'attività.
// Modulo PURO e testabile (lib/__tests__/valutazione.test.ts).
//
// Modello: ogni step ha delle "caratteristiche" (osservabili), ciascuna
// sottocategoria di un criterio della griglia. Il docente le valuta 1..5,
// per la CLASSE (annotazione senza alunnoId) e/o per il singolo ALUNNO
// (annotazione con alunnoId). Nel resoconto:
//  - la cella (alunno × criterio) media le valutazioni di QUELL'alunno per le
//    caratteristiche di quel criterio;
//  - il riepilogo di classe per criterio media le valutazioni di CLASSE.
//
// REGOLA NON NEGOZIABILE: mai suggerire una valutazione non osservata. Una
// cella senza dati resta `null` (vuota), mai un default.
// ============================================================================

import type {
  Annotazione,
  Attivita,
  CellaValutazione,
  Classe,
  Criterio,
  Livello,
  Osservabile,
  RiepilogoCriterioClasse,
} from "./types";

/** Indicizza gli osservabili per id, per risalire al criterioId da un'annotazione. */
export function indicizzaOsservabili(attivita: Attivita): Map<string, Osservabile> {
  const m = new Map<string, Osservabile>();
  for (const step of attivita.step) {
    for (const o of step.osservabili) m.set(o.id, o);
  }
  return m;
}

/** Arrotonda una media al livello 1..5 (round half-up), o null se non ci sono valori. */
export function arrotondaLivello(valori: number[]): Livello | null {
  if (valori.length === 0) return null;
  const media = valori.reduce((a, b) => a + b, 0) / valori.length;
  const clamp = Math.min(5, Math.max(1, Math.round(media)));
  return clamp as Livello;
}

/** Valore (1..5) di un'annotazione di valutazione se riferita al criterio richiesto. */
function valorePerCriterio(
  a: Annotazione,
  criterioId: string,
  osservabili: Map<string, Osservabile>
): Livello | null {
  if (a.tipo !== "valutazione" || a.valore == null || !a.osservabileId) return null;
  const o = osservabili.get(a.osservabileId);
  if (!o || o.criterioId !== criterioId) return null;
  return a.valore;
}

/** Aggrega la cella (alunno × criterio): livello suggerito + numero di osservazioni. */
export function aggregaCella(
  annotazioni: Annotazione[],
  alunnoId: string,
  criterioId: string,
  osservabili: Map<string, Osservabile>
): CellaValutazione {
  const valori: number[] = [];
  for (const a of annotazioni) {
    if (a.alunnoId !== alunnoId) continue; // solo valutazioni di QUEL singolo alunno
    const v = valorePerCriterio(a, criterioId, osservabili);
    if (v != null) valori.push(v);
  }
  return {
    alunnoId,
    criterioId,
    livelloSuggerito: arrotondaLivello(valori),
    numOsservazioni: valori.length,
  };
}

/** Matrice completa alunni × criteri. */
export function costruisciMatrice(
  attivita: Attivita,
  classe: Classe,
  annotazioni: Annotazione[]
): CellaValutazione[] {
  const osservabili = indicizzaOsservabili(attivita);
  const celle: CellaValutazione[] = [];
  for (const alunno of classe.alunni) {
    for (const criterio of attivita.griglia.criteri) {
      celle.push(aggregaCella(annotazioni, alunno.id, criterio.id, osservabili));
    }
  }
  return celle;
}

/** Riepilogo per criterio a livello di classe (solo valutazioni della CLASSE, senza alunnoId). */
export function riepilogoClasse(
  attivita: Attivita,
  annotazioni: Annotazione[]
): RiepilogoCriterioClasse[] {
  const osservabili = indicizzaOsservabili(attivita);
  return attivita.griglia.criteri.map((criterio: Criterio) => {
    const valori: number[] = [];
    for (const a of annotazioni) {
      if (a.alunnoId != null) continue; // solo valutazioni di classe
      const v = valorePerCriterio(a, criterio.id, osservabili);
      if (v != null) valori.push(v);
    }
    return {
      criterioId: criterio.id,
      livelloMedio: arrotondaLivello(valori),
      numOsservazioni: valori.length,
    };
  });
}
