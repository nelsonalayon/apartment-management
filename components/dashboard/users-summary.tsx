import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UserSummary } from "@/lib/calculations";
import { formatCOP } from "@/lib/format";
import type { Apartment } from "@/lib/types";

/** Tarjeta con la información de un usuario. */
function UserCard({
  summary,
  codigoByRef,
}: {
  summary: UserSummary;
  /** Referencia larga → código corto ("101"/"202"). */
  codigoByRef: Map<string, string>;
}) {
  const cuotasLabel =
    summary.cuotasPagadas === 1
      ? "1 cuota pagada"
      : `${summary.cuotasPagadas} cuotas pagadas`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{summary.user.nombre}</CardTitle>
        <CardDescription>{cuotasLabel}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Total pagado</span>
          <span className="text-xl font-bold tabular-nums text-primary">
            {formatCOP(summary.totalPagado)}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {summary.apartamentos.length === 0 ? (
            <Badge variant="outline">Sin pagos</Badge>
          ) : (
            summary.apartamentos.map((apartmentId) => (
              <Badge key={apartmentId} variant="outline">
                Apto {codigoByRef.get(apartmentId) ?? apartmentId}
              </Badge>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Sección con el resumen de todos los usuarios. */
export function UsersSummary({
  summaries,
  apartments,
}: {
  summaries: UserSummary[];
  apartments: Apartment[];
}) {
  const codigoByRef = new Map(apartments.map((a) => [a.id, a.codigo]));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {summaries.map((summary) => (
        <UserCard
          key={summary.user.id}
          summary={summary}
          codigoByRef={codigoByRef}
        />
      ))}
    </div>
  );
}
