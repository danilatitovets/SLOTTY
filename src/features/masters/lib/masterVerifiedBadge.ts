/** Публичная галочка: три способа входа мастера (Telegram, Google, email). */
export function masterShowsVerifiedBadge(master: { isVerified?: boolean }): boolean {
  return Boolean(master.isVerified);
}
