"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Attivita, Elasticita, Fase, Materiale, Step, UdaMateria } from "@/lib/types";
import { repository, nuovoIdAttivita } from "@/lib/repository";
import { materieUda } from "@/lib/uda";
import { PECUP_COMPETENZE } from "@/lib/pecup";
import { NOME_FASE } from "@/lib/fasi";
import { Logo } from "@/components/comune/Logo";
import { Icona } from "@/components/comune/Icona";

// ---------------------------------------------------------------------------
// Bozza: gli stessi dati dell'Attivita ma "grezzi" dai form (numeri come stringa,
// domande/aiuti come testo multilinea). Alla fine si costruisce l'Attivita.
// ---------------------------------------------------------------------------
type MaterialeBozza = { id: string; descrizione: string; tipo: Materiale["tipo"]; critico: boolean; link: string };
type UdaBozza = { id: string; materia: string; come: string };
type StepBozza = {
  id: string;
  titolo: string;
  fase: Fase;
  azione: string;
  durataMin: string;
  elasticita: Elasticita;
  minutiRecuperabili: string;
  neuro: string;
  adattamentoBes: string;
  domande: string; // una per riga
  aiuti: string; // una per riga
  fallback: string;
};
type Bozza = {
  titolo: string;
  descrizione: string;
  obiettivo: string;
  materia: string;
  ordineScuola: string;
  metodologia: string;
  creatore: string;
  immagine: string;
  competenzeIds: string[];
  uda: UdaBozza[];
  materiali: MaterialeBozza[];
  step: StepBozza[];
};

const rid = () => Math.random().toString(36).slice(2, 9);
const righe = (t: string) =>
  t.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);

const nuovoMateriale = (): MaterialeBozza => ({
  id: rid(),
  descrizione: "",
  tipo: "fisico",
  critico: false,
  link: "",
});
const nuovaUda = (): UdaBozza => ({ id: rid(), materia: "", come: "" });
const nuovoStep = (): StepBozza => ({
  id: rid(),
  titolo: "",
  fase: "pensa",
  azione: "",
  durataMin: "10",
  elasticita: "comprimibile",
  minutiRecuperabili: "0",
  neuro: "",
  adattamentoBes: "",
  domande: "",
  aiuti: "",
  fallback: "",
});

const BOZZA_VUOTA: Bozza = {
  titolo: "",
  descrizione: "",
  obiettivo: "",
  materia: "",
  ordineScuola: "",
  metodologia: "",
  creatore: "",
  immagine: "",
  competenzeIds: [],
  uda: [],
  materiali: [],
  step: [nuovoStep()],
};

// Attivita esistente → bozza per il form (per la modalità modifica).
function toBozza(a: Attivita): Bozza {
  return {
    titolo: a.titolo,
    descrizione: a.descrizione ?? "",
    obiettivo: a.obiettivo ?? "",
    materia: a.materia,
    ordineScuola: a.ordineScuola ?? "",
    metodologia: a.metodologia,
    creatore: a.creatore ?? "",
    immagine: a.immagine ?? "",
    competenzeIds: a.griglia.criteri.map((c) => c.id),
    uda: (a.uda && a.uda.length ? a.uda : materieUda(a.possibileUdaCon)).map((u) => ({
      id: rid(),
      materia: u.materia,
      come: u.come,
    })),
    materiali: a.materialiNecessari.map((m) => ({
      id: m.id,
      descrizione: m.descrizione,
      tipo: m.tipo,
      critico: m.critico,
      link: m.link ?? "",
    })),
    step: a.step.map((s) => ({
      id: s.id,
      titolo: s.titolo,
      fase: s.fase,
      azione: s.azione,
      durataMin: String(s.durataMin),
      elasticita: s.elasticita,
      minutiRecuperabili: String(s.minutiRecuperabili),
      neuro: s.neuro ?? "",
      adattamentoBes: s.adattamentoBes ?? "",
      domande: (s.domande ?? []).join("\n"),
      aiuti: (s.aiuti ?? []).join("\n"),
      fallback: s.fallback ?? "",
    })),
  };
}

const PASSI = ["Generale", "Competenze", "Materiali", "Step della lezione", "Riepilogo"];
// Metodologie didattiche innovative (fonte: orizzontescuola.it, mini-guida
// "dal Debate al Metodo Jigsaw") + Design Thinking. Ordinate alfabeticamente;
// l'ultima opzione "Altro" apre un campo libero.
const METODOLOGIE = [
  "Aule disciplinari",
  "Circle Time",
  "Cooperative Learning",
  "Debate",
  "Design Thinking",
  "Didattica Digitale Integrata",
  "Didattica Laboratoriale",
  "Didattica per Scenari",
  "Digital Storytelling",
  "Episodi di Apprendimento Situato (EAS)",
  "Flipped Classroom",
  "Game-Based Learning (GBL)",
  "Gamification",
  "Inquiry-Based Science Education (IBSE)",
  "Lezione Segmentata",
  "Make Learning and Thinking Visible (MLTV)",
  "Making",
  "Metodo Jigsaw",
  "Microlearning",
  "Outdoor Education",
  "Peer Education",
  "Problem Solving",
  "Project Based Learning (PBL)",
  "Role Play",
  "Service Learning",
  "Storytelling",
  "TEAL",
  "Tinkering",
  "Writing and Reading Workshop",
].sort((a, b) => a.localeCompare(b, "it"));
const FASI: Fase[] = ["setup", "pensa", "fai", "capisci"];
const ELASTICITA: Elasticita[] = ["essenziale", "comprimibile", "tagliabile"];
const TIPI: Materiale["tipo"][] = ["fisico", "digitale", "tecnico"];

const inputCls =
  "min-h-tap w-full rounded-xl border border-panel-line bg-white px-3 py-2 text-base text-ink placeholder:text-muted";
const selectCls =
  "min-h-tap w-full rounded-xl border border-panel-line bg-white px-3 py-2 text-base font-semibold text-ink";
const card = "rounded-2xl border border-panel-line bg-surface";

function Campo({
  label,
  hint,
  obbligatorio,
  children,
}: {
  label: string;
  hint?: string;
  obbligatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-ink">
        {label} {obbligatorio && <span className="text-fai-ink">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function CreaClient({ attivitaId }: { attivitaId?: string }) {
  const router = useRouter();
  const modifica = !!attivitaId;
  const [passo, setPasso] = useState(0);
  const [b, setB] = useState<Bozza>(BOZZA_VUOTA);
  const [salvando, setSalvando] = useState(false);
  const [caricamento, setCaricamento] = useState(modifica);
  const originale = useRef<Attivita | null>(null);
  const [stepDettagli, setStepDettagli] = useState<Set<string>>(new Set());
  const [metodoAltro, setMetodoAltro] = useState(false);

  // Modalità modifica: carica l'attività esistente e prefilla il form.
  useEffect(() => {
    if (!attivitaId) return;
    let vivo = true;
    (async () => {
      const a = await repository.getAttivita(attivitaId);
      if (!vivo) return;
      if (a) {
        originale.current = a;
        setB(toBozza(a));
        setMetodoAltro(!METODOLOGIE.includes(a.metodologia));
      }
      setCaricamento(false);
    })();
    return () => {
      vivo = false;
    };
  }, [attivitaId]);

  const set = <K extends keyof Bozza>(k: K, v: Bozza[K]) => setB((p) => ({ ...p, [k]: v }));

  // --- competenze ---
  const toggleComp = (id: string) =>
    setB((p) => ({
      ...p,
      competenzeIds: p.competenzeIds.includes(id)
        ? p.competenzeIds.filter((x) => x !== id)
        : [...p.competenzeIds, id],
    }));

  // --- materiali ---
  const aggiornaMat = (id: string, patch: Partial<MaterialeBozza>) =>
    setB((p) => ({ ...p, materiali: p.materiali.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  const rimuoviMat = (id: string) =>
    setB((p) => ({ ...p, materiali: p.materiali.filter((m) => m.id !== id) }));

  // --- UDA (materie collegabili) ---
  const aggiornaUda = (id: string, patch: Partial<UdaBozza>) =>
    setB((p) => ({ ...p, uda: p.uda.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
  const rimuoviUda = (id: string) =>
    setB((p) => ({ ...p, uda: p.uda.filter((u) => u.id !== id) }));

  // --- immagine di copertina: da file (data URL) o da link ---
  const caricaImmagine = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("immagine", String(reader.result));
    reader.readAsDataURL(file);
  };

  // --- step ---
  const aggiornaStep = (id: string, patch: Partial<StepBozza>) =>
    setB((p) => ({ ...p, step: p.step.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  const rimuoviStep = (id: string) =>
    setB((p) => ({ ...p, step: p.step.filter((s) => s.id !== id) }));
  const spostaStep = (id: string, dir: -1 | 1) =>
    setB((p) => {
      const i = p.step.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.step.length) return p;
      const step = [...p.step];
      [step[i], step[j]] = [step[j], step[i]];
      return { ...p, step };
    });
  const toggleDettagli = (id: string) =>
    setStepDettagli((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const durataTot = b.step.reduce((a, s) => a + (Number(s.durataMin) || 0), 0);

  const valido = (p: number): boolean => {
    if (p === 0) return !!(b.titolo.trim() && b.materia.trim() && b.metodologia.trim());
    if (p === 1) return b.competenzeIds.length > 0;
    if (p === 3)
      return (
        b.step.length > 0 &&
        b.step.every((s) => s.titolo.trim() && s.azione.trim() && Number(s.durataMin) > 0)
      );
    return true; // materiali (2) e riepilogo (4) non hanno vincoli
  };

  const salva = async () => {
    if (salvando) return;
    setSalvando(true);
    try {
      const step: Step[] = b.step.map((s) => ({
        id: s.id,
        titolo: s.titolo.trim(),
        fase: s.fase,
        azione: s.azione.trim(),
        durataMin: Number(s.durataMin) || 0,
        elasticita: s.elasticita,
        minutiRecuperabili: Number(s.minutiRecuperabili) || 0,
        osservabili: [],
        ...(s.neuro.trim() ? { neuro: s.neuro.trim() } : {}),
        ...(s.adattamentoBes.trim() ? { adattamentoBes: s.adattamentoBes.trim() } : {}),
        ...(righe(s.domande).length ? { domande: righe(s.domande) } : {}),
        ...(righe(s.aiuti).length ? { aiuti: righe(s.aiuti) } : {}),
        ...(s.fallback.trim() ? { fallback: s.fallback.trim() } : {}),
      }));
      const materiali: Materiale[] = b.materiali
        .filter((m) => m.descrizione.trim())
        .map((m) => ({
          id: m.id,
          descrizione: m.descrizione.trim(),
          tipo: m.tipo,
          critico: m.critico,
          ...(m.link.trim() ? { link: m.link.trim() } : {}),
        }));
      const criteri = PECUP_COMPETENZE.filter((c) => b.competenzeIds.includes(c.id));
      const uda: UdaMateria[] = b.uda
        .filter((u) => u.materia.trim())
        .map((u) => ({ materia: u.materia.trim(), come: u.come.trim() }));
      const attivita: Attivita = {
        id: attivitaId ?? nuovoIdAttivita(),
        titolo: b.titolo.trim(),
        materia: b.materia.trim(),
        metodologia: b.metodologia.trim(),
        durataTotaleMin: durataTot,
        materialiNecessari: materiali,
        step,
        griglia: { criteri },
        ...(b.descrizione.trim() ? { descrizione: b.descrizione.trim() } : {}),
        ...(b.obiettivo.trim() ? { obiettivo: b.obiettivo.trim() } : {}),
        ...(b.ordineScuola.trim() ? { ordineScuola: b.ordineScuola.trim() } : {}),
        ...(b.creatore.trim() ? { creatore: b.creatore.trim() } : {}),
        ...(uda.length ? { uda } : {}),
        ...(b.immagine.trim() ? { immagine: b.immagine.trim() } : {}),
        // campi non gestiti dal form: preservali in modifica
        ...(originale.current?.voto != null ? { voto: originale.current.voto } : {}),
        ...(originale.current?.presentazione ? { presentazione: originale.current.presentazione } : {}),
      };
      await repository.saveAttivita(attivita);
      router.push(`/lezione?id=${attivita.id}`);
    } catch {
      setSalvando(false);
    }
  };

  if (caricamento) return <p className="p-6 text-center text-muted">Carico l’attività…</p>;

  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      {/* Nav + progresso */}
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-fai-ink underline">
          ← Le tue attività
        </Link>
        <Logo altezza={24} chip />
      </div>

      <h1 className="font-head text-3xl font-black leading-tight text-ink sm:text-4xl">
        {modifica ? "Modifica attività" : "Crea una nuova attività"}
      </h1>
      <p className="mt-1 text-muted">
        Passo {passo + 1} di {PASSI.length} · <span className="font-semibold text-ink">{PASSI[passo]}</span>
      </p>
      <div className="mt-3 flex gap-1.5">
        {PASSI.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= passo ? "bg-accent" : "bg-panel"}`}
          />
        ))}
      </div>

      <div className="mt-6">
        {passo === 0 && (
          <div className="space-y-4">
            <Campo label="Titolo" obbligatorio>
              <input
                className={inputCls}
                value={b.titolo}
                onChange={(e) => set("titolo", e.target.value)}
                placeholder="Es. Ulisse a fumetti — Inferno XXVI"
              />
            </Campo>
            <Campo label="Descrizione breve" hint="Una frase che compare sotto il titolo nelle card.">
              <textarea
                className={inputCls}
                rows={2}
                value={b.descrizione}
                onChange={(e) => set("descrizione", e.target.value)}
                placeholder="Di cosa parla l'attività, in poche righe."
              />
            </Campo>
            <Campo label="Obiettivo" hint="Cosa deve raggiungere la classe con questa attività.">
              <textarea
                className={inputCls}
                rows={2}
                value={b.obiettivo}
                onChange={(e) => set("obiettivo", e.target.value)}
                placeholder="Es. Trasformare l'episodio in una striscia a fumetti cogliendone il senso."
              />
            </Campo>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo label="Materia" obbligatorio>
                <input
                  className={inputCls}
                  value={b.materia}
                  onChange={(e) => set("materia", e.target.value)}
                  placeholder="Es. Italiano"
                />
              </Campo>
              <Campo label="Ordine di scuola">
                <input
                  className={inputCls}
                  value={b.ordineScuola}
                  onChange={(e) => set("ordineScuola", e.target.value)}
                  placeholder="Es. Secondaria II grado"
                />
              </Campo>
              <Campo label="Metodologia" obbligatorio>
                <select
                  className={selectCls}
                  value={metodoAltro ? "__altro__" : b.metodologia}
                  onChange={(e) => {
                    if (e.target.value === "__altro__") {
                      setMetodoAltro(true);
                      set("metodologia", "");
                    } else {
                      setMetodoAltro(false);
                      set("metodologia", e.target.value);
                    }
                  }}
                >
                  <option value="" disabled>
                    Scegli una metodologia…
                  </option>
                  {METODOLOGIE.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  <option value="__altro__">Altro…</option>
                </select>
                {metodoAltro && (
                  <input
                    className={`${inputCls} mt-2`}
                    value={b.metodologia}
                    onChange={(e) => set("metodologia", e.target.value)}
                    placeholder="Scrivi la metodologia"
                  />
                )}
              </Campo>
              <Campo label="Creato da" hint="Il tuo nome o quello della scuola.">
                <input
                  className={inputCls}
                  value={b.creatore}
                  onChange={(e) => set("creatore", e.target.value)}
                  placeholder="Es. Prof.ssa Rossi"
                />
              </Campo>
            </div>
            {/* UDA: materie collegabili, ciascuna con una descrizione */}
            <div>
              <p className="text-sm font-bold text-ink">Possibile UDA con</p>
              <p className="mb-2 text-xs text-muted">
                Materie con cui costruire un’unità interdisciplinare e come possono trattare
                l’argomento per questa attività.
              </p>
              <div className="space-y-2">
                {b.uda.map((u) => (
                  <div key={u.id} className={`${card} p-3`}>
                    <div className="flex items-center gap-2">
                      <input
                        className={inputCls}
                        value={u.materia}
                        onChange={(e) => aggiornaUda(u.id, { materia: e.target.value })}
                        placeholder="Materia (es. Arte)"
                      />
                      <button
                        type="button"
                        onClick={() => rimuoviUda(u.id)}
                        aria-label="Rimuovi materia"
                        className="min-h-tap shrink-0 rounded-xl border border-panel-line px-3 text-sm font-semibold text-fai-ink active:bg-black/5"
                      >
                        ✕
                      </button>
                    </div>
                    <textarea
                      className={`${inputCls} mt-2`}
                      rows={2}
                      value={u.come}
                      onChange={(e) => aggiornaUda(u.id, { come: e.target.value })}
                      placeholder="Come può integrarsi in questa attività…"
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => set("uda", [...b.uda, nuovaUda()])}
                className="mt-2 min-h-tap w-full rounded-xl border border-dashed border-panel-line px-4 py-2 text-sm font-bold text-ink active:bg-black/5"
              >
                + Aggiungi materia
              </button>
            </div>

            {/* Immagine di copertina: da file (data URL) o da link */}
            <Campo
              label="Immagine di copertina"
              hint="Facoltativa: carica un file dal PC oppure incolla un link."
            >
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex min-h-tap cursor-pointer items-center gap-1.5 rounded-xl border border-panel-line bg-white px-3 text-sm font-semibold text-ink active:bg-black/5">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => caricaImmagine(e.target.files?.[0] ?? null)}
                  />
                  <Icona nome="scarica" size={14} /> Carica dal PC
                </label>
                <input
                  className={`${inputCls} flex-1`}
                  value={b.immagine.startsWith("data:") ? "" : b.immagine}
                  onChange={(e) => set("immagine", e.target.value)}
                  placeholder="oppure incolla un link/URL"
                />
              </div>
              {b.immagine && (
                <div className="mt-2 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.immagine} alt="" className="h-16 w-28 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => set("immagine", "")}
                    className="text-sm font-semibold text-fai-ink underline"
                  >
                    Rimuovi
                  </button>
                </div>
              )}
            </Campo>
          </div>
        )}

        {passo === 1 && (
          <div>
            <p className="mb-3 text-sm text-muted">
              Scegli le competenze PECUP che l’attività fa esercitare: diventeranno la griglia di
              valutazione (da A a E). Selezionane almeno una.
            </p>
            <ul className="space-y-2">
              {PECUP_COMPETENZE.map((c) => {
                const on = b.competenzeIds.includes(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => toggleComp(c.id)}
                      aria-pressed={on}
                      className={[
                        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                        on ? "border-accent bg-accent/10" : "border-panel-line bg-surface active:bg-black/5",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                          on ? "border-accent bg-accent text-[#1A1A1A]" : "border-panel-line bg-surface text-transparent",
                        ].join(" ")}
                        aria-hidden
                      >
                        <Icona nome="check" size={14} />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-head font-bold text-ink">{c.nome}</span>
                        <span className="block text-xs text-muted">{c.competenzaMinisteriale}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-sm text-muted">{b.competenzeIds.length} competenze selezionate.</p>
          </div>
        )}

        {passo === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Elenca i materiali che servono per l’attività. Segna come «necessario» quelli senza cui
              non si può iniziare. Sezione facoltativa.
            </p>
            {b.materiali.map((m) => (
              <div key={m.id} className={`${card} p-3`}>
                <div className="flex items-start gap-2">
                  <input
                    className={inputCls}
                    value={m.descrizione}
                    onChange={(e) => aggiornaMat(m.id, { descrizione: e.target.value })}
                    placeholder="Es. Fogli A3 e matite (uno per gruppo)"
                  />
                  <button
                    type="button"
                    onClick={() => rimuoviMat(m.id)}
                    aria-label="Rimuovi materiale"
                    className="min-h-tap shrink-0 rounded-xl border border-panel-line px-3 text-sm font-semibold text-fai-ink active:bg-black/5"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <select
                    className="min-h-tap rounded-xl border border-panel-line bg-white px-3 text-sm font-semibold text-ink"
                    value={m.tipo}
                    onChange={(e) => aggiornaMat(m.id, { tipo: e.target.value as Materiale["tipo"] })}
                  >
                    {TIPI.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={m.critico}
                      onChange={(e) => aggiornaMat(m.id, { critico: e.target.checked })}
                      className="h-4 w-4 accent-[#1A1A1A]"
                    />
                    Necessario
                  </label>
                  <input
                    className="min-h-tap flex-1 rounded-xl border border-panel-line bg-white px-3 text-sm text-ink"
                    value={m.link}
                    onChange={(e) => aggiornaMat(m.id, { link: e.target.value })}
                    placeholder="Link (facoltativo)"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set("materiali", [...b.materiali, nuovoMateriale()])}
              className="min-h-tap w-full rounded-xl border border-dashed border-panel-line px-4 py-2 text-sm font-bold text-ink active:bg-black/5"
            >
              + Aggiungi materiale
            </button>
          </div>
        )}

        {passo === 3 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">
                Gli step in ordine: cosa fa il docente, quanto dura, quanto è comprimibile.
              </p>
              <span className="shrink-0 rounded-full bg-panel px-2.5 py-0.5 text-xs font-bold text-muted">
                {b.step.length} step · {durataTot}′
              </span>
            </div>
            {b.step.map((s, i) => {
              const aperto = stepDettagli.has(s.id);
              return (
                <div key={s.id} className={`${card} p-3`}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-head text-sm font-bold text-ink">Step {i + 1}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => spostaStep(s.id, -1)}
                        disabled={i === 0}
                        aria-label="Sposta su"
                        className="min-h-tap rounded-lg border border-panel-line px-2 text-sm text-ink disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => spostaStep(s.id, 1)}
                        disabled={i === b.step.length - 1}
                        aria-label="Sposta giù"
                        className="min-h-tap rounded-lg border border-panel-line px-2 text-sm text-ink disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => rimuoviStep(s.id)}
                        disabled={b.step.length <= 1}
                        aria-label="Rimuovi step"
                        className="min-h-tap rounded-lg border border-panel-line px-2 text-sm font-semibold text-fai-ink disabled:opacity-30"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Campo label="Titolo dello step" obbligatorio>
                      <input
                        className={inputCls}
                        value={s.titolo}
                        onChange={(e) => aggiornaStep(s.id, { titolo: e.target.value })}
                        placeholder="Es. Aggancio"
                      />
                    </Campo>
                    <Campo label="Azione (cosa fa il docente)" obbligatorio>
                      <textarea
                        className={inputCls}
                        rows={2}
                        value={s.azione}
                        onChange={(e) => aggiornaStep(s.id, { azione: e.target.value })}
                        placeholder="L'istruzione operativa dello step."
                      />
                    </Campo>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <Campo label="Fase">
                        <select
                          className={selectCls}
                          value={s.fase}
                          onChange={(e) => aggiornaStep(s.id, { fase: e.target.value as Fase })}
                        >
                          {FASI.map((f) => (
                            <option key={f} value={f}>
                              {NOME_FASE[f]}
                            </option>
                          ))}
                        </select>
                      </Campo>
                      <Campo label="Durata (min)" obbligatorio>
                        <input
                          type="number"
                          min={1}
                          className={inputCls}
                          value={s.durataMin}
                          onChange={(e) => aggiornaStep(s.id, { durataMin: e.target.value })}
                        />
                      </Campo>
                      <Campo label="Elasticità">
                        <select
                          className={selectCls}
                          value={s.elasticita}
                          onChange={(e) => aggiornaStep(s.id, { elasticita: e.target.value as Elasticita })}
                        >
                          {ELASTICITA.map((el) => (
                            <option key={el} value={el}>
                              {el}
                            </option>
                          ))}
                        </select>
                      </Campo>
                      <Campo label="Recuperabili (min)">
                        <input
                          type="number"
                          min={0}
                          className={inputCls}
                          value={s.minutiRecuperabili}
                          onChange={(e) => aggiornaStep(s.id, { minutiRecuperabili: e.target.value })}
                        />
                      </Campo>
                    </div>

                    <Campo label="Domande guida" hint="Le domande da porre alla classe, una per riga.">
                      <textarea
                        className={inputCls}
                        rows={2}
                        value={s.domande}
                        onChange={(e) => aggiornaStep(s.id, { domande: e.target.value })}
                        placeholder={"Chi era Ulisse per voi?\nChe cos'è la sete di conoscenza?"}
                      />
                    </Campo>
                    <Campo
                      label="Se la classe si blocca"
                      hint="Suggerimenti/aiuti per sbloccare, uno per riga."
                    >
                      <textarea
                        className={inputCls}
                        rows={2}
                        value={s.aiuti}
                        onChange={(e) => aggiornaStep(s.id, { aiuti: e.target.value })}
                        placeholder={"Se nessuno risponde, parti tu con un esempio.\nAccetta anche risposte imperfette."}
                      />
                    </Campo>

                    <button
                      type="button"
                      onClick={() => toggleDettagli(s.id)}
                      aria-expanded={aperto}
                      className="text-sm font-bold text-accent-ink"
                    >
                      {aperto ? "− Nascondi dettagli" : "+ Dettagli (facoltativi)"}
                    </button>
                    {aperto && (
                      <div className="space-y-3 rounded-xl bg-panel p-3">
                        <Campo label="Adattamento BES/DSA">
                          <textarea
                            className={inputCls}
                            rows={2}
                            value={s.adattamentoBes}
                            onChange={(e) => aggiornaStep(s.id, { adattamentoBes: e.target.value })}
                          />
                        </Campo>
                        <Campo label="Spunto di neurodidattica">
                          <textarea
                            className={inputCls}
                            rows={2}
                            value={s.neuro}
                            onChange={(e) => aggiornaStep(s.id, { neuro: e.target.value })}
                          />
                        </Campo>
                        <Campo label="Fallback (se la tecnologia non funziona)">
                          <textarea
                            className={inputCls}
                            rows={2}
                            value={s.fallback}
                            onChange={(e) => aggiornaStep(s.id, { fallback: e.target.value })}
                          />
                        </Campo>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => set("step", [...b.step, nuovoStep()])}
              className="min-h-tap w-full rounded-xl border border-dashed border-panel-line px-4 py-2 text-sm font-bold text-ink active:bg-black/5"
            >
              + Aggiungi step
            </button>
          </div>
        )}

        {passo === 4 && (
          <div className="space-y-3">
            <p className="text-sm text-muted">Controlla e crea l’attività.</p>
            <div className={`${card} p-4`}>
              <p className="font-head text-xl font-extrabold text-ink">{b.titolo || "Senza titolo"}</p>
              {b.descrizione && <p className="mt-1 text-sm text-muted">{b.descrizione}</p>}
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                {[
                  ["Materia", b.materia || "—"],
                  ["Metodologia", b.metodologia || "—"],
                  ["Durata", `${durataTot}′`],
                  ["Step", `${b.step.length}`],
                  ["Competenze", `${b.competenzeIds.length}`],
                  ["Materiali", `${b.materiali.filter((m) => m.descrizione.trim()).length}`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-panel px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</p>
                    <p className="font-head font-bold text-ink">{v}</p>
                  </div>
                ))}
              </div>
              {b.competenzeIds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {PECUP_COMPETENZE.filter((c) => b.competenzeIds.includes(c.id)).map((c) => (
                    <span
                      key={c.id}
                      className="rounded-full border border-accent bg-white px-2 py-0.5 text-xs font-bold text-accent-ink"
                    >
                      {c.nome}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted">
              L’attività verrà salvata sul tuo dispositivo e comparirà tra «Le tue attività». Potrai
              condurla o rivederla come le altre.
            </p>
          </div>
        )}
      </div>

      {/* Barra di navigazione fissa */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="pointer-events-auto mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-panel-line bg-surface p-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <button
            type="button"
            onClick={() => (passo === 0 ? router.push("/") : setPasso((p) => p - 1))}
            className="min-h-tap rounded-xl border border-panel-line px-4 text-sm font-semibold text-ink active:bg-black/5"
          >
            {passo === 0 ? "Annulla" : "Indietro"}
          </button>
          <div className="min-w-0 flex-1 text-center text-xs text-muted">
            {!valido(passo) &&
              (passo === 0
                ? "Compila titolo, materia e metodologia"
                : passo === 1
                  ? "Seleziona almeno una competenza"
                  : passo === 3
                    ? "Ogni step vuole titolo, azione e durata"
                    : "")}
          </div>
          {passo < PASSI.length - 1 ? (
            <button
              type="button"
              onClick={() => valido(passo) && setPasso((p) => p + 1)}
              disabled={!valido(passo)}
              className="min-h-tap rounded-xl bg-accent px-5 text-sm font-bold text-[#1A1A1A] active:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Avanti
            </button>
          ) : (
            <button
              type="button"
              onClick={salva}
              disabled={salvando || !valido(0) || !valido(1) || !valido(3)}
              className="min-h-tap rounded-xl bg-accent px-5 text-sm font-bold text-[#1A1A1A] active:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {salvando
                ? modifica
                  ? "Salvo…"
                  : "Creo…"
                : modifica
                  ? "Salva modifiche"
                  : "Crea attività"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
