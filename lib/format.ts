/**
 * Helpers para mostrar valores en pantalla.
 */

/** Formato de dinero en pesos colombianos. Ej: 75000000 → "$75.000.000" */
const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatCOP(value: number): string {
  return copFormatter.format(value);
}

/** Formato de porcentaje con máximo 2 decimales. Ej: 39.8437 → "39,84%" */
export function formatPercent(value: number): string {
  return `${value.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;
}

/** Formato de fecha ISO ("2026-01-15") → "15 ene 2026" */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  // Se crea la fecha en horario local para evitar desfases de zona horaria.
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
