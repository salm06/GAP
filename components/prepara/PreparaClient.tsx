"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { repository } from "@/lib/repository";
import type { Attivita, Classe, Sessione } from "@/lib/types";
import { Bottone } from "@/components/ui/Bottone";
import { Logo } from "@/components/comune/Logo";
import { Icona } from "@/components/comune/Icona";
import { SelettoreClasse } from "./SelettoreClasse";

export function PreparaClient({ attivitaId }: { attivitaId: string }) {
  const router = useRouter();
  const [attivita, setAttivita] = useState<Attivita | null>(null);
  const [classi, setClassi] = useState<Classe[]>([]);
  const [sessione, setSessione] = useState<Sessione | null>(null);
  const [caricamento, setCaricamento] = useState(true);

  // Carica attività + classi + sessione di preparazione (riusa quella esistente).
  useEffect(() => {
    (async () => {
      const [att, cls, sessioni] = await Promise.all([
        repository.getAttivita(attivitaId),
        repository.listClassi(),
        repository.getSessioniPerAttivita(attivitaId),
      ]);
      setAttivita(att);
      setClassi(cls);
      let prep = sessioni.find((s) => s.stato === "preparazione") ?? null;
      if (!prep) prep = await repository.creaSessione(attivitaId);
      setSessione(prep);
      setCaricamento(false);
    })();
  }, [attivitaId]);

  const patch = (updater: (s: Sessione) => Sessione) => {
    setSessione((prev) => {
      if (!prev) return prev;
      const nuova = updater(prev);
      void repository.aggiornaSessione(nuova);
      return nuova;
    });
  };

  const spuntati = sessione?.materialiSpuntati ?? [];
  const toggleMateriale = (id: string) =>
    patch((s) => {
      const set = new Set(s.materialiSpuntati ?? []);
      set.has(id) ? set.delete(id) : set.add(id);
      return { ...s, materialiSpuntati: [...set] };
    });

  const criticiMancanti = useMemo(() => {
    if (!attivita) return [];
    return attivita.materialiNecessari.filter((m) => m.critico && !spuntati.includes(m.id));
  }, [attivita, spuntati]);

  const inizia = () => {
    if (!sessione || !attivita) return;
    if (criticiMancanti.length > 0) {
      const ok = window.confirm(
        `Mancano materiali critici (${criticiMancanti
          .map((m) => m.descrizione)
          .join(", ")}). Iniziare comunque?`
      );
      if (!ok) return;
    }
    router.push(`/attivita/${attivita.id}/conduci?sessione=${sessione.id}`);
  };

  if (caricamento || !attivita || !sessione) {
    return <p className="p-6 text-center text-muted">Carico…</p>;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 pb-28">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-accent underline">
          ← Attività
        </Link>
        <Logo altezza={24} chip />
      </div>
      <h1 className="font-head text-2xl font-black text-ink sm:text-4xl">{attivita.titolo}</h1>
      <p className="text-sm text-muted">
        {attivita.materia} · {attivita.metodologia} · {attivita.durataTotaleMin}′
      </p>

      <div className="lg:grid lg:grid-cols-2 lg:gap-8">
        <div>
          {/* Materiali */}
          <section className="mt-6">
            <h2 className="mb-2 font-head text-lg font-bold text-ink">Materiali</h2>
            <ul className="space-y-2">
              {attivita.materialiNecessari.map((m) => {
                const ok = spuntati.includes(m.id);
                const nero = m.critico; // materiali critici: card nera ad alto contrasto
                return (
                  <li
                    key={m.id}
                    className={[
                      "flex items-start gap-3 rounded-2xl border p-3",
                      nero ? "border-[#1A1A1A] bg-[#1A1A1A]" : "border-panel-line bg-panel",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => toggleMateriale(m.id)}
                      aria-pressed={ok}
                      aria-label={`${ok ? "Rimuovi spunta" : "Spunta"}: ${m.descrizione}`}
                      className={[
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2",
                        ok
                          ? "border-accent bg-accent text-[#1A1A1A]"
                          : nero
                            ? "border-white/45 bg-transparent text-transparent"
                            : "border-panel-line bg-transparent text-transparent",
                      ].join(" ")}
                    >
                      <Icona nome="check" size={16} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={
                          ok
                            ? nero
                              ? "text-white/45 line-through"
                              : "text-muted line-through"
                            : nero
                              ? "text-white"
                              : "text-ink"
                        }
                      >
                        {m.descrizione}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        {m.critico && (
                          <span className="rounded-full bg-accent px-2 py-0.5 font-bold text-[#1A1A1A]">
                            critico
                          </span>
                        )}
                        <span
                          className={[
                            "rounded-full border px-2 py-0.5",
                            nero ? "border-white/30 text-white/70" : "border-panel-line text-muted",
                          ].join(" ")}
                        >
                          {m.tipo}
                        </span>
                        {m.link && (
                          <a
                            href={m.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-accent underline"
                          >
                            Apri link
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div>
          {/* Classe */}
          <section className="mt-6">
            <h2 className="mb-2 font-head text-lg font-bold text-ink">Classe</h2>
            <SelettoreClasse
              classi={classi}
              selezionataId={sessione.classeId}
              onSeleziona={(id) => patch((s) => ({ ...s, classeId: id }))}
              onNuovaClasse={async (nome, testo) => {
                const nuova = await repository.importaAlunniDaTesto(nome, testo);
                setClassi((c) => [...c, nuova]);
                patch((s) => ({ ...s, classeId: nuova.id }));
              }}
            />
          </section>

          {/* Panoramica step */}
          <section className="mt-6">
            <h2 className="mb-2 font-head text-lg font-bold text-ink">
              Step ({attivita.step.length})
            </h2>
            <ol className="space-y-1">
              {attivita.step.map((s, i) => (
                <li
                  key={s.id}
                  className="flex justify-between rounded-xl border border-panel-line bg-panel px-3 py-2 text-sm"
                >
                  <span className="text-ink">
                    {i + 1}. {s.titolo}
                  </span>
                  <span className="tabular-nums text-muted">{s.durataMin}′</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      {/* CTA fissa in basso */}
      <div className="fixed inset-x-0 bottom-0 border-t border-panel-line bg-bg/90 p-4 backdrop-blur">
        <div className="mx-auto max-w-5xl">
          <Bottone pieno onClick={inizia}>
            Inizia l&apos;attività →
          </Bottone>
          {criticiMancanti.length > 0 && (
            <p className="mt-1 text-center text-xs text-fai">
              {criticiMancanti.length} material{criticiMancanti.length === 1 ? "e" : "i"} critico ancora da spuntare
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
