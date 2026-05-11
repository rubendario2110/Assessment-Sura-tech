/**
 * Extra logs from use cases + idempotency stores. Default **on** when running apps.
 * **Off** under Jest unless you set `APPLICATION_VERBOSE_LOGS=true` (see `test/setup-env.ts`).
 */
export function isApplicationVerboseLogging(): boolean {
  return process.env.APPLICATION_VERBOSE_LOGS !== "false";
}
