/**
 * Lightweight catalog load probe.
 * Usage: API=https://api.example.com CONCURRENCY=50 DURATION_SEC=30 node scripts/load/catalog-hammer.mjs
 */
const API = (process.env.API ?? 'http://127.0.0.1:4000').replace(/\/$/, '');
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 50);
const DURATION_SEC = Number(process.env.DURATION_SEC ?? 30);

const latencies = [];
let ok = 0;
let err = 0;
let stopped = false;

async function oneRequest() {
  const t0 = performance.now();
  try {
    const res = await fetch(`${API}/api/catalog/listings?limit=24`);
    const ms = performance.now() - t0;
    latencies.push(ms);
    if (res.ok) ok++;
    else err++;
  } catch {
    err++;
  }
}

async function worker() {
  while (!stopped) {
    await oneRequest();
  }
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function main() {
  console.log(`Hammer ${API}/api/catalog/listings concurrency=${CONCURRENCY} duration=${DURATION_SEC}s`);
  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await new Promise((r) => setTimeout(r, DURATION_SEC * 1000));
  stopped = true;
  await Promise.all(workers);

  const sorted = [...latencies].sort((a, b) => a - b);
  const avg = sorted.length ? sorted.reduce((a, b) => a + b, 0) / sorted.length : 0;
  console.log({
    requests: ok + err,
    ok,
    err,
    avgMs: Math.round(avg),
    p95Ms: Math.round(percentile(sorted, 95)),
    p99Ms: Math.round(percentile(sorted, 99)),
  });
  if (err > ok * 0.05) process.exit(1);
}

void main();
