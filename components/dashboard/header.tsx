import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "./theme-toggle";
import { SessionInfo } from "./session-info";

/** Encabezado principal del dashboard. */
export function Header() {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>MVP</Badge>
          <Badge variant="secondary">Datos reales</Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Lee cookies() → debe ir detrás de <Suspense> (Cache Components). */}
          <Suspense
            fallback={
              <div
                aria-busy="true"
                className="h-7 w-32 animate-pulse rounded-lg bg-muted motion-reduce:animate-none"
              />
            }
          >
            <SessionInfo />
          </Suspense>
          <ThemeToggle />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Control de cuota inicial
        </h1>
        <p className="text-muted-foreground">
          Estado de los pagos de los apartamentos 101 y 202 — 4 personas
          pagando
        </p>
      </div>
    </header>
  );
}
