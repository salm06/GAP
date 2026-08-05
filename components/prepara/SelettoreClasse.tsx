"use client";

import { useState } from "react";
import type { Classe } from "@/lib/types";
import { Bottone } from "@/components/ui/Bottone";
import { parseElencoAlunni } from "@/lib/repository";

type Props = {
  classi: Classe[];
  selezionataId?: string;
  onSeleziona: (id: string) => void;
  onNuovaClasse: (nome: string, testo: string) => void | Promise<void>;
};

/** Selettore classe + import rapido incollando i nomi (uno per riga o CSV). */
export function SelettoreClasse({ classi, selezionataId, onSeleziona, onNuovaClasse }: Props) {
  const [nuova, setNuova] = useState(false);
  const [nome, setNome] = useState("");
  const [testo, setTesto] = useState("");

  const anteprima = parseElencoAlunni(testo);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {classi.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSeleziona(c.id)}
            aria-pressed={selezionataId === c.id}
            className={[
              "min-h-tap rounded-xl border px-4 py-2 text-base font-semibold",
              selezionataId === c.id
                ? "border-accent bg-accent text-[#1A1A1A]"
                : "border-panel-line bg-surface text-ink active:bg-black/5",
            ].join(" ")}
          >
            {c.nome}
            <span className="ml-2 text-xs opacity-70">{c.alunni.length}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setNuova((v) => !v)}
          className="min-h-tap rounded-xl border border-dashed border-panel-line px-4 py-2 text-base font-semibold text-muted active:bg-black/5"
        >
          + Nuova
        </button>
      </div>

      {nuova && (
        <div className="mt-3 rounded-2xl border border-panel-line bg-surface p-3">
          <input
            type="text"
            placeholder="Nome classe (es. 2B Informatica)"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="mb-2 w-full min-h-tap rounded-lg border border-panel-line bg-white px-3 text-base text-ink"
          />
          <textarea
            placeholder={"Incolla i nomi, uno per riga.\nOppure CSV: Cognome,Nome"}
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-panel-line bg-white p-3 text-base text-ink"
          />
          <p className="mt-1 text-xs text-muted">{anteprima.length} alunni riconosciuti</p>
          <Bottone
            className="mt-2"
            pieno
            disabled={anteprima.length === 0 || !nome.trim()}
            onClick={async () => {
              await onNuovaClasse(nome, testo);
              setNuova(false);
              setNome("");
              setTesto("");
            }}
          >
            Crea classe
          </Bottone>
        </div>
      )}
    </div>
  );
}
