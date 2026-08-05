"use client";

import type { Attivita, CellaValutazione, Classe, Livello } from "@/lib/types";

type Props = {
  attivita: Attivita;
  classe: Classe;
  celle: CellaValutazione[];
  override: Record<string, Record<string, Livello>>;
  onSetLivello: (alunnoId: string, criterioId: string, livello: Livello | null) => void;
};

/**
 * Matrice alunni × criteri, precompilata dai chip toccati.
 * - livello suggerito calcolato dalle osservazioni (con conteggio a supporto)
 * - sempre modificabile con un tocco
 * - celle senza dati chiaramente VUOTE, mai un default
 */
export function GrigliaValutazione({ attivita, classe, celle, override, onSetLivello }: Props) {
  const criteri = attivita.griglia.criteri;
  const cerca = (a: string, c: string) =>
    celle.find((x) => x.alunnoId === a && x.criterioId === c);

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
          {classe.alunni.map((al) => (
            <tr key={al.id} className="border-t border-panel-line">
              <th className="sticky left-0 z-10 whitespace-nowrap bg-surface px-3 py-2 text-left font-medium text-ink">
                {al.nome}
              </th>
              {criteri.map((c) => {
                const cella = cerca(al.id, c.id);
                const manuale = override[al.id]?.[c.id];
                const effettivo = manuale ?? cella?.livelloSuggerito ?? null;
                const vuota = effettivo == null;
                const n = cella?.numOsservazioni ?? 0;
                return (
                  <td key={c.id} className="px-2 py-2 align-top">
                    <div className="flex gap-1">
                      {([1, 2, 3, 4, 5] as Livello[]).map((liv) => {
                        const attivo = effettivo === liv;
                        return (
                          <button
                            key={liv}
                            type="button"
                            onClick={() => onSetLivello(al.id, c.id, attivo ? null : liv)}
                            aria-label={`${al.nome}, ${c.nome}: livello ${liv}`}
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
