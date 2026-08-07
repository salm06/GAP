"use client";

type Props = {
  soloNecessario: boolean;
  onToggle: () => void;
};

/**
 * Su schermi larghi (spesso duplicati sul proiettore) avvisiamo e offriamo
 * "solo il necessario", che nasconde la sceneggiatura del docente.
 */
export function AvvisoProiettore({ soloNecessario, onToggle }: Props) {
  return (
    <div className="mx-3 mb-2 hidden items-center justify-between gap-3 rounded-2xl border-2 border-fai bg-white px-4 py-2 sm:mx-6 lg:flex">
      <p className="text-sm text-ink">
        ⚠️ Schermo grande: se è duplicato sul proiettore, la classe potrebbe leggere le tue note.
      </p>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={soloNecessario}
        className="min-h-tap shrink-0 rounded-full bg-fai px-3 py-1.5 text-sm font-bold text-white active:brightness-95"
      >
        {soloNecessario ? "Mostra tutto" : "Solo il necessario"}
      </button>
    </div>
  );
}
