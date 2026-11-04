import type { Apartment, Installment, User } from "./types";

/**
 * Cálculos automáticos del MVP.
 *
 * Todas las funciones son puras: reciben datos y devuelven resultados.
 * Todo se deriva de las cuotas (installments), así que si los datos
 * cambian, los resúmenes se actualizan solos.
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
 * - valorPagado = suma de las cuotas PAGADAS (las pendientes no cuentan).
 * - valorPendiente = cuotaInicial - valorPagado.
 * - avance = valorPagado / cuotaInicial * 100 (máximo 100%).
 */
export function getApartmentSummary(
  apartment: Apartment,
  installments: Installment[]
): ApartmentSummary {
  const cuotas = installments.filter(
    (cuota) => cuota.apartmentId === apartment.id
  );
  const pagadas = cuotas.filter((cuota) => cuota.estado === "pagada");

  const valorPagado = pagadas.reduce((total, cuota) => total + cuota.valor, 0);
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
 * Calcula el resumen de un usuario a partir de las cuotas que pagó.
 * No es necesario que todos los usuarios paguen lo mismo.
 */
export function getUserSummary(
  user: User,
  installments: Installment[]
): UserSummary {
  const pagadas = installments.filter(
    (cuota) => cuota.estado === "pagada" && cuota.userId === user.id
  );

  const totalPagado = pagadas.reduce((total, cuota) => total + cuota.valor, 0);
  const apartamentos = [...new Set(pagadas.map((cuota) => cuota.apartmentId))];

  return {
    user,
    cuotasPagadas: pagadas.length,
    totalPagado,
    apartamentos,
  };
}

/**
 * Calcula el resumen general de todos los apartamentos y cuotas.
 */
export function getGeneralSummary(
  apartments: Apartment[],
  installments: Installment[]
): GeneralSummary {
  const totalCuotaInicial = apartments.reduce(
    (total, apartment) => total + apartment.cuotaInicial,
    0
  );

  const pagadas = installments.filter((cuota) => cuota.estado === "pagada");
  const totalPagado = pagadas.reduce((total, cuota) => total + cuota.valor, 0);
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
