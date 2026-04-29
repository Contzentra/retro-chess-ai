import type { Square } from "chess.js";

export type PlayerColor = "w" | "b";

export type MoveInput = {
  from: Square;
  to: Square;
  promotion?: "q" | "r" | "b" | "n";
};

