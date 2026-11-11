import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ApartmentSummary } from "@/lib/calculations";
import { formatCOP, formatPercent } from "@/lib/format";
import { ProgressBar } from "./progress-bar";
import { cn } from "cn";

/** Dato pequeño (etiqueta + valor) usado dentro de la tarjeta. */
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
      <span className={cn("font-medium tabular-nums", className)}>{value}</span>
    </div>
  );
}

/** Tarjeta de apartamento: el porcentaje de avance es el protagonista. */
export function ApartmentCard({ summary }: { summary: ApartmentSummary }) {
  const { apartment } = summary;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{apartment.nombre}</CardTitle>
        <CardDescription>{summary.totalCuotas} cuotas en total</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-4xl font-semibold tracking-tight tabular-nums">
              {formatPercent(summary.avance)}
            </span>
            <span className="text-sm tabular-nums text-muted-foreground">
              {summary.cuotasPagadas} de {summary.totalCuotas} pagadas
            </span>
          </div>
          <ProgressBar value={summary.avance} className="h-3" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Info label="Valor total" value={formatCOP(apartment.valorTotal)} />
          <Info
            label="Cuota inicial"
            value={formatCOP(apartment.cuotaInicial)}
          />
          <Info
            label="Valor pagado"
            value={formatCOP(summary.valorPagado)}
            className="text-primary"
          />
          <Info
            label="Valor pendiente"
            value={formatCOP(summary.valorPendiente)}
            className="text-amber-600 dark:text-amber-400"
          />
          <Info label="Cuotas pagadas" value={String(summary.cuotasPagadas)} />
          <Info
            label="Cuotas pendientes"
            value={String(summary.cuotasPendientes)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
