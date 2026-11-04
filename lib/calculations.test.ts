import { describe, expect, it } from "vitest";
import {
  getApartmentSummary,
  getGeneralSummary,
  getUserSummary,
} from "@/lib/calculations";
import { apartments, installments, users } from "@/data/mock-data";
import type { Apartment, Installment } from "@/lib/types";

const apto101 = apartments.find((a) => a.id === "101");
const apto202 = apartments.find((a) => a.id === "202");

describe("getApartmentSummary", () => {
  it("resumen del apartamento 101", () => {
    const s = getApartmentSummary(apto101!, installments);

    expect(s.totalCuotas).toBe(12);
    expect(s.cuotasPagadas).toBe(5);
    expect(s.cuotasPendientes).toBe(7);
    expect(s.valorPagado).toBe(15_000_000);
    expect(s.valorPendiente).toBe(21_000_000);
    // 15.000.000 / 36.000.000 × 100 = 41,666...
    expect(s.avance).toBeCloseTo(41.67, 1);
  });

  it("resumen del apartamento 202", () => {
    const s = getApartmentSummary(apto202!, installments);

    expect(s.totalCuotas).toBe(8);
    expect(s.cuotasPagadas).toBe(3);
    expect(s.cuotasPendientes).toBe(5);
    expect(s.valorPagado).toBe(10_500_000);
    expect(s.valorPendiente).toBe(17_500_000);
    // 10.500.000 / 28.000.000 × 100 = 37,5 (exacto)
    expect(s.avance).toBe(37.5);
  });

  it("las cuotas pendientes nunca suman al valor pagado", () => {
    const s = getApartmentSummary(apto101!, installments);

    // Solo las 5 pagadas: 5 × 3.000.000
    expect(s.valorPagado).toBe(
      installments
        .filter((c) => c.apartmentId === "101" && c.estado === "pagada")
        .reduce((total, c) => total + c.valor, 0)
    );
  });
});

describe("getGeneralSummary", () => {
  it("totales generales del dashboard", () => {
    const g = getGeneralSummary(apartments, installments);

    expect(g.totalApartamentos).toBe(2);
    expect(g.totalCuotaInicial).toBe(64_000_000);
    expect(g.totalPagado).toBe(25_500_000);
    expect(g.totalPendiente).toBe(38_500_000);
    expect(g.cuotasPagadas).toBe(8);
    expect(g.cuotasPendientes).toBe(12);
    // 25.500.000 / 64.000.000 × 100 = 39,84375
    expect(g.avance).toBeCloseTo(39.84, 1);
  });

  it("pagado + pendiente = cuota inicial", () => {
    const g = getGeneralSummary(apartments, installments);

    expect(g.totalPagado + g.totalPendiente).toBe(g.totalCuotaInicial);
  });
});

describe("getUserSummary", () => {
  it("Ana pagó en los dos apartamentos", () => {
    const ana = users.find((u) => u.id === "ana");
    const s = getUserSummary(ana!, installments);

    expect(s.cuotasPagadas).toBe(3); // 101-1, 101-3, 202-3
    expect(s.totalPagado).toBe(9_500_000); // 3.000.000 × 2 + 3.500.000
    expect(s.apartamentos).toEqual(["101", "202"]);
  });

  it("Carlos solo pagó en el 101", () => {
    const carlos = users.find((u) => u.id === "carlos");
    const s = getUserSummary(carlos!, installments);

    expect(s.cuotasPagadas).toBe(2);
    expect(s.totalPagado).toBe(6_000_000);
    expect(s.apartamentos).toEqual(["101"]);
  });

  it("Andrés solo pagó una cuota en el 202", () => {
    const andres = users.find((u) => u.id === "andres");
    const s = getUserSummary(andres!, installments);

    expect(s.cuotasPagadas).toBe(1);
    expect(s.totalPagado).toBe(3_500_000);
    expect(s.apartamentos).toEqual(["202"]);
  });

  it("la suma de lo pagado por todos los usuarios = total pagado", () => {
    const totalUsuarios = users.reduce(
      (total, user) => total + getUserSummary(user, installments).totalPagado,
      0
    );

    expect(totalUsuarios).toBe(getGeneralSummary(apartments, installments).totalPagado);
  });
});

describe("límites de avance", () => {
  const fakeApartment: Apartment = {
    id: "x",
    nombre: "Apartamento de prueba",
    valorTotal: 100_000,
    cuotaInicial: 500_000,
  };

  it("el avance nunca supera 100%", () => {
    // Cuotas pagadas que suman MÁS que la cuota inicial (dato inconsistente)
    const cuotas: Installment[] = [
      { id: "c1", numero: 1, apartmentId: "x", valor: 400_000, fechaLimite: "2026-01-01", estado: "pagada", userId: "ana", fechaPago: "2026-01-01" },
      { id: "c2", numero: 2, apartmentId: "x", valor: 400_000, fechaLimite: "2026-02-01", estado: "pagada", userId: "ana", fechaPago: "2026-02-01" },
    ];

    const s = getApartmentSummary(fakeApartment, cuotas);

    expect(s.avance).toBe(100);
    expect(s.valorPendiente).toBe(0); // nunca negativo
  });

  it("con cuota inicial en 0 el avance es 0 (sin división por cero)", () => {
    const sinInicial: Apartment = { ...fakeApartment, cuotaInicial: 0 };
    const s = getApartmentSummary(sinInicial, []);

    expect(s.avance).toBe(0);
  });
});
