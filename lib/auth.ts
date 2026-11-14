/**
 * Lógica de autenticación PURA (sin IO): PINs y firmas de sesión.
 *
 * - PIN: se guarda en MySQL como `scrypt$salt$hash` (nunca en claro).
 * - Sesión: valor firmado con HMAC-SHA256 para detectar cookies
 *   manipuladas o expiradas.
 *
 * Solo depende de node:crypto → es testeable con Vitest sin BD ni red.
 */
import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

/* ---------------------------------- PINs --------------------------------- */

/** Genera un PIN de 4 dígitos (ej. "0427"; puede empezar con 0). */
export function generatePin(): string {
  return String(randomInt(0, 10_000)).padStart(4, "0");
}

/**
 * Hashea un PIN con scrypt + salt aleatorio.
 * Formato guardado: `scrypt$<salt base64url>$<hash base64url>`.
 */
export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(pin, salt, 32).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

/** Verifica un PIN contra su hash guardado (comparación constante en tiempo). */
export function verifyPin(pin: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const [, salt, expectedB64] = parts;
  const expected = Buffer.from(expectedB64, "base64url");
  const actual = scryptSync(pin, salt, 32);

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

/* -------------------------------- Sesión --------------------------------- */

/** Valor de cookie: `<userId>.<expiraEnUnix>.<firma HMAC>`. */
export function signSession(
  userId: string,
  expiresAt: number,
  secret: string
): string {
  const payload = `${userId}.${expiresAt}`;
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export type SessionPayload = {
  userId: string;
  expiresAt: number;
};

/**
 * Verifica una cookie de sesión: firma válida y no expirada.
 * Devuelve null ante cualquier manipulación (firma incorrecta,
 * payload corrupto o fecha vencida).
 */
export function verifySession(
  value: string,
  secret: string
): SessionPayload | null {
  const lastDot = value.lastIndexOf(".");
  if (lastDot <= 0) return null;

  const payload = value.slice(0, lastDot);
  const signature = value.slice(lastDot + 1);

  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");

  const actualBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(actualBuf, expectedBuf)) return null;

  const payloadDot = payload.lastIndexOf(".");
  if (payloadDot <= 0) return null;

  const userId = payload.slice(0, payloadDot);
  const expiresAt = Number(payload.slice(payloadDot + 1));
  if (!Number.isFinite(expiresAt)) return null;
  if (expiresAt < Math.floor(Date.now() / 1000)) return null;

  return { userId, expiresAt };
}
