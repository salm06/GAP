"use client";

import type { Attivita, Sessione } from "@/lib/types";
import { cronometroTotale, formattaMinuti } from "@/lib/tempo";
import { Logo } from "@/components/comune/Logo";
import { Icona } from "@/components/comune/Icona";

type Props = {
  attivita: Attivita;
  sessione: Sessione;
  ora: number;
  wakeLockAttivo: boolean;
  inPausa: boolean;
  onSalvaEsci: () => void;
};

export function BarraStato({
  attivita,
  sessione,
  ora,
  wakeLockAttivo,
  inPausa,
  onSalvaEsci,
}: Props) {
  const n = attivita.step.length;
  const crono = cronometroTotale(attivita, sessione, ora);
  const sforato = crono.rimanentiMs < 0;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-panel-line bg-bg/85 px-4 py-2 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <Logo altezza={18} chip />
        <div className="hidden items-center gap-2 rounded-full border border-panel-line bg-panel px-3 py-1 sm:flex">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="font-head text-[11px] font-bold uppercase tracking-[.15em] text-ink">
            Step {sessione.stepCorrente + 1}
          </span>
          <span className="text-[11px] text-muted">/ {n}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {wakeLockAttivo && (
          <span title="Schermo tenuto acceso" className="text-capisci">
            ●
          </span>
        )}
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-muted">
            {inPausa ? "in pausa" : "rimasti"}
          </p>
          <p
            className={[
              "font-head text-lg font-black tabular-nums",
              inPausa ? "text-accent-ink" : sforato ? "text-ritardo" : "text-ink",
            ].join(" ")}
          >
            {formattaMinuti(crono.rimanentiMs)}
          </p>
        </div>
        <button
          type="button"
          onClick={onSalvaEsci}
          className="flex min-h-tap items-center gap-1.5 rounded-full border border-panel-line px-3 py-1.5 text-xs font-semibold text-muted active:bg-black/5"
          title="Salva lo stato ed esci — potrai riprendere"
        >
          <Icona nome="esci" size={15} /> Salva
        </button>
      </div>
    </header>
  );
}
