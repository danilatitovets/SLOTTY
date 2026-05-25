/**
 * Назначить пользователя администратором платформы.
 *
 * npm run make:admin -- --email admin@example.com
 * npm run make:admin -- --userId <uuid>
 * npm run make:admin -- --telegramId 123456789
 */
import { pool } from '../config/db.js';

type Args = {
  email?: string;
  userId?: string;
  telegramId?: string;
};

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--email' && argv[i + 1]) out.email = argv[++i];
    else if (a === '--userId' && argv[i + 1]) out.userId = argv[++i];
    else if (a === '--telegramId' && argv[i + 1]) out.telegramId = argv[++i];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.email && !args.userId && !args.telegramId) {
    console.error('Укажите --email, --userId или --telegramId');
    process.exit(1);
  }

  let profileId: string | null = null;
  let label = '';

  if (args.userId) {
    const r = await pool.query<{ id: string; full_name: string }>(
      `select id, full_name from public.profiles where id = $1`,
      [args.userId],
    );
    const row = r.rows[0];
    if (!row) {
      console.error(`Пользователь не найден: ${args.userId}`);
      process.exit(1);
    }
    profileId = row.id;
    label = row.full_name;
  } else if (args.email) {
    const r = await pool.query<{ profile_id: string; full_name: string }>(
      `select ai.profile_id, p.full_name
         from public.auth_identities ai
         join public.profiles p on p.id = ai.profile_id
        where lower(trim(ai.email)) = lower(trim($1))
        limit 1`,
      [args.email],
    );
    const row = r.rows[0];
    if (!row) {
      console.error(`Пользователь с email не найден: ${args.email}`);
      process.exit(1);
    }
    profileId = row.profile_id;
    label = row.full_name;
  } else if (args.telegramId) {
    const r = await pool.query<{ id: string; full_name: string }>(
      `select id, full_name from public.profiles where telegram_user_id::text = $1`,
      [args.telegramId],
    );
    const row = r.rows[0];
    if (!row) {
      console.error(`Пользователь с Telegram ID не найден: ${args.telegramId}`);
      process.exit(1);
    }
    profileId = row.id;
    label = row.full_name;
  }

  await pool.query(
    `update public.profiles set role = 'platform_admin', updated_at = now() where id = $1`,
    [profileId],
  );

  console.log(`✓ ${label} (${profileId}) назначен platform_admin`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
