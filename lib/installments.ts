/**
 * Lógica pura de la tabla de pagos de la página del apartamento.
 *
 * Reglas (spec 001, RF-6 y RF-8):
 * - Los pagos adicionales van AL PRINCIPIO de la tabla, con su fecha
 *   ascendente; después las cuotas con su número fijo de la BD en
 *   orden ascendente (no se renumera con filtros).
 * - El filtro de estado solo toca las cuotas: los pagos adicionales
 *   están siempre visibles.
 * - Ninguna función lee el reloj: si alguna dependiera del tiempo, lo
 *   recibiría como parámetro (convención del plan, sección 5).
 */
import type { ExtraPayment, Installment, InstallmentState } from "./types";

/** Fila de la tabla de pagos: un pago adicional o una cuota. */
export type PaymentRow =
  | {
      tipo: "extra";
      id: string;
      /** Concepto del pago (ej. "Separación"); se muestra en la columna "Cuota". */
      concepto: string;
      monto: number;
      /** Fecha de pago (ISO "YYYY-MM-DD"). */
      fecha: string;
      userId?: string;
    }
  | {
      tipo: "cuota";
      id: string;
      numero: number;
      valor: number;
      /** Fecha programada (ISO "YYYY-MM-DD"). */
      fechaLimite: string;
      estado: InstallmentState;
      userId?: string;
      fechaPago?: string;
    };

/** Opciones del filtro único de estado (vista inicial: "todas"). */
export type EstadoFiltro = "todas" | "pagada" | "pendiente";

/**
 * Arma las filas de la tabla: primero los pagos adicionales en orden
 * de fecha ascendente, después las cuotas en orden de número
 * ascendente. El orden se garantiza aquí, no depende del ORDER BY.
 */
export function buildPaymentRows(
  cuotas: Installment[],
  extras: ExtraPayment[]
): PaymentRow[] {
  const filasExtras: PaymentRow[] = [...extras]
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id.localeCompare(b.id))
    .map((extra) => ({
      tipo: "extra" as const,
      id: extra.id,
      concepto: extra.concepto ?? "—",
      monto: extra.monto,
      fecha: extra.fecha,
      userId: extra.userId,
    }));

  const filasCuotas: PaymentRow[] = [...cuotas]
    .sort((a, b) => a.numero - b.numero)
    .map((cuota) => ({
      tipo: "cuota" as const,
      id: cuota.id,
      numero: cuota.numero,
      valor: cuota.valor,
      fechaLimite: cuota.fechaLimite,
      estado: cuota.estado,
      userId: cuota.userId,
      fechaPago: cuota.fechaPago,
    }));

  return [...filasExtras, ...filasCuotas];
}

/**
 * Filtra por estado: las cuotas según el filtro elegido y los pagos
 * adicionales SIEMPRE (el filtro solo afecta a las cuotas). Una cuota
 * "vencida" llega ya convertida en "pendiente" desde la capa de
 * datos, por eso entra en el filtro "Pendientes".
 */
export function filterRowsByEstado(
  filas: PaymentRow[],
  filtro: EstadoFiltro
): PaymentRow[] {
  if (filtro === "todas") return filas;
  return filas.filter(
    (fila) => fila.tipo === "extra" || fila.estado === filtro
  );
}
