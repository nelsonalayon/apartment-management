import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import type { GeneralSummary } from "@/lib/calculations";
import { formatCOP, formatPercent } from "@/lib/format";
import { ProgressBar } from "./progress-bar";
import { cn } from "cn";

type StatCardProps = {
  title: string;
  value: string;
  /** Resalta el valor en color principal (verde esmerald). */
  highlight?: boolean;
  /** Si se indica, muestra una barra de progreso debajo del valor. */
  progress?: number;
};

function StatCard({ title, value, highlight, progress }: StatCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <span
          className={cn(
            "text-2xl font-bold tabular-nums",
            highlight && "text-primary"
          )}
        >
          {value}
        </span>
        {progress !== undefined && <ProgressBar value={progress} />}
      </CardContent>
    </Card>
  );
}

/** Tarjetas del resumen general (parte superior del dashboard). */
export function SummaryCards({ summary }: { summary: GeneralSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total de apartamentos"
        value={String(summary.totalApartamentos)}
      />
      <StatCard
        title="Total de la cuota inicial"
        value={formatCOP(summary.totalCuotaInicial)}
      />
      <StatCard
        title="Total pagado"
        value={formatCOP(summary.totalPagado)}
        highlight
      />
      <StatCard
        title="Total pendiente"
        value={formatCOP(summary.totalPendiente)}
      />
      <StatCard title="Cuotas pagadas" value={String(summary.cuotasPagadas)} />
      <StatCard
        title="Cuotas pendientes"
        value={String(summary.cuotasPendientes)}
      />
      <StatCard
        title="Avance general"
        value={formatPercent(summary.avance)}
        highlight
        progress={summary.avance}
      />
    </div>
  );
}
