"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessione } from "@/lib/hooks/useSessione";
import { useCronometro } from "@/lib/hooks/useCronometro";
import { useWakeLock } from "@/lib/hooks/useWakeLock";
import { applicaSuggerimento, calcolaDeriva, inPausa, oraVirtuale } from "@/lib/tempo";
import type { Annotazione, Sessione, Voto } from "@/lib/types";
import { repository } from "@/lib/repository";

import { BarraStato } from "./BarraStato";
import { Timeline } from "./Timeline";
import { BannerDeriva } from "./BannerDeriva";
import { AzioneCorrente } from "./AzioneCorrente";
import { SupportoInline } from "./SupportoInline";
import { RisorseStep } from "./RisorseStep";
import { Annota } from "./Annota";
import { NavStep } from "./NavStep";
import { AvvisoProiettore } from "@/components/comune/AvvisoProiettore";
import { Icona } from "@/components/comune/Icona";

function nuovoIdAnn() {
  return `ann-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ConduciClient({ sessioneId }: { sessioneId: string }) {
  const router = useRouter();
  const { sessione, attivita, classe, caricamento, patch } = useSessione(sessioneId);
  const oraReale = useCronometro(1000);
  const { attivo: wakeLockAttivo } = useWakeLock(!!sessione && sessione.stato !== "conclusa");

  const [soloNecessario, setSoloNecessario] = useState(false);
  const [mostraFallback, setMostraFallback] = useState(false);
  const initRef = useRef(false);

  const ora = sessione ? oraVirtuale(sessione, oraReale) : oraReale;
  const pausato = sessione ? inPausa(sessione) : false;

  useEffect(() => {
    if (!sessione || initRef.current) return;
    if (sessione.stato === "conclusa") return;
    initRef.current = true;
    patch((s) => {
      const step = (attivita?.step ?? [])[s.stepCorrente];
      if (!step) return s;
      const v = oraVirtuale(s, Date.now());
      const haTempo = s.tempiReali.some((t) => t.stepId === step.id);
      return {
        ...s,
        stato: "in-corso",
        avviataAlle: s.stato === "preparazione" ? v : s.avviataAlle,
        tempiReali: haTempo ? s.tempiReali : [...s.tempiReali, { stepId: step.id, inizio: v }],
      };
    });
  }, [sessione, attivita, patch]);

  const step = sessione && attivita ? attivita.step[sessione.stepCorrente] : null;

  const deriva = useMemo(() => {
    if (!attivita || !sessione) return null;
    return calcolaDeriva(attivita, sessione, ora);
  }, [attivita, sessione, ora]);

  const togglePausa = useCallback(() => {
    patch((s) => {
      if (s.pausaDa != null) {
        const msInPausa = (s.msInPausa ?? 0) + Math.max(0, Date.now() - s.pausaDa);
        return { ...s, pausaDa: undefined, msInPausa };
      }
      return { ...s, pausaDa: Date.now() };
    });
  }, [patch]);

  // Azzera il cronometro dello step corrente (riparte da 0 dall'istante attuale).
  const resetTimer = useCallback(() => {
    if (!step) return;
    patch((s) => {
      const v = oraVirtuale(s, Date.now());
      const esiste = s.tempiReali.some((t) => t.stepId === step.id);
      const tempi = esiste
        ? s.tempiReali.map((t) =>
            t.stepId === step.id ? { ...t, inizio: v, fine: undefined } : t
          )
        : [...s.tempiReali, { stepId: step.id, inizio: v }];
      return { ...s, tempiReali: tempi };
    });
  }, [step, patch]);

  const vaAlloStep = useCallback(
    (target: number) => {
      if (!attivita) return;
      const clamp = Math.max(0, Math.min(attivita.step.length - 1, target));
      patch((s) => {
        const v = oraVirtuale(s, Date.now());
        const corrente = attivita.step[s.stepCorrente];
        const bersaglio = attivita.step[clamp];
        let tempi = s.tempiReali.map((t) =>
          t.stepId === corrente.id && t.fine == null ? { ...t, fine: v } : t
        );
        const esiste = tempi.find((t) => t.stepId === bersaglio.id);
        if (esiste) {
          tempi = tempi.map((t) =>
            t.stepId === bersaglio.id ? { ...t, inizio: v, fine: undefined } : t
          );
        } else {
          tempi = [...tempi, { stepId: bersaglio.id, inizio: v }];
        }
        return { ...s, stepCorrente: clamp, tempiReali: tempi, stato: "in-corso" };
      });
      setMostraFallback(false);
    },
    [attivita, patch]
  );

  const saltaConConferma = useCallback(
    (target: number) => {
      if (!sessione || target === sessione.stepCorrente) return;
      if (window.confirm(`Saltare allo step ${target + 1}?`)) vaAlloStep(target);
    },
    [sessione, vaAlloStep]
  );

  const salvaEdEsci = useCallback(() => router.push("/"), [router]);

  const concludi = useCallback(async () => {
    if (!sessione) return;
    patch((s) => {
      const v = oraVirtuale(s, Date.now());
      const tempi = s.tempiReali.map((t) => (t.fine == null ? { ...t, fine: v } : t));
      return { ...s, tempiReali: tempi, stato: "conclusa", pausaDa: undefined };
    });
    await repository.flushSync();
    router.push(`/rivedi?sessione=${sessione.id}`);
  }, [sessione, patch, router]);

  const accettaDeriva = useCallback(() => {
    if (!attivita || !deriva?.suggerimento) return;
    patch((s) => applicaSuggerimento(s, attivita, deriva.suggerimento!));
  }, [attivita, deriva, patch]);

  // --- Valutazioni (A–E) e note ---
  const valutaClasse = useCallback(
    (osservabileId: string, valore: Voto | null) => {
      if (!step) return;
      patch((s) => {
        const senza = s.annotazioni.filter(
          (a) =>
            !(
              a.tipo === "valutazione" &&
              a.stepId === step.id &&
              a.osservabileId === osservabileId &&
              a.alunnoId == null
            )
        );
        if (valore == null) return { ...s, annotazioni: senza };
        const nuova: Annotazione = {
          id: nuovoIdAnn(),
          stepId: step.id,
          timestamp: Date.now(),
          tipo: "valutazione",
          osservabileId,
          valore,
        };
        return { ...s, annotazioni: [...senza, nuova] };
      });
    },
    [step, patch]
  );

  const valutaAlunno = useCallback(
    (alunnoId: string, osservabileId: string, valore: Voto | null) => {
      if (!step) return;
      patch((s) => {
        const senza = s.annotazioni.filter(
          (a) =>
            !(
              a.tipo === "valutazione" &&
              a.stepId === step.id &&
              a.osservabileId === osservabileId &&
              a.alunnoId === alunnoId
            )
        );
        if (valore == null) return { ...s, annotazioni: senza };
        const nuova: Annotazione = {
          id: nuovoIdAnn(),
          stepId: step.id,
          timestamp: Date.now(),
          tipo: "valutazione",
          osservabileId,
          alunnoId,
          valore,
        };
        return { ...s, annotazioni: [...senza, nuova] };
      });
    },
    [step, patch]
  );

  const notaAlunno = useCallback(
    (alunnoId: string, testo: string) => {
      if (!step) return;
      patch((s) => {
        const senza = s.annotazioni.filter(
          (a) => !(a.tipo === "testo" && a.stepId === step.id && a.alunnoId === alunnoId)
        );
        if (!testo) return { ...s, annotazioni: senza };
        return {
          ...s,
          annotazioni: [
            ...senza,
            {
              id: nuovoIdAnn(),
              stepId: step.id,
              timestamp: Date.now(),
              tipo: "testo",
              alunnoId,
              contenuto: testo,
            },
          ],
        };
      });
    },
    [step, patch]
  );

  if (caricamento) return <p className="p-6 text-center text-muted">Carico la sessione…</p>;
  if (!sessione || !attivita || !step) {
    return (
      <div className="p-6 text-center">
        <p className="text-ink">Sessione non trovata.</p>
        <button onClick={() => router.push("/")} className="mt-3 text-fai-ink underline">
          Torna alla home
        </button>
      </div>
    );
  }
  if (sessione.stato === "conclusa") {
    return (
      <div className="p-6 text-center">
        <p className="text-ink">Questa sessione è conclusa.</p>
        <button
          onClick={() => router.push(`/rivedi?sessione=${sessione.id}`)}
          className="mt-3 text-fai-ink underline"
        >
          Vai a Rivedi
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <BarraStato
        attivita={attivita}
        sessione={sessione}
        ora={ora}
        wakeLockAttivo={wakeLockAttivo}
        inPausa={pausato}
        onSalvaEsci={salvaEdEsci}
      />
      <Timeline attivita={attivita} sessione={sessione} onSalta={saltaConConferma} />
      <AvvisoProiettore soloNecessario={soloNecessario} onToggle={() => setSoloNecessario((v) => !v)} />
      {deriva && <BannerDeriva deriva={deriva} onAccetta={accettaDeriva} />}

      {/* Card dello step (sinistra) + annota fuori dal rettangolo (destra) */}
      {/* pb ampio: lascia spazio alla barra di navigazione fissa in basso */}
      <main className="flex-1 px-3 pb-24 sm:px-6">
        <div className="items-start gap-6 xl:grid xl:grid-cols-[1.4fr_1fr]">
          {/* Colonna sinistra: la card dello step, sul modello del mazzo */}
          <article
            key={step.id}
            className="overflow-hidden rounded-card border border-panel-line bg-surface shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)]"
          >
            <AzioneCorrente
              step={step}
              indice={sessione.stepCorrente}
              totale={attivita.step.length}
              sessione={sessione}
              ora={ora}
              inPausa={pausato}
              onTogglePausa={togglePausa}
              onResetTimer={resetTimer}
            />

            <div className="px-5 pb-5 sm:px-7 sm:pb-7">
              <RisorseStep step={step} />

              {step.fallback && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setMostraFallback((v) => !v)}
                    aria-expanded={mostraFallback}
                    className="inline-flex min-h-tap items-center gap-2 rounded-full border border-fai px-4 py-2 text-sm font-semibold text-fai-ink active:bg-black/5"
                  >
                    <Icona nome="fulmine" size={15} /> Non funziona?
                  </button>
                  {mostraFallback && (
                    <p className="mt-2 rounded-2xl border border-fai/40 bg-fai/10 px-4 py-3 text-base text-ink">
                      {step.fallback}
                    </p>
                  )}
                </div>
              )}

              {/* Riquadro giallo: adattamento BES/DSA di questo step */}
              {step.adattamentoBes && (
                <div
                  className="mt-6 rounded-2xl border-l-4 border-accent px-4 py-3"
                  style={{ backgroundColor: "rgba(255,199,0,0.18)" }}
                >
                  <span className="mb-1 flex items-center gap-2 font-head text-[10px] font-bold uppercase tracking-[.18em] text-accent-ink">
                    <Icona nome="check" size={13} /> Adattamento BES/DSA
                  </span>
                  <p className="text-sm leading-relaxed text-ink">{step.adattamentoBes}</p>
                </div>
              )}

              <div className="mt-6">
                <SupportoInline key={step.id} step={step} />
              </div>

              {/* Spunto di neurodidattica — sotto domande/aiuti, con font del kit */}
              {step.neuro && !soloNecessario && (
                <div className="mt-4 rounded-2xl border border-panel-line bg-panel px-4 py-3">
                  <span className="mb-1 flex items-center gap-2 font-head text-[10px] font-bold uppercase tracking-[.18em] text-accent-ink">
                    <Icona nome="lampadina" size={13} /> Perché funziona · sguardo neurodidattico
                  </span>
                  <p className="text-sm leading-relaxed text-ink">{step.neuro}</p>
                </div>
              )}
            </div>
          </article>

          {/* Colonna destra: annota, fuori dal rettangolo dello step */}
          <aside className="mt-6 xl:mt-0">
            <Annota
              step={step}
              classe={classe}
              criteri={attivita.griglia.criteri}
              gruppi={sessione.gruppi}
              annotazioni={sessione.annotazioni}
              onValutaClasse={valutaClasse}
              onValutaAlunno={valutaAlunno}
              onNotaAlunno={notaAlunno}
            />
          </aside>
        </div>
      </main>

      <NavStep
        attivita={attivita}
        sessione={sessione}
        onIndietro={() => vaAlloStep(sessione.stepCorrente - 1)}
        onAvanti={() => vaAlloStep(sessione.stepCorrente + 1)}
        onConcludi={concludi}
      />
    </div>
  );
}
