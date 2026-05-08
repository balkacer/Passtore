#!/usr/bin/env node
/**
 * Lightweight API load probe — GET /health only (no auth, no vault payloads).
 * Start the API first (e.g. docker compose up). Tune with env vars.
 *
 *   LOAD_TEST_BASE_URL=http://127.0.0.1:3000 LOAD_DURATION_MS=8000 LOAD_CONCURRENCY=25 node scripts/load-health.mjs
 */

const base = (process.env.LOAD_TEST_BASE_URL || 'http://127.0.0.1:3000').replace(
  /\/$/,
  '',
);
const durationMs = Number(process.env.LOAD_DURATION_MS || 8000);
const concurrency = Math.max(1, Number(process.env.LOAD_CONCURRENCY || 20));

async function hitOnce() {
  const res = await fetch(`${base}/health`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const body = await res.json();
  if (body?.status !== 'ok') {
    throw new Error('unexpected health body');
  }
}

async function burst() {
  await Promise.all(Array.from({ length: concurrency }, () => hitOnce()));
}

async function main() {
  const start = Date.now();
  let bursts = 0;
  let failures = 0;
  while (Date.now() - start < durationMs) {
    try {
      await burst();
      bursts++;
    } catch {
      failures++;
    }
  }
  const elapsed = Date.now() - start;
  const summary = {
    baseUrl: base,
    durationMs: elapsed,
    burstsOk: bursts,
    burstFailures: failures,
    approximateRequests: bursts * concurrency,
    concurrencyPerBurst: concurrency,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
