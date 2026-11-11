import type { Apartment, Installment, User } from "@/lib/types";

/**
 * Datos de ejemplo (mock).
 *
 * Esta es la ÚNICA fuente de datos del MVP.
 * Más adelante se puede reemplazar por datos de una API o base de datos
 * sin tocar los componentes, siempre que se mantenga la misma forma (types.ts).
 */

/* ------------------------------ Apartamentos ------------------------------ */

export const apartments: Apartment[] = [
  {
    id: "101",
    codigo: "101",
    nombre: "Apartamento 101",
    valorTotal: 180_000_000,
    cuotaInicial: 36_000_000,
  },
  {
    id: "202",
    codigo: "202",
    nombre: "Apartamento 202",
    valorTotal: 140_000_000,
    cuotaInicial: 28_000_000,
  },
];

/* -------------------------------- Usuarios -------------------------------- */

export const users: User[] = [
  { id: "ana", nombre: "Ana Martínez" },
  { id: "carlos", nombre: "Carlos Gómez" },
  { id: "laura", nombre: "Laura Rodríguez" },
  { id: "andres", nombre: "Andrés Pérez" },
];

/* --------------------------------- Cuotas --------------------------------- */
/*
 * Apartamento 101: 12 cuotas de $3.000.000 (día 15 de cada mes).
 *   Pagadas: 5  →  $15.000.000  (cuotas 1 a 5)
 *
 * Apartamento 202: 8 cuotas de $3.500.000 (fecha programada irregular).
 *   Pagadas: 3  →  $10.500.000  (cuotas 1 a 3)
 *
 * Total: 20 cuotas → 8 pagadas ($25.500.000) y 12 pendientes.
 */

export const installments: Installment[] = [
  // ---------- Apartamento 101 ----------
  { id: "a101-1", numero: 1, apartmentId: "101", valor: 3_000_000, fechaLimite: "2026-01-15", estado: "pagada", userId: "ana", fechaPago: "2026-01-10" },
  { id: "a101-2", numero: 2, apartmentId: "101", valor: 3_000_000, fechaLimite: "2026-02-15", estado: "pagada", userId: "carlos", fechaPago: "2026-02-12" },
  { id: "a101-3", numero: 3, apartmentId: "101", valor: 3_000_000, fechaLimite: "2026-03-15", estado: "pagada", userId: "ana", fechaPago: "2026-03-08" },
  { id: "a101-4", numero: 4, apartmentId: "101", valor: 3_000_000, fechaLimite: "2026-04-15", estado: "pagada", userId: "laura", fechaPago: "2026-04-14" },
  { id: "a101-5", numero: 5, apartmentId: "101", valor: 3_000_000, fechaLimite: "2026-05-15", estado: "pagada", userId: "carlos", fechaPago: "2026-05-09" },
  { id: "a101-6", numero: 6, apartmentId: "101", valor: 3_000_000, fechaLimite: "2026-06-15", estado: "pendiente" },
  { id: "a101-7", numero: 7, apartmentId: "101", valor: 3_000_000, fechaLimite: "2026-07-15", estado: "pendiente" },
  { id: "a101-8", numero: 8, apartmentId: "101", valor: 3_000_000, fechaLimite: "2026-08-15", estado: "pendiente" },
  { id: "a101-9", numero: 9, apartmentId: "101", valor: 3_000_000, fechaLimite: "2026-09-15", estado: "pendiente" },
  { id: "a101-10", numero: 10, apartmentId: "101", valor: 3_000_000, fechaLimite: "2026-10-15", estado: "pendiente" },
  { id: "a101-11", numero: 11, apartmentId: "101", valor: 3_000_000, fechaLimite: "2026-11-15", estado: "pendiente" },
  { id: "a101-12", numero: 12, apartmentId: "101", valor: 3_000_000, fechaLimite: "2026-12-15", estado: "pendiente" },

  // ---------- Apartamento 202 ----------
  { id: "a202-1", numero: 1, apartmentId: "202", valor: 3_500_000, fechaLimite: "2026-01-20", estado: "pagada", userId: "laura", fechaPago: "2026-01-18" },
  { id: "a202-2", numero: 2, apartmentId: "202", valor: 3_500_000, fechaLimite: "2026-02-20", estado: "pagada", userId: "andres", fechaPago: "2026-02-19" },
  { id: "a202-3", numero: 3, apartmentId: "202", valor: 3_500_000, fechaLimite: "2026-03-20", estado: "pagada", userId: "ana", fechaPago: "2026-03-15" },
  { id: "a202-4", numero: 4, apartmentId: "202", valor: 3_500_000, fechaLimite: "2026-05-20", estado: "pendiente" },
  { id: "a202-5", numero: 5, apartmentId: "202", valor: 3_500_000, fechaLimite: "2026-07-20", estado: "pendiente" },
  { id: "a202-6", numero: 6, apartmentId: "202", valor: 3_500_000, fechaLimite: "2026-09-20", estado: "pendiente" },
  { id: "a202-7", numero: 7, apartmentId: "202", valor: 3_500_000, fechaLimite: "2026-11-20", estado: "pendiente" },
  { id: "a202-8", numero: 8, apartmentId: "202", valor: 3_500_000, fechaLimite: "2026-12-20", estado: "pendiente" },
];
