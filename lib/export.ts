// ============================================================================
// Export dei risultati: CSV (dati) e PDF (stampa del browser).
// Decisione: il PDF è ottenuto via window.print() su una vista con stili di
// stampa dedicati — nessuna dipendenza pesante, funziona offline.
// ============================================================================

import type { Attivita, CellaValutazione, Classe, Sessione } from "./types";
import { durataEffettivaStep } from "./tempo";

function scaricaFile(nome: string, contenuto: string, mime: string) {
  const blob = new Blob([contenuto], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvCampo(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Esporta la matrice di valutazione (alunni × criteri) in CSV. */
export function esportaValutazioneCSV(
  attivita: Attivita,
  classe: Classe,
  celle: CellaValutazione[],
  override: Record<string, Record<string, number>> = {}
) {
  const criteri = attivita.griglia.criteri;
  const intestazione = ["Alunno", ...criteri.map((c) => c.nome)];
  const righe = [intestazione.map(csvCampo).join(";")];

  for (const alunno of classe.alunni) {
    const campi: string[] = [csvCampo(alunno.nome)];
    for (const criterio of criteri) {
      const cella = celle.find(
        (x) => x.alunnoId === alunno.id && x.criterioId === criterio.id
      );
      const manuale = override[alunno.id]?.[criterio.id];
      const livello = manuale ?? cella?.livelloSuggerito ?? null;
      const n = cella?.numOsservazioni ?? 0;
      campi.push(csvCampo(livello == null ? "" : `${livello} (${n} oss.)`));
    }
    righe.push(campi.join(";"));
  }

  const nome = `valutazione-${attivita.id}-${new Date().toISOString().slice(0, 10)}.csv`;
  scaricaFile(nome, "﻿" + righe.join("\n"), "text/csv;charset=utf-8");
}

/** Esporta i tempi reali vs previsti in CSV. */
export function esportaTempiCSV(attivita: Attivita, sessione: Sessione) {
  const righe = [["Step", "Previsto (min)", "Reale (min)", "Scostamento (min)"].join(";")];
  for (const step of attivita.step) {
    const t = sessione.tempiReali.find((r) => r.stepId === step.id);
    const previsto = durataEffettivaStep(step, sessione);
    const realeMin = t?.fine ? Math.round((t.fine - t.inizio) / 60000) : null;
    const scost = realeMin == null ? "" : realeMin - previsto;
    righe.push(
      [csvCampo(step.titolo), previsto, csvCampo(realeMin ?? "—"), csvCampo(scost)].join(";")
    );
  }
  const nome = `tempi-${attivita.id}-${new Date().toISOString().slice(0, 10)}.csv`;
  scaricaFile(nome, "﻿" + righe.join("\n"), "text/csv;charset=utf-8");
}

/** Apre la finestra di stampa del browser (→ "Salva come PDF"). */
export function stampaPdf() {
  window.print();
}
