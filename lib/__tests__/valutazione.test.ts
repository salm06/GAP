import { describe, expect, it } from "vitest";
import {
  aggregaCella,
  arrotondaLivello,
  costruisciMatrice,
  indicizzaOsservabili,
  riepilogoClasse,
} from "../valutazione";
import type { Annotazione, Attivita, Classe } from "../types";

function attivita(): Attivita {
  return {
    id: "att",
    titolo: "T",
    materia: "X",
    metodologia: "y",
    durataTotaleMin: 30,
    materialiNecessari: [],
    step: [
      {
        id: "s1",
        titolo: "S1",
        azione: "a",
        durataMin: 10,
        elasticita: "essenziale",
        minutiRecuperabili: 0,
        osservabili: [
          { id: "o1", label: "Colgono il senso", criterioId: "c1" },
          { id: "o2", label: "Argomentano", criterioId: "c1" },
          { id: "o3", label: "Collaborano", criterioId: "c2" },
        ],
      },
    ],
    griglia: {
      criteri: [
        { id: "c1", nome: "Comprensione", descrittori: [] },
        { id: "c2", nome: "Collaborazione", descrittori: [] },
      ],
    },
  };
}

const classe: Classe = {
  id: "cl",
  nome: "2B",
  alunni: [
    { id: "a1", nome: "Bianchi A." },
    { id: "a2", nome: "Conti G." },
  ],
};

function ann(over: Partial<Annotazione>): Annotazione {
  return {
    id: Math.random().toString(),
    stepId: "s1",
    timestamp: 0,
    tipo: "valutazione",
    ...over,
  };
}

describe("arrotondaLivello", () => {
  it("ritorna null senza valori (nessun default)", () => {
    expect(arrotondaLivello([])).toBeNull();
  });
  it("arrotonda la media (round half-up) e resta nel range 1..5", () => {
    expect(arrotondaLivello([5, 2])).toBe(4); // 3.5 → 4
    expect(arrotondaLivello([5, 5, 5])).toBe(5);
    expect(arrotondaLivello([1, 1, 2])).toBe(1);
    expect(arrotondaLivello([4, 5])).toBe(5);
  });
});

describe("aggregaCella", () => {
  it("aggrega solo le valutazioni del singolo alunno per quel criterio", () => {
    const osservabili = indicizzaOsservabili(attivita());
    const annotazioni = [
      ann({ alunnoId: "a1", osservabileId: "o1", valore: 5 }), // c1
      ann({ alunnoId: "a1", osservabileId: "o2", valore: 3 }), // c1
      ann({ alunnoId: "a1", osservabileId: "o3", valore: 4 }), // c2 → non conta per c1
      ann({ alunnoId: "a2", osservabileId: "o1", valore: 2 }), // altro alunno
      ann({ osservabileId: "o1", valore: 1 }), // classe → non conta per la cella
    ];
    const cella = aggregaCella(annotazioni, "a1", "c1", osservabili);
    expect(cella.livelloSuggerito).toBe(4); // media(5,3)=4
    expect(cella.numOsservazioni).toBe(2);
  });

  it("cella vuota (null) se l'alunno non è stato valutato", () => {
    const osservabili = indicizzaOsservabili(attivita());
    const cella = aggregaCella([], "a2", "c1", osservabili);
    expect(cella.livelloSuggerito).toBeNull();
    expect(cella.numOsservazioni).toBe(0);
  });
});

describe("costruisciMatrice", () => {
  it("produce una cella per ogni alunno × criterio", () => {
    const annotazioni = [
      ann({ alunnoId: "a1", osservabileId: "o1", valore: 5 }),
      ann({ alunnoId: "a1", osservabileId: "o3", valore: 4 }),
    ];
    const matrice = costruisciMatrice(attivita(), classe, annotazioni);
    expect(matrice).toHaveLength(2 * 2);
    const a1c1 = matrice.find((c) => c.alunnoId === "a1" && c.criterioId === "c1");
    expect(a1c1?.livelloSuggerito).toBe(5);
    const a2c1 = matrice.find((c) => c.alunnoId === "a2" && c.criterioId === "c1");
    expect(a2c1?.livelloSuggerito).toBeNull();
  });
});

describe("riepilogoClasse", () => {
  it("usa solo le valutazioni di CLASSE (senza alunnoId)", () => {
    const annotazioni = [
      ann({ osservabileId: "o1", valore: 4 }), // classe, c1
      ann({ osservabileId: "o2", valore: 3 }), // classe, c1
      ann({ alunnoId: "a1", osservabileId: "o1", valore: 1 }), // alunno → ignorato
    ];
    const r = riepilogoClasse(attivita(), annotazioni);
    const c1 = r.find((x) => x.criterioId === "c1");
    expect(c1?.numOsservazioni).toBe(2);
    expect(c1?.livelloMedio).toBe(4); // media(4,3)=3.5 → 4
    const c2 = r.find((x) => x.criterioId === "c2");
    expect(c2?.livelloMedio).toBeNull();
  });
});
