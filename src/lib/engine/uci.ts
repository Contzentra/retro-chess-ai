export type UciWorker = {
  postMessage: (msg: string) => void;
  onmessage: ((e: MessageEvent<string>) => void) | null;
  terminate?: () => void;
};

export function parseBestMove(line: string): string | null {
  // "bestmove e2e4 ponder e7e5"
  const m = line.match(/^bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?)/i);
  return m?.[1] ?? null;
}

export async function uciHandshake(worker: UciWorker): Promise<void> {
  // WASM compilation can take a while on first load.
  await waitFor(worker, "uciok", () => worker.postMessage("uci"), 60000);
  await waitFor(worker, "readyok", () => worker.postMessage("isready"), 30000);
}

export async function uciGoDepth(
  worker: UciWorker,
  fen: string,
  depth: number
): Promise<string> {
  worker.postMessage(`position fen ${fen}`);
  worker.postMessage(`go depth ${depth}`);

  const best = await waitForBestMove(worker, 30000);
  return best;
}

function waitFor(
  worker: UciWorker,
  token: string,
  trigger: () => void,
  timeoutMs: number = 8000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      cleanup();
      reject(new Error(`UCI timeout waiting for ${token}`));
    }, timeoutMs);

    const prev = worker.onmessage;
    worker.onmessage = (e) => {
      const data = String(e.data || "");
      prev?.(e);
      if (data.includes(token)) {
        cleanup();
        resolve();
      }
    };

    const cleanup = () => {
      clearTimeout(t);
    };

    trigger();
  });
}

function waitForBestMove(worker: UciWorker, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      cleanup();
      reject(new Error("UCI timeout waiting for bestmove"));
    }, timeoutMs);

    const prev = worker.onmessage;
    worker.onmessage = (e) => {
      const data = String(e.data || "");
      prev?.(e);
      const best = parseBestMove(data);
      if (best) {
        cleanup();
        resolve(best);
      }
    };

    const cleanup = () => clearTimeout(t);
  });
}
