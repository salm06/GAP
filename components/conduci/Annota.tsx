"use client";

import { Fragment, useState } from "react";
import type { Alunno, Annotazione, Classe, Criterio, Gruppo, Step, Voto } from "@/lib/types";
import { VOTI } from "@/lib/voti";
import { Icona } from "@/components/comune/Icona";

type Props = {
  step: Step;
  classe: Classe | null;
  criteri: Criterio[]; // competenze dell'attività, valutabili in ogni step
  gruppi?: Gruppo[]; // se presenti, gli alunni sono suddivisi per gruppo
  annotazioni: Annotazione[];
  onValutaClasse: (criterioId: string, valore: Voto | null) => void;
  onValutaAlunno: (alunnoId: string, criterioId: string, valore: Voto | null) => void;
  onNotaAlunno: (alunnoId: string, testo: string) => void;
};

/** Riga di voto A–E. Ritoccare = azzerare (secondo tocco sul valore attivo). */
function Voti({
  valore,
  onSet,
  aria,
}: {
  valore: Voto | null;
  onSet: (v: Voto | null) => void;
  aria: string;
}) {
  return (
    <div className="flex gap-1" role="group" aria-label={aria}>
      {VOTI.map((v) => {
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
  criteri,
  gruppi,
  annotazioni,
  onValutaClasse,
  onValutaAlunno,
  onNotaAlunno,
}: Props) {
  const caratteristiche = criteri;

  const votoClasse = (critId: string): Voto | null =>
    annotazioni.find(
      (a) =>
        a.tipo === "valutazione" &&
        a.stepId === step.id &&
        a.osservabileId === critId &&
        a.alunnoId == null
    )?.valore ?? null;

  const votoAlunno = (alunnoId: string, critId: string): Voto | null =>
    annotazioni.find(
      (a) =>
        a.tipo === "valutazione" &&
        a.stepId === step.id &&
        a.osservabileId === critId &&
        a.alunnoId === alunnoId
    )?.valore ?? null;

  // Voto comune del gruppo per una competenza: la lettera se TUTTI i membri
  // hanno lo stesso voto, altrimenti null (voti diversi o incompleti).
  const votoGruppoComune = (ids: string[], critId: string): Voto | null => {
    if (ids.length === 0) return null;
    const primo = votoAlunno(ids[0], critId);
    return primo != null && ids.every((id) => votoAlunno(id, critId) === primo) ? primo : null;
  };

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
  const [apertoGruppoId, setApertoGruppoId] = useState<string | null>(null);
  const [bozzaGruppo, setBozzaGruppo] = useState("");

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

  const apriGruppo = (id: string) => {
    setApertoGruppoId((prev) => (prev === id ? null : id));
    setBozzaGruppo("");
  };

  // Scheda del singolo alunno: pulsante + pannello (voti individuali + nota).
  const renderAlunno = (a: Alunno) => {
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

        {aperto && (
          <div className="col-span-full rounded-2xl border border-accent/50 bg-panel p-4">
            <p className="mb-3 font-head font-bold text-ink">{a.nome}</p>
            <div className="space-y-3">
              {caratteristiche.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3">
                  <span
                    className="min-w-0 flex-1 text-sm text-ink"
                    title={o.competenzaMinisteriale}
                  >
                    {o.nome}
                  </span>
                  <Voti
                    valore={votoAlunno(a.id, o.id)}
                    onSet={(v) => onValutaAlunno(a.id, o.id, v)}
                    aria={`${o.nome}, ${a.nome}`}
                  />
                </div>
              ))}
            </div>
            <label className="mt-4 mb-1 block text-sm font-bold text-ink">Nota personale</label>
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
            <p className="mt-2 text-xs text-muted">I voti si salvano da soli a ogni tocco.</p>
          </div>
        )}
      </Fragment>
    );
  };

  // Griglia di alunni (usata sia in modalità piatta sia dentro ogni gruppo).
  const grigliaAlunni = (alunni: Alunno[]) => (
    <div className="grid grid-flow-row-dense grid-cols-2 gap-2 sm:grid-cols-3">
      {alunni.map(renderAlunno)}
    </div>
  );

  const byId = new Map((classe?.alunni ?? []).map((a) => [a.id, a]));
  const gruppiValidi = (gruppi ?? []).filter((g) => g.alunniIds.length > 0);
  const assegnati = new Set(gruppiValidi.flatMap((g) => g.alunniIds));
  const senzaGruppo = (classe?.alunni ?? []).filter((a) => !assegnati.has(a.id));

  return (
    <div className="space-y-4">
      {/* Competenze · voto di classe (A–E) */}
      <section
        aria-label="Annota in un tocco"
        className="rounded-card border border-panel-line bg-surface p-4 shadow-[0_16px_50px_-34px_rgba(0,0,0,0.35)] sm:p-5"
      >
        <p className="mb-3 flex items-center gap-2 font-head text-[11px] font-bold uppercase tracking-[.18em] text-accent-ink">
          <Icona nome="check" size={14} /> Competenze · voto di classe (A–E)
        </p>
        <div className="space-y-3">
          {caratteristiche.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3">
              <span
                className="min-w-0 flex-1 text-sm font-medium text-ink"
                title={o.competenzaMinisteriale}
              >
                {o.nome}
              </span>
              <Voti
                valore={votoClasse(o.id)}
                onSet={(v) => onValutaClasse(o.id, v)}
                aria={`${o.nome}, classe`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Alunni — voti individuali + nota di testo, eventualmente per gruppo */}
      <section
        aria-label="Note e voti per alunno"
        className="rounded-card border border-panel-line bg-surface p-4 shadow-[0_16px_50px_-34px_rgba(0,0,0,0.35)] sm:p-5"
      >
        <p className="mb-3 flex items-center gap-2 font-head text-[11px] font-bold uppercase tracking-[.18em] text-accent-ink">
          <Icona nome="persona" size={14} /> Alunni · voto competenze (A–E) e nota
        </p>

        {!classe ? (
          <p className="text-sm text-muted">Nessuna classe collegata a questa sessione.</p>
        ) : gruppiValidi.length > 0 ? (
          <div className="space-y-4">
            {gruppiValidi.map((g) => {
              const membri = g.alunniIds.map((id) => byId.get(id)).filter((a): a is Alunno => !!a);
              const gruppoAperto = apertoGruppoId === g.id;
              return (
                <div key={g.id} className="rounded-2xl border border-panel-line p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-head text-sm font-bold text-ink">
                      {g.nome} <span className="text-muted">· {membri.length}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => apriGruppo(g.id)}
                      aria-expanded={gruppoAperto}
                      className={[
                        "min-h-tap rounded-full border px-3 text-xs font-bold transition-colors",
                        gruppoAperto
                          ? "border-accent bg-accent text-[#1A1A1A]"
                          : "border-accent bg-white text-accent-ink active:bg-black/5",
                      ].join(" ")}
                    >
                      {gruppoAperto ? "Chiudi gruppo" : "Valuta gruppo"}
                    </button>
                  </div>

                  {/* Pannello: voto e nota per l'INTERO gruppo (si applicano a tutti i membri) */}
                  {gruppoAperto && (
                    <div className="mb-3 rounded-2xl border border-accent/50 bg-panel p-4">
                      <p className="mb-3 font-head font-bold text-ink">{g.nome} · tutto il gruppo</p>
                      <div className="space-y-3">
                        {caratteristiche.map((o) => (
                          <div key={o.id} className="flex items-center justify-between gap-3">
                            <span
                              className="min-w-0 flex-1 text-sm text-ink"
                              title={o.competenzaMinisteriale}
                            >
                              {o.nome}
                            </span>
                            <Voti
                              valore={votoGruppoComune(g.alunniIds, o.id)}
                              onSet={(v) =>
                                g.alunniIds.forEach((id) => onValutaAlunno(id, o.id, v))
                              }
                              aria={`${o.nome}, ${g.nome}`}
                            />
                          </div>
                        ))}
                      </div>
                      <label className="mt-4 mb-1 block text-sm font-bold text-ink">
                        Nota al gruppo
                      </label>
                      <textarea
                        value={bozzaGruppo}
                        onChange={(e) => setBozzaGruppo(e.target.value)}
                        rows={3}
                        placeholder="Osservazione sull'intero gruppo in questo step…"
                        className="w-full rounded-xl border border-panel-line bg-white p-3 text-base text-ink placeholder:text-muted"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const t = bozzaGruppo.trim();
                            if (t) g.alunniIds.forEach((id) => onNotaAlunno(id, t));
                            setApertoGruppoId(null);
                            setBozzaGruppo("");
                          }}
                          className="min-h-tap flex-1 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-[#1A1A1A] active:brightness-95"
                        >
                          Salva nota al gruppo
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-muted">
                        Voto e nota del gruppo si applicano a ogni membro; poi puoi ritoccare i
                        singoli.
                      </p>
                    </div>
                  )}

                  {grigliaAlunni(membri)}
                </div>
              );
            })}

            {senzaGruppo.length > 0 && (
              <div className="rounded-2xl border border-panel-line p-3">
                <p className="mb-2 font-head text-sm font-bold text-muted">Senza gruppo</p>
                {grigliaAlunni(senzaGruppo)}
              </div>
            )}
          </div>
        ) : (
          grigliaAlunni(classe.alunni)
        )}
      </section>
    </div>
  );
}
