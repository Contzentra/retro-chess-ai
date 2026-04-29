import { NextResponse } from "next/server";

// Debug endpoint (dev-only) — returns last Stockfish lines captured in client.
// In production this will always be empty because the engine runs in the browser.
export async function GET() {
  return NextResponse.json({
    note: "Engine runs in the browser; check DevTools Console for worker errors.",
  });
}

