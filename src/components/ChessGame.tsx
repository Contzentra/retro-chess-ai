"use client";

import { Chess, type Square } from "chess.js";
import { useEffect, useMemo, useRef, useState } from "react";
import ChessBoard from "./ChessBoard";
import {
  bestMove,
  ensureReady,
  getEngineDebugLines,
  resetEngine,
  stopEngineSearch,
} from "@/lib/engine/stockfishClient";
import { fallbackBestMove } from "@/lib/engine/fallback";
import type { PlayerColor } from "@/lib/chess/types";

type Status =
  | { kind: "idle" }
  | { kind: "thinking"; text: string }
  | { kind: "error"; text: string };

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

export default function ChessGame() {
  const [game, setGame] = useState(() => new Chess());
  const [playerColor, setPlayerColor] = useState<PlayerColor>("w");
  const [depth, setDepth] = useState(12);
  const [selected, setSelected] = useState<Square | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null
  );
  const [hintMove, setHintMove] = useState<{ from: Square; to: Square } | null>(
    null
  );
  const [promotionPick, setPromotionPick] = useState<{
    from: Square;
    to: Square;
    color: PlayerColor;
  } | null>(null);
  const [showEngineLog, setShowEngineLog] = useState(false);
  const [engineLog, setEngineLog] = useState<string[]>([]);
  const [engineMode, setEngineMode] = useState<"stockfish" | "fallback">(
    "fallback"
  );
  const [engineInit, setEngineInit] = useState<
    "idle" | "initializing" | "ready" | "failed"
  >("idle");

  const thinkingRef = useRef(false);

  const turn = game.turn();
  const isPlayersTurn = turn === playerColor;
  const orientation = playerColor;

  const legalTargets = useMemo(() => {
    if (!selected) return new Set<Square>();
    const moves = game.moves({ square: selected, verbose: true }) as any[];
    return new Set<Square>(moves.map((m) => m.to));
  }, [game, selected]);

  function reset(newPlayerColor: PlayerColor = playerColor) {
    stopEngineSearch();
    thinkingRef.current = false;
    setStatus({ kind: "idle" });
    setSelected(null);
    setLastMove(null);
    setHintMove(null);
    setPromotionPick(null);
    setPlayerColor(newPlayerColor);
    setGame(new Chess());
  }

  async function initEngine() {
    setEngineInit("initializing");
    setShowEngineLog(true);
    setStatus({ kind: "thinking", text: "INITIALIZING ENGINE…" });
    try {
      resetEngine();
      await ensureReady();
      setEngineLog(getEngineDebugLines());
      setEngineMode("stockfish");
      setEngineInit("ready");
      setStatus({ kind: "idle" });
    } catch (e) {
      setEngineLog(getEngineDebugLines());
      setEngineMode("fallback");
      setEngineInit("failed");
      setStatus({
        kind: "error",
        text: `Stockfish did not start (no "uciok"). Using fallback AI. Tip: try Chrome/Edge and check DevTools Console. (${(e as Error).message})`,
      });
    }
  }

  async function makeAiMove(nextGame: Chess) {
    if (thinkingRef.current) return;
    if (nextGame.isGameOver()) return;
    if (nextGame.turn() === playerColor) return;

    thinkingRef.current = true;
    setStatus({ kind: "thinking", text: "ENGINE THINKING…" });
    try {
      setEngineLog(getEngineDebugLines());
      const fen = nextGame.fen();
      const bm =
        engineMode === "fallback"
          ? fallbackBestMove(fen, 3)
          : await bestMove(fen, clamp(depth, 1, 20));
      const from = bm.slice(0, 2) as Square;
      const to = bm.slice(2, 4) as Square;
      const promotion = bm.length === 5 ? (bm[4] as any) : undefined;

      const g2 = new Chess(nextGame.fen());
      const res = g2.move({ from, to, promotion });
      if (!res) throw new Error("engine returned illegal move");

      setLastMove({ from, to });
      setGame(g2);
      setStatus({ kind: "idle" });
    } catch (e) {
      setEngineLog(getEngineDebugLines());
      // auto-fallback so the game remains playable
      if (engineMode === "stockfish") {
        setEngineMode("fallback");
        setStatus({
          kind: "error",
          text: "Stockfish failed — switched to fallback AI (weaker).",
        });
        thinkingRef.current = false;
        return;
      }
      setStatus({
        kind: "error",
        text: `Engine error. Try lower depth. (${(e as Error).message})`,
      });
    } finally {
      thinkingRef.current = false;
    }
  }

  function onSquareClick(sq: Square) {
    if (status.kind === "thinking") return;
    if (!isPlayersTurn) return;
    if (promotionPick) return;

    const piece = game.get(sq);

    // select own piece
    if (!selected) {
      if (!piece) return;
      if (piece.color !== playerColor) return;
      setSelected(sq);
      return;
    }

    // reselect
    if (sq === selected) {
      setSelected(null);
      return;
    }
    if (piece && piece.color === playerColor) {
      setSelected(sq);
      return;
    }

    // attempt move
    const g2 = new Chess(game.fen());
    const pieceFrom = game.get(selected);
    const isPawn =
      pieceFrom?.type === "p" &&
      ((pieceFrom.color === "w" && sq[1] === "8") ||
        (pieceFrom.color === "b" && sq[1] === "1"));

    if (isPawn) {
      // show promotion picker
      setPromotionPick({ from: selected, to: sq, color: pieceFrom.color });
      return;
    }

    let move: any = null;
    try {
      move = g2.move({ from: selected, to: sq });
    } catch {
      // chess.js can throw on invalid move objects; treat as illegal move
      return;
    }
    if (!move) return;

    setLastMove({ from: selected, to: sq });
    setSelected(null);
    setHintMove(null);
    setGame(g2);
  }

  function commitPromotion(p: "q" | "r" | "b" | "n") {
    if (!promotionPick) return;
    const { from, to } = promotionPick;
    const g2 = new Chess(game.fen());
    let move: any = null;
    try {
      move = g2.move({ from, to, promotion: p });
    } catch {
      setPromotionPick(null);
      return;
    }
    if (!move) {
      setPromotionPick(null);
      return;
    }
    setLastMove({ from, to });
    setSelected(null);
    setHintMove(null);
    setPromotionPick(null);
    setGame(g2);
  }

  // keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
      if (e.key.toLowerCase() === "r") reset(playerColor);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [playerColor]);

  // Stockfish is optional. Default to fallback so the game always works.

  useEffect(() => {
    if (status.kind !== "thinking") return;
    const t = setInterval(() => setEngineLog(getEngineDebugLines()), 600);
    return () => clearInterval(t);
  }, [status.kind]);

  // after player move, let AI respond
  useEffect(() => {
    if (game.turn() !== playerColor) {
      makeAiMove(game).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.fen(), playerColor, depth]);

  const resultText = useMemo(() => {
    if (!game.isGameOver()) return null;
    if (game.isCheckmate()) return `CHECKMATE — ${game.turn() === "w" ? "BLACK" : "WHITE"} WINS`;
    if (game.isStalemate()) return "STALEMATE";
    if (game.isDraw()) return "DRAW";
    return "GAME OVER";
  }, [game]);

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <ChessBoard
          game={game}
          orientation={orientation}
          selected={selected}
          legalTargets={legalTargets}
          lastMove={lastMove}
          hintMove={hintMove}
          onSquareClick={onSquareClick}
        />

        <div className="panel p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-[color:var(--text-dim)] text-xs">TURN</div>
            <div className={turn === "w" ? "neon-cyan" : "neon-magenta"}>
              {turn === "w" ? "WHITE" : "BLACK"}
            </div>
            {game.inCheck() && (
              <div className="text-[color:var(--yellow)]">CHECK</div>
            )}
          </div>

          <div className="text-xs text-[color:var(--text-dim)]">
            {status.kind === "thinking"
              ? status.text
              : status.kind === "error"
                ? status.text
                : resultText ?? (isPlayersTurn ? "YOUR MOVE" : "WAITING…")}
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="panel p-4">
          <h2 className="text-2xl neon-cyan">CONTROL DECK</h2>

          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-[13px] text-[color:var(--text-dim)]">
                You play
              </div>
              <div className="flex gap-2">
                <button
                  className="btn"
                  onClick={() => reset("w")}
                  aria-pressed={playerColor === "w"}
                >
                  WHITE
                </button>
                <button
                  className="btn"
                  onClick={() => reset("b")}
                  aria-pressed={playerColor === "b"}
                >
                  BLACK
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div className="text-[13px] text-[color:var(--text-dim)]">
                  Engine depth
                </div>
                <div className="text-[13px] neon-magenta">{depth}</div>
              </div>
              <input
                className="mt-2 w-full"
                type="range"
                min={6}
                max={18}
                step={1}
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
              />
              <div className="mt-1 text-[11px] text-[color:var(--text-dim)]">
                Higher depth = stronger but slower.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="btn" onClick={() => reset(playerColor)}>
                NEW GAME
              </button>
              <button className="btn" onClick={() => setShowEngineLog(true)}>
                ENGINE LOG
              </button>
              <button
                className="btn"
                onClick={async () => {
                  await initEngine();
                }}
              >
                TRY STOCKFISH
              </button>
              <button
                className="btn"
                onClick={async () => {
                  if (!isPlayersTurn || status.kind === "thinking") return;
                  setStatus({ kind: "thinking", text: "CALCULATING HINT…" });
                  try {
                    const bm =
                      engineMode === "fallback"
                        ? fallbackBestMove(game.fen(), 2)
                        : await bestMove(game.fen(), clamp(depth, 1, 20));
                    setHintMove({
                      from: bm.slice(0, 2) as Square,
                      to: bm.slice(2, 4) as Square,
                    });
                    setStatus({ kind: "idle" });
                  } catch (e) {
                    setStatus({
                      kind: "error",
                      text: `Hint failed. (${(e as Error).message})`,
                    });
                  }
                }}
              >
                HINT
              </button>
              <button
                className="btn"
                onClick={() => {
                  const g2 = new Chess(game.fen());
                  const undone = g2.undo();
                  if (!undone) return;
                  const undone2 = g2.undo(); // undo AI move too
                  if (!undone2) return;
                  setGame(g2);
                  setSelected(null);
                  setHintMove(null);
                  setStatus({ kind: "idle" });
                }}
              >
                UNDO
              </button>
            </div>

            <div className="text-[11px] text-[color:var(--text-dim)]">
              Engine:{" "}
              <span className={engineMode === "stockfish" ? "neon-cyan" : "neon-magenta"}>
                {engineMode.toUpperCase()}
              </span>{" "}
              <span className="opacity-60">
                ({engineInit === "ready" ? "READY" : engineInit === "initializing" ? "INIT…" : engineInit === "failed" ? "FAILED" : "IDLE"})
              </span>
            </div>
          </div>
        </div>

        <div className="panel p-4">
          <h3 className="text-xl neon-magenta">MOVE LIST</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
            {game.history({ verbose: true }).map((m: any, idx: number) => (
              <div
                key={`${m.san}-${idx}`}
                className="border border-[rgba(120,140,255,0.18)] px-2 py-1"
              >
                <span className="text-[color:var(--text-dim)] mr-2">
                  {idx + 1}.
                </span>
                <span>{m.san}</span>
              </div>
            ))}
            {game.history().length === 0 && (
              <div className="col-span-2 text-[color:var(--text-dim)]">
                No moves yet.
              </div>
            )}
          </div>
        </div>
      </aside>

      {promotionPick && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
          <div className="panel p-5 w-[min(420px,92vw)]">
            <h3 className="text-2xl neon-magenta">PROMOTION</h3>
            <p className="mt-1 text-xs text-[color:var(--text-dim)]">
              Choose a piece (default in chess GUIs is usually Queen).
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {(["q", "r", "b", "n"] as const).map((p) => (
                <button key={p} className="btn" onClick={() => commitPromotion(p)}>
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button className="btn" onClick={() => setPromotionPick(null)}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {showEngineLog && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60"
          onClick={() => setShowEngineLog(false)}
        >
          <div
            className="panel p-5 w-[min(760px,92vw)] max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-end justify-between gap-4">
              <h3 className="text-2xl neon-cyan">ENGINE LOG</h3>
              <button className="btn" onClick={() => setShowEngineLog(false)}>
                CLOSE
              </button>
            </div>
            <div className="mt-3 flex-1 overflow-auto border border-[rgba(120,140,255,0.18)] p-3 text-[12px] leading-5">
              {engineLog.length === 0 ? (
                <div className="text-[color:var(--text-dim)]">
                  No lines captured yet. If the worker fails to start, check DevTools
                  Console for errors.
                </div>
              ) : (
                <pre className="whitespace-pre-wrap break-words">
                  {engineLog.slice(-200).join("\n")}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
