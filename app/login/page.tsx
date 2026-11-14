import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUsers } from "@/data/db";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "@/components/login/login-form";
import type { User } from "@/lib/types";

/**
 * Página de login.
 * Con Cache Components, leer cookies() fuera de <Suspense> es error de
 * build, así que la parte dinámica (sesión + usuarios) va detrás del
 * límite y el shell (título) se sirve al instante.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <Badge>MVP</Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Control de cuota inicial
        </h1>
        <p className="text-sm text-muted-foreground">
          Inicia sesión para ver el estado de los pagos
        </p>
      </div>

      <Suspense
        fallback={
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Iniciar sesión</CardTitle>
              <CardDescription>Cargando...</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                aria-busy="true"
                className="h-40 animate-pulse rounded-lg bg-muted motion-reduce:animate-none"
              />
            </CardContent>
          </Card>
        }
      >
        <LoginPanel />
      </Suspense>
    </main>
  );
}

/** Parte dinámica: sesión actual + lista de usuarios desde la BD. */
async function LoginPanel() {
  const sessionUser = await getCurrentUser();
  if (sessionUser) redirect("/");

  const users: User[] = await getUsers();

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>Selecciona tu nombre e ingresa tu PIN</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm users={users} />
      </CardContent>
    </Card>
  );
}
