/* Icone SVG a tratto. Usano currentColor: diventano nere o bianche
   a seconda del colore di testo del contenitore. */

type Nome =
  | "play"
  | "pausa"
  | "domanda"
  | "lampadina"
  | "microfono"
  | "fulmine"
  | "avanti"
  | "indietro"
  | "check"
  | "matita"
  | "persona"
  | "esci"
  | "prossima"
  | "reset";

const PATHS: Record<Nome, string> = {
  play: '<path d="M8 5v14l11-7z"/>',
  pausa: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  domanda:
    '<circle cx="12" cy="12" r="9"/><path d="M9.2 9.4c0-2.2 1.7-3.2 3.2-2.7 1.6.5 2.1 2.2 1 3.3-1 1-1.6 1.5-1.6 3"/><circle cx="11.8" cy="17" r=".9" fill="currentColor" stroke="none"/>',
  lampadina:
    '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.3 1 2.5h6c0-1.2.2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
  microfono:
    '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0"/><path d="M12 17v4M9 21h6"/>',
  fulmine: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  avanti: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  indietro: '<path d="M19 12H6M11 6l-6 6 6 6"/>',
  check: '<path d="M5 12l5 5 9-11"/>',
  matita: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/>',
  persona: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  esci: '<path d="M15 4h4v16h-4M11 8l-4 4 4 4M7 12h9"/>',
  prossima: '<path d="M6 4l10 8-10 8zM18 4v16"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4"/>',
};

type Props = {
  nome: Nome;
  size?: number;
  className?: string;
  riempi?: boolean; // usa fill invece di stroke (per play/pausa/fulmine)
};

const RIEMPITE = new Set<Nome>(["play", "pausa", "fulmine", "prossima"]);

export function Icona({ nome, size = 18, className = "", riempi }: Props) {
  const usaFill = riempi ?? RIEMPITE.has(nome);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      fill={usaFill ? "currentColor" : "none"}
      stroke={usaFill ? "none" : "currentColor"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: PATHS[nome] }}
    />
  );
}
