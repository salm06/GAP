"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { repository } from "@/lib/repository";
import type { Attivita, Classe, Sessione } from "@/lib/types";

type Stato = {
  sessione: Sessione | null;
  attivita: Attivita | null;
  classe: Classe | null;
  caricamento: boolean;
};

/**
 * Carica una sessione (con la sua attività e classe) e ne persiste ogni
 * modifica su IndexedDB. La persistenza è immediata: se il telefono si blocca
 * o l'app viene chiusa, lo stato è già salvato → ripresa esatta.
 */
export function useSessione(sessioneId: string | null) {
  const [stato, setStato] = useState<Stato>({
    sessione: null,
    attivita: null,
    classe: null,
    caricamento: true,
  });
  const sessioneRef = useRef<Sessione | null>(null);

  useEffect(() => {
    let vivo = true;
    if (!sessioneId) {
      setStato({ sessione: null, attivita: null, classe: null, caricamento: false });
      return;
    }
    (async () => {
      const sessione = await repository.getSessione(sessioneId);
      if (!sessione) {
        if (vivo) setStato({ sessione: null, attivita: null, classe: null, caricamento: false });
        return;
      }
      const [attivita, classe] = await Promise.all([
        repository.getAttivita(sessione.attivitaId),
        sessione.classeId ? repository.getClasse(sessione.classeId) : Promise.resolve(null),
      ]);
      sessioneRef.current = sessione;
      if (vivo) setStato({ sessione, attivita, classe, caricamento: false });
    })();
    return () => {
      vivo = false;
    };
  }, [sessioneId]);

  /** Applica un aggiornamento immutabile alla sessione e lo salva subito. */
  const patch = useCallback((updater: (s: Sessione) => Sessione) => {
    setStato((prev) => {
      if (!prev.sessione) return prev;
      const nuova = updater(prev.sessione);
      sessioneRef.current = nuova;
      // persistenza fire-and-forget (Dexie serializza le scritture in ordine)
      void repository.aggiornaSessione(nuova);
      return { ...prev, sessione: nuova };
    });
  }, []);

  return { ...stato, patch };
}
