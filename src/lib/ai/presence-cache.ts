// ============================================================
// Tiny module-level TTL cache for per-account "does it have any
// content?" booleans (knowledge chunks, approved memory). These
// existence COUNTs run on every draft / auto-reply just to decide
// whether retrieval is worth doing — two roundtrips per reply in
// active accounts. Same in-memory pattern (and the same serverless
// caveat) as src/lib/rate-limit.ts: per-instance, best-effort. A
// stale hit only costs an extra empty retrieval or a skipped one for
// at most TTL_MS, and write paths invalidate explicitly.
// ============================================================

const TTL_MS = 60_000

const cache = new Map<string, { value: boolean; expires: number }>()

function key(kind: 'kb' | 'memory', accountId: string): string {
  return `${kind}:${accountId}`
}

export function getCachedPresence(
  kind: 'kb' | 'memory',
  accountId: string,
): boolean | null {
  const hit = cache.get(key(kind, accountId))
  if (!hit) return null
  if (Date.now() > hit.expires) {
    cache.delete(key(kind, accountId))
    return null
  }
  return hit.value
}

export function setCachedPresence(
  kind: 'kb' | 'memory',
  accountId: string,
  value: boolean,
): void {
  cache.set(key(kind, accountId), { value, expires: Date.now() + TTL_MS })
}

/** Call from any route that writes KB chunks / memory rows so the next
 *  reply re-checks instead of serving a stale "empty". */
export function invalidatePresence(
  kind: 'kb' | 'memory',
  accountId: string,
): void {
  cache.delete(key(kind, accountId))
}

/** Test helper — module-level state would otherwise leak between specs. */
export function clearPresenceCache(): void {
  cache.clear()
}
