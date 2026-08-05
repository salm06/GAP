"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ConduciClient } from "./ConduciClient";

function ConduciInner({ id }: { id: string }) {
  const sessioneId = useSearchParams().get("sessione");
  if (!sessioneId) {
    return (
      <div className="p-6 text-center">
        <p className="text-ink">Manca il riferimento alla sessione.</p>
        <Link href={`/attivita/${id}/prepara`} className="mt-3 inline-block text-fai-ink underline">
          Vai a Prepara
        </Link>
      </div>
    );
  }
  return <ConduciClient sessioneId={sessioneId} />;
}

export function ConduciEntry({ id }: { id: string }) {
  return (
    <Suspense fallback={<p className="p-6 text-center text-muted">Carico…</p>}>
      <ConduciInner id={id} />
    </Suspense>
  );
}
