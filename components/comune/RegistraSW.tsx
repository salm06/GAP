"use client";

import { useServiceWorker } from "@/lib/hooks/useServiceWorker";

/** Componente invisibile: registra il service worker in produzione. */
export function RegistraSW() {
  useServiceWorker();
  return null;
}
