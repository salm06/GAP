"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CreaClient } from "./CreaClient";

function CreaInner() {
  const id = useSearchParams().get("id");
  return <CreaClient attivitaId={id ?? undefined} />;
}

export function CreaEntry() {
  return (
    <Suspense fallback={<p className="p-6 text-center text-muted">Carico…</p>}>
      <CreaInner />
    </Suspense>
  );
}
