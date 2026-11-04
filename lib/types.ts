/**
 * Tipos de la aplicación.
 * Definen la forma de los datos que usamos en todo el MVP.
 */

/** Apartamento con sus datos generales. */
export type Apartment = {
  /** Identificador corto, ej. "101". */
  id: string;
  /** Nombre visible, ej. "Apartamento 101". */
  nombre: string;
  /** Valor total del apartamento en pesos. */
  valorTotal: number;
  /** Valor de la cuota inicial que se debe completar. */
  cuotaInicial: number;
};

/** Usuario que realiza pagos. */
export type User = {
  id: string;
  nombre: string;
};

/** Estado de una cuota. */
export type InstallmentState = "pagada" | "pendiente";

/** Cuota de la cuota inicial. */
export type Installment = {
  id: string;
  /** Número de cuota dentro del apartamento (1, 2, 3...). */
  numero: number;
  /** Apartamento al que pertenece la cuota. */
  apartmentId: string;
  /** Valor de esta cuota en pesos. */
  valor: number;
  /** Fecha programada de pago (ISO "YYYY-MM-DD"). */
  fechaLimite: string;
  estado: InstallmentState;
  /** Usuario que pagó. Solo presente cuando estado === "pagada". */
  userId?: string;
  /** Fecha en que se realizó el pago (ISO "YYYY-MM-DD"). Solo cuando está pagada. */
  fechaPago?: string;
};
