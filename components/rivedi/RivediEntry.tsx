"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { RivediClient } from "./RivediClient";

function RivediInner() {
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
  return <RivediClient sessioneId={sessioneId} />;
}

export function RivediEntry() {
  return (
    <Suspense fallback={<p className="p-6 text-center text-muted">Carico…</p>}>
      <RivediInner />
    </Suspense>
  );
}
