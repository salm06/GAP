"use client";

import { Fragment } from "react";
import type { Alunno, Attivita, CellaValutazione, Classe, Gruppo, Voto } from "@/lib/types";
import { VOTI, mediaVoti } from "@/lib/voti";

type Props = {
  attivita: Attivita;
  classe: Classe;
  celle: CellaValutazione[];
  override: Record<string, Record<string, Voto>>;
  gruppi?: Gruppo[];
  onSetLivello: (alunnoId: string, criterioId: string, livello: Voto | null) => void;
};

/**
 * Matrice alunni × competenze (voti A–E), precompilata dalle osservazioni.
 * - se ci sono gruppi, gli alunni sono raggruppati con una riga di media del gruppo
 * - livello suggerito calcolato dalle osservazioni (con conteggio a supporto)
 * - sempre modificabile con un tocco; celle senza dati chiaramente VUOTE
 */
export function GrigliaValutazione({
  attivita,
  classe,
  celle,
  override,
  gruppi,
  onSetLivello,
}: Props) {
  const criteri = attivita.griglia.criteri;
  const cerca = (a: string, c: string) => celle.find((x) => x.alunnoId === a && x.criterioId === c);
  const effettivo = (a: string, c: string): Voto | null =>
    override[a]?.[c] ?? cerca(a, c)?.livelloSuggerito ?? null;

  const byId = new Map(classe.alunni.map((a) => [a.id, a]));
  const gruppiValidi = (gruppi ?? []).filter((g) => g.alunniIds.length > 0);
  const assegnati = new Set(gruppiValidi.flatMap((g) => g.alunniIds));
  const senzaGruppo = classe.alunni.filter((a) => !assegnati.has(a.id));

  const rigaAlunno = (al: Alunno, indent: boolean) => (
    <tr key={al.id} className="border-t border-panel-line">
      <th
        className={[
          "sticky left-0 z-10 whitespace-nowrap bg-surface px-3 py-2 text-left font-medium text-ink",
          indent ? "pl-6" : "",
        ].join(" ")}
      >
        {al.nome}
      </th>
      {criteri.map((c) => {
        const cella = cerca(al.id, c.id);
        const manuale = override[al.id]?.[c.id];
        const eff = manuale ?? cella?.livelloSuggerito ?? null;
        const vuota = eff == null;
        const n = cella?.numOsservazioni ?? 0;
        return (
          <td key={c.id} className="px-2 py-2 align-top">
            <div className="flex gap-1">
              {VOTI.map((liv) => {
                const attivo = eff === liv;
                return (
                  <button
                    key={liv}
                    type="button"
                    onClick={() => onSetLivello(al.id, c.id, attivo ? null : liv)}
                    aria-label={`${al.nome}, ${c.nome}: voto ${liv}`}
                    aria-pressed={attivo}
                    className={[
                      "h-8 w-8 rounded-md border text-sm font-bold",
                      attivo
                        ? "border-accent bg-accent text-[#1A1A1A]"
                        : "border-panel-line bg-surface text-muted",
                    ].join(" ")}
                  >
                    {liv}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[11px] text-muted">
              {vuota
                ? "— non osservato"
                : `${n} oss.${manuale != null ? " · a mano" : " · suggerito"}`}
            </p>
          </td>
        );
      })}
    </tr>
  );

  // Riga di sintesi del gruppo: media A–E dei voti effettivi dei membri per competenza.
  const rigaGruppo = (g: Gruppo) => (
    <tr className="border-t-2 border-accent bg-panel">
      <th className="sticky left-0 z-10 whitespace-nowrap bg-panel px-3 py-2 text-left font-head font-bold text-ink">
        {g.nome} <span className="font-normal text-muted">· media</span>
      </th>
      {criteri.map((c) => {
        const voti = g.alunniIds
          .map((id) => effettivo(id, c.id))
          .filter((v): v is Voto => v != null);
        const media = mediaVoti(voti);
        return (
          <td key={c.id} className="px-2 py-2">
            {media != null ? (
              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-accent px-2 text-sm font-bold text-[#1A1A1A]">
                {media}
              </span>
            ) : (
              <span className="text-xs text-muted">—</span>
            )}
          </td>
        );
      })}
    </tr>
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-panel-line bg-surface">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-panel px-3 py-2 text-left font-semibold text-ink">
              Alunno
            </th>
            {criteri.map((c) => (
              <th
                key={c.id}
                className="min-w-[9rem] bg-panel px-2 py-2 text-left font-semibold text-ink"
                title={c.competenzaMinisteriale}
              >
                {c.nome}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {gruppiValidi.length > 0 ? (
            <>
              {gruppiValidi.map((g) => (
                <Fragment key={g.id}>
                  {rigaGruppo(g)}
                  {g.alunniIds
                    .map((id) => byId.get(id))
                    .filter((a): a is Alunno => !!a)
                    .map((al) => rigaAlunno(al, true))}
                </Fragment>
              ))}
              {senzaGruppo.length > 0 && (
                <>
                  <tr className="border-t-2 border-panel-line bg-panel">
                    <th
                      colSpan={criteri.length + 1}
                      className="sticky left-0 px-3 py-1.5 text-left font-head text-xs font-bold uppercase tracking-wide text-muted"
                    >
                      Senza gruppo
                    </th>
                  </tr>
                  {senzaGruppo.map((al) => rigaAlunno(al, true))}
                </>
              )}
            </>
          ) : (
            classe.alunni.map((al) => rigaAlunno(al, false))
          )}
        </tbody>
      </table>
    </div>
  );
}
