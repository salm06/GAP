"use client";

import type { Step } from "@/lib/types";
import { Icona } from "@/components/comune/Icona";

/**
 * Domande e Aiuti come liste subito visibili (niente click per scorrere),
 * uno accanto all'altro dentro la card dello step.
 */
export function SupportoInline({ step }: { step: Step }) {
  const domande = step.domande ?? [];
  const aiuti = step.aiuti ?? [];

  if (domande.length === 0 && aiuti.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {domande.length > 0 && (
        <div className="rounded-2xl border border-panel-line bg-panel p-4">
          <span className="mb-2 flex items-center gap-2 font-head text-[11px] font-bold uppercase tracking-[.18em] text-accent-ink">
            <Icona nome="domanda" size={14} /> Domande da porre
          </span>
          <ul className="space-y-2">
            {domande.map((d, i) => (
              <li key={i} className="flex gap-2 leading-snug text-ink">
                <span aria-hidden className="mt-[0.5rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {aiuti.length > 0 && (
        <div className="rounded-2xl border border-panel-line bg-panel p-4">
          <span className="mb-2 flex items-center gap-2 font-head text-[11px] font-bold uppercase tracking-[.18em] text-accent-ink">
            <Icona nome="lampadina" size={14} /> Se la classe si blocca
          </span>
          <ul className="space-y-2">
            {aiuti.map((a, i) => (
              <li key={i} className="flex gap-2 leading-snug text-ink">
                <span aria-hidden className="mt-[0.5rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
