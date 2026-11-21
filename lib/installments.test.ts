import { describe, expect, it } from "vitest";
import { buildPaymentRows, filterRowsByEstado } from "@/lib/installments";
import { installments } from "@/data/mock-data";
import type { ExtraPayment, Installment } from "@/lib/types";

/** Cuotas del 101 del mock: 12 en total (5 pagadas, 7 pendientes). */
const cuotas101 = installments.filter((cuota) => cuota.apartmentId === "101");

/** Extras de prueba, llegando desordenados a propósito. */
const extras: ExtraPayment[] = [
  { id: "e2", apartmentId: "101", monto: 500_000, concepto: "reforma", fecha: "2026-05-01", userId: "carlos" },
  { id: "e1", apartmentId: "101", monto: 1_000_000, concepto: "separación", fecha: "2026-01-15", userId: "ana" },
  { id: "e3", apartmentId: "101", monto: 200_000, fecha: "2026-03-10", userId: "laura" }, // sin concepto
];

describe("buildPaymentRows", () => {
  it("los pagos adicionales van primero y las cuotas después", () => {
    const filas = buildPaymentRows(cuotas101, extras);

    expect(filas).toHaveLength(15); // 3 extras + 12 cuotas
    expect(filas.slice(0, 3).every((fila) => fila.tipo === "extra")).toBe(true);
    expect(filas.slice(3).every((fila) => fila.tipo === "cuota")).toBe(true);
  });

  it("los extras se ordenan por fecha ascendente", () => {
    const fechas = buildPaymentRows(cuotas101, extras)
      .filter((fila) => fila.tipo === "extra")
      .map((fila) => (fila.tipo === "extra" ? fila.fecha : ""));

    expect(fechas).toEqual(["2026-01-15", "2026-03-10", "2026-05-01"]);
  });

  it("las cuotas conservan su número fijo y van en orden ascendente", () => {
    // Llegan en el orden 3, 1, 2
    const desordenadas: Installment[] = [cuotas101[2], cuotas101[0], cuotas101[1]];
    const numeros = buildPaymentRows(desordenadas, []).map((fila) =>
      fila.tipo === "cuota" ? fila.numero : -1
    );

    expect(numeros).toEqual([1, 2, 3]); // no se renumera ni se reordena
  });

  it("solo cuotas → todas las filas son cuotas con sus datos", () => {
    const filas = buildPaymentRows(cuotas101.slice(0, 2), []);

    expect(filas).toHaveLength(2);
    expect(filas.every((fila) => fila.tipo === "cuota")).toBe(true);
    expect(filas[0]).toMatchObject({ numero: 1, valor: 3_000_000, fechaLimite: "2026-01-15" });
  });

  it("solo extras → todas las filas son extras", () => {
    const filas = buildPaymentRows([], extras);

    expect(filas).toHaveLength(3);
    expect(filas.every((fila) => fila.tipo === "extra")).toBe(true);
  });

  it("arrays vacíos → sin filas", () => {
    expect(buildPaymentRows([], [])).toEqual([]);
  });

  it("un extra sin concepto muestra «—» en lugar de undefined", () => {
    const filas = buildPaymentRows([], [extras[2]]); // e3 sin concepto

    expect(filas[0]).toMatchObject({ tipo: "extra", concepto: "—" });
  });
});

describe("filterRowsByEstado", () => {
  const filas = buildPaymentRows(cuotas101, extras); // 3 extras + 12 cuotas

  it("«todas» muestra todo (vista inicial)", () => {
    expect(filterRowsByEstado(filas, "todas")).toHaveLength(15);
  });

  it("«pagada» muestra solo las cuotas pagadas y todos los extras", () => {
    const visibles = filterRowsByEstado(filas, "pagada");

    expect(visibles.filter((fila) => fila.tipo === "cuota")).toHaveLength(5);
    expect(visibles.filter((fila) => fila.tipo === "extra")).toHaveLength(3);
  });

  it("«pendiente» muestra solo las cuotas pendientes y todos los extras", () => {
    const visibles = filterRowsByEstado(filas, "pendiente");

    expect(visibles.filter((fila) => fila.tipo === "cuota")).toHaveLength(7);
    expect(visibles.filter((fila) => fila.tipo === "extra")).toHaveLength(3);
  });

  it("el filtro nunca oculta los pagos adicionales (CA-8.3)", () => {
    for (const filtro of ["todas", "pagada", "pendiente"] as const) {
      const extrasVisibles = filterRowsByEstado(filas, filtro).filter(
        (fila) => fila.tipo === "extra"
      );
      expect(extrasVisibles).toHaveLength(3);
    }
  });

  it("un filtro que deja 0 cuotas conserva solo los extras (caso 11)", () => {
    const soloPagadas = buildPaymentRows(
      cuotas101.filter((cuota) => cuota.estado === "pagada"),
      []
    );
    const visibles = filterRowsByEstado(soloPagadas, "pendiente");

    expect(visibles.filter((fila) => fila.tipo === "cuota")).toHaveLength(0);
  });

  it("una cuota «vencida» (llega como pendiente) entra en «Pendientes» (caso 9)", () => {
    // La capa de datos convierte vencida → pendiente (data/db.ts); el
    // filtro la trata como pendiente en badge y en filtro.
    const vencida: Installment = {
      id: "v1",
      numero: 13,
      apartmentId: "101",
      valor: 100,
      fechaLimite: "2020-01-01",
      estado: "pendiente",
    };
    const filasVencida = buildPaymentRows([vencida], []);

    expect(filterRowsByEstado(filasVencida, "pendiente")).toHaveLength(1);
    expect(filterRowsByEstado(filasVencida, "pagada")).toHaveLength(0);
  });
});
