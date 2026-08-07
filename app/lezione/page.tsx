import { LezioneEntry } from "@/components/lezione/LezioneEntry";

// Route statica: l'attività è identificata dal query param ?id=… (letto lato
// client da IndexedDB). Così funziona anche con le attività create dal docente,
// che non esistono a build-time (compatibile con output: export).
export default function LezionePage() {
  return <LezioneEntry />;
}
