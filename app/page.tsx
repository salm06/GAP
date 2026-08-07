"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { repository } from "@/lib/repository";
import type { Attivita, Sessione } from "@/lib/types";
import { creatoreDi } from "@/lib/creatore";
import { Logo } from "@/components/comune/Logo";
import { Icona } from "@/components/comune/Icona";
import { Creatore } from "@/components/comune/Creatore";

type Conferma = { id: string; tipo: "reset" | "elimina"; stage: number };

// Colore del badge per metodologia (preview card lezioni). Metodo ignoto → giallo brand.
const COLORE_METODO: Record<string, string> = {
  "design thinking": "bg-metodo-design text-white",
  "digital storytelling": "bg-metodo-storytelling text-white",
};
const classeMetodo = (metodologia: string) =>
  COLORE_METODO[metodologia.trim().toLowerCase()] ?? "bg-accent text-[#1A1A1A]";

// Chip info scheda: sfondo bianco con bordo e testo nel colore del brand (outline, meno d'impatto).
const CHIP_COLORI = [
  "bg-white border border-accent text-accent-ink",
  "bg-white border border-fai text-fai-ink",
  "bg-white border border-capisci text-capisci-ink",
];

// Card di preview del kit in formato minimal: hero, titolo, descrizione, chip,
// badge BES, firma del creatore e un solo bottone "Apri Lezione". Tutto il resto
// (altre info, materiali, scelta classe, avvio) vive nella pagina della lezione.
function CardAttivita({ a }: { a: Attivita }) {
  const chips = [
    a.materia,
    a.ordineScuola,
    `${a.durataTotaleMin} min · ${a.step.length} fasi`,
  ].filter((v): v is string => !!v);
  const haBes = a.step.some((s) => s.adattamentoBes);

  return (
    <li className="group flex h-full flex-col overflow-hidden rounded-card border border-panel-line bg-surface transition-colors sm:hover:border-accent">
      <Link href={`/lezione?id=${a.id}`} className="block">
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

        {/* autore + titolo + descrizione + chip */}
        <div className="px-5 pt-5">
          <div className="mb-2">
            <Creatore nome={creatoreDi(a)} />
          </div>
          <p className="font-head text-xl font-extrabold text-ink">{a.titolo}</p>
          {a.descrizione && (
            <p className="mt-1.5 text-sm leading-snug text-muted">{a.descrizione}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((value, i) => (
              <span
                key={i}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  CHIP_COLORI[i % CHIP_COLORI.length]
                }`}
              >
                {value}
              </span>
            ))}
          </div>
        </div>
      </Link>

      {/* badge BES → apri lezione */}
      <div className="mt-auto px-5 pb-5 pt-4">
        {haBes && (
          <div className="flex items-center gap-2 rounded-full bg-[#1A1A1A] px-4 py-2.5 font-head text-sm font-bold text-white">
            <Icona nome="check" size={16} /> Adattamenti BES/DSA inclusi
          </div>
        )}

        <Link
          href={`/lezione?id=${a.id}`}
          className={`${haBes ? "mt-4 " : ""}flex min-h-tap w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-head text-base font-bold text-[#1A1A1A] transition-[filter] active:brightness-95`}
        >
          <Icona nome="apri" size={16} /> Apri Lezione
        </Link>
      </div>
    </li>
  );
}

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
        <span className="rounded-full bg-[#1A1A1A] px-3 py-1 font-head text-[11px] font-bold uppercase tracking-[.16em] text-accent">
          Player · Kit PLUS
        </span>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-head text-3xl font-black tracking-tight text-ink sm:text-5xl">
          Le tue attività
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            className="min-h-tap rounded-full border border-panel-line px-4 py-2 font-head text-sm font-bold text-ink active:bg-black/5"
          >
            Biblioteca
          </button>
          <Link
            href="/crea"
            className="inline-flex min-h-tap items-center rounded-full bg-[#1A1A1A] px-4 py-2 font-head text-sm font-bold text-white active:brightness-125"
          >
            Crea Attività
          </Link>
        </div>
      </div>
      <p className="mt-2 text-base text-muted">Conduci la lezione dal telefono, passo dopo passo.</p>

      {caricamento && <p className="mt-6 text-muted">Carico…</p>}

      {attiva && (
        <Link
          href={`/conduci?sessione=${attiva.id}`}
          className="mt-8 flex items-center justify-between gap-3 rounded-card border border-accent bg-white p-5 transition-colors active:bg-black/5"
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
          <CardAttivita key={a.id} a={a} />
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
                          href={`/conduci?sessione=${s.id}`}
                          className="inline-flex min-h-tap items-center justify-center rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-[#1A1A1A]"
                        >
                          Riprendi
                        </Link>
                      ) : (
                        <Link
                          href={`/rivedi?sessione=${s.id}`}
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
