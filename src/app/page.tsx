import ChessGame from "@/components/ChessGame";

export default function Page() {
  return (
    <div className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-5xl neon-cyan leading-none">RETRO CHESS AI</h1>
            <p className="text-[13px] text-[color:var(--text-dim)]">
              Click-to-move chess with a strong engine. Neon. Scanlines. No excuses.
            </p>
          </div>
          <div className="panel px-4 py-3 text-[12px] text-[color:var(--text-dim)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="kbd">LMB</span> select/move
              <span className="mx-2 opacity-40">|</span>
              <span className="kbd">ESC</span> cancel
              <span className="mx-2 opacity-40">|</span>
              <span className="kbd">R</span> new game
            </div>
          </div>
        </header>

        <div className="mt-8">
          <ChessGame />
        </div>
      </div>
    </div>
  );
}

