import { Card, CardContent } from "@/components/ui/card";
import type { GeneralSummary } from "@/lib/calculations";
import { formatCOP, formatPercent } from "@/lib/format";
import { ProgressBar } from "./progress-bar";

/**
 * Panel principal del dashboard: el avance general es el número
 * protagonista, con la barra y los montos pagado/pendiente debajo.
 * Es el único momento "valiente" del diseño; el resto queda silencioso.
 */
export function SummaryHero({ summary }: { summary: GeneralSummary }) {
  const totalCuotas = summary.cuotasPagadas + summary.cuotasPendientes;

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 py-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Avance general
          </span>
          <span className="text-sm tabular-nums text-muted-foreground">
            {summary.cuotasPagadas} de {totalCuotas} cuotas pagadas
          </span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <span className="text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
            {formatPercent(summary.avance)}
          </span>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Total pagado</span>
              <span className="text-xl font-semibold tabular-nums text-primary">
                {formatCOP(summary.totalPagado)}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">
                Total pendiente
              </span>
              <span className="text-xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                {formatCOP(summary.totalPendiente)}
              </span>
            </div>
          </div>
        </div>

        <ProgressBar value={summary.avance} className="h-3" />
      </CardContent>
    </Card>
  );
}
