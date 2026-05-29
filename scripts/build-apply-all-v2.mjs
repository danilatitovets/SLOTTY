/**
 * Собирает supabase/migrations_v2/apply_all_v2.sql из нумерованных миграций 001–999.
 * Источник правды — отдельные файлы NNN_*.sql; apply_all только для чистой тестовой БД.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const MIGRATIONS_DIR = path.join(root, 'supabase', 'migrations_v2');
const OUT_FILE = path.join(MIGRATIONS_DIR, 'apply_all_v2.sql');
const MIGRATION_FILE_RE = /^(\d{3})_.*\.sql$/;

function listMigrationSqlFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => MIGRATION_FILE_RE.test(f))
    .sort();
}

const files = listMigrationSqlFiles().filter((f) => {
  const n = Number.parseInt(f.slice(0, 3), 10);
  return n >= 1;
});

if (files.length === 0) {
  console.error('Нет миграций 001+ в', MIGRATIONS_DIR);
  process.exit(1);
}

const first = files[0].slice(0, 3);
const last = files[files.length - 1].slice(0, 3);

const header = `/*
  SLOTTY DB v2 — ОДИН ФАЙЛ для ручного применения в Supabase SQL Editor.

  Сгенерировано: scripts/build-apply-all-v2.mjs
  НЕ редактировать вручную — пересоберите: npm run db:v2:build-all

  ВНИМАНИЕ
  - Применять ТОЛЬКО на чистой ТЕСТОВОЙ базе Supabase (новый проект или пустая public).
  - НЕ применять на production с уже применёнными миграциями.
  - Старая схема v1 (supabase/schema.sql) КОНФЛИКТУЕТ с v2.
  - Для существующей БД используйте npm run db:v2:migrate (инкрементально).

  Содержимое = миграции ${first} … ${last} по порядку.
  После успешного выполнения: npm run db:v2:smoke
*/

`;

const parts = [header];
for (const name of files) {
  const content = fs.readFileSync(path.join(MIGRATIONS_DIR, name), 'utf8').trimEnd();
  parts.push(`\n-- ======================================================================\n`);
  parts.push(`-- FILE: ${name}\n`);
  parts.push(`-- ======================================================================\n\n`);
  parts.push(content);
  parts.push('\n');
}

fs.writeFileSync(OUT_FILE, parts.join(''), 'utf8');
console.log(`apply_all_v2.sql обновлён: ${files.length} файлов (${first}–${last})`);
