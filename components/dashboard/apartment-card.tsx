import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
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

/** Tarjeta con toda la información de un apartamento. */
export function ApartmentCard({ summary }: { summary: ApartmentSummary }) {
  const { apartment } = summary;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{apartment.nombre}</CardTitle>
        <CardDescription>{summary.totalCuotas} cuotas en total</CardDescription>
        <CardAction>
          <Badge variant="outline">{formatPercent(summary.avance)} de avance</Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
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
            className="text-amber-600"
          />
          <Info label="Cuotas pagadas" value={String(summary.cuotasPagadas)} />
          <Info
            label="Cuotas pendientes"
            value={String(summary.cuotasPendientes)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Avance</span>
            <span className="font-medium tabular-nums">
              {formatPercent(summary.avance)}
            </span>
          </div>
          <ProgressBar value={summary.avance} />
        </div>
      </CardContent>
    </Card>
  );
}
