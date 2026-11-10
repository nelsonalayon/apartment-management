import type { Apartment, ExtraPayment, Installment, User } from "./types";

/**
 * Cálculos automáticos del MVP.
 *
 * Todas las funciones son puras: reciben datos y devuelven resultados.
 * Todo se deriva de las cuotas (installments) y de los pagos
 * adicionales (extras), así que si los datos cambian, los resúmenes
 * se actualizan solos.
 */

/** Resumen de un apartamento. */
export type ApartmentSummary = {
  apartment: Apartment;
  totalCuotas: number;
  cuotasPagadas: number;
  cuotasPendientes: number;
  valorPagado: number;
  valorPendiente: number;
  /** Porcentaje de avance (0 a 100, nunca mayor a 100). */
  avance: number;
};

/** Resumen de un usuario. */
export type UserSummary = {
  user: User;
  cuotasPagadas: number;
  totalPagado: number;
  /** Ids de los apartamentos a los que ha pagado. */
  apartamentos: string[];
};

/** Resumen general del dashboard. */
export type GeneralSummary = {
  totalApartamentos: number;
  totalCuotaInicial: number;
  totalPagado: number;
  totalPendiente: number;
  cuotasPagadas: number;
  cuotasPendientes: number;
  /** Porcentaje de avance general (0 a 100). */
  avance: number;
};

/**
 * Calcula el resumen de un apartamento a partir de sus cuotas.
 * - valorPagado = suma de las cuotas PAGADAS + los pagos adicionales
 *   del apartamento (las pendientes no cuentan).
 * - valorPendiente = cuotaInicial - valorPagado (nunca negativo).
 * - avance = valorPagado / cuotaInicial * 100 (máximo 100%).
 */
export function getApartmentSummary(
  apartment: Apartment,
  installments: Installment[],
  extras: ExtraPayment[] = []
): ApartmentSummary {
  const cuotas = installments.filter(
    (cuota) => cuota.apartmentId === apartment.id
  );
  const pagadas = cuotas.filter((cuota) => cuota.estado === "pagada");

  const valorCuotasPagadas = pagadas.reduce(
    (total, cuota) => total + cuota.valor,
    0
  );
  const extrasDelApartamento = extras.filter(
    (extra) => extra.apartmentId === apartment.id
  );
  const valorPagado =
    valorCuotasPagadas +
    extrasDelApartamento.reduce((total, extra) => total + extra.monto, 0);
  const valorPendiente = Math.max(0, apartment.cuotaInicial - valorPagado);
  const avance =
    apartment.cuotaInicial > 0
      ? Math.min(100, (valorPagado / apartment.cuotaInicial) * 100)
      : 0;

  return {
    apartment,
    totalCuotas: cuotas.length,
    cuotasPagadas: pagadas.length,
    cuotasPendientes: cuotas.length - pagadas.length,
    valorPagado,
    valorPendiente,
    avance,
  };
}

/**
 * Calcula el resumen de un usuario a partir de las cuotas que pagó
 * y los pagos adicionales que realizó.
 * No es necesario que todos los usuarios paguen lo mismo.
 */
export function getUserSummary(
  user: User,
  installments: Installment[],
  extras: ExtraPayment[] = []
): UserSummary {
  const pagadas = installments.filter(
    (cuota) => cuota.estado === "pagada" && cuota.userId === user.id
  );

  const extrasDelUsuario = extras.filter((extra) => extra.userId === user.id);
  const totalPagado =
    pagadas.reduce((total, cuota) => total + cuota.valor, 0) +
    extrasDelUsuario.reduce((total, extra) => total + extra.monto, 0);
  const apartamentos = [
    ...new Set([
      ...pagadas.map((cuota) => cuota.apartmentId),
      ...extrasDelUsuario.map((extra) => extra.apartmentId),
    ]),
  ];

  return {
    user,
    cuotasPagadas: pagadas.length,
    totalPagado,
    apartamentos,
  };
}

/**
 * Calcula el resumen general de todos los apartamentos, cuotas
 * y pagos adicionales.
 */
export function getGeneralSummary(
  apartments: Apartment[],
  installments: Installment[],
  extras: ExtraPayment[] = []
): GeneralSummary {
  const totalCuotaInicial = apartments.reduce(
    (total, apartment) => total + apartment.cuotaInicial,
    0
  );

  const pagadas = installments.filter((cuota) => cuota.estado === "pagada");
  const totalPagado =
    pagadas.reduce((total, cuota) => total + cuota.valor, 0) +
    extras.reduce((total, extra) => total + extra.monto, 0);
  const totalPendiente = Math.max(0, totalCuotaInicial - totalPagado);

  const avance =
    totalCuotaInicial > 0
      ? Math.min(100, (totalPagado / totalCuotaInicial) * 100)
      : 0;

  return {
    totalApartamentos: apartments.length,
    totalCuotaInicial,
    totalPagado,
    totalPendiente,
    cuotasPagadas: pagadas.length,
    cuotasPendientes: installments.length - pagadas.length,
    avance,
  };
}
