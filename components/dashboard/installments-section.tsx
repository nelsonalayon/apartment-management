"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import type { Apartment, Installment, User } from "@/lib/types";
import { StatusBadge } from "./status-badge";

type EstadoFilter = "todas" | "pagada" | "pendiente";

type InstallmentsSectionProps = {
  installments: Installment[];
  apartments: Apartment[];
  users: User[];
};

/** Grupo de botones para un filtro. */
function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}:</span>
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

/** Sección con la tabla de cuotas y los filtros básicos. */
export function InstallmentsSection({
  installments,
  apartments,
  users,
}: InstallmentsSectionProps) {
  const [estado, setEstado] = useState<EstadoFilter>("todas");
  const [apartmentId, setApartmentId] = useState("todos");

  // Referencia larga → código corto ("101"/"202") para mostrar en la tabla.
  const codigoByRef = useMemo(
    () => new Map(apartments.map((a) => [a.id, a.codigo])),
    [apartments]
  );

  const filtered = useMemo(
    () =>
      installments.filter(
        (cuota) =>
          (estado === "todas" || cuota.estado === estado) &&
          (apartmentId === "todos" || cuota.apartmentId === apartmentId)
      ),
    [installments, estado, apartmentId]
  );

  const userName = (userId?: string) =>
    users.find((user) => user.id === userId)?.nombre;

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Cuotas</CardTitle>
          <span className="text-sm text-muted-foreground">
            Mostrando {filtered.length} de {installments.length}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <FilterGroup
            label="Estado"
            value={estado}
            onChange={(value) => setEstado(value as EstadoFilter)}
            options={[
              { value: "todas", label: "Todas" },
              { value: "pagada", label: "Pagadas" },
              { value: "pendiente", label: "Pendientes" },
            ]}
          />
          <FilterGroup
            label="Apartamento"
            value={apartmentId}
            onChange={setApartmentId}
            options={[
              { value: "todos", label: "Todos" },
              ...apartments.map((apartment) => ({
                value: apartment.id,
                label: `Apto ${apartment.codigo}`,
              })),
            ]}
          />
        </div>
      </CardHeader>

      <CardContent>
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay cuotas para estos filtros.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cuota</TableHead>
                <TableHead>Apartamento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Fecha programada</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Fecha de pago</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cuota) => (
                <TableRow key={cuota.id}>
                  <TableCell className="font-medium">#{cuota.numero}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      Apto{" "}
                      {codigoByRef.get(cuota.apartmentId) ?? cuota.apartmentId}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatCOP(cuota.valor)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(cuota.fechaLimite)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge estado={cuota.estado} />
                  </TableCell>
                  <TableCell>
                    {cuota.estado === "pagada" ? (
                      userName(cuota.userId) ?? "—"
                    ) : (
                      <span className="italic text-muted-foreground">
                        Pendiente
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {cuota.fechaPago ? formatDate(cuota.fechaPago) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
