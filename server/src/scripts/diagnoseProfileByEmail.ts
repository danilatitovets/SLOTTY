/**
 * Диагностика дубликатов profiles по email.
 * cd server && npx tsx src/scripts/diagnoseProfileByEmail.ts danila.titovets@gmail.com
 */
import { diagnoseProfilesByEmail } from '../modules/auth/profileDuplicatePolicy.js';
import { loadE2eEnv } from './e2eDb.js';

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length);
}

async function main() {
  const email = process.argv[2]?.trim();
  if (!email) {
    console.error('Usage: npx tsx src/scripts/diagnoseProfileByEmail.ts <email>');
    process.exit(1);
  }

  loadE2eEnv();
  const rows = await diagnoseProfilesByEmail(email);
    if (rows.length === 0) {
      console.log(`Профили по email ${email} не найдены.`);
      return;
    }

    console.log(`\nДиагностика для ${email} (${rows.length} profile(s))\n`);
    const headers = [
      'profileId',
      'role',
      'createdAt',
      'providers',
      'hasMaster',
      'services',
      'appts',
      'subscription',
      'main?',
      'dup?',
    ];
    console.log(headers.map((h) => pad(h, 14)).join(''));

    for (const r of rows) {
      console.log(
        [
          pad(r.profileId.slice(0, 8) + '…', 14),
          pad(r.role, 14),
          pad(r.createdAt.slice(0, 10), 14),
          pad(r.providers.slice(0, 40), 14),
          pad(r.hasMasterProfile ? 'yes' : 'no', 14),
          pad(String(r.servicesCount), 14),
          pad(String(r.appointmentsCount), 14),
          pad(r.subscription.slice(0, 12), 14),
          pad(r.isLikelyMainProfile ? 'YES' : 'no', 14),
          pad(r.isLikelyDuplicateProfile ? 'YES' : 'no', 14),
        ].join(''),
      );
      console.log(`  full id: ${r.profileId}`);
    }

    const main = rows.find((r) => r.isLikelyMainProfile);
    const dup = rows.find((r) => r.isLikelyDuplicateProfile);
    console.log('\n--- Рекомендация ---');
    if (main) console.log(`Canonical (main): ${main.profileId}`);
    else console.log('Canonical: не определён автоматически — проверьте вручную');
    if (dup) console.log(`Duplicate (empty): ${dup.profileId}`);
    else console.log('Duplicate: не найден автоматически');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
