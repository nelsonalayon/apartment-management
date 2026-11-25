import { ProgressBar } from "@/components/dashboard/progress-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApartmentSummary } from "@/lib/calculations";
import { formatCOP, formatPercent } from "@/lib/format";
import { cn } from "cn";

/** Dato pequeño (etiqueta + valor), mismo patrón de la tarjeta del dashboard. */
function Info({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("font-medium tabular-nums", className)}>
        {value}
      </span>
    </div>
  );
}

/**
 * Resumen del apartamento con exactamente 3 datos (CA-5.1):
 * avance (porcentaje con barra), pagado y pendiente en dinero.
 * Sin contadores de cuotas ni otros datos de la tarjeta del dashboard.
 */
export function ApartmentSummary({ summary }: { summary: ApartmentSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Valor pagado de la cuota inicial del apartamento</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-4xl font-semibold tracking-tight tabular-nums">
              {formatPercent(summary.avance)}
            </span>

          </div>
          <ProgressBar value={summary.avance} className="h-3" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Info
            label="Pagado"
            value={formatCOP(summary.valorPagado)}
            className="text-primary"
          />
          <Info
            label="Pendiente"
            value={formatCOP(summary.valorPendiente)}
            className="text-amber-600 dark:text-amber-400"
          />
        </div>
      </CardContent>
    </Card>
  );
}
