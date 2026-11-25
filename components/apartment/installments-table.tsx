"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCOP, formatDate } from "@/lib/format";
import {
  filterRowsByEstado,
  type EstadoFiltro,
  type PaymentRow,
} from "@/lib/installments";
import type { User } from "@/lib/types";

type InstallmentsTableProps = {
  /** Filas ya calculadas: extras primero (fecha asc.) y cuotas después. */
  filas: PaymentRow[];
  /** Cuotas del apartamento en la BD (distingue CA-6.3 de CA-6.4). */
  totalCuotas: number;
  users: User[];
};

/** Grupo de botones del filtro de estado (patrón del dashboard, aria-pressed). */
function FilterGroup({
  value,
  onChange,
}: {
  value: EstadoFiltro;
  onChange: (value: EstadoFiltro) => void;
}) {
  const options: { value: EstadoFiltro; label: string }[] = [
    { value: "todas", label: "Todas" },
    { value: "pagada", label: "Pagadas" },
    { value: "pendiente", label: "Pendientes" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Estado:</span>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <Button
              key={option.value}
              size="sm"
              variant={isActive ? "default" : "outline"}
              aria-pressed={isActive}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Tabla de pagos del apartamento (RF-6, RF-8):
 * - Los pagos adicionales van al principio (concepto en "Cuota"; "—"
 *   en Fecha programada y Estado, CA-8.1) y el filtro solo toca las
 *   cuotas: los extras siempre están visibles (CA-8.3).
 * - Estados vacíos (defensa, no error): "Sin cuotas registradas"
 *   (CA-6.3), "No hay cuotas con este filtro" debajo de la tabla
 *   (CA-6.4) y "Sin pagos adicionales registrados" (CA-8.2).
 * - En pantallas angostas se ocultan las fechas con hidden sm:table-cell
 *   (sin scroll horizontal, RNF-3).
 */
export function InstallmentsTable({
  filas,
  totalCuotas,
  users,
}: InstallmentsTableProps) {
  const [estado, setEstado] = useState<EstadoFiltro>("todas");

  const visibles = filterRowsByEstado(filas, estado);
  const cuotasVisibles = visibles.filter((fila) => fila.tipo === "cuota").length;
  const hayExtras = filas.some((fila) => fila.tipo === "extra");

  const nombreUsuario = (userId?: string) =>
    users.find((user) => user.id === userId)?.nombre;

  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle>Pagos</CardTitle>
        <FilterGroup value={estado} onChange={setEstado} />
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {visibles.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cuota</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Fecha programada
                </TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Fecha de pago
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((fila) =>
                fila.tipo === "extra" ? (
                  <TableRow key={`extra-${fila.id}`}>
                    <TableCell className="font-medium">
                      {fila.concepto}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatCOP(fila.monto)}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      —
                    </TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>{nombreUsuario(fila.userId) ?? "—"}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatDate(fila.fecha)}
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={`cuota-${fila.id}`}>
                    <TableCell className="font-medium">#{fila.numero}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatCOP(fila.valor)}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatDate(fila.fechaLimite)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge estado={fila.estado} />
                    </TableCell>
                    <TableCell>
                      {fila.estado === "pagada"
                        ? (nombreUsuario(fila.userId) ?? "—")
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {fila.fechaPago ? formatDate(fila.fechaPago) : "—"}
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        )}

        {/* Mensajes de vacío: estados de defensa, nunca error (RF-10). */}
        <div aria-live="polite" className="flex flex-col gap-1.5">
          {totalCuotas === 0 && (
            <p className="text-sm text-muted-foreground">
              Sin cuotas registradas
            </p>
          )}
          {totalCuotas > 0 && cuotasVisibles === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay cuotas con este filtro
            </p>
          )}
          {!hayExtras && (
            <p className="text-sm text-muted-foreground">
              Sin pagos adicionales registrados
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
