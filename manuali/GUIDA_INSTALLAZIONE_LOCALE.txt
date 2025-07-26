### Guida Rapida: Come Avviare il Progetto in Locale su Windows

Una volta che hai clonato il progetto da GitHub (da https://github.com/nemorfol/fire-simulator), segui questi passaggi per farlo funzionare sulla tua macchina:

**1. Installa Node.js e npm (Node Package Manager)**

*   **Cos'è:** Node.js è l'ambiente di runtime che permette a JavaScript di essere eseguito fuori dal browser. `npm` (Node Package Manager) è lo strumento che useremo per installare tutte le librerie e le dipendenze di cui il progetto ha bisogno. `npm` viene installato automaticamente con Node.js.
*   **Come fare:**
    1.  Apri il tuo browser e vai sul sito ufficiale di Node.js: https://nodejs.org/en
    2.  Vedrai due versioni consigliate: "LTS" (Long Term Support) e "Current". Ti consiglio vivamente di scaricare la versione **LTS**, è la più stabile e raccomandata per la maggior parte degli utenti.
    3.  Scarica l'installer `.msi` per Windows.
    4.  Esegui l'installer scaricato. Segui le istruzioni a schermo, accettando i termini di licenza e lasciando le opzioni di installazione predefinite (inclusa l'installatione di npm).

*   **Verifica l'installazione:**
    1.  Apri il "Prompt dei comandi" di Windows (cerca `cmd` nel menu Start).
    2.  Digita i seguenti comandi e premi Invio dopo ciascuno:
        ```bash
        node -v
        npm -v
        ```
    3.  Se l'installazione è andata a buon fine, dovresti vedere i numeri di versione di Node.js e npm (es. `v18.17.1` per Node e `9.6.7` per npm).

**2. Prepara il Progetto Clonato**

*   **Cos'è:** Il progetto ha bisogno di alcune "dipendenze" (altre librerie JavaScript) per funzionare. Queste sono elencate nel file `package.json`.
*   **Come fare:**
    1.  Apri il "Prompt dei comandi" di Windows.
    2.  Naviga fino alla cartella principale del progetto che hai clonato. Ad esempio, se il progetto si trova in `F:\sviluppo\fire-new`, digita:
        ```bash
        F:
        cd \sviluppo\fire-new
        ```
    3.  Una volta nella cartella del progetto, installa tutte le dipendenze necessarie digitando:
        ```bash
        npm install
        ```
        Questo comando leggerà il file `package.json` e scaricherà tutte le librerie necessarie nella cartella `node_modules` all'interno del tuo progetto. Potrebbe volerci qualche minuto.

**3. Avvia il Server di Sviluppo**

*   **Cos'è:** Questo progetto è un'applicazione web basata su Vue.js e Vite. Per vederla e usarla nel tuo browser, devi avviare un piccolo server web locale.
*   **Come fare:**
    1.  Assicurati di essere ancora nella cartella principale del progetto nel "Prompt dei comandi".
    2.  Digita il comando per avviare il server di sviluppo:
        ```bash
        npm run dev
        ```
    3.  Dopo un momento, il terminale ti mostrerà un messaggio simile a:
        ```
        VITE vX.Y.Z ready in Zms

        ➜ Local:    http://localhost:5173/
        ➜ Network:  use --host to expose
        ➜ press h to show help
        ```
    4.  Apri il tuo browser web (Chrome, Firefox, Edge, ecc.) e vai all'indirizzo indicato come "Local", di solito `http://localhost:5173/` (il numero di porta potrebbe variare).

A questo punto, dovresti vedere l'applicazione del simulatore caricata nel tuo browser e pronta per essere utilizzata!
