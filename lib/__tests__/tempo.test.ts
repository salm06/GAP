import { describe, expect, it } from "vitest";
import {
  applicaSuggerimento,
  calcolaDeriva,
  cronometroTotale,
  durataEffettivaStep,
  formattaMMSS,
  getT0,
} from "../tempo";
import type { Attivita, Sessione, Step } from "../types";

const MIN = 60_000;

function step(id: string, durataMin: number, elasticita: Step["elasticita"], recup: number): Step {
  return {
    id,
    titolo: `Step ${id}`,
    azione: "fai qualcosa",
    durataMin,
    elasticita,
    minutiRecuperabili: recup,
    osservabili: [],
  };
}

function attivita(): Attivita {
  return {
    id: "att",
    titolo: "Test",
    materia: "X",
    metodologia: "y",
    durataTotaleMin: 50,
    materialiNecessari: [],
    step: [
      step("s1", 10, "essenziale", 2),
      step("s2", 10, "comprimibile", 4),
      step("s3", 10, "essenziale", 2),
      step("s4", 10, "tagliabile", 8),
      step("s5", 10, "comprimibile", 5),
    ],
    griglia: { criteri: [] },
  };
}

function sessione(over: Partial<Sessione> = {}): Sessione {
  return {
    id: "ses",
    attivitaId: "att",
    avviataAlle: 0,
    stepCorrente: 0,
    tempiReali: [],
    annotazioni: [],
    stato: "in-corso",
    ...over,
  };
}

describe("durataEffettivaStep", () => {
  it("usa la durata di default senza override", () => {
    expect(durataEffettivaStep(attivita().step[0], sessione())).toBe(10);
  });
  it("usa l'override quando presente", () => {
    const s = sessione({ durateEffettive: { s1: 4 } });
    expect(durataEffettivaStep(attivita().step[0], s)).toBe(4);
  });
});

describe("getT0", () => {
  it("usa il timestamp di ingresso in Conduci (avviataAlle)", () => {
    const avvio = new Date(2026, 0, 1, 10, 6, 0, 0).getTime();
    const s = sessione({ avviataAlle: avvio });
    expect(getT0(s)).toBe(avvio);
  });
});

describe("cronometroTotale", () => {
  it("conta alla rovescia dalla durata totale, senza decurtazioni", () => {
    const avvio = new Date(2026, 0, 1, 10, 6, 0, 0).getTime();
    const s = sessione({ avviataAlle: avvio });
    const c = cronometroTotale(attivita(), s, avvio);
    expect(c.decurtatiMs).toBe(0);
    // Piano totale 50': all'avvio restano esattamente 50'.
    expect(Math.round(c.rimanentiMs / MIN)).toBe(50);
  });
});

describe("calcolaDeriva", () => {
  it("è in-linea se lo scostamento è sotto la soglia di 3'", () => {
    const s = sessione({
      stepCorrente: 1,
      tempiReali: [{ stepId: "s1", inizio: 0, fine: 12 * MIN }], // +2' su s1
    });
    const d = calcolaDeriva(attivita(), s, 12 * MIN);
    expect(d.direzione).toBe("in-linea");
    expect(d.suggerimento).toBeUndefined();
  });

  it("rileva il ritardo e suggerisce di comprimere, mai un essenziale", () => {
    // s1 concluso con 16' invece di 10' → +6' di ritardo. Corrente = s2 (indice 1).
    const s = sessione({
      stepCorrente: 1,
      tempiReali: [
        { stepId: "s1", inizio: 0, fine: 16 * MIN },
        { stepId: "s2", inizio: 16 * MIN }, // in corso
      ],
    });
    const d = calcolaDeriva(attivita(), s, 16 * MIN);
    expect(d.direzione).toBe("ritardo");
    expect(d.scostamentoMin).toBe(6);
    // Priorità: il primo 'tagliabile' a valle è s4.
    expect(d.suggerimento?.stepId).toBe("s4");
    expect(d.suggerimento?.azione).toBe("taglia");
    expect(d.suggerimento?.testo).toContain("recuperi");
  });

  it("include lo sforamento dello step corrente ancora in corso", () => {
    // s1 in corso da 16' su 10' previsti → +6'.
    const s = sessione({
      stepCorrente: 0,
      tempiReali: [{ stepId: "s1", inizio: 0 }],
    });
    const d = calcolaDeriva(attivita(), s, 16 * MIN);
    expect(d.scostamentoMin).toBe(6);
    expect(d.direzione).toBe("ritardo");
  });

  it("non mostra falso anticipo a metà di uno step corrente", () => {
    const s = sessione({ stepCorrente: 0, tempiReali: [{ stepId: "s1", inizio: 0 }] });
    const d = calcolaDeriva(attivita(), s, 3 * MIN); // 3' su 10' previsti
    expect(d.scostamentoMin).toBe(0);
    expect(d.direzione).toBe("in-linea");
  });

  it("rileva l'anticipo dagli step conclusi in fretta", () => {
    // s1 chiuso in 4' invece di 10' → −6'.
    const s = sessione({
      stepCorrente: 1,
      tempiReali: [
        { stepId: "s1", inizio: 0, fine: 4 * MIN },
        { stepId: "s2", inizio: 4 * MIN },
      ],
    });
    const d = calcolaDeriva(attivita(), s, 4 * MIN);
    expect(d.direzione).toBe("anticipo");
    expect(d.scostamentoMin).toBe(-6);
    expect(d.suggerimento?.azione).toBe("espandi");
  });
});

describe("applicaSuggerimento", () => {
  it("comprime la durata effettiva dello step scelto", () => {
    const att = attivita();
    const s = sessione({ stepCorrente: 1 });
    const sugg = {
      stepId: "s4",
      stepIndice: 3,
      stepTitolo: "Step s4",
      azione: "taglia" as const,
      minutiRecuperabili: 8,
      testo: "…",
    };
    const nuova = applicaSuggerimento(s, att, sugg);
    expect(nuova.durateEffettive?.s4).toBe(2); // 10 − 8
    expect(s.durateEffettive).toBeUndefined(); // immutabilità
  });

  it("espande la durata effettiva", () => {
    const att = attivita();
    const s = sessione({ stepCorrente: 0 });
    const nuova = applicaSuggerimento(s, att, {
      stepId: "s3",
      stepIndice: 2,
      stepTitolo: "Step s3",
      azione: "espandi",
      minutiRecuperabili: 5,
      testo: "…",
    });
    expect(nuova.durateEffettive?.s3).toBe(15); // 10 + 5
  });
});

describe("formattaMMSS", () => {
  it("formatta minuti e secondi", () => {
    expect(formattaMMSS(65_000)).toBe("1:05");
    expect(formattaMMSS(0)).toBe("0:00");
    expect(formattaMMSS(-5_000)).toBe("−0:05");
  });
});
