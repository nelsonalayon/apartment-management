import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserApartmentSummary } from "@/lib/calculations";
import { formatCOP } from "@/lib/format";

/**
 * Usuarios con pagos en ESTE apartamento (RF-7): solo quien tiene pagos
 * aparece (CA-7.2) y su total = sus cuotas pagadas + sus pagos
 * adicionales de aquí (CA-7.1). Sin pagos → mensaje de defensa (CA-7.3).
 */
export function ApartmentUsers({
  summaries,
}: {
  summaries: UserApartmentSummary[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios del apartamento</CardTitle>
      </CardHeader>

      <CardContent>
        {summaries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin pagos registrados en este apartamento
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {summaries.map((summary) => (
              <li
                key={summary.user.id}
                className="flex items-center justify-between gap-3"
              >
                <span className="font-medium">{summary.user.nombre}</span>
                <span className="tabular-nums text-primary">
                  {formatCOP(summary.totalPagado)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
