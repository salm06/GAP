"use client";

import type { Deriva } from "@/lib/types";
import { Icona } from "@/components/comune/Icona";

type Props = {
  deriva: Deriva;
  onAccetta: () => void;
};

/** Banner di deriva: solo colore e testo, nessun suono, nessun popup. */
export function BannerDeriva({ deriva, onAccetta }: Props) {
  if (deriva.direzione === "in-linea" || !deriva.suggerimento) return null;

  const ritardo = deriva.direzione === "ritardo";
  const s = deriva.suggerimento;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-3 mb-2 flex items-center gap-3 rounded-2xl bg-[#1A1A1A] px-4 py-2 text-white sm:mx-6"
    >
      <p className="flex-1 text-sm font-semibold text-white">{s.testo}</p>
      <button
        type="button"
        onClick={onAccetta}
        className={[
          "flex min-h-tap shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-[#1A1A1A] active:brightness-95",
          ritardo ? "bg-fai" : "bg-accent",
        ].join(" ")}
      >
        <Icona nome="check" size={15} />
        {s.azione === "espandi" ? "Ok" : "Applica"}
      </button>
    </div>
  );
}
