"use client";

import type { Chess, Square } from "chess.js";
import PieceSprite from "./PieceSprite";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"] as const;

export default function ChessBoard({
  game,
  orientation,
  selected,
  legalTargets,
  lastMove,
  hintMove,
  onSquareClick,
}: {
  game: Chess;
  orientation: "w" | "b";
  selected: Square | null;
  legalTargets: Set<Square>;
  lastMove: { from: Square; to: Square } | null;
  hintMove: { from: Square; to: Square } | null;
  onSquareClick: (sq: Square) => void;
}) {
  const board = game.board();

  const ranks = orientation === "w" ? RANKS : [...RANKS].reverse();
  const files = orientation === "w" ? FILES : [...FILES].reverse();

  return (
    <div className="panel p-4">
      <div className="grid grid-cols-8 gap-0 select-none aspect-square w-full max-w-[640px] mx-auto">
        {ranks.map((rank, rIdx) =>
          files.map((file, fIdx) => {
            const sq = `${file}${rank}` as Square;
            const base = (rIdx + fIdx) % 2 === 0 ? "rgba(0,255,255,0.06)" : "rgba(255,0,255,0.05)";
            const piece = game.get(sq);

            const isSelected = selected === sq;
            const isTarget = legalTargets.has(sq);
            const isLast = lastMove?.from === sq || lastMove?.to === sq;
            const isHint = hintMove?.from === sq || hintMove?.to === sq;

            return (
              <button
                key={sq}
                type="button"
                onClick={() => onSquareClick(sq)}
                className="relative aspect-square outline-none"
                style={{
                  background: base,
                  border: "1px solid rgba(120,140,255,0.12)",
                  boxShadow: isSelected
                    ? "inset 0 0 0 2px rgba(0,255,255,0.65), inset 0 0 18px rgba(0,255,255,0.18)"
                    : isHint
                      ? "inset 0 0 0 2px rgba(0,255,136,0.45), inset 0 0 18px rgba(0,255,136,0.14)"
                      : isLast
                      ? "inset 0 0 0 2px rgba(255,0,255,0.35), inset 0 0 12px rgba(255,0,255,0.14)"
                      : "none",
                }}
              >
                {/* Coordinates */}
                {fIdx === 0 && (
                  <span className="absolute left-1 top-1 text-[10px] text-[color:var(--text-dim)]">
                    {rank}
                  </span>
                )}
                {rIdx === 7 && (
                  <span className="absolute right-1 bottom-1 text-[10px] text-[color:var(--text-dim)]">
                    {file}
                  </span>
                )}

                {/* Target marker */}
                {isTarget && (
                  <div className="absolute inset-0 grid place-items-center">
                    <div
                      className="rounded-full"
                      style={{
                        width: piece ? "70%" : "32%",
                        height: piece ? "70%" : "32%",
                        background: piece ? "rgba(255,255,255,0.06)" : "rgba(0,255,255,0.22)",
                        border: piece ? "1px solid rgba(255,0,255,0.25)" : "1px solid rgba(0,255,255,0.35)",
                        boxShadow: "0 0 18px rgba(0,255,255,0.18)",
                      }}
                    />
                  </div>
                )}

                {/* Piece */}
                {piece && (
                  <div className="absolute inset-1">
                    <PieceSprite color={piece.color} piece={piece.type} />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
