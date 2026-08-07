// ============================================================================
// Le 12 competenze PECUP di area generale (D.Lgs 61/2017), selezionabili in fase
// di creazione attività: quelle scelte diventano la griglia di valutazione
// (griglia.criteri), valutate da A a E. `nome` è l'etichetta breve per la UI,
// `competenzaMinisteriale` è il testo integrale della competenza.
// ============================================================================

import type { Criterio } from "./types";

export const PECUP_COMPETENZE: Criterio[] = [
  {
    id: "pecup-01",
    nome: "Valori e cittadinanza",
    competenzaMinisteriale:
      "Agire in riferimento ad un sistema di valori, coerenti con i principi della Costituzione, in base ai quali essere in grado di valutare fatti e orientare i propri comportamenti personali, sociali e professionali",
  },
  {
    id: "pecup-02",
    nome: "Lingua italiana",
    competenzaMinisteriale:
      "Utilizzare il patrimonio lessicale ed espressivo della lingua italiana secondo le esigenze comunicative nei vari contesti: sociali, culturali, scientifici, economici, tecnologici e professionali",
  },
  {
    id: "pecup-03",
    nome: "Ambiente e territorio",
    competenzaMinisteriale:
      "Riconoscere gli aspetti geografici, ecologici, territoriali, dell'ambiente naturale ed antropico, le connessioni con le strutture demografiche, economiche, sociali, culturali e le trasformazioni intervenute nel corso del tempo",
  },
  {
    id: "pecup-04",
    nome: "Tradizioni culturali",
    competenzaMinisteriale:
      "Stabilire collegamenti tra le tradizioni culturali locali, nazionali ed internazionali, sia in una prospettiva interculturale sia ai fini della mobilità di studio e di lavoro",
  },
  {
    id: "pecup-05",
    nome: "Lingue straniere",
    competenzaMinisteriale:
      "Utilizzare i linguaggi settoriali delle lingue straniere previste dai percorsi di studio per interagire in diversi ambiti e contesti di studio e di lavoro",
  },
  {
    id: "pecup-06",
    nome: "Beni artistici",
    competenzaMinisteriale: "Riconoscere il valore e le potenzialità dei beni artistici e ambientali",
  },
  {
    id: "pecup-07",
    nome: "Comunicazione visiva e multimediale",
    competenzaMinisteriale:
      "Individuare ed utilizzare le moderne forme di comunicazione visiva e multimediale, anche con riferimento alle strategie espressive e agli strumenti tecnici della comunicazione in rete",
  },
  {
    id: "pecup-08",
    nome: "Strumenti informatici",
    competenzaMinisteriale:
      "Utilizzare le reti e gli strumenti informatici nelle attività di studio, ricerca e approfondimento",
  },
  {
    id: "pecup-09",
    nome: "Espressività corporea e sport",
    competenzaMinisteriale:
      "Riconoscere i principali aspetti comunicativi, culturali e relazionali dell'espressività corporea ed esercitare in modo efficace la pratica sportiva per il benessere individuale e collettivo",
  },
  {
    id: "pecup-10",
    nome: "Economia e processi",
    competenzaMinisteriale:
      "Comprendere e utilizzare i principali concetti relativi all'economia, all'organizzazione, allo svolgimento dei processi produttivi e dei servizi",
  },
  {
    id: "pecup-11",
    nome: "Tutela della persona e sicurezza",
    competenzaMinisteriale:
      "Padroneggiare l'uso di strumenti tecnologici con particolare attenzione alla sicurezza e alla tutela della salute nei luoghi di vita e di lavoro, alla tutela della persona, dell'ambiente e del territorio",
  },
  {
    id: "pecup-12",
    nome: "Assi culturali applicati",
    competenzaMinisteriale:
      "Utilizzare i concetti e i fondamentali strumenti degli assi culturali per comprendere la realtà ed operare in campi applicativi",
  },
];
