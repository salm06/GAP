"use client";

import type { Attivita, Sessione } from "@/lib/types";
import { durataEffettivaStep } from "@/lib/tempo";

type Props = {
  attivita: Attivita;
  sessione: Sessione;
  onSalta: (indice: number) => void;
};

/** Timeline a segmenti: larghezza proporzionale alla durata, colore per stato. */
export function Timeline({ attivita, sessione, onSalta }: Props) {
  const durate = attivita.step.map((s) => durataEffettivaStep(s, sessione));
  const totale = durate.reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="flex gap-1 px-4 py-2" role="group" aria-label="Avanzamento attività">
      {attivita.step.map((s, i) => {
        const stato =
          i < sessione.stepCorrente ? "fatto" : i === sessione.stepCorrente ? "corrente" : "dafare";
        const larghezza = `${(durate[i] / totale) * 100}%`;
        const colore =
          stato === "fatto" ? "bg-fatto" : stato === "corrente" ? "bg-accent" : "bg-dafare";
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSalta(i)}
            style={{ width: larghezza }}
            className="group flex min-h-tap flex-col justify-center"
            aria-label={`Step ${i + 1}: ${s.titolo}, ${durate[i]} minuti, ${
              stato === "fatto" ? "completato" : stato === "corrente" ? "in corso" : "da fare"
            }. Tocca per saltare qui.`}
            aria-current={stato === "corrente" ? "step" : undefined}
          >
            <span
              className={[
                "block rounded-full transition-all",
                colore,
                stato === "corrente" ? "h-2.5" : "h-1.5",
              ].join(" ")}
            />
          </button>
        );
      })}
    </div>
  );
}
