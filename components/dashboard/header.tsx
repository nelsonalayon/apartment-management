import { Badge } from "@/components/ui/badge";

/** Encabezado principal del dashboard. */
export function Header() {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>MVP</Badge>
        <Badge variant="secondary">Datos de ejemplo</Badge>
      </div>
      <h1 className="text-3xl font-bold tracking-tight">
        Control de cuota inicial
      </h1>
      <p className="text-muted-foreground">
        Estado de los pagos de los apartamentos 101 y 202 — 4 personas pagando
      </p>
    </header>
  );
}
