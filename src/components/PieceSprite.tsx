import type { PieceSymbol } from "chess.js";

const PALETTE = {
  w: { stroke: "#00ffff", fill: "#e9f7ff" },
  b: { stroke: "#ff00ff", fill: "#ffd8ff" },
} as const;

function Glow({ color }: { color: string }) {
  return (
    <filter id={`glow-${color.replace("#", "")}`} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.4" result="blur" />
      <feColorMatrix
        in="blur"
        type="matrix"
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.9 0"
      />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}

export default function PieceSprite({
  color,
  piece,
}: {
  color: "w" | "b";
  piece: PieceSymbol;
}) {
  const p = PALETTE[color];

  // Simple, readable silhouettes with a neon outline.
  // Intentionally not “realistic” — it’s synthwave.
  const Shape = () => {
    switch (piece) {
      case "p":
        return (
          <>
            <circle cx="32" cy="22" r="9" />
            <path d="M24 33c2-4 6-7 8-7s6 3 8 7l2 7H22l2-7z" />
            <path d="M22 44h20l3 6H19l3-6z" />
          </>
        );
      case "r":
        return (
          <>
            <path d="M20 18h6v5h4v-5h4v5h4v-5h6v10H20V18z" />
            <path d="M24 28h16v14H24V28z" />
            <path d="M22 44h20l3 6H19l3-6z" />
          </>
        );
      case "n":
        return (
          <>
            <path d="M22 45c1-9 5-17 11-22 4-3 10-4 12 1 2 4-1 9-6 10 5 2 8 7 7 12H22z" />
            <path d="M30 23l6 3" />
            <path d="M22 44h20l3 6H19l3-6z" />
          </>
        );
      case "b":
        return (
          <>
            <path d="M32 16c5 4 8 9 8 14 0 3-1 5-3 7l5 8H22l5-8c-2-2-3-4-3-7 0-5 3-10 8-14z" />
            <path d="M32 22v8" />
            <path d="M22 44h20l3 6H19l3-6z" />
          </>
        );
      case "q":
        return (
          <>
            <path d="M22 26l5-8 5 8 5-8 5 8 4-6 2 9c0 7-6 13-16 13S16 36 16 29l2-9 4 6z" />
            <path d="M22 44h20l3 6H19l3-6z" />
          </>
        );
      case "k":
        return (
          <>
            <path d="M30 14h4v6h6v4h-6v5c5 2 8 6 8 10 0 5-4 9-10 9h0c-6 0-10-4-10-9 0-4 3-8 8-10v-5h-6v-4h6v-6z" />
            <path d="M22 44h20l3 6H19l3-6z" />
          </>
        );
    }
  };

  return (
    <svg viewBox="0 0 64 64" className="w-full h-full" role="img" aria-label={`${color}${piece}`}>
      <defs>
        <Glow color={p.stroke} />
      </defs>

      <g
        filter={`url(#glow-${p.stroke.replace("#", "")})`}
        stroke={p.stroke}
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill={p.fill}
      >
        <Shape />
      </g>
    </svg>
  );
}

