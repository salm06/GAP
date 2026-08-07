"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { repository, parseElencoAlunni } from "@/lib/repository";
import type { Attivita, Classe, Gruppo } from "@/lib/types";
import { creatoreDi } from "@/lib/creatore";
import { schedaMetodo } from "@/lib/metodo";
import { materieUda } from "@/lib/uda";
import { isPremium, puoGestireAttivita } from "@/lib/account";
import { Logo } from "@/components/comune/Logo";
import { Icona } from "@/components/comune/Icona";

// Colore del badge per metodologia. Metodo ignoto → giallo brand.
const COLORE_METODO: Record<string, string> = {
  "design thinking": "bg-metodo-design text-white",
  "digital storytelling": "bg-metodo-storytelling text-white",
};
const classeMetodo = (metodologia: string) =>
  COLORE_METODO[metodologia.trim().toLowerCase()] ?? "bg-accent text-[#1A1A1A]";

// Chip info scheda: stesso stile della card in home — bianco con bordo colorato (giallo/arancio/teal).
const CHIP_COLORI = [
  "bg-white border border-accent text-accent-ink",
  "bg-white border border-fai text-fai-ink",
  "bg-white border border-capisci text-capisci-ink",
];

const card = "rounded-2xl border border-panel-line bg-surface";

// Bottone di download tondo, sola icona: nera, icona bianca → gialla all'hover.
const btnScaricaTondo =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] text-white transition-colors hover:text-accent";

export function LezioneClient({ attivitaId }: { attivitaId: string }) {
  const router = useRouter();
  const [attivita, setAttivita] = useState<Attivita | null>(null);
  const [classi, setClassi] = useState<Classe[]>([]);
  const [caricamento, setCaricamento] = useState(true);

  const [classeId, setClasseId] = useState<string | null>(null);
  const [avviando, setAvviando] = useState(false);
  const [nuovaAperta, setNuovaAperta] = useState(false);
  const [nomeNuova, setNomeNuova] = useState("");
  const [testoNuova, setTestoNuova] = useState("");
  const [spuntati, setSpuntati] = useState<Set<string>>(new Set());
  // Gruppi di lavoro (facoltativi): numero gruppi + assegnazione alunno→indice gruppo.
  const [gruppiAperta, setGruppiAperta] = useState(false);
  const [numGruppi, setNumGruppi] = useState(2);
  const [assegnazioni, setAssegnazioni] = useState<Record<string, number>>({});
  const [confElimina, setConfElimina] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const elimina = async () => {
    if (!attivita || eliminando) return;
    setEliminando(true);
    try {
      await repository.eliminaAttivita(attivita.id);
      router.push("/");
    } catch {
      setEliminando(false);
    }
  };

  const ricaricaClassi = useCallback(async () => {
    setClassi(await repository.listClassi());
  }, []);

  useEffect(() => {
    (async () => {
      const [att, cls] = await Promise.all([
        repository.getAttivita(attivitaId),
        repository.listClassi(),
      ]);
      setAttivita(att);
      setClassi(cls);
      setCaricamento(false);
    })();
  }, [attivitaId]);

  const classeSelezionata = classi.find((c) => c.id === classeId) ?? null;

  // Gruppi correnti derivati dalle assegnazioni (alunno → indice gruppo).
  const costruisciGruppi = (): Gruppo[] => {
    const g: Gruppo[] = Array.from({ length: numGruppi }, (_, i) => ({
      id: `g${i + 1}`,
      nome: `Gruppo ${i + 1}`,
      alunniIds: [],
    }));
    for (const [alunnoId, idx] of Object.entries(assegnazioni)) {
      if (idx >= 0 && idx < numGruppi) g[idx].alunniIds.push(alunnoId);
    }
    return g;
  };

  // Distribuisce a caso gli alunni della classe nei gruppi (round-robin su ordine mescolato).
  const generaCasuale = () => {
    if (!classeSelezionata) return;
    const ids = classeSelezionata.alunni.map((a) => a.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    const next: Record<string, number> = {};
    ids.forEach((id, i) => (next[id] = i % numGruppi));
    setAssegnazioni(next);
  };

  const cambiaNumGruppi = (n: number) => {
    const max = classeSelezionata?.alunni.length ?? 2;
    const clamp = Math.max(2, Math.min(n, Math.max(2, max)));
    setNumGruppi(clamp);
    setAssegnazioni((prev) =>
      Object.fromEntries(Object.entries(prev).map(([id, idx]) => [id, idx % clamp]))
    );
  };

  const assegna = (alunnoId: string, val: string) =>
    setAssegnazioni((prev) => {
      const next = { ...prev };
      if (val === "") delete next[alunnoId];
      else next[alunnoId] = Number(val);
      return next;
    });

  // Avvia con la classe scelta: riusa la sessione in preparazione se esiste,
  // vi imposta la classe (ed eventuali gruppi) e va direttamente a Conduci.
  const avvia = async () => {
    if (!attivita || !classeId || avviando || !necessariPronti) return;
    setAvviando(true);
    try {
      const gruppi = Object.keys(assegnazioni).length
        ? costruisciGruppi().filter((g) => g.alunniIds.length > 0)
        : undefined;
      const esistenti = await repository.getSessioniPerAttivita(attivita.id);
      let s = esistenti.find((x) => x.stato === "preparazione") ?? null;
      if (s) {
        s = { ...s, classeId, gruppi };
        await repository.aggiornaSessione(s);
      } else {
        s = await repository.creaSessione(attivita.id, classeId);
        if (gruppi) {
          s = { ...s, gruppi };
          await repository.aggiornaSessione(s);
        }
      }
      router.push(`/conduci?sessione=${s.id}`);
    } catch {
      setAvviando(false);
    }
  };

  if (caricamento) return <p className="p-6 text-center text-muted">Carico…</p>;
  if (!attivita)
    return (
      <div className="p-6 text-center">
        <p className="text-ink">Lezione non trovata.</p>
        <Link href="/" className="mt-3 inline-block text-fai-ink underline">
          Torna alle attività
        </Link>
      </div>
    );

  const a = attivita;
  const chips = [
    a.materia,
    a.ordineScuola,
    `${a.durataTotaleMin} min · ${a.step.length} fasi`,
  ].filter((v): v is string => !!v);
  const uda = a.uda && a.uda.length ? a.uda : materieUda(a.possibileUdaCon);
  const haBes = a.step.some((s) => s.adattamentoBes);
  const scheda = schedaMetodo(a.metodologia);
  const materiali = a.materialiNecessari;
  const nPronti = materiali.filter((m) => spuntati.has(m.id)).length;
  // I materiali "necessari" (critici) vanno spuntati prima di poter iniziare.
  const necessari = materiali.filter((m) => m.critico);
  const necessariPronti = necessari.every((m) => spuntati.has(m.id));
  const puoIniziare = !!classeId && necessariPronti;

  const toggleMat = (id: string) =>
    setSpuntati((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    // pb ampio: lascia spazio alla barra fissa "Inizia attività" in fondo alla view.
    <main className="mx-auto max-w-3xl px-4 pb-44 pt-6">
      {/* Nav */}
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-fai-ink underline">
          ← Le tue attività
        </Link>
        <Logo altezza={24} chip />
      </div>

      {/* Hero banner con valutazione */}
      <div className="relative aspect-[21/9] w-full overflow-hidden rounded-card bg-panel">
        {a.immagine ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.immagine} alt="" className="h-full w-full object-cover" />
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
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#1A1A1A] px-3 py-1.5 font-head text-sm font-black text-white shadow ring-1 ring-white/20">
            {a.voto.toFixed(1)}
            <span className="text-[11px] font-bold text-white/50">/ 10</span>
          </span>
        )}
      </div>

      {/* Titolo + gestione (modifica/elimina) a fianco */}
      <div className="mt-5 flex items-start justify-between gap-3">
        <h1 className="min-w-0 font-head text-3xl font-black leading-tight text-ink sm:text-4xl">
          {a.titolo}
        </h1>
        {puoGestireAttivita(a) && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Link
              href={`/crea?id=${a.id}`}
              className="inline-flex min-h-tap items-center gap-1.5 rounded-xl border border-panel-line bg-white px-3 py-2 text-sm font-semibold text-ink active:bg-black/5"
            >
              <Icona nome="matita" size={15} /> Modifica
            </Link>
            {confElimina ? (
              <>
                <span className="text-sm font-semibold text-fai-ink">Eliminare?</span>
                <button
                  type="button"
                  onClick={elimina}
                  disabled={eliminando}
                  className="min-h-tap rounded-xl bg-[#dc2626] px-3 py-2 text-sm font-bold text-white active:brightness-95 disabled:opacity-40"
                >
                  {eliminando ? "Elimino…" : "Sì"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfElimina(false)}
                  className="min-h-tap rounded-xl border border-panel-line px-3 py-2 text-sm font-semibold text-muted active:bg-black/5"
                >
                  No
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfElimina(true)}
                aria-label="Elimina l'attività"
                title="Elimina"
                className="inline-flex min-h-tap min-w-tap items-center justify-center rounded-xl bg-[#dc2626] text-white active:brightness-95"
              >
                <Icona nome="cestino" size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* creata da */}
      <div className="mt-3 flex items-center gap-2.5">
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-[#1A1A1A]"
          aria-hidden
        >
          <Icona nome="persona" size={18} />
        </span>
        <span className="text-sm text-muted">
          creata da <span className="font-bold text-ink">{creatoreDi(a)}</span>
        </span>
      </div>

      {/* chip meta + BES */}
      <div className="mt-4 flex flex-wrap gap-2">
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
        {haBes && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#1A1A1A] px-3 py-1 text-xs font-bold text-white">
            <Icona nome="check" size={13} /> BES/DSA
          </span>
        )}
      </div>

      {/* Descrizione + obiettivo (riquadro giallo a fianco) */}
      {(a.descrizione || a.obiettivo) && (
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start">
          {a.descrizione && (
            <p className="flex-1 text-lg leading-relaxed text-ink">{a.descrizione}</p>
          )}
          {a.obiettivo && (
            <div className="rounded-2xl bg-accent p-4 sm:w-72 sm:shrink-0">
              <p className="font-head text-[11px] font-bold uppercase tracking-wide text-[#1A1A1A]/70">
                Obiettivo
              </p>
              <p className="mt-1 font-semibold leading-snug text-[#1A1A1A]">{a.obiettivo}</p>
            </div>
          )}
        </div>
      )}

      {/* Materiali della lezione (cartacei, kit base) */}
      <section className="mt-6">
        <h2 className="font-head text-lg font-bold text-ink">Materiali della lezione</h2>
        <p className="mt-1 text-sm text-muted">
          I materiali cartacei disponibili con il kit base.
        </p>
        {/* 1. Sceneggiatura — full width, titolo + download inline + contesto player */}
        <div className={`${card} mt-4 p-4`}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-head font-bold text-ink">La sceneggiatura</h3>
            <button
              type="button"
              onClick={() => {}}
              aria-label="Scarica la sceneggiatura in PDF"
              className={btnScaricaTondo}
            >
              <Icona nome="scarica" size={18} />
            </button>
          </div>
          <p className="mt-1 text-sm text-muted">
            Il copione stampabile di tutti gli step, senza la parte di valutazione.
          </p>

          {isPremium() ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-[rgba(0,184,181,0.4)] bg-[rgba(0,184,181,0.08)] px-4 py-3">
              <span className="mt-0.5 shrink-0 text-capisci-ink">
                <Icona nome="play" size={16} />
              </span>
              <p className="text-sm text-ink">
                Hai il <span className="font-bold">kit PLUS</span>: puoi condurre la lezione dal{" "}
                <span className="font-bold">player digitale</span> — timer degli step e valutazione
                facilitata mentre insegni. Premi «Inizia attività» qui sotto.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-[rgba(255,199,0,0.5)] bg-[rgba(255,199,0,0.10)] px-4 py-3">
              <p className="text-sm text-ink">
                Vuoi condurre la lezione dal vivo? Con il{" "}
                <span className="font-bold">player digitale</span> hai il timer degli step e la
                valutazione facilitata in corsa: è nel <span className="font-bold">kit PLUS</span>.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {}}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1A1A1A] px-3 py-2 text-sm font-bold text-white active:brightness-125"
                >
                  Passa a Premium
                </button>
                <button
                  type="button"
                  onClick={() => {}}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-panel-line bg-white px-3 py-2 text-sm font-semibold text-ink active:bg-black/5"
                >
                  Sblocca solo questa lezione
                </button>
              </div>
              <p className="mt-2 text-xs text-muted">
                Premium conviene se conduci molte lezioni; l’acquisto singolo se usi il sito di rado.
              </p>
            </div>
          )}
        </div>

        {/* Altri 3 materiali su una sola riga */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* 2. Presentazione teorica */}
          <div className={`${card} flex flex-col p-4`}>
            <h3 className="font-head font-bold text-ink">La presentazione teorica</h3>
            <p className="mt-1 flex-1 text-sm text-muted">
              Le slide pronte per introdurre l’argomento alla classe.
            </p>
            {a.presentazione ? (
              <a
                href={a.presentazione}
                download
                aria-label="Scarica la presentazione"
                className={`mt-3 ${btnScaricaTondo}`}
              >
                <Icona nome="scarica" size={18} />
              </a>
            ) : (
              <span className="mt-3 text-sm text-muted">Non disponibile per questa lezione.</span>
            )}
          </div>

          {/* 3. Griglia di valutazione */}
          <div className={`${card} flex flex-col p-4`}>
            <h3 className="font-head font-bold text-ink">La griglia di valutazione</h3>
            <p className="mt-1 flex-1 text-sm text-muted">
              Le competenze da stampare e compilare a mano.
            </p>
            <button
              type="button"
              onClick={() => {}}
              aria-label="Scarica la griglia in PDF"
              className={`mt-3 ${btnScaricaTondo}`}
            >
              <Icona nome="scarica" size={18} />
            </button>
          </div>

          {/* 4. Guida al metodo */}
          <div className={`${card} flex flex-col p-4`}>
            <h3 className="font-head font-bold text-ink">La guida al metodo</h3>
            <p className="mt-1 flex-1 text-sm text-muted">
              Il documento sul metodo didattico usato: {a.metodologia}.
            </p>
            {scheda.guidaPdf ? (
              <a
                href={scheda.guidaPdf}
                download
                aria-label="Scarica la guida al metodo"
                className={`mt-3 ${btnScaricaTondo}`}
              >
                <Icona nome="scarica" size={18} />
              </a>
            ) : (
              <span className="mt-3 text-sm text-muted">
                Non disponibile per «{a.metodologia}».
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Perché funziona (principio neurodidattico) — callout su fondo nero. */}
      <section className="mt-6 rounded-2xl bg-[#1A1A1A] p-5">
        <div className="flex items-center gap-2">
          <span className="text-accent">
            <Icona nome="lampadina" size={20} />
          </span>
          <h2 className="font-head text-lg font-bold text-white">Perché funziona</h2>
        </div>
        <p className="mt-3 leading-relaxed text-white/85">{scheda.neuro}</p>
      </section>

      {/* Materiali da spuntare */}
      {materiali.length > 0 && (
        <section className={`mt-6 ${card} p-5`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-head text-lg font-bold text-ink">Materiali da preparare</h2>
            <span className="shrink-0 rounded-full bg-panel px-2.5 py-0.5 text-xs font-bold text-muted">
              {nPronti}/{materiali.length} pronti
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {materiali.map((m) => {
              const on = spuntati.has(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => toggleMat(m.id)}
                    aria-pressed={on}
                    className={[
                      "flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                      on
                        ? "border-capisci bg-capisci/10"
                        : "border-panel-line bg-surface active:bg-black/5",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                        on
                          ? "border-capisci bg-capisci text-white"
                          : "border-panel-line bg-surface text-transparent",
                      ].join(" ")}
                      aria-hidden
                    >
                      <Icona nome="check" size={14} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className={on ? "text-muted line-through" : "text-ink"}>
                        {m.descrizione}
                      </span>
                      <span className="flex flex-wrap items-center gap-2 text-xs">
                        {m.critico ? (
                          <span className="rounded-full bg-[#1A1A1A] px-2 py-0.5 font-bold text-white">
                            necessario
                          </span>
                        ) : (
                          <span className="rounded-full border border-panel-line px-2 py-0.5 font-semibold text-muted">
                            consigliato
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
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold text-accent-ink underline"
                          >
                            Apri link
                          </a>
                        )}
                      </span>
                    </span>
                    {m.download && (
                      <a
                        href={m.download}
                        download
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Scarica il materiale"
                        title="Scarica"
                        className="ml-2 inline-flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full bg-[#1A1A1A] text-accent"
                      >
                        <Icona nome="scarica" size={16} />
                      </a>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Cosa andremo a valutare — competenze PECUP, valutate da A a E */}
      {a.griglia.criteri.length > 0 && (
        <section className={`mt-6 ${card} p-5`}>
          <h2 className="font-head text-lg font-bold text-ink">Cosa andremo a valutare</h2>
          <p className="mt-1 text-sm text-muted">
            Le competenze (PECUP) osservabili in ogni step, da A ad E per ogni studente; al termine
            trovi la griglia già precompilata nel resoconto.
          </p>
          <ul className="mt-3 space-y-3">
            {a.griglia.criteri.map((c) => (
              <li key={c.id} className="border-l-2 border-accent pl-3">
                <p className="font-head font-bold text-ink">{c.nome}</p>
                {c.competenzaMinisteriale && (
                  <p className="mt-0.5 text-sm text-muted">{c.competenzaMinisteriale}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* UDA interdisciplinare: materie con cui costruire un'unità di apprendimento */}
      {uda.length > 0 && (
        <section className={`mt-6 ${card} p-5`}>
          <h2 className="font-head text-lg font-bold text-ink">UDA</h2>
          <p className="mt-1 text-sm text-muted">
            Materie con cui costruire un’unità di apprendimento interdisciplinare, e come
            integrarle.
          </p>
          <ul className="mt-3 space-y-3">
            {uda.map(({ materia, come }) => (
              <li key={materia} className="rounded-xl bg-panel p-4">
                <p className="font-head font-bold text-ink">{materia}</p>
                <p className="mt-1 text-sm text-muted">{come}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Il metodo in breve */}
      <section className={`mt-6 ${card} p-5`}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-head text-lg font-bold text-ink">Il metodo in breve</h2>
          <span
            className={`rounded-full px-2.5 py-0.5 font-head text-[11px] font-bold uppercase tracking-wide ${classeMetodo(
              a.metodologia
            )}`}
          >
            {a.metodologia}
          </span>
        </div>
        <p className="mt-3 leading-relaxed text-ink">{scheda.come}</p>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-panel px-4 py-3">
          <span className="mt-0.5 shrink-0 text-accent-ink">
            <Icona nome="lampadina" size={18} />
          </span>
          <p className="text-sm text-muted">
            Vuoi creare attività così? Questo metodo fa parte del{" "}
            <span className="font-bold text-ink">mazzo di carte GAP</span> per docenti: uno
            strumento fisico per progettare lezioni “giocando”.
          </p>
        </div>
      </section>

      {/* Barra fissa in fondo alla view: rettangolo arrotondato con effetto glass.
          Scelta classe (+ nuova) + avvio. Il wrapper non intercetta i click nei margini. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-white/50 bg-[rgba(255,255,255,0.45)] p-3 shadow-[0_8px_30px_rgba(0,0,0,0.16)] backdrop-blur-2xl backdrop-saturate-150 sm:p-4">
          {nuovaAperta && (
            <div className="mb-3 rounded-2xl border border-panel-line bg-panel p-3">
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
                rows={4}
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
                  await ricaricaClassi();
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

          {gruppiAperta && classeSelezionata && (
            <div className="mb-3 rounded-2xl border border-panel-line bg-panel p-3">
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="num-gruppi" className="text-sm font-semibold text-ink">
                  Numero di gruppi
                </label>
                <input
                  id="num-gruppi"
                  type="number"
                  min={2}
                  max={Math.max(2, classeSelezionata.alunni.length)}
                  value={numGruppi}
                  onChange={(e) => cambiaNumGruppi(Number(e.target.value))}
                  className="min-h-tap w-16 rounded-lg border border-panel-line bg-white px-2 text-center text-base text-ink"
                />
                <button
                  type="button"
                  onClick={generaCasuale}
                  className="min-h-tap rounded-xl bg-accent px-3 text-sm font-bold text-[#1A1A1A] active:brightness-95"
                >
                  Genera a caso
                </button>
                <span className="text-xs text-muted">oppure assegna a mano</span>
              </div>

              <div className="mt-3 grid max-h-52 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                {classeSelezionata.alunni.map((al) => (
                  <div key={al.id} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">{al.nome}</span>
                    <select
                      value={assegnazioni[al.id] ?? ""}
                      onChange={(e) => assegna(al.id, e.target.value)}
                      aria-label={`Gruppo di ${al.nome}`}
                      className="min-h-tap shrink-0 rounded-lg border border-panel-line bg-white px-2 text-sm font-semibold text-ink"
                    >
                      <option value="">—</option>
                      {Array.from({ length: numGruppi }, (_, i) => (
                        <option key={i} value={i}>
                          G{i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {costruisciGruppi().map((g) => (
                  <span
                    key={g.id}
                    className="rounded-full border border-panel-line bg-white px-2 py-0.5 text-xs font-semibold text-ink"
                  >
                    {g.nome}: {g.alunniIds.length}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={classeId ?? ""}
                onChange={(e) => {
                  setClasseId(e.target.value || null);
                  setAssegnazioni({});
                  setGruppiAperta(false);
                }}
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
              className="min-h-tap shrink-0 rounded-xl border border-panel-line bg-surface px-3 text-sm font-semibold text-ink active:bg-black/5"
            >
              {nuovaAperta ? "Annulla" : "+ Nuova"}
            </button>
            <button
              type="button"
              onClick={() => setGruppiAperta((v) => !v)}
              aria-expanded={gruppiAperta}
              disabled={!classeSelezionata}
              title={!classeSelezionata ? "Scegli prima una classe" : undefined}
              className="min-h-tap shrink-0 rounded-xl border border-panel-line bg-surface px-3 text-sm font-semibold text-ink active:bg-black/5 disabled:opacity-40"
            >
              {gruppiAperta ? "Chiudi" : "Gruppi"}
            </button>
          </div>

          <button
            type="button"
            onClick={avvia}
            disabled={!puoIniziare || avviando}
            className={[
              "mt-3 flex min-h-tap w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-head text-base font-bold transition-[filter]",
              puoIniziare
                ? "bg-accent text-[#1A1A1A] active:brightness-95"
                : "cursor-not-allowed bg-panel text-muted",
            ].join(" ")}
          >
            <Icona nome="play" size={16} />
            {avviando ? "Avvio…" : "Inizia attività"}
          </button>
          {!classeId ? (
            <p className="mt-1 text-center text-xs text-fai-ink">
              Seleziona una classe per iniziare
            </p>
          ) : (
            !necessariPronti && (
              <p className="mt-1 text-center text-xs text-fai-ink">
                Spunta i materiali necessari per iniziare
              </p>
            )
          )}
        </div>
      </div>
    </main>
  );
}
