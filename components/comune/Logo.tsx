/* eslint-disable @next/next/no-img-element */

type Props = {
  className?: string;
  /** altezza in px del wordmark */
  altezza?: number;
  /** ignorato: mantenuto per compatibilità con le chiamate esistenti */
  chip?: boolean;
};

/**
 * Wordmark GAP dal brand kit (PNG nero su bianco).
 * `mix-blend-mode: multiply` elimina lo sfondo bianco su fondi chiari:
 * il bianco lascia passare lo sfondo, il nero resta.
 */
export function Logo({ className = "", altezza = 28 }: Props) {
  return (
    <img
      src="/gap-logo.png"
      alt="GAP"
      height={altezza}
      style={{ height: altezza, width: "auto", mixBlendMode: "multiply" }}
      className={className}
    />
  );
}
