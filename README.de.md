# Retro Chess AI (Deutsch)

Retro Chess AI ist eine Retro-/Synthwave-Schach-App (Next.js), in der du gegen eine KI spielst.

![Preview](public/preview.png)

## Features

- Klick-zum-Ziehen Schachbrett (legale Züge via `chess.js`)
- Retro-Synthwave-UI (Scanlines/Noise/Neon)
- Gut erkennbare Retro-Figuren (SVG Silhouetten)
- KI:
  - **Fallback KI** (immer verfügbar, schneller Start)
  - Optionaler Versuch mit **Stockfish** (WebWorker + WASM) über den Button `TRY STOCKFISH`
- Zugliste, Undo, Hint, Promotion-Dialog

## Start (lokal)

```bash
cd retro-chess-ai
npm install
npm run dev
```

Dann öffnen: `http://localhost:3000` (oder den Port aus der Konsole).

## Steuerung

- Linksklick: Figur auswählen / Zug ausführen
- `ESC`: Auswahl abbrechen
- `R`: Neue Partie

## KI / Engine Hinweise

Die App startet standardmäßig mit **Fallback KI**, damit es sofort läuft.
Wenn du Stockfish nutzen willst, klicke `TRY STOCKFISH`. Falls dein Browser/Setup den Worker/WASM blockiert, bleibt das Spiel weiterhin mit Fallback spielbar.

## Build

```bash
npm run build
npm run start
```

