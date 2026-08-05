"use client";

import type { Attivita, Sessione } from "@/lib/types";
import { Icona } from "@/components/comune/Icona";

type Props = {
  attivita: Attivita;
  sessione: Sessione;
  onIndietro: () => void;
  onAvanti: () => void;
  onConcludi: () => void;
};

/** Indietro piccolo, Avanti grande e pieno. Sull'ultimo step: concludi. */
export function NavStep({ attivita, sessione, onIndietro, onAvanti, onConcludi }: Props) {
  const i = sessione.stepCorrente;
  const ultimo = i >= attivita.step.length - 1;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch gap-2 border-t border-panel-line bg-bg/90 px-3 py-3 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onIndietro}
        disabled={i === 0}
        aria-label="Torna allo step precedente"
        className="flex min-h-tap min-w-tap items-center justify-center rounded-full border border-panel-line px-4 text-ink transition-colors active:bg-black/5 disabled:opacity-30"
      >
        <Icona nome="indietro" size={20} />
      </button>
      {ultimo ? (
        <button
          type="button"
          onClick={onConcludi}
          className="flex min-h-tap flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 font-head text-base font-bold text-[#1A1A1A] active:brightness-95"
        >
          Concludi e rivedi <Icona nome="avanti" size={18} />
        </button>
      ) : (
        <button
          type="button"
          onClick={onAvanti}
          className="flex min-h-tap flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 font-head text-base font-bold text-[#1A1A1A] active:brightness-95"
        >
          Fatto, step {i + 2} <Icona nome="avanti" size={18} />
        </button>
      )}
    </nav>
  );
}
