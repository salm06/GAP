import { describe, expect, it } from "vitest";
import { aggregaCella, costruisciMatrice, riepilogoClasse } from "../valutazione";
import { mediaVoti } from "../voti";
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
        fase: "pensa",
        azione: "a",
        durataMin: 10,
        elasticita: "essenziale",
        minutiRecuperabili: 0,
        osservabili: [],
      },
    ],
    griglia: {
      criteri: [
        { id: "c1", nome: "Lingua italiana" },
        { id: "c2", nome: "Comunicazione visiva" },
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

describe("mediaVoti", () => {
  it("ritorna null senza voti (nessun default)", () => {
    expect(mediaVoti([])).toBeNull();
  });
  it("media A..E (A = alto) con round half-up", () => {
    expect(mediaVoti(["A", "C"])).toBe("B"); // (5+3)/2 = 4 → B
    expect(mediaVoti(["A", "A", "A"])).toBe("A");
    expect(mediaVoti(["E", "E", "D"])).toBe("E"); // 1.33 → E
    expect(mediaVoti(["B", "A"])).toBe("A"); // 4.5 → 5 → A
  });
});

describe("aggregaCella", () => {
  it("aggrega solo i voti del singolo alunno per quella competenza (anche su più step)", () => {
    const annotazioni = [
      ann({ alunnoId: "a1", osservabileId: "c1", valore: "A" }),
      ann({ alunnoId: "a1", osservabileId: "c1", valore: "C", stepId: "s2" }), // altro step, stessa competenza
      ann({ alunnoId: "a1", osservabileId: "c2", valore: "A" }), // altra competenza → non conta
      ann({ alunnoId: "a2", osservabileId: "c1", valore: "E" }), // altro alunno
      ann({ osservabileId: "c1", valore: "E" }), // classe → non conta per la cella
    ];
    const cella = aggregaCella(annotazioni, "a1", "c1");
    expect(cella.livelloSuggerito).toBe("B"); // media(A,C) = B
    expect(cella.numOsservazioni).toBe(2);
  });

  it("cella vuota (null) se l'alunno non è stato valutato", () => {
    const cella = aggregaCella([], "a2", "c1");
    expect(cella.livelloSuggerito).toBeNull();
    expect(cella.numOsservazioni).toBe(0);
  });
});

describe("costruisciMatrice", () => {
  it("produce una cella per ogni alunno × competenza", () => {
    const annotazioni = [
      ann({ alunnoId: "a1", osservabileId: "c1", valore: "A" }),
      ann({ alunnoId: "a1", osservabileId: "c2", valore: "B" }),
    ];
    const matrice = costruisciMatrice(attivita(), classe, annotazioni);
    expect(matrice).toHaveLength(2 * 2);
    const a1c1 = matrice.find((c) => c.alunnoId === "a1" && c.criterioId === "c1");
    expect(a1c1?.livelloSuggerito).toBe("A");
    const a2c1 = matrice.find((c) => c.alunnoId === "a2" && c.criterioId === "c1");
    expect(a2c1?.livelloSuggerito).toBeNull();
  });
});

describe("riepilogoClasse", () => {
  it("usa solo i voti di CLASSE (senza alunnoId)", () => {
    const annotazioni = [
      ann({ osservabileId: "c1", valore: "A" }), // classe, c1
      ann({ osservabileId: "c1", valore: "C", stepId: "s2" }), // classe, c1, altro step
      ann({ alunnoId: "a1", osservabileId: "c1", valore: "E" }), // alunno → ignorato
    ];
    const r = riepilogoClasse(attivita(), annotazioni);
    const c1 = r.find((x) => x.criterioId === "c1");
    expect(c1?.numOsservazioni).toBe(2);
    expect(c1?.livelloMedio).toBe("B"); // media(A,C) = B
    const c2 = r.find((x) => x.criterioId === "c2");
    expect(c2?.livelloMedio).toBeNull();
  });
});
