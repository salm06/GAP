"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { repository, parseElencoAlunni } from "@/lib/repository";
import type { Attivita, Classe, Sessione } from "@/lib/types";
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

// Chip info scheda: sfondo pieno con i colori del brand.
const CHIP_COLORI = [
  "bg-accent text-[#1A1A1A]",
  "bg-fai text-[#1A1A1A]",
  "bg-capisci text-[#1A1A1A]",
];

// Card di preview del kit: hero, titolo, descrizione, chip, BES, "Altre info"
// e, in fondo, selezione classe + avvio (così la classe non si può saltare).
function CardAttivita({
  a,
  classi,
  onClasseCreata,
}: {
  a: Attivita;
  classi: Classe[];
  onClasseCreata: (c: Classe) => void;
}) {
  const router = useRouter();
  const [aperto, setAperto] = useState(false);
  const [matAperto, setMatAperto] = useState(false);
  const [classeId, setClasseId] = useState<string | null>(null);
  const [avviando, setAvviando] = useState(false);
  const [nuovaAperta, setNuovaAperta] = useState(false);
  const [nomeNuova, setNomeNuova] = useState("");
  const [testoNuova, setTestoNuova] = useState("");
  const chips = [
    a.materia,
    a.ordineScuola,
    `${a.durataTotaleMin} min · ${a.step.length} fasi`,
  ].filter((v): v is string => !!v);
  const altre = (
    [
      ["Tecnologia richiesta", a.tecnologiaRichiesta],
      ["Competenze target", a.competenzeTarget],
      ["Possibile UDA con", a.possibileUdaCon],
    ] as [string, string | undefined][]
  ).filter(([, v]) => !!v);
  const haBes = a.step.some((s) => s.adattamentoBes);

  // Avvia con la classe scelta: riusa la sessione in preparazione se esiste,
  // vi imposta la classe e va direttamente a Conduci.
  const avvia = async () => {
    if (!classeId || avviando) return;
    setAvviando(true);
    try {
      const esistenti = await repository.getSessioniPerAttivita(a.id);
      let s = esistenti.find((x) => x.stato === "preparazione") ?? null;
      if (s) {
        s = { ...s, classeId };
        await repository.aggiornaSessione(s);
      } else {
        s = await repository.creaSessione(a.id, classeId);
      }
      router.push(`/attivita/${a.id}/conduci?sessione=${s.id}`);
    } catch {
      setAvviando(false);
    }
  };

  return (
    <li className="group flex h-full flex-col overflow-hidden rounded-card border border-panel-line bg-surface transition-colors sm:hover:border-accent">
      <div className="block">
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

        {/* titolo + descrizione + chip */}
        <div className="px-5 pt-5">
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
      </div>

      {/* BES → Altre info → Materiali → selezione classe + avvio */}
      <div className="mt-auto px-5 pb-5 pt-4">
        {haBes && (
          <div className="flex items-center gap-2 rounded-full bg-[#1A1A1A] px-4 py-2.5 font-head text-sm font-bold text-white">
            <Icona nome="check" size={16} /> Adattamenti BES/DSA inclusi
          </div>
        )}

        {altre.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setAperto((v) => !v)}
              aria-expanded={aperto}
              className="flex w-full items-center justify-between gap-2 text-sm font-bold text-ink active:opacity-70"
            >
              Altre info
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className={`transition-transform ${aperto ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {aperto && (
              <dl className="mt-3 space-y-3">
                {altre.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-sm font-bold text-ink">{label}</dt>
                    <dd className="mt-0.5 text-sm font-light text-muted">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}

        {a.materialiNecessari.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setMatAperto((v) => !v)}
              aria-expanded={matAperto}
              className="flex w-full items-center justify-between gap-2 text-sm font-bold text-ink active:opacity-70"
            >
              Materiali ({a.materialiNecessari.length})
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className={`transition-transform ${matAperto ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {matAperto && (
              <ul className="mt-3 space-y-2">
                {a.materialiNecessari.map((m) => (
                  <li key={m.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span className="min-w-0 flex-1">
                      <span className="text-ink">{m.descrizione}</span>
                      <span className="ml-2 inline-flex flex-wrap items-center gap-2 align-middle text-xs">
                        {m.critico && (
                          <span className="rounded-full bg-[#1A1A1A] px-2 py-0.5 font-bold text-white">
                            critico
                          </span>
                        )}
                        <span className="rounded-full border border-panel-line px-2 py-0.5 text-muted">
                          {m.tipo}
                        </span>
                        {m.link && (
                          <a
                            href={m.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-accent-ink underline"
                          >
                            Apri link
                          </a>
                        )}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Selezione classe (con "+ Nuova") + Inizia attività */}
        <div className="mt-4 border-t border-panel-line pt-4">
          <p className="mb-2 font-head text-[11px] font-bold uppercase tracking-wide text-accent-ink">
            Scegli la classe
          </p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={classeId ?? ""}
                onChange={(e) => setClasseId(e.target.value || null)}
                aria-label="Scegli la classe"
                className="min-h-tap w-full appearance-none rounded-xl border border-panel-line bg-panel px-3 pr-9 text-sm font-semibold text-ink"
              >
                <option value="" disabled>
                  Scegli una classe…
                </option>
                {classi.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} · {c.alunni.length} alunni
                  </option>
                ))}
              </select>
              <span
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              >
                ▾
              </span>
            </div>
            <button
              type="button"
              onClick={() => setNuovaAperta((v) => !v)}
              aria-expanded={nuovaAperta}
              className="min-h-tap shrink-0 rounded-xl border border-panel-line px-3 text-sm font-semibold text-ink active:bg-black/5"
            >
              + Nuova
            </button>
          </div>

          {nuovaAperta && (
            <div className="mt-2 rounded-2xl border border-panel-line bg-surface p-3">
              <input
                type="text"
                placeholder="Nome classe (es. 2B Informatica)"
                value={nomeNuova}
                onChange={(e) => setNomeNuova(e.target.value)}
                className="mb-2 min-h-tap w-full rounded-lg border border-panel-line bg-white px-3 text-base text-ink"
              />
              <textarea
                placeholder={"Incolla i nomi, uno per riga.\nOppure CSV: Cognome,Nome"}
                value={testoNuova}
                onChange={(e) => setTestoNuova(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-panel-line bg-white p-3 text-base text-ink"
              />
              <p className="mt-1 text-xs text-muted">
                {parseElencoAlunni(testoNuova).length} alunni riconosciuti
              </p>
              <button
                type="button"
                disabled={parseElencoAlunni(testoNuova).length === 0 || !nomeNuova.trim()}
                onClick={async () => {
                  const nuova = await repository.importaAlunniDaTesto(nomeNuova, testoNuova);
                  onClasseCreata(nuova);
                  setClasseId(nuova.id);
                  setNuovaAperta(false);
                  setNomeNuova("");
                  setTestoNuova("");
                }}
                className="mt-2 min-h-tap w-full rounded-xl bg-accent px-4 py-2 text-sm font-bold text-[#1A1A1A] active:brightness-95 disabled:opacity-40"
              >
                Crea classe
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={avvia}
            disabled={!classeId || avviando}
            className={[
              "mt-3 flex min-h-tap w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-head text-base font-bold transition-colors",
              classeId
                ? "bg-accent text-[#1A1A1A] active:brightness-95"
                : "cursor-not-allowed bg-panel text-muted",
            ].join(" ")}
          >
            <Icona nome="play" size={16} />
            {avviando ? "Avvio…" : "Inizia attività"}
          </button>
          {!classeId && (
            <p className="mt-1 text-center text-xs text-fai-ink">
              Seleziona una classe per iniziare
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

export default function Home() {
  const [attivita, setAttivita] = useState<Attivita[]>([]);
  const [classi, setClassi] = useState<Classe[]>([]);
  const [sessioni, setSessioni] = useState<Sessione[]>([]);
  const [caricamento, setCaricamento] = useState(true);
  const [conferma, setConferma] = useState<Conferma | null>(null);

  const ricarica = useCallback(async () => {
    const [lista, cls, sess] = await Promise.all([
      repository.listAttivita(),
      repository.listClassi(),
      repository.listSessioni(),
    ]);
    setAttivita(lista);
    setClassi(cls);
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
          <button
            type="button"
            className="min-h-tap rounded-full bg-[#1A1A1A] px-4 py-2 font-head text-sm font-bold text-white active:brightness-125"
          >
            Crea Attività
          </button>
        </div>
      </div>
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
          <CardAttivita
            key={a.id}
            a={a}
            classi={classi}
            onClasseCreata={(c) => setClassi((prev) => [...prev, c])}
          />
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
