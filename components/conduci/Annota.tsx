"use client";

import { Fragment, useState } from "react";
import type { Annotazione, Classe, Livello, Step } from "@/lib/types";
import { Icona } from "@/components/comune/Icona";

type Props = {
  step: Step;
  classe: Classe | null;
  annotazioni: Annotazione[];
  onValutaClasse: (osservabileId: string, valore: Livello | null) => void;
  onValutaAlunno: (alunnoId: string, osservabileId: string, valore: Livello | null) => void;
  onNotaAlunno: (alunnoId: string, testo: string) => void;
};

const LIVELLI: Livello[] = [1, 2, 3, 4, 5];

/** Riga di voto 1..5. Ritoccare = azzerare (secondo tocco sul valore attivo). */
function Voti({
  valore,
  onSet,
  aria,
}: {
  valore: Livello | null;
  onSet: (v: Livello | null) => void;
  aria: string;
}) {
  return (
    <div className="flex gap-1" role="group" aria-label={aria}>
      {LIVELLI.map((v) => {
        const on = valore === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onSet(on ? null : v)}
            aria-pressed={on}
            aria-label={`${aria}: ${v}`}
            className={[
              "h-9 w-9 rounded-lg border text-sm font-bold transition-colors",
              on
                ? "border-accent bg-accent text-[#1A1A1A]"
                : "border-panel-line bg-panel text-muted active:bg-black/5",
            ].join(" ")}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

export function Annota({
  step,
  classe,
  annotazioni,
  onValutaClasse,
  onValutaAlunno,
  onNotaAlunno,
}: Props) {
  const caratteristiche = step.osservabili;

  const votoClasse = (osId: string): Livello | null =>
    annotazioni.find(
      (a) =>
        a.tipo === "valutazione" &&
        a.stepId === step.id &&
        a.osservabileId === osId &&
        a.alunnoId == null
    )?.valore ?? null;

  const votoAlunno = (alunnoId: string, osId: string): Livello | null =>
    annotazioni.find(
      (a) =>
        a.tipo === "valutazione" &&
        a.stepId === step.id &&
        a.osservabileId === osId &&
        a.alunnoId === alunnoId
    )?.valore ?? null;

  const notaDi = (alunnoId: string) =>
    annotazioni.find((a) => a.tipo === "testo" && a.stepId === step.id && a.alunnoId === alunnoId)
      ?.contenuto ?? "";

  const haDati = (alunnoId: string) =>
    annotazioni.some(
      (a) =>
        a.stepId === step.id &&
        a.alunnoId === alunnoId &&
        ((a.tipo === "testo" && !!a.contenuto) || a.tipo === "valutazione")
    );

  const [apertoId, setApertoId] = useState<string | null>(null);
  const [bozza, setBozza] = useState("");

  const apri = (alunnoId: string) => {
    if (apertoId === alunnoId) {
      setApertoId(null);
      return;
    }
    setApertoId(alunnoId);
    setBozza(notaDi(alunnoId));
  };
  const salvaNota = () => {
    if (apertoId) onNotaAlunno(apertoId, bozza.trim());
    setApertoId(null);
    setBozza("");
  };

  return (
    <div className="space-y-4">
      {/* Annota in un tocco — 3 caratteristiche della classe, voto 1..5 */}
      <section
        aria-label="Annota in un tocco"
        className="rounded-card border border-panel-line bg-surface p-4 shadow-[0_16px_50px_-34px_rgba(0,0,0,0.35)] sm:p-5"
      >
        <p className="mb-3 flex items-center gap-2 font-head text-[11px] font-bold uppercase tracking-[.18em] text-accent-ink">
          <Icona nome="check" size={14} /> Annota in un tocco · la classe
        </p>
        <div className="space-y-3">
          {caratteristiche.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3">
              <span className="min-w-0 flex-1 text-sm font-medium text-ink">{o.label}</span>
              <Voti
                valore={votoClasse(o.id)}
                onSet={(v) => onValutaClasse(o.id, v)}
                aria={`${o.label}, classe`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Alunni — voti individuali + nota di testo */}
      <section
        aria-label="Note e voti per alunno"
        className="rounded-card border border-panel-line bg-surface p-4 shadow-[0_16px_50px_-34px_rgba(0,0,0,0.35)] sm:p-5"
      >
        <p className="mb-3 flex items-center gap-2 font-head text-[11px] font-bold uppercase tracking-[.18em] text-accent-ink">
          <Icona nome="persona" size={14} /> Alunni · voto e nota per questo step
        </p>

        {!classe ? (
          <p className="text-sm text-muted">Nessuna classe collegata a questa sessione.</p>
        ) : (
          <>
            <div className="grid grid-flow-row-dense grid-cols-2 gap-2 sm:grid-cols-3">
              {classe.alunni.map((a) => {
                const aperto = apertoId === a.id;
                return (
                  <Fragment key={a.id}>
                    <button
                      type="button"
                      onClick={() => apri(a.id)}
                      aria-expanded={aperto}
                      className={[
                        "flex min-h-tap items-center justify-between gap-1 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors",
                        aperto
                          ? "border-accent bg-accent/15 text-ink"
                          : "border-panel-line bg-panel text-ink active:bg-black/5",
                      ].join(" ")}
                    >
                      <span className="truncate">{a.nome}</span>
                      {haDati(a.id) && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
                    </button>

                    {/* Pannello subito sotto la riga dell'alunno cliccato (full-width) */}
                    {aperto && (
                      <div className="col-span-full rounded-2xl border border-accent/50 bg-panel p-4">
                        <p className="mb-3 font-head font-bold text-ink">{a.nome}</p>

                        {/* Voti individuali sulle stesse caratteristiche */}
                        <div className="space-y-3">
                          {caratteristiche.map((o) => (
                            <div key={o.id} className="flex items-center justify-between gap-3">
                              <span className="min-w-0 flex-1 text-sm text-ink">{o.label}</span>
                              <Voti
                                valore={votoAlunno(a.id, o.id)}
                                onSet={(v) => onValutaAlunno(a.id, o.id, v)}
                                aria={`${o.label}, ${a.nome}`}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Nota di testo */}
                        <label className="mt-4 mb-1 block text-sm font-bold text-ink">
                          Nota personale
                        </label>
                        <textarea
                          value={bozza}
                          onChange={(e) => setBozza(e.target.value)}
                          rows={3}
                          placeholder="Cosa hai osservato di questo alunno in questo step…"
                          className="w-full rounded-xl border border-panel-line bg-white p-3 text-base text-ink placeholder:text-muted"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={salvaNota}
                            className="min-h-tap flex-1 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-[#1A1A1A] active:brightness-95"
                          >
                            Salva nota
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setApertoId(null);
                              setBozza("");
                            }}
                            className="min-h-tap rounded-xl border border-panel-line px-4 py-2 text-sm font-semibold text-muted active:bg-black/5"
                          >
                            Chiudi
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-muted">
                          I voti si salvano da soli a ogni tocco.
                        </p>
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
