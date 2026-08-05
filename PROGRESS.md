# GAP Player — PROGRESS

Player riutilizzabile per condurre attività didattiche GAP (kit PLUS).
Motore JSON-driven: cambiando `/data/*.attivita.json` funziona con qualsiasi lezione.

## Come si avvia

```bash
npm install
npm run dev          # http://localhost:3000  (service worker disattivato in dev)
npm test             # 19 test su tempo.ts e valutazione.ts
npm run build && npm start   # build di produzione: qui il PWA/offline è attivo
```

Flusso: Home → tocca l'attività → **Prepara** (materiali, classe, orario) →
**Inizia l'attività** → **Conduci** → **Concludi e rivedi** → **Rivedi**.

---

## Stato per fase

| Fase | Contenuto | Stato |
|------|-----------|-------|
| 1 | Tipi, struttura, repository layer, dati seed | ✅ Fatto |
| 2 | Conduci: navigazione step + cronometri | ✅ Fatto |
| 3 | Motore del tempo + banner di deriva | ✅ Fatto |
| 4 | Annota in un tocco (chip classe, chip alunno, vocale) | ✅ Fatto |
| 5 | Prepara (checklist, link, classe, orario) | ✅ Fatto |
| 6 | Rivedi (tempi, note, griglia precompilata, export) | ✅ Fatto |
| 7 | PWA, offline, wake lock, ripresa sessione | ✅ Fatto |
| 8 | Test su deriva e aggregazione valutazioni | ✅ Fatto (19/19) |

### Verificato dal vivo (dev server)
- Home elenca l'attività seed (9 step, 100′).
- Prepara: spunta materiali, selezione classe, orario → tutto persiste in IndexedDB.
- Conduci: azione grande, cronometro step, barra di stato, timeline a 9 segmenti, cosaDico, pulsanti Domande/Aiuti, chip di annotazione.
- Chip di classe: 1° tocco registra (evidenziato), 2° tocco annulla → verificato su IndexedDB.
- `tsc --noEmit` pulito. `npm test` 19/19.

---

## Decisioni prese (correggimi qui)

1. **Stack di supporto**: `dexie` (IndexedDB), `@serwist/next` (PWA/offline), `vitest` (test). Nessuna libreria di componenti UI: tutto scritto a mano con Tailwind. *(Approvato: Dexie al posto di idb.)*
2. **Orario di inizio — "entrambi"**: default da `orarioInizioPrevisto` nel JSON, sovrascrivibile in Prepara (`Sessione.orarioInizioEffettivo`). `getT0()` è l'unico punto che decide il riferimento. Il cronometro totale viene decurtato se `avviataAlle` è successivo a `T0`.
   - ⚠️ **Nota d'uso**: se apri Conduci a un'ora molto diversa dall'orario dichiarato senza aggiornarlo in Prepara, il cronometro risulta già quasi esaurito (è la decurtazione che lavora). In classe l'orario va impostato all'ora reale della lezione.
3. **Deriva**: `scostamento = drift degli step conclusi (reale − previsto) + solo lo sforamento dello step corrente`. Niente falso "anticipo" a metà di uno step in corso. Soglia 3′. Suggerimento singolo, priorità `tagliabile` → `comprimibile`, mai `essenziale`; in anticipo suggerisce dove espandere. Accettare aggiorna `durateEffettive` e ridisegna la timeline.
4. **Aggregazione valutazione**: la cella (alunno × criterio) usa **solo** le osservazioni riferite a quel singolo alunno (media arrotondata + conteggio). Le annotazioni di ambito `classe` **non** riempiono le celle individuali — confluiscono nel riepilogo di classe. Le celle senza dati restano **vuote** (`null`), mai un default.
5. **Export PDF = stampa del browser** (`window.print()` con stili `@media print`), nessuna dipendenza pesante, funziona offline. CSV via Blob (valutazione + tempi).
6. **PannelloAlunni / PannelloSupporto = fogli dal basso non bloccanti**: i cronometri continuano a scorrere sotto; si chiudono con tocco fuori, Esc o pulsante. Nessun modale che ferma l'attività.
7. **Conferma salto step**: `window.confirm` nativo (momentaneo, avviato dal docente). Semplice; sostituibile con conferma inline se preferisci.
8. **Una sola sessione attiva** alla volta: la Home mostra "Riprendi" se esiste una sessione `in-corso`.
9. **Riapertura di uno step già fatto**: si riapre il segmento esistente (reset di `inizio`, azzerato `fine`), non si accumulano più intervalli per lo stesso step. Sufficiente per l'MVP.

---

## Architettura

- `lib/repository.ts` — **unico** contratto dati (interfaccia + impl. locale Dexie). I componenti non toccano mai `db.ts`. Sostituire con API reali = riscrivere solo questo file.
- `lib/tempo.ts`, `lib/valutazione.ts` — moduli **puri** e testati (nessun `Date.now()` interno: l'ora arriva come parametro).
- `lib/hooks/` — `useSessione` (carica + persiste ogni modifica → ripresa esatta), `useCronometro`, `useWakeLock`, `useVocale`, `useServiceWorker`.
- Persistenza **immediata** su ogni cambiamento: chiusura/blocco a metà lezione non perde dati.

---

## Cosa manca / da rifinire (fase futura)

- **Icone PWA**: attualmente SVG generati (`public/icons/*.svg`). Per una resa ottima su iOS servono PNG 192/512 + maskable.
- **Sync differita reale**: `repository.flushSync()` è un no-op; l'"Invia all'autore" salva solo il flag in locale. Aggancio pronto per il backend.
- **Registrazione audio di fallback** quando la Web Speech API non è disponibile (ora il pulsante mostra "n/d"). La dettatura richiede Chrome/Edge e microfono.
- **QR / link diretto**: la sessione si apre già da `/attivita/[id]/conduci?sessione=…`; manca la generazione del QR lato kit.
- **Modalità relatore** completa su schermo proiettato: oggi c'è l'avviso + "solo il necessario" (nasconde la sceneggiatura). Da estendere.
- **Import CSV avanzato**: ora si incolla un nome per riga o `Cognome,Nome`. Nessun parsing di file `.csv` con intestazioni multiple.

---

## Rifiniture (round 2)

- **Brand GAP applicato**: logo wordmark (`public/gap-logo.png`, dal tuo brand kit Canva) in Home/Prepara/Conduci/Rivedi. Palette da hex forniti — giallo `#FFD62E`, teal `#00B8B5`, arancione `#FF842F` + inchiostro nero. Tutti i colori sono **token centralizzati** in `app/globals.css` (`:root`): cambiare lì = cambiare ovunque. Sui riempimenti brillanti il testo è nero (contrasto + look GAP). Icone PWA e theme-color aggiornati.
- **Responsive desktop + mobile**: Home a griglia di card (1→2 colonne), Prepara a due colonne su desktop, Conduci a due colonne (azione | annota) su `lg`, singola colonna su mobile. Rivedi a larghezza `max-w-4xl` con sintesi e note in griglia.
- **Spaziatura domande/aiuti ↔ annota**: aggiunto `pb-6` sotto i pulsanti di supporto e separazione di colonna, così i due blocchi non sono più appiccicati.
- **Elenco alunni**: aggiunta seconda classe fittizia **3A Liceo Scientifico** (26 nomi) in `data/3a-liceo.classe.json`. Seed reso **idempotente per ID**: le nuove classi seed compaiono anche su un DB già inizializzato, senza toccare quelle importate dal docente.
- **Pausa timer per step**: pulsante ⏸/▶ accanto al cronometro. Modello a **orologio virtuale** (`oraVirtuale`, `inPausa` in `lib/tempo.ts`): la pausa congela cronometro step, totale e deriva; alla ripresa il tempo in pausa è escluso dalle durate. Stato persistito (`pausaDa`, `msInPausa`).
- **Salva & riprendi**: lo stato è già persistito ad ogni modifica; aggiunto pulsante **"Salva ed esci"** in Conduci (torna alla Home mantenendo la sessione) e la Home mostra **"Riprendi / In pausa"** con attività e step corrente.
- **Rivedi come resoconto**: header con badge, **sintesi** (durata reale vs prevista, step, annotazioni, alunni osservati), tempi reale/previsto, **riepilogo di classe per criterio**, **Note per la classe** (chip di classe raggruppati + note vocali), **Note per alunno**, griglia editabile, export PDF/CSV, feedback autore.

### Verificato dal vivo (round 2)
- Pausa: etichetta →"Riprendi", timer congelato, `pausaDa`/`msInPausa` persistiti; ripresa accumula il tempo in pausa. ✓
- Rivedi con annotazioni reali: "Partecipano ×2" + nota vocale nelle note di classe; Alessandro/Giulia nelle note per alunno; riepilogo criteri corretto (c1 liv.4/2oss, c2 liv.3/2oss, c4 liv.4/1oss); i chip di classe non riempiono le celle dei singoli. ✓
- Desktop: `main` a due colonne (grid), avviso proiettore visibile. ✓
- Logo caricato, sfondo brand `#faf9f5`, `tsc` pulito, test 19/19. ✓

## Rifiniture (round 3) — stile del sito + modello di valutazione

- **Stile del sito (tema chiaro)**: sfondo pagina chiaro con **dots animati** (drift), rettangolo dello step **bianco** arrotondato, font Montserrat/Spline Sans/Caveat (self-hosted via `next/font`), palette brand giallo `#FFC700` / arancio `#FF842F` / teal `#00B8B5` su token centralizzati in `globals.css`. Icone **SVG** (`components/comune/Icona.tsx`) che seguono `currentColor` (nere/bianche secondo lo sfondo). Logo senza sfondo bianco (`mix-blend-mode: multiply`).
- **Conduci full-width**, un rettangolo per step. Testata in **barra nera** arrotondata: `01/09 · TITOLO` inline + cronometro + **pausa solo-icona**.
- **Domande/Aiuti inline**: niente più pannelli dal basso; sezioni una sotto l'altra dentro il rettangolo, il testo cambia al click (con contatore N/tot).
- **Annota in un tocco = valutazione 1–5**: ogni step ha **3 caratteristiche**, ciascuna sottocategoria di un criterio della griglia. Voto di **classe** per caratteristica. La scala è **1–5 ovunque** (annota + griglia finale).
- **Sezione alunni separata**: sotto l'annota, la lista dei nomi (formato **"Cognome I."**). Cliccando un nome si aprono i **voti 1–5 individuali** sulle stesse caratteristiche **+** una **textarea** per la nota personale dello step. Tutto confluisce nel resoconto.
- **Rivedi** aggiornato: "Voti e note della classe" (voto per caratteristica), "Note per alunno" con voti individuali + testo, riepilogo per criterio e griglia a 1–5. Aggregazione: la cella alunno×criterio media i voti individuali di quell'alunno; il riepilogo di classe media i voti di classe.
- **Home · gestione sessioni**: sezione "Attività svolte" con **Riprendi/Rivedi**, **Reset** (azzera i progressi tenendo classe e checklist) ed **Elimina** con **doppia conferma**.

### Verificato dal vivo (round 3)
- Conduci: barra nera con numero/titolo inline + timer + pausa icona; domande/aiuti che ciclano inline; 3 caratteristiche 1–5; lista "Cognome I.". ✓
- Voto di classe (o-s1-1=4), voto individuale (a1=5) e nota testo persistiti su IndexedDB. ✓
- Rivedi: voto di classe → criterio "Collaborazione liv.4"; Bianchi A. con voto 5 + nota. ✓
- Console pulita su tab nuova (0 errori), `tsc` pulito, test **19/19**. ✓

> Nota dev: durante l'hot-reload possono restare in console errori "stale" di render intermedi (es. `toggleChipClasse`); si azzerano con un riavvio di `npm run dev` o una scheda nuova. Non sono errori del codice attuale.

## Criteri di accettazione — copertura

- ✅ Condurre l'intera attività da telefono senza tastiera (chip + vocale).
- ✅ Sforo → l'app indica quale step comprimere e di quanto, applicabile con un tocco.
- ✅ N chip toccati → griglia con livelli suggeriti + numero di osservazioni.
- ✅ Offline dopo il primo caricamento (build di produzione, Serwist).
- ✅ Chiusura a metà → ripresa esatta (stato persistito su ogni modifica).
- ✅ Cambiando il JSON dell'attività, il player funziona con una lezione diversa senza toccare il codice.
