<!-- BEGIN:nextjs-agent-rules -->
# Retro Chess AI – Agent Notes

## Project goal

Build a polished retro/synthwave chess app with a reliable AI opponent.

## Key files

- `src/components/ChessGame.tsx` – main game logic + AI wiring
- `src/components/ChessBoard.tsx` – board rendering + highlights
- `src/components/PieceSprite.tsx` – piece SVG silhouettes
- `src/lib/engine/stockfishClient.ts` / `src/lib/engine/uci.ts` – Stockfish (optional)
- `src/lib/engine/fallback.ts` – always-available fallback AI

## Notes

- Keep the app playable even when Stockfish fails to init (fallback must remain functional).
- Prefer small assets and docker-friendly styling (pure CSS/SVG).

# Next.js version warning

This project uses modern Next.js. If tooling changes, prefer following the repo’s own config.

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
