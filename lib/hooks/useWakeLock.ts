"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tiene lo schermo acceso in modalità Conduci (Wake Lock API).
 * Si riattiva automaticamente quando la scheda torna in foreground.
 */
export function useWakeLock(attivo: boolean): { supportato: boolean; attivo: boolean } {
  const sentinel = useRef<WakeLockSentinel | null>(null);
  const [statoAttivo, setStatoAttivo] = useState(false);
  const supportato = typeof navigator !== "undefined" && "wakeLock" in navigator;

  useEffect(() => {
    if (!attivo || !supportato) return;
    let annullato = false;

    const richiedi = async () => {
      try {
        const s = await (navigator as Navigator & {
          wakeLock: { request: (type: "screen") => Promise<WakeLockSentinel> };
        }).wakeLock.request("screen");
        if (annullato) {
          await s.release();
          return;
        }
        sentinel.current = s;
        setStatoAttivo(true);
        s.addEventListener("release", () => setStatoAttivo(false));
      } catch {
        setStatoAttivo(false);
      }
    };

    const onVis = () => {
      if (document.visibilityState === "visible") richiedi();
    };

    richiedi();
    document.addEventListener("visibilitychange", onVis);

    return () => {
      annullato = true;
      document.removeEventListener("visibilitychange", onVis);
      sentinel.current?.release().catch(() => {});
      sentinel.current = null;
      setStatoAttivo(false);
    };
  }, [attivo, supportato]);

  return { supportato, attivo: statoAttivo };
}
