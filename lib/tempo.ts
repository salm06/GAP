// ============================================================================
// Motore del tempo — "correttore di rotta", non un timer che suona.
// Modulo PURO: nessun Date.now() interno, l'ora corrente arriva come parametro.
// Testabile in lib/__tests__/tempo.test.ts.
// ============================================================================

import type {
  Attivita,
  CronometroTotale,
  Deriva,
  Sessione,
  Step,
  SuggerimentoDeriva,
} from "./types";

const MIN = 60_000;
const SOGLIA_DERIVA_MIN = 3; // sotto i 3' non disturbiamo il docente

/** Se il timer della sessione è attualmente in pausa. */
export function inPausa(sessione: Sessione): boolean {
  return sessione.pausaDa != null;
}

/**
 * Orologio virtuale: tempo reale meno tutto il tempo trascorso in pausa
 * (incluso l'eventuale intervallo di pausa in corso). Tutti i timestamp
 * (inizio/fine step, avvio) vengono scritti su QUESTA scala: così le durate
 * escludono automaticamente le pause e ogni cronometro si congela quando è
 * in pausa. Prima della prima pausa, virtuale == reale.
 */
export function oraVirtuale(sessione: Sessione, oraReale: number): number {
  const accumulato = sessione.msInPausa ?? 0;
  const pausaCorrente = sessione.pausaDa != null ? Math.max(0, oraReale - sessione.pausaDa) : 0;
  return oraReale - accumulato - pausaCorrente;
}

/** Durata pianificata dello step, tenendo conto di eventuali override (deriva accettata). */
export function durataEffettivaStep(step: Step, sessione: Sessione): number {
  const override = sessione.durateEffettive?.[step.id];
  return override != null ? override : step.durataMin;
}

/**
 * T0 = istante di riferimento del piano: il momento in cui si è entrati in
 * Conduci. Niente più orario dichiarato o decurtazioni: il cronometro totale
 * parte semplicemente da qui.
 */
export function getT0(sessione: Sessione): number {
  return sessione.avviataAlle;
}

/** Somma delle durate pianificate (con override) di tutti gli step. */
export function durataPianificataTotaleMs(attivita: Attivita, sessione: Sessione): number {
  return attivita.step.reduce((acc, s) => acc + durataEffettivaStep(s, sessione) * MIN, 0);
}

/**
 * Cronometro totale: conto alla rovescia della durata pianificata a partire
 * dall'ingresso in Conduci (T0 = avviataAlle). Nessuna decurtazione.
 */
export function cronometroTotale(
  attivita: Attivita,
  sessione: Sessione,
  ora: number
): CronometroTotale {
  const totaleMs = durataPianificataTotaleMs(attivita, sessione);
  const t0 = getT0(sessione);
  const finePrevista = t0 + totaleMs;
  const rimanentiMs = finePrevista - ora;
  return { rimanentiMs, decurtatiMs: 0, totaleMs };
}

/** Tempo realmente consumato (ms) fino a `ora`, sommando step conclusi + step corrente. */
export function tempoConsumatoMs(sessione: Sessione, ora: number): number {
  return sessione.tempiReali.reduce((acc, t) => {
    const fine = t.fine ?? ora;
    return acc + Math.max(0, fine - t.inizio);
  }, 0);
}

/**
 * Calcola la deriva rispetto al piano.
 *
 * scostamento = deriva accumulata dagli step CONCLUSI (reale − previsto)
 *               + sforamento dello step CORRENTE oltre il suo tempo previsto.
 *
 * Non si accredita "anticipo" mentre uno step è ancora in corso (nessun falso
 * anticipo a metà step): l'anticipo emerge solo dagli step chiusi in fretta.
 */
export function calcolaDeriva(attivita: Attivita, sessione: Sessione, ora: number): Deriva {
  const step = attivita.step;
  let driftConclusiMs = 0;

  for (let i = 0; i < step.length; i++) {
    const t = sessione.tempiReali.find((r) => r.stepId === step[i].id);
    if (!t || t.fine == null) continue; // solo step conclusi
    const reale = t.fine - t.inizio;
    const previsto = durataEffettivaStep(step[i], sessione) * MIN;
    driftConclusiMs += reale - previsto;
  }

  // Sforamento dello step corrente (solo eccesso, mai credito).
  const corrente = step[sessione.stepCorrente];
  let sforamentoCorrenteMs = 0;
  if (corrente) {
    const t = sessione.tempiReali.find((r) => r.stepId === corrente.id);
    if (t && t.fine == null) {
      const elapsed = ora - t.inizio;
      const previsto = durataEffettivaStep(corrente, sessione) * MIN;
      sforamentoCorrenteMs = Math.max(0, elapsed - previsto);
    }
  }

  const scostamentoMs = driftConclusiMs + sforamentoCorrenteMs;
  const scostamentoMin = Math.round(scostamentoMs / MIN);

  let direzione: Deriva["direzione"] = "in-linea";
  if (scostamentoMin >= SOGLIA_DERIVA_MIN) direzione = "ritardo";
  else if (scostamentoMin <= -SOGLIA_DERIVA_MIN) direzione = "anticipo";

  const deriva: Deriva = { scostamentoMin, direzione };
  if (direzione !== "in-linea") {
    deriva.suggerimento =
      direzione === "ritardo"
        ? suggerisciCompressione(attivita, sessione, scostamentoMin)
        : suggerisciEspansione(attivita, sessione, Math.abs(scostamentoMin));
  }
  return deriva;
}

/**
 * In ritardo: scegli uno step SUCCESSIVO da comprimere/tagliare.
 * Priorità: prima i 'tagliabile', poi i 'comprimibile'. Mai gli 'essenziale'.
 * Fra pari priorità si prende il primo step a valle (il più imminente).
 */
function suggerisciCompressione(
  attivita: Attivita,
  sessione: Sessione,
  scostamentoMin: number
): SuggerimentoDeriva | undefined {
  const candidati = (elast: Step["elasticita"]) =>
    attivita.step
      .map((s, i) => ({ s, i }))
      .filter(
        ({ s, i }) =>
          i > sessione.stepCorrente &&
          s.elasticita === elast &&
          durataEffettivaStep(s, sessione) > 0 &&
          s.minutiRecuperabili > 0
      );

  const scelto = candidati("tagliabile")[0] ?? candidati("comprimibile")[0];
  if (!scelto) return undefined;

  const { s, i } = scelto;
  const azione = s.elasticita === "tagliabile" ? "taglia" : "comprimi";
  const recuperabili = Math.min(s.minutiRecuperabili, durataEffettivaStep(s, sessione));
  const etichetta = s.elasticita === "tagliabile" ? "tagliabile" : "comprimibile";
  return {
    stepId: s.id,
    stepIndice: i,
    stepTitolo: s.titolo,
    azione,
    minutiRecuperabili: recuperabili,
    testo: `Sei ${scostamentoMin}' oltre. Lo step ${i + 1} è ${etichetta} → recuperi ${recuperabili}'.`,
  };
}

/** In anticipo: suggerisci dove dedicare più tempo (primo step 'essenziale' a valle, altrimenti il primo a valle). */
function suggerisciEspansione(
  attivita: Attivita,
  sessione: Sessione,
  anticipoMin: number
): SuggerimentoDeriva | undefined {
  const valle = attivita.step.map((s, i) => ({ s, i })).filter(({ i }) => i > sessione.stepCorrente);
  const scelto = valle.find(({ s }) => s.elasticita === "essenziale") ?? valle[0];
  if (!scelto) return undefined;
  const { s, i } = scelto;
  return {
    stepId: s.id,
    stepIndice: i,
    stepTitolo: s.titolo,
    azione: "espandi",
    minutiRecuperabili: anticipoMin,
    testo: `Sei ${anticipoMin}' in anticipo. Puoi dedicare più tempo allo step ${i + 1} «${s.titolo}».`,
  };
}

/**
 * Applica un suggerimento di deriva: aggiorna le durate effettive a valle.
 * Ritorna una NUOVA sessione (immutabile). Non muta l'argomento.
 */
export function applicaSuggerimento(
  sessione: Sessione,
  attivita: Attivita,
  sugg: SuggerimentoDeriva
): Sessione {
  const step = attivita.step[sugg.stepIndice];
  if (!step) return sessione;
  const durateEffettive = { ...(sessione.durateEffettive ?? {}) };

  if (sugg.azione === "espandi") {
    durateEffettive[step.id] = durataEffettivaStep(step, sessione) + sugg.minutiRecuperabili;
  } else {
    const nuova = Math.max(0, durataEffettivaStep(step, sessione) - sugg.minutiRecuperabili);
    durateEffettive[step.id] = nuova;
  }
  return { ...sessione, durateEffettive };
}

/** Formatta millisecondi come "M:SS" (per i cronometri che contano in avanti). */
export function formattaMMSS(ms: number): string {
  const neg = ms < 0;
  const tot = Math.floor(Math.abs(ms) / 1000);
  const m = Math.floor(tot / 60);
  const s = tot % 60;
  return `${neg ? "−" : ""}${m}:${String(s).padStart(2, "0")}`;
}

/** Formatta un tempo residuo in "M′" arrotondato ai minuti, con segno per lo sforamento. */
export function formattaMinuti(ms: number): string {
  const neg = ms < 0;
  const min = Math.round(Math.abs(ms) / MIN);
  return `${neg ? "−" : ""}${min}′`;
}
