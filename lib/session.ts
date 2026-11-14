/**
 * Sesión de usuario: cookie httpOnly firmada (30 días).
 *
 * Al leerla se revalida que el usuario siga existiendo en la BD,
 * así que una cuenta eliminada queda sin sesión de inmediato.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { signSession, verifySession } from "./auth";
import { getUserById } from "@/data/db";
import type { User } from "@/lib/types";

const COOKIE_NAME = "session";
/** 30 días. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET no está definida. Añádela a .env.local (nunca a git)."
    );
  }
  return secret;
}

/** Crea la sesión del usuario (cookie firmada, httpOnly, 30 días). */
export async function createSession(userId: string): Promise<void> {
  const expiresAt = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const value = signSession(userId, expiresAt, getSecret());

  (await cookies()).set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Elimina la cookie de sesión (logout). */
export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

/**
 * Usuario actual: lee la cookie, verifica la firma y revalida
 * el usuario contra la BD. Devuelve null si no hay sesión válida.
 */
export async function getCurrentUser(): Promise<User | null> {
  // Marca el tramo como request-time: sin esto, Next detecta Date.now()
  // (al verificar la expiración) como valor inestable durante el prerender.
  await connection();

  let raw: string | undefined;
  try {
    raw = (await cookies()).get(COOKIE_NAME)?.value;
  } catch {
    // Known bug de Next (InvariantError) al re-renderizar Server Actions en
    // modo MPA sobre rutas PPR: cookies() recibe un objeto interno inválido.
    // Tratamos como "sin sesión": la dirección segura (menos privilegios)
    // y en /login simplemente se vuelve a mostrar el formulario.
    return null;
  }
  if (!raw) return null;

  const session = verifySession(raw, getSecret());
  if (!session) return null;

  return getUserById(session.userId);
}

/** Como getCurrentUser, pero redirige al login si no hay sesión. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
