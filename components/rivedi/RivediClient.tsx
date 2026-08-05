"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { repository } from "@/lib/repository";
import type { Attivita, Classe, Livello, Sessione } from "@/lib/types";
import { costruisciMatrice, indicizzaOsservabili, riepilogoClasse } from "@/lib/valutazione";
import { durataEffettivaStep } from "@/lib/tempo";
import { esportaTempiCSV, esportaValutazioneCSV, stampaPdf } from "@/lib/export";
import { Bottone } from "@/components/ui/Bottone";
import { Logo } from "@/components/comune/Logo";
import { GrigliaValutazione } from "./GrigliaValutazione";

const MIN = 60_000;

export function RivediClient({ sessioneId }: { sessioneId: string }) {
  const [sessione, setSessione] = useState<Sessione | null>(null);
  const [attivita, setAttivita] = useState<Attivita | null>(null);
  const [classe, setClasse] = useState<Classe | null>(null);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    (async () => {
      const s = await repository.getSessione(sessioneId);
      if (!s) {
        setCaricamento(false);
        return;
      }
      const [att, cls] = await Promise.all([
        repository.getAttivita(s.attivitaId),
        s.classeId ? repository.getClasse(s.classeId) : Promise.resolve(null),
      ]);
      setSessione(s);
      setAttivita(att);
      setClasse(cls);
      setCaricamento(false);
    })();
  }, [sessioneId]);

  const patch = (updater: (s: Sessione) => Sessione) =>
    setSessione((prev) => {
      if (!prev) return prev;
      const nuova = updater(prev);
      void repository.aggiornaSessione(nuova);
      return nuova;
    });

  const celle = useMemo(() => {
    if (!attivita || !classe || !sessione) return [];
    return costruisciMatrice(attivita, classe, sessione.annotazioni);
  }, [attivita, classe, sessione]);

  const riepilogo = useMemo(() => {
    if (!attivita || !sessione) return [];
    return riepilogoClasse(attivita, sessione.annotazioni);
  }, [attivita, sessione]);

  if (caricamento) return <p className="p-6 text-center text-muted">Carico…</p>;
  if (!sessione || !attivita)
    return (
      <div className="p-6 text-center">
        <p className="text-ink">Sessione non trovata.</p>
        <Link href="/" className="text-fai-ink underline">
          Home
        </Link>
      </div>
    );

  const override = sessione.valutazioneOverride ?? {};
  const setLivello = (alunnoId: string, criterioId: string, livello: Livello | null) =>
    patch((s) => {
      const ov: Record<string, Record<string, Livello>> = { ...(s.valutazioneOverride ?? {}) };
      const perAlunno = { ...(ov[alunnoId] ?? {}) };
      if (livello == null) delete perAlunno[criterioId];
      else perAlunno[criterioId] = livello;
      ov[alunnoId] = perAlunno;
      return { ...s, valutazioneOverride: ov };
    });

  const osservabili = indicizzaOsservabili(attivita);
  const nomeOsservabile = (osservabileId?: string) =>
    osservabileId ? osservabili.get(osservabileId)?.label ?? "" : "";
  const nomeCriterio = (id: string) => attivita.griglia.criteri.find((c) => c.id === id)?.nome ?? id;
  const nomeStep = (id: string) => attivita.step.find((s) => s.id === id)?.titolo ?? id;

  const durataRealeMin = Math.round(
    sessione.tempiReali.reduce((acc, t) => acc + (t.fine ? t.fine - t.inizio : 0), 0) / MIN
  );
  const durataPianMin = attivita.step.reduce((a, s) => a + durataEffettivaStep(s, sessione), 0);
  const alunniOsservati = new Set(
    sessione.annotazioni.filter((a) => a.alunnoId).map((a) => a.alunnoId)
  ).size;

  // Voti di classe (per caratteristica) + note vocali
  const votiClasse = sessione.annotazioni
    .filter((a) => a.tipo === "valutazione" && a.alunnoId == null && a.valore != null)
    .map((a) => ({
      id: a.id,
      label: nomeOsservabile(a.osservabileId),
      step: nomeStep(a.stepId),
      valore: a.valore as number,
    }));
  const noteVocali = sessione.annotazioni.filter((a) => a.tipo === "vocale");

  // Per alunno: voti individuali + note di testo
  const perAlunno = (classe?.alunni ?? [])
    .map((al) => ({
      alunno: al,
      note: sessione.annotazioni
        .filter((a) => a.alunnoId === al.id && (a.tipo === "testo" || a.tipo === "valutazione"))
        .sort((x, y) => x.timestamp - y.timestamp),
    }))
    .filter((x) => x.note.length > 0);

  const card = "rounded-2xl border border-panel-line bg-surface";
  const dataStr = new Date(sessione.avviataAlle).toLocaleDateString("it-IT");

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-fai-ink underline">
          ← Home
        </Link>
        <Logo altezza={24} chip />
      </div>

      <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 font-head text-[11px] font-bold uppercase tracking-wide text-[#1A1A1A]">
        Resoconto attività
      </span>
      <h1 className="mt-2 font-head text-2xl font-black text-ink sm:text-4xl">{attivita.titolo}</h1>
      <p className="text-sm text-muted">
        {classe ? classe.nome : "Senza classe"} · {dataStr}
      </p>

      {/* Sintesi */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: "Durata reale", v: `${durataRealeMin}′`, s: `su ${durataPianMin}′ previsti` },
          { k: "Step svolti", v: `${attivita.step.length}`, s: "completati" },
          { k: "Annotazioni", v: `${sessione.annotazioni.length}`, s: "raccolte" },
          { k: "Alunni osservati", v: `${alunniOsservati}`, s: classe ? `di ${classe.alunni.length}` : "" },
        ].map((c) => (
          <div key={c.k} className={`${card} p-3`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{c.k}</p>
            <p className="font-head text-2xl font-black text-ink">{c.v}</p>
            <p className="text-xs text-muted">{c.s}</p>
          </div>
        ))}
      </section>

      {/* Tempi reale vs previsto */}
      <section className="mt-8 print-break">
        <h2 className="mb-2 font-head text-lg font-bold text-ink">Tempi: reale vs previsto</h2>
        <ul className="space-y-1">
          {attivita.step.map((st) => {
            const t = sessione.tempiReali.find((r) => r.stepId === st.id);
            const previsto = durataEffettivaStep(st, sessione);
            const realeMin = t?.fine ? Math.round((t.fine - t.inizio) / MIN) : null;
            const scost = realeMin == null ? null : realeMin - previsto;
            return (
              <li key={st.id} className={`${card} flex items-center justify-between px-3 py-2 text-sm`}>
                <span className="text-ink">{st.titolo}</span>
                <span className="flex items-center gap-3 tabular-nums">
                  <span className="text-muted">
                    {realeMin ?? "—"}′ / {previsto}′
                  </span>
                  {scost != null && scost !== 0 && (
                    <span className={["font-semibold", scost > 0 ? "text-ritardo" : "text-anticipo"].join(" ")}>
                      {scost > 0 ? `+${scost}` : scost}′
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Valutazione */}
      <section className="mt-8 print-break">
        <h2 className="mb-2 font-head text-lg font-bold text-ink">Valutazione della classe</h2>
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {riepilogo.map((r) => (
            <div key={r.criterioId} className={`${card} flex items-center justify-between px-3 py-2`}>
              <span className="text-sm text-ink">{nomeCriterio(r.criterioId)}</span>
              <span className="flex items-center gap-2">
                {r.livelloMedio != null ? (
                  <span className="rounded-md bg-accent px-2 py-0.5 text-sm font-bold text-[#1A1A1A]">
                    liv. {r.livelloMedio}
                  </span>
                ) : (
                  <span className="text-xs text-muted">non osservato</span>
                )}
                <span className="text-xs text-muted">{r.numOsservazioni} oss.</span>
              </span>
            </div>
          ))}
        </div>

        <p className="mb-3 text-xs text-muted">
          Livelli suggeriti dalle osservazioni raccolte. Le celle vuote non sono mai riempite
          d&apos;ufficio: correggile o completale con un tocco.
        </p>
        {classe ? (
          <GrigliaValutazione
            attivita={attivita}
            classe={classe}
            celle={celle}
            override={override}
            onSetLivello={setLivello}
          />
        ) : (
          <p className="text-muted">Nessuna classe collegata: griglia non disponibile.</p>
        )}
      </section>

      {/* Voti e note di classe */}
      <section className="mt-8 print-break">
        <h2 className="mb-2 font-head text-lg font-bold text-ink">Voti e note della classe</h2>
        {votiClasse.length === 0 && noteVocali.length === 0 ? (
          <p className="text-sm text-muted">Nessuna valutazione di classe raccolta.</p>
        ) : (
          <>
            {votiClasse.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {votiClasse.map((c) => (
                  <li key={c.id} className={`${card} flex items-center gap-2 px-3 py-1.5 text-sm text-ink`}>
                    <span className="text-muted">{c.step} ·</span> {c.label}
                    <span className="rounded-md bg-accent px-1.5 text-xs font-bold text-[#1A1A1A]">
                      {c.valore}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {noteVocali.length > 0 && (
              <ul className="mt-3 space-y-1">
                {noteVocali.map((a) => (
                  <li key={a.id} className={`${card} px-3 py-2 text-sm text-ink`}>
                    🎤 {a.contenuto}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      {/* Note per alunno */}
      <section className="mt-8 print-break">
        <h2 className="mb-2 font-head text-lg font-bold text-ink">Note per alunno</h2>
        {perAlunno.length === 0 ? (
          <p className="text-sm text-muted">Nessuna nota sui singoli alunni.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {perAlunno.map(({ alunno, note }) => (
              <li key={alunno.id} className={`${card} p-3`}>
                <p className="font-head font-bold text-ink">{alunno.nome}</p>
                <ul className="mt-1 space-y-1.5">
                  {note.map((a) => (
                    <li key={a.id} className="text-sm text-ink">
                      <span className="font-semibold text-fai-ink">{nomeStep(a.stepId)}:</span>{" "}
                      {a.tipo === "testo" ? (
                        a.contenuto
                      ) : (
                        <>
                          {nomeOsservabile(a.osservabileId)}{" "}
                          <span className="rounded bg-accent px-1.5 text-xs font-bold text-[#1A1A1A]">
                            {a.valore}
                          </span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Export */}
      <section className="no-print mt-10 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Bottone variante="secondario" onClick={stampaPdf}>
          Esporta PDF
        </Bottone>
        <Bottone
          variante="secondario"
          onClick={() => classe && esportaValutazioneCSV(attivita, classe, celle, override)}
          disabled={!classe}
        >
          CSV valutazione
        </Bottone>
        <Bottone variante="secondario" onClick={() => esportaTempiCSV(attivita, sessione)}>
          CSV tempi
        </Bottone>
      </section>

      {/* Feedback all'autore */}
      <section className={`no-print mt-8 ${card} p-4`}>
        <h2 className="font-head text-lg font-bold text-ink">Migliora il kit</h2>
        <p className="mt-1 text-sm text-muted">
          Vuoi rimandare all&apos;autore i tempi reali e le note come proposta di miglioramento del kit?
        </p>
        {sessione.feedbackInviato ? (
          <p className="mt-3 font-semibold text-capisci-ink">✓ Grazie, feedback registrato.</p>
        ) : (
          <Bottone className="mt-3" onClick={() => patch((s) => ({ ...s, feedbackInviato: true }))}>
            Invia all&apos;autore
          </Bottone>
        )}
        <p className="mt-2 text-xs text-muted">
          (In questa fase il feedback resta salvato in locale: l&apos;invio reale arriverà con il backend.)
        </p>
      </section>
    </main>
  );
}
