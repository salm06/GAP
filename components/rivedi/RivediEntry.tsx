"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { RivediClient } from "./RivediClient";

function RivediInner({ id }: { id: string }) {
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
  return <RivediClient sessioneId={sessioneId} />;
}

export function RivediEntry({ id }: { id: string }) {
  return (
    <Suspense fallback={<p className="p-6 text-center text-muted">Carico…</p>}>
      <RivediInner id={id} />
    </Suspense>
  );
}
