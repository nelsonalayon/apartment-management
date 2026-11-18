"use server";

import { redirect } from "next/navigation";
import { verifyPin } from "@/lib/auth";
import { getUserById, getUserPinHash } from "@/data/db";
import { createSession, destroySession } from "@/lib/session";
import { clearFailures, registerFailure, remainingLockMs } from "@/lib/rate-limit";

/** Estado que la Server Action devuelve al formulario (useActionState). */
export type LoginState = { error?: string };

/**
 * Server Action de login: valida usuario + PIN contra la BD
 * y crea la sesión. No hay endpoints REST: todo va por Server Actions.
 */
export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const userId = String(formData.get("userId") ?? "");
  const pin = String(formData.get("pin") ?? "");

  if (!userId || !pin) {
    return { error: "Selecciona tu usuario e ingresa tu PIN." };
  }

  // Fuerza bruta: si la clave ya está bloqueada, ni se verifica el PIN.
  const lockMs = remainingLockMs(userId);
  if (lockMs > 0) {
    const minutes = Math.max(1, Math.ceil(lockMs / 60_000));
    return {
      error: `Demasiados intentos fallidos. Intenta de nuevo en ${minutes} min.`,
    };
  }

  const user = await getUserById(userId);
  const pinHash = user ? await getUserPinHash(user.id) : null;

  // Mensaje genérico a propósito: no revela si el usuario o el PIN existen.
  if (!user || !pinHash || !verifyPin(pin, pinHash)) {
    const blocked = registerFailure(userId) > 0;
    if (blocked) {
      return { error: "Demasiados intentos fallidos. Intenta de nuevo en 5 min." };
    }
    return { error: "Credenciales incorrectas." };
  }

  clearFailures(userId);
  await createSession(user.id);
  redirect("/");
}

/** Server Action de logout: borra la cookie y vuelve al login. */
export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
