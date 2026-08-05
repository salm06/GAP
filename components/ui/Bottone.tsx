"use client";

import { forwardRef } from "react";

type Variante = "primario" | "secondario" | "fantasma" | "pericolo";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  pieno?: boolean;
};

const varianti: Record<Variante, string> = {
  primario: "bg-accent text-[#1A1A1A] active:brightness-95",
  secondario: "bg-panel text-ink border border-panel-line active:bg-black/5",
  fantasma: "bg-transparent text-muted active:bg-black/5",
  pericolo: "bg-fai text-[#1A1A1A] active:brightness-95",
};

/** Bottone con tap target >= 44px, alto contrasto. Scritto a mano (niente librerie UI). */
export const Bottone = forwardRef<HTMLButtonElement, Props>(function Bottone(
  { variante = "primario", pieno, className = "", children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={[
        "min-h-tap min-w-tap rounded-xl px-4 py-3 text-base font-semibold",
        "transition-colors disabled:opacity-40 disabled:pointer-events-none",
        varianti[variante],
        pieno ? "w-full" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
});
