"use client";

import { useEffect } from "react";

/** Registra il service worker generato da Serwist (solo in produzione). */
export function useServiceWorker() {
  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline non disponibile, l'app funziona comunque online */
    });
  }, []);
}
