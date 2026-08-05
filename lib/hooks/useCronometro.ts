"use client";

import { useEffect, useState } from "react";

/**
 * Restituisce l'ora corrente (ms) aggiornata a intervalli regolari.
 * Usato per far avanzare cronometri e ricalcolare la deriva senza timer sparsi.
 */
export function useCronometro(intervalloMs = 1000): number {
  const [ora, setOra] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setOra(Date.now()), intervalloMs);
    // aggiornamento immediato al rientro in foreground (schermo riacceso)
    const onVis = () => setOra(Date.now());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [intervalloMs]);
  return ora;
}
