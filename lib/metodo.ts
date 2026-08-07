// ============================================================================
// Schede dei metodi didattici GAP: il "come" (cos'è il metodo, in breve, con
// riferimento al mazzo di carte per docenti) e il "perché" (principio
// neurodidattico generale, in parole semplici). Contenuto redazionale,
// indicizzato per metodologia; fallback neutro per metodi non ancora descritti.
// ============================================================================

export type SchedaMetodo = {
  come: string; // cos'è il metodo, in breve
  neuro: string; // principio neurodidattico generale, spiegato semplice
  guidaPdf?: string; // PDF con la guida al metodo (path in /public), se disponibile
};

const SCHEDE: Record<string, SchedaMetodo> = {
  "digital storytelling": {
    come: "Il digital storytelling trasforma un contenuto da studiare in una storia che gli studenti costruiscono e raccontano con strumenti digitali — fumetti, immagini, brevi video. Non si impara ripetendo, ma dando forma: si sceglie cosa mostrare, in che ordine e con quali parole. È uno dei metodi del mazzo di carte GAP, pensato per far progettare attività come questa “giocando”: ogni carta è uno spunto pronto da combinare al volo.",
    neuro: "Quando trasformiamo un’idea in un racconto da mostrare agli altri, il cervello la rielabora invece di archiviarla passivamente. L’emozione della narrazione e il dover fare una scelta — cosa disegnare, cosa dire — fissano il ricordo molto più a lungo di una spiegazione solo ascoltata. Raccontare una cosa è, in fondo, capirla due volte.",
    guidaPdf: "/materiali/gap-metodo-digital-storytelling.pdf",
  },
  "design thinking": {
    come: "Il design thinking affronta un problema reale partendo dalle persone: prima si entra nei loro panni (empatia), poi si generano idee, si costruisce un prototipo povero e lo si mette subito alla prova. Gli studenti non studiano una soluzione: la progettano. È uno dei metodi del mazzo di carte GAP, che aiuta i docenti a costruire attività come questa “giocando” con carte-spunto da combinare.",
    neuro: "Toccare, costruire e sbagliare in fretta attivano l’apprendimento molto più dell’ascolto. Mettersi nei panni di un altro accende l’empatia e dà uno scopo concreto: il cervello ricorda meglio ciò che serve a risolvere un problema vero. Correggere un prototipo di cartone vale più di una regola imparata a memoria.",
  },
};

const DEFAULT_SCHEDA: SchedaMetodo = {
  come: "Un metodo attivo del mazzo di carte GAP: gli studenti costruiscono qualcosa di concreto invece di ricevere passivamente i contenuti. Le carte-spunto aiutano il docente a progettare l’attività “giocando”, combinando gli elementi.",
  neuro: "Si ricorda meglio ciò che si fa, non ciò che si ascolta soltanto: dare uno scopo concreto e chiedere di produrre qualcosa impegna l’attenzione e consolida l’apprendimento.",
};

export function schedaMetodo(metodologia: string): SchedaMetodo {
  return SCHEDE[metodologia.trim().toLowerCase()] ?? DEFAULT_SCHEDA;
}
