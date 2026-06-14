# FR Visual Design

Sito pubblico statico di **FR Visual Design**, progetto creativo di Francesca Rossello dedicato a visual design, murales, grafica, siti web, landing page e gestionali su misura.

## Sezioni del sito

- Home
- Portfolio
- Blog
- Murales
- Gestionali
- Contatti

## Funzioni

- Portfolio lavori
- Caso studio "La fiducia che torna a casa"
- PDF scheda progetto
- Wizard richiesta preventivo con 10 servizi
- FormSubmit con fallback `mailto:`
- Pagina servizi gestionali

## Nota tecnica

Il sito è statico e pubblicabile con GitHub Pages.

- Non contiene dati clienti.
- Non contiene credenziali.
- Non contiene backend.
- Non è collegato tecnicamente ad Archimede Suite.
- Non è collegato tecnicamente a FR Visual Gest.
- FR Visual Gest è un progetto separato.

## Pubblicazione con GitHub Pages

1. Caricare il contenuto della cartella `FR-Visual-Design` in un repository GitHub.
2. Andare in **Settings → Pages**.
3. Selezionare **Deploy from a branch**.
4. Selezionare il branch `main`.
5. Selezionare la cartella `/root`.
6. Salvare.

Il file `index.html` si trova nella root del progetto. Tutti i collegamenti interni e gli asset utilizzano percorsi relativi.

## File esclusi dalla pubblicazione

Il file `.gitignore` esclude backup ZIP, log, cache, file temporanei, `.env`, dipendenze, build, backup e l'audio legacy non utilizzato.
