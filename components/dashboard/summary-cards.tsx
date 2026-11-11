import { Card, CardContent } from "@/components/ui/card";
import type { GeneralSummary } from "@/lib/calculations";
import { formatCOP } from "@/lib/format";
import { cn } from "cn";

type StatProps = {
  label: string;
  value: string;
  /** Resalta la cifra con color semántico (verde = pagada, ámbar = pendiente). */
  className?: string;
};

/** Celda de la franja de estadísticas. */
function Stat({ label, value, className }: StatProps) {
  return (
    <div className="flex flex-col gap-1 bg-card p-4 sm:p-5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-lg font-semibold tabular-nums sm:text-xl", className)}>
        {value}
      </span>
    </div>
  );
}

/**
 * Franja de estadísticas secundarias del resumen general.
 * Un solo bloque con separadores hairline (gap-px sobre bg-border)
 * en lugar de tarjetas repetidas: el protagonismo lo tiene el hero.
 */
export function SummaryCards({ summary }: { summary: GeneralSummary }) {
  return (
    <Card className="py-0">
      <CardContent className="grid grid-cols-2 gap-px bg-border p-0 sm:grid-cols-4">
        <Stat label="Apartamentos" value={String(summary.totalApartamentos)} />
        <Stat
          label="Cuota inicial total"
          value={formatCOP(summary.totalCuotaInicial)}
        />
        <Stat
          label="Cuotas pagadas"
          value={String(summary.cuotasPagadas)}
          className="text-primary"
        />
        <Stat
          label="Cuotas pendientes"
          value={String(summary.cuotasPendientes)}
          className="text-amber-600 dark:text-amber-400"
        />
      </CardContent>
    </Card>
  );
}
