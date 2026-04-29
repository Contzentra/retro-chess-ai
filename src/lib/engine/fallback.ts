"use client";

import { Chess } from "chess.js";

const PIECE_VALUE: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

function evaluate(game: Chess): number {
  // Positive = white better
  let score = 0;
  const board = game.board();
  for (const rank of board) {
    for (const piece of rank) {
      if (!piece) continue;
      const v = PIECE_VALUE[piece.type] || 0;
      score += piece.color === "w" ? v : -v;
    }
  }
  // small bonus for mobility
  score += game.moves().length * (game.turn() === "w" ? 1 : -1);
  return score;
}

function minimax(game: Chess, depth: number, alpha: number, beta: number): number {
  if (depth === 0 || game.isGameOver()) {
    if (game.isCheckmate()) {
      // current side to move is checkmated => bad for side to move
      return game.turn() === "w" ? -999999 : 999999;
    }
    return evaluate(game);
  }

  const moves = game.moves({ verbose: true }) as any[];
  if (moves.length === 0) return evaluate(game);

  const maximizing = game.turn() === "w";
  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      game.move(m);
      const val = minimax(game, depth - 1, alpha, beta);
      game.undo();
      best = Math.max(best, val);
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      game.move(m);
      const val = minimax(game, depth - 1, alpha, beta);
      game.undo();
      best = Math.min(best, val);
      beta = Math.min(beta, val);
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function fallbackBestMove(fen: string, depth: number): string {
  const game = new Chess(fen);
  // Tiny opening book (first 2 plies), adds variety and strength.
  if (game.history().length <= 1) {
    const side = game.turn();
    const book: Record<string, string[]> = {
      w: ["e2e4", "d2d4", "c2c4", "g1f3"],
      b: ["e7e5", "c7c5", "e7e6", "g8f6"],
    };
    const cand = book[side];
    for (const uci of shuffle([...cand])) {
      const from = uci.slice(0, 2) as any;
      const to = uci.slice(2, 4) as any;
      const g2 = new Chess(game.fen());
      try {
        const m = g2.move({ from, to });
        if (m) return uci;
      } catch {
        // ignore
      }
    }
  }
  const moves = game.moves({ verbose: true }) as any[];
  if (moves.length === 0) throw new Error("no legal moves");

  let bestMove = moves[0];
  let bestScore = game.turn() === "w" ? -Infinity : Infinity;
  const d = Math.max(1, Math.min(4, depth));

  for (const m of moves) {
    game.move(m);
    const score = minimax(game, d - 1, -Infinity, Infinity);
    game.undo();

    if (game.turn() === "w") {
      // after undo, side to move is same as before loop; use maximizing flag
    }

    const maximizing = game.turn() === "w";
    if (maximizing) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = m;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = m;
      }
    }
  }

  const promo = bestMove.promotion ? String(bestMove.promotion) : "";
  return `${bestMove.from}${bestMove.to}${promo}`;
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
