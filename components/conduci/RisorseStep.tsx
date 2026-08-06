"use client";

import type { Step } from "@/lib/types";
import { Icona } from "@/components/comune/Icona";

/**
 * Materiali pronti all'uso dello step (immagini da proiettare, documenti, link).
 * Si aprono in una NUOVA scheda: il docente ha tutto pronto senza il minimo sforzo.
 * Feature generica: basta aggiungere `risorse` a uno step nel JSON dell'attività.
 */
export function RisorseStep({ step }: { step: Step }) {
  const risorse = step.risorse ?? [];
  if (risorse.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-panel-line bg-panel p-4">
      <span className="mb-2 flex items-center gap-2 font-head text-[10px] font-bold uppercase tracking-[.18em] text-accent-ink">
        <Icona nome="apri" size={13} /> Materiale per la lezione
      </span>
      <div className="flex flex-wrap gap-2">
        {risorse.map((r, i) => (
          <a
            key={i}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-tap items-center gap-2 rounded-xl bg-[#1A1A1A] px-4 py-2.5 text-sm font-bold text-white active:brightness-125"
          >
            <Icona nome="apri" size={15} /> {r.label}
          </a>
        ))}
      </div>
    </div>
  );
}
