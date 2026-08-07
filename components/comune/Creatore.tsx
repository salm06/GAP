/* Firma del creatore della lezione: avatar circolare + nome.
   Usato nella card (home) e nella pagina di resoconto della lezione. */

import { Icona } from "./Icona";

export function Creatore({
  nome,
  size = "sm",
  className = "",
}: {
  nome: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const md = size === "md";
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-accent text-[#1A1A1A] ${
          md ? "h-9 w-9" : "h-7 w-7"
        }`}
        aria-hidden
      >
        <Icona nome="persona" size={md ? 18 : 14} />
      </span>
      <span className={`font-semibold text-ink ${md ? "text-base" : "text-sm"}`}>{nome}</span>
    </span>
  );
}
