"use client";

import type { UciWorker } from "./uci";
import { uciGoDepth, uciHandshake } from "./uci";

type EngineState = {
  worker: UciWorker | null;
  ready: boolean;
  debugLines: string[];
};

let engineState: EngineState = { worker: null, ready: false, debugLines: [] };

async function createWorker(): Promise<UciWorker> {
  // We copy `node_modules/stockfish/bin/stockfish.js` + `.wasm` to `public/engine/`
  // via scripts/copy-stockfish.mjs (postinstall / predev / prebuild).
  // Stockfish.js expects worker mode to be enabled via `#<wasmUrl>,worker` hash.
  const wasmUrl = "/engine/stockfish.wasm";
  const w = new Worker(`/engine/stockfish.js#${wasmUrl},worker`, {
    // ensure classic worker, not module
    type: "classic",
  } as WorkerOptions) as unknown as UciWorker;
  // capture early output for debugging + handshake
  ;(w as unknown as Worker).onerror = (e) => {
    engineState.debugLines.push(
      `worker_error: ${String((e as any)?.message || e)}`
    );
    engineState.debugLines = engineState.debugLines.slice(-200);
  };
  ;(w as unknown as Worker).onmessageerror = (e) => {
    engineState.debugLines.push(`worker_messageerror: ${String(e)}`);
    engineState.debugLines = engineState.debugLines.slice(-200);
  };
  const prev = w.onmessage;
  w.onmessage = (e) => {
    const line = String(e.data ?? "");
    engineState.debugLines.push(line);
    engineState.debugLines = engineState.debugLines.slice(-200);
    prev?.(e);
  };
  return w;
}

export async function getEngine(): Promise<UciWorker> {
  if (engineState.worker) return engineState.worker;
  const w = await createWorker();
  engineState.worker = w;
  return w;
}

export async function ensureReady(): Promise<UciWorker> {
  const w = await getEngine();
  if (!engineState.ready) {
    engineState.debugLines.push("handshake_start");
    try {
      await uciHandshake(w);
      engineState.debugLines.push("handshake_ok");
      engineState.ready = true;
    } catch (e) {
      engineState.debugLines.push(`handshake_fail: ${(e as Error).message}`);
      engineState.ready = false;
      throw e;
    }
  }
  return w;
}

export async function bestMove(fen: string, depth: number): Promise<string> {
  const w = await ensureReady();
  return uciGoDepth(w, fen, depth);
}

export function stopEngineSearch(): void {
  if (!engineState.worker) return;
  try {
    engineState.worker.postMessage("stop");
  } catch {
    // ignore
  }
}

export function getEngineDebugLines(): string[] {
  return [...engineState.debugLines];
}

export function resetEngine(): void {
  try {
    (engineState.worker as any)?.terminate?.();
  } catch {
    // ignore
  }
  engineState.worker = null;
  engineState.ready = false;
  engineState.debugLines.push("engine_reset");
  engineState.debugLines = engineState.debugLines.slice(-200);
}
