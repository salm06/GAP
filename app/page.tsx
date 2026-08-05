"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { repository } from "@/lib/repository";
import type { Attivita, Sessione } from "@/lib/types";
import { Logo } from "@/components/comune/Logo";
import { Icona } from "@/components/comune/Icona";

type Conferma = { id: string; tipo: "reset" | "elimina"; stage: number };

// Colore del badge per metodologia (preview card lezioni). Metodo ignoto → giallo brand.
const COLORE_METODO: Record<string, string> = {
  "design thinking": "bg-metodo-design text-white",
  "digital storytelling": "bg-metodo-storytelling text-white",
};
const classeMetodo = (metodologia: string) =>
  COLORE_METODO[metodologia.trim().toLowerCase()] ?? "bg-accent text-[#1A1A1A]";

export default function Home() {
  const [attivita, setAttivita] = useState<Attivita[]>([]);
  const [sessioni, setSessioni] = useState<Sessione[]>([]);
  const [caricamento, setCaricamento] = useState(true);
  const [conferma, setConferma] = useState<Conferma | null>(null);

  const ricarica = useCallback(async () => {
    const [lista, sess] = await Promise.all([
      repository.listAttivita(),
      repository.listSessioni(),
    ]);
    setAttivita(lista);
    setSessioni(sess);
    setCaricamento(false);
  }, []);

  useEffect(() => {
    void ricarica();
  }, [ricarica]);

  const attivitaDi = (s: Sessione) => attivita.find((a) => a.id === s.attivitaId);
  const attiva = sessioni.find((s) => s.stato === "in-corso") ?? null;
  const attivitaAttiva = attiva ? attivitaDi(attiva) : null;
  const svolte = sessioni.filter((s) => s.stato === "in-corso" || s.stato === "conclusa");

  const procediConferma = async () => {
    if (!conferma) return;
    if (conferma.tipo === "reset") {
      await repository.resetSessione(conferma.id);
      setConferma(null);
      await ricarica();
      return;
    }
    // elimina: doppia conferma
    if (conferma.stage < 2) {
      setConferma({ ...conferma, stage: conferma.stage + 1 });
      return;
    }
    await repository.eliminaSessione(conferma.id);
    setConferma(null);
    await ricarica();
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-10 flex items-center gap-3">
        <Logo altezza={30} />
        <span className="rounded-full border border-panel-line bg-surface px-3 py-1 font-head text-[11px] font-bold uppercase tracking-[.16em] text-accent-ink">
          Player · Kit PLUS
        </span>
      </header>

      <h1 className="font-head text-3xl font-black tracking-tight text-ink sm:text-5xl">
        Le tue attività
      </h1>
      <p className="mt-2 text-base text-muted">Conduci la lezione dal telefono, passo dopo passo.</p>

      {caricamento && <p className="mt-6 text-muted">Carico…</p>}

      {attiva && (
        <Link
          href={`/attivita/${attiva.attivitaId}/conduci?sessione=${attiva.id}`}
          className="mt-8 flex items-center justify-between gap-3 rounded-card border border-accent bg-accent/10 p-5 transition-colors active:bg-accent/20"
        >
          <div className="min-w-0">
            <p className="font-head text-[11px] font-bold uppercase tracking-[.16em] text-accent-ink">
              {attiva.pausaDa != null ? "In pausa · riprendi" : "Sessione in corso"}
            </p>
            <p className="truncate text-xl font-bold text-ink">
              {attivitaAttiva ? attivitaAttiva.titolo : "Riprendi da dove eri"}
            </p>
            {attivitaAttiva && (
              <p className="text-sm text-muted">
                Step {attiva.stepCorrente + 1} di {attivitaAttiva.step.length}
              </p>
            )}
          </div>
          <span className="shrink-0 text-ink">
            <Icona nome="play" size={26} />
          </span>
        </Link>
      )}

      {/* Kit disponibili */}
      <h2 className="mt-10 font-head text-lg font-bold text-ink">Kit disponibili</h2>
      <ul className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2">
        {attivita.map((a) => (
          <li key={a.id}>
            <Link
              href={`/attivita/${a.id}/prepara`}
              className="group flex h-full flex-col overflow-hidden rounded-card border border-panel-line bg-surface transition-colors active:bg-black/5 sm:hover:border-accent"
            >
              {/* hero banner contestuale */}
              <div className="relative aspect-[20/9] w-full overflow-hidden bg-panel">
                {a.immagine ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.immagine}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 sm:group-hover:scale-105"
                  />
                ) : (
                  <div className={`h-full w-full ${classeMetodo(a.metodologia).split(" ")[0]}`} />
                )}
                <span
                  className={`absolute left-3 top-3 inline-block w-fit rounded-full px-2.5 py-0.5 font-head text-[11px] font-bold uppercase tracking-wide shadow ring-1 ring-white/70 ${classeMetodo(
                    a.metodologia
                  )}`}
                >
                  {a.metodologia}
                </span>
                {a.voto != null && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#1A1A1A] px-2.5 py-1 font-head text-[12px] font-black text-white shadow ring-1 ring-white/20">
                    {a.voto.toFixed(1)}
                    <span className="text-[10px] font-bold text-white/50">/ 10</span>
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <p className="font-head text-xl font-extrabold text-ink">{a.titolo}</p>
                <p className="mt-1 text-sm text-muted">
                  {a.step.length} fasi · {a.durataTotaleMin} min
                </p>

                {/* Scheda di presentazione: metadati del kit */}
                <p className="mb-2 mt-4 font-head text-[10px] font-bold uppercase tracking-[.18em] text-capisci-ink">
                  Scheda di presentazione
                </p>
                <dl className="grid grid-cols-1 gap-y-2.5">
                  {(
                    [
                      ["Materia", a.materia],
                      ["Ordine di scuola", a.ordineScuola],
                      ["Durata", `${a.durataTotaleMin} min · ${a.step.length} fasi`],
                      ["Tecnologia richiesta", a.tecnologiaRichiesta],
                      ["Competenze target", a.competenzeTarget],
                      ["Possibile UDA con", a.possibileUdaCon],
                    ] as [string, string | undefined][]
                  )
                    .filter(([, v]) => !!v)
                    .map(([label, value]) => (
                      <div key={label} className="flex items-baseline justify-between gap-3">
                        <dt className="shrink-0 text-xs text-muted">{label}</dt>
                        <dd className="text-right text-xs font-bold text-ink">{value}</dd>
                      </div>
                    ))}
                </dl>

                {/* Badge finale: adattamenti BES/DSA (se la lezione ne include) */}
                {a.step.some((s) => s.adattamentoBes) && (
                  <div className="mt-auto flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 font-head text-sm font-bold text-[#1A1A1A]">
                    <Icona nome="check" size={16} /> Adattamenti BES/DSA inclusi
                  </div>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Sessioni svolte / in corso */}
      {svolte.length > 0 && (
        <>
          <h2 className="mt-10 font-head text-lg font-bold text-ink">Attività svolte</h2>
          <ul className="mt-3 space-y-2">
            {svolte.map((s) => {
              const att = attivitaDi(s);
              const inConferma = conferma?.id === s.id ? conferma : null;
              return (
                <li
                  key={s.id}
                  className="flex flex-col gap-3 rounded-2xl border border-panel-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 font-head text-[10px] font-bold uppercase tracking-wide",
                          s.stato === "in-corso"
                            ? "bg-accent text-[#1A1A1A]"
                            : "bg-capisci/20 text-capisci-ink",
                        ].join(" ")}
                      >
                        {s.stato === "in-corso" ? "In corso" : "Conclusa"}
                      </span>
                      <p className="truncate font-semibold text-ink">
                        {att ? att.titolo : s.attivitaId}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(s.avviataAlle).toLocaleString("it-IT", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {inConferma ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-fai-ink">
                        {inConferma.tipo === "reset"
                          ? "Azzerare i dati?"
                          : inConferma.stage < 2
                            ? "Eliminare?"
                            : "Sicuro? Non si annulla"}
                      </span>
                      <button
                        type="button"
                        onClick={procediConferma}
                        className="inline-flex min-h-tap items-center justify-center rounded-full bg-fai px-3 py-1.5 text-sm font-bold text-[#1A1A1A] active:brightness-95"
                      >
                        {inConferma.tipo === "reset"
                          ? "Sì, azzera"
                          : inConferma.stage < 2
                            ? "Sì"
                            : "Elimina"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConferma(null)}
                        className="inline-flex min-h-tap items-center justify-center rounded-full border border-panel-line px-3 py-1.5 text-sm font-semibold text-muted active:bg-black/5"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {s.stato === "in-corso" ? (
                        <Link
                          href={`/attivita/${s.attivitaId}/conduci?sessione=${s.id}`}
                          className="inline-flex min-h-tap items-center justify-center rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-[#1A1A1A]"
                        >
                          Riprendi
                        </Link>
                      ) : (
                        <Link
                          href={`/attivita/${s.attivitaId}/rivedi?sessione=${s.id}`}
                          className="inline-flex min-h-tap items-center justify-center rounded-full border border-panel-line px-4 py-1.5 text-sm font-semibold text-ink active:bg-black/5"
                        >
                          Rivedi
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => setConferma({ id: s.id, tipo: "reset", stage: 1 })}
                        className="inline-flex min-h-tap items-center justify-center rounded-full border border-panel-line px-4 py-1.5 text-sm font-semibold text-ink active:bg-black/5"
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setConferma({ id: s.id, tipo: "elimina", stage: 1 })}
                        className="inline-flex min-h-tap items-center justify-center rounded-full border border-fai px-4 py-1.5 text-sm font-semibold text-fai-ink active:bg-black/5"
                      >
                        Elimina
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
