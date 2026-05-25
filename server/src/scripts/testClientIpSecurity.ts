/**
 * Проверка resolveClientIp против подделки заголовков.
 * cd server && npm run test:client-ip
 */
import type { Request } from 'express';

function mockReq(opts: {
  headers?: Record<string, string>;
  ip?: string;
  remote?: string;
}): Request {
  return {
    headers: opts.headers ?? {},
    ip: opts.ip,
    socket: { remoteAddress: opts.remote },
  } as Request;
}

async function runCase(
  name: string,
  env: Record<string, string | undefined>,
  req: Request,
  expect: { clientIp: string; usedHeader: string },
): Promise<boolean> {
  const prev: Record<string, string | undefined> = {};
  for (const key of [
    'NODE_ENV',
    'TRUST_PROXY',
    'TRUST_CLOUDFLARE_HEADERS',
  ] as const) {
    prev[key] = process.env[key];
    if (env[key] === undefined) delete process.env[key];
    else process.env[key] = env[key];
  }

  const { resolveClientIpDebug } = await import('../lib/clientIp.js');
  const got = resolveClientIpDebug(req);
  const ok = got.clientIp === expect.clientIp && got.usedHeader === expect.usedHeader;

  for (const key of Object.keys(prev) as (keyof typeof prev)[]) {
    if (prev[key] === undefined) delete process.env[key];
    else process.env[key] = prev[key];
  }

  console.log(`${ok ? '✓' : '✗'} ${name}`);
  console.log(`   expected clientIp=${expect.clientIp} usedHeader=${expect.usedHeader}`);
  console.log(`   got        clientIp=${got.clientIp} usedHeader=${got.usedHeader}`);
  if (!ok) console.log(`   debug`, got);
  return ok;
}

async function main() {
  const fakeCf = { 'cf-connecting-ip': '1.2.3.4', 'x-real-ip': '5.6.7.8' };
  const baseReq = mockReq({
    headers: fakeCf,
    ip: '127.0.0.1',
    remote: '::ffff:127.0.0.1',
  });

  const cases: Array<Parameters<typeof runCase>> = [
    [
      'dev + fake CF/X-Real-IP → req.ip only',
      { NODE_ENV: 'development', TRUST_PROXY: undefined, TRUST_CLOUDFLARE_HEADERS: undefined },
      baseReq,
      { clientIp: '127.0.0.1', usedHeader: 'req.ip' },
    ],
    [
      'prod без CF trust + fake CF → req.ip',
      { NODE_ENV: 'production', TRUST_PROXY: '1', TRUST_CLOUDFLARE_HEADERS: undefined },
      baseReq,
      { clientIp: '127.0.0.1', usedHeader: 'req.ip' },
    ],
    [
      'prod TRUST_CLOUDFLARE_HEADERS=true + fake CF → cf-connecting-ip',
      {
        NODE_ENV: 'production',
        TRUST_PROXY: '1',
        TRUST_CLOUDFLARE_HEADERS: 'true',
      },
      baseReq,
      { clientIp: '1.2.3.4', usedHeader: 'cf-connecting-ip' },
    ],
    [
      'prod TRUST_PROXY=2 + fake CF → cf-connecting-ip',
      { NODE_ENV: 'production', TRUST_PROXY: '2', TRUST_CLOUDFLARE_HEADERS: undefined },
      baseReq,
      { clientIp: '1.2.3.4', usedHeader: 'cf-connecting-ip' },
    ],
    [
      'test env ignores CF even if TRUST_CLOUDFLARE_HEADERS=true',
      { NODE_ENV: 'test', TRUST_CLOUDFLARE_HEADERS: 'true' },
      baseReq,
      { clientIp: '127.0.0.1', usedHeader: 'req.ip' },
    ],
  ];

  const results: boolean[] = [];
  for (const c of cases) {
    results.push(await runCase(...c));
  }

  const failed = results.filter((r) => !r).length;
  if (failed > 0) {
    console.error(`\n${failed} case(s) failed`);
    process.exit(1);
  }
  console.log('\nAll client IP security checks passed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
