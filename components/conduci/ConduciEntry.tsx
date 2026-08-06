"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ConduciClient } from "./ConduciClient";

function ConduciInner() {
  const sessioneId = useSearchParams().get("sessione");
  if (!sessioneId) {
    return (
      <div className="p-6 text-center">
        <p className="text-ink">Manca il riferimento alla sessione.</p>
        <Link href="/" className="mt-3 inline-block text-fai-ink underline">
          Torna alle attività
        </Link>
      </div>
    );
  }
  return <ConduciClient sessioneId={sessioneId} />;
}

export function ConduciEntry() {
  return (
    <Suspense fallback={<p className="p-6 text-center text-muted">Carico…</p>}>
      <ConduciInner />
    </Suspense>
  );
}
