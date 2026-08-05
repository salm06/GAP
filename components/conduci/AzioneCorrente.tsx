"use client";

import type { Sessione, Step } from "@/lib/types";
import { durataEffettivaStep, formattaMMSS } from "@/lib/tempo";
import { stileFase, NOME_FASE } from "@/lib/fasi";
import { Icona } from "@/components/comune/Icona";

type Props = {
  step: Step;
  indice: number;
  totale: number;
  sessione: Sessione;
  ora: number; // orologio virtuale (congelato in pausa)
  inPausa: boolean;
  onTogglePausa: () => void;
  onResetTimer: () => void;
};

/**
 * Testata + corpo della card dello step.
 * Strip colorata per fase: numero/fase · cronometro · reset · pausa.
 * Corpo: titolo su una riga (grassetto) e l'azione come paragrafo normale.
 */
export function AzioneCorrente({
  step,
  indice,
  totale,
  sessione,
  ora,
  inPausa,
  onTogglePausa,
  onResetTimer,
}: Props) {
  const tempo = sessione.tempiReali.find((t) => t.stepId === step.id && t.fine == null);
  const elapsed = tempo ? Math.max(0, ora - tempo.inizio) : 0;
  const previsti = durataEffettivaStep(step, sessione);
  const inRitardoStep = elapsed > previsti * 60_000;
  const pad = (n: number) => String(n).padStart(2, "0");
  const s = stileFase(step.fase);

  return (
    <div>
      {/* Strip colorata a filo card: numero/fase · cronometro · reset · pausa */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
        style={{ background: s.stripBg, color: s.stripInk }}
      >
        <p className="min-w-0 truncate font-head text-xs font-extrabold uppercase tracking-[.14em]">
          {pad(indice + 1)}
          <span style={{ opacity: 0.55 }}>/{pad(totale)}</span>
          {step.fase && <span style={{ opacity: 0.9 }}> · {NOME_FASE[step.fase]}</span>}
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <div
            className="rounded-lg px-2.5 py-1 text-right leading-none"
            style={{ background: inRitardoStep && !inPausa ? "rgba(0,0,0,.28)" : s.badgeBg }}
          >
            <span
              className="font-head text-lg font-black tabular-nums"
              style={{ opacity: inPausa ? 0.6 : 1 }}
            >
              {formattaMMSS(elapsed)}
            </span>
            <span className="ml-1 text-xs" style={{ opacity: 0.6 }}>
              / {previsti}′
            </span>
          </div>
          <button
            type="button"
            onClick={onResetTimer}
            aria-label="Azzera il cronometro dello step"
            title="Azzera il cronometro dello step"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors active:opacity-70"
            style={{ borderColor: "currentColor" }}
          >
            <Icona nome="reset" size={15} />
          </button>
          <button
            type="button"
            onClick={onTogglePausa}
            aria-pressed={inPausa}
            aria-label={inPausa ? "Riprendi il timer" : "Metti in pausa il timer"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors"
            style={
              inPausa
                ? { background: "#1A1A1A", color: "#FFFFFF", borderColor: "#1A1A1A" }
                : { borderColor: "currentColor" }
            }
          >
            <Icona nome={inPausa ? "play" : "pausa"} size={15} />
          </button>
        </div>
      </div>

      {/* Corpo della card: titolo (una riga) + azione come paragrafo */}
      <div className="px-5 pt-5 sm:px-7 sm:pt-7">
        {inPausa && (
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-bold text-[#1A1A1A]">
            <Icona nome="pausa" size={12} /> Timer in pausa
          </p>
        )}

        <h2 className="font-head text-2xl font-black leading-tight tracking-tight text-ink sm:text-3xl">
          {step.titolo}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-ink sm:text-lg">{step.azione}</p>
      </div>
    </div>
  );
}
