/**
 * Límite de intentos de login (defensa contra fuerza bruta) — SIN dependencias.
 *
 * Ventana fija en memoria del proceso: tras MAX intentos fallidos seguidos
 * para una misma clave, la clave queda bloqueada WINDOW_MS y ni se verifica
 * el PIN. Un login correcto limpia el contador.
 *
 * - Clave = userId (no IP): así un atacante rotando IPs no esquiva el límite
 *   de un PIN de 4 dígitos (10.000 combinaciones).
 * - Memoria del proceso: con `pnpm start` (un proceso) es suficiente para el
 *   MVP; un reinicio del server lo limpia. Nada de estado en la BD.
 * - `now` es inyectable para poder testear el tiempo con Vitest (puro).
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60_000; // 5 minutos

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Elimina claves cuya ventana ya venció (evita crecimiento del Map). */
function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

/**
 * Devuelve los ms que quedan de bloqueo para la clave (0 = sin bloqueo).
 * Llamar ANTES de verificar el PIN: si hay bloqueo, ni se comprueba.
 */
export function remainingLockMs(key: string, now: number = Date.now()): number {
  const bucket = buckets.get(key);
  if (!bucket) return 0;
  if (now >= bucket.resetAt) {
    buckets.delete(key);
    return 0;
  }
  return bucket.count >= MAX_ATTEMPTS ? bucket.resetAt - now : 0;
}

/**
 * Registra un intento fallido y devuelve los ms de bloqueo resultantes
 * (0 si todavía no se alcanzó el límite).
 */
export function registerFailure(key: string, now: number = Date.now()): number {
  prune(now);

  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    // Primero de una ventana nueva.
    bucket = { count: 1, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
  } else {
    bucket.count += 1;
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    bucket.resetAt = now + WINDOW_MS; // el bloqueo dura WINDOW_MS desde aquí
    return WINDOW_MS;
  }
  return 0;
}

/** Limpia el contador de una clave (login correcto). */
export function clearFailures(key: string): void {
  buckets.delete(key);
}
