import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";

/**
 * Identidad de la sesión en el Header: nombre del usuario + Salir.
 * Es async (lee cookies) por eso debe ir dentro de <Suspense>.
 */
export async function SessionInfo() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">{user.nombre}</span>
      <form action={logout}>
        <Button type="submit" variant="outline" size="sm">
          Salir
        </Button>
      </form>
    </div>
  );
}
