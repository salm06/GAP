"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { LezioneClient } from "./LezioneClient";

function LezioneInner() {
  const attivitaId = useSearchParams().get("id");
  if (!attivitaId) {
    return (
      <div className="p-6 text-center">
        <p className="text-ink">Lezione non trovata.</p>
        <Link href="/" className="mt-3 inline-block text-fai-ink underline">
          Torna alle attività
        </Link>
      </div>
    );
  }
  return <LezioneClient attivitaId={attivitaId} />;
}

export function LezioneEntry() {
  return (
    <Suspense fallback={<p className="p-6 text-center text-muted">Carico…</p>}>
      <LezioneInner />
    </Suspense>
  );
}
