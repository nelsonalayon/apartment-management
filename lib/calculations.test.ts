import { describe, expect, it } from "vitest";
import {
  getApartmentSummary,
  getGeneralSummary,
  getUserSummary,
} from "@/lib/calculations";
import { apartments, installments, users } from "@/data/mock-data";
import type { Apartment, ExtraPayment, Installment } from "@/lib/types";

/** Pagos adicionales de prueba (regla: SÍ cuentan hacia la cuota inicial). */
const extras: ExtraPayment[] = [
  { id: "e1", apartmentId: "101", monto: 1_000_000, concepto: "separación", fecha: "2026-01-15", userId: "ana" },
  { id: "e2", apartmentId: "202", monto: 500_000, concepto: "reforma", fecha: "2026-02-10", userId: "carlos" },
];

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
    codigo: "x",
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

describe("pagos adicionales (extras)", () => {
  it("suman al valor pagado del apartamento y bajan el pendiente", () => {
    const s = getApartmentSummary(apto101!, installments, extras);

    // 15.000.000 (cuotas pagadas) + 1.000.000 (extra e1 del 101)
    expect(s.valorPagado).toBe(16_000_000);
    expect(s.valorPendiente).toBe(20_000_000); // 36.000.000 − 16.000.000
    // 16.000.000 / 36.000.000 × 100 = 44,444...
    expect(s.avance).toBeCloseTo(44.44, 1);
  });

  it("los extras del OTRO apartamento no cuentan", () => {
    const s = getApartmentSummary(apto202!, installments, extras);

    // 10.500.000 + solo el extra e2 del 202 (500.000); e1 (del 101) no suma
    expect(s.valorPagado).toBe(11_000_000);
    expect(s.valorPendiente).toBe(17_000_000); // 28.000.000 − 11.000.000
    // 11.000.000 / 28.000.000 × 100 = 39,2857...
    expect(s.avance).toBeCloseTo(39.29, 1);
  });

  it("el avance con extras nunca supera 100%", () => {
    const fakeApartment: Apartment = {
      id: "x",
      codigo: "x",
      nombre: "Apartamento de prueba",
      valorTotal: 100_000,
      cuotaInicial: 500_000,
    };
    const cuotas: Installment[] = [
      { id: "c1", numero: 1, apartmentId: "x", valor: 400_000, fechaLimite: "2026-01-01", estado: "pagada", userId: "ana", fechaPago: "2026-01-01" },
    ];
    const extraGrande: ExtraPayment[] = [
      { id: "e9", apartmentId: "x", monto: 900_000, fecha: "2026-01-02", userId: "ana" },
    ];

    const s = getApartmentSummary(fakeApartment, cuotas, extraGrande);

    expect(s.valorPagado).toBe(1_300_000); // sí suma el total real...
    expect(s.avance).toBe(100); // ...pero el avance se topa en 100
    expect(s.valorPendiente).toBe(0); // y el pendiente nunca es negativo
  });

  it("suman al total pagado del usuario", () => {
    const ana = users.find((u) => u.id === "ana");
    const s = getUserSummary(ana!, installments, extras);

    // 9.500.000 (cuotas) + 1.000.000 (extra e1 de ana) = 10.500.000
    expect(s.cuotasPagadas).toBe(3);
    expect(s.totalPagado).toBe(10_500_000);
    expect(s.apartamentos).toEqual(["101", "202"]);
  });

  it("un extra agrega el apartamento a la lista del usuario", () => {
    const carlos = users.find((u) => u.id === "carlos");
    const s = getUserSummary(carlos!, installments, extras);

    // 6.000.000 (cuotas, solo 101) + 500.000 (extra e2 en el 202)
    expect(s.cuotasPagadas).toBe(2); // los extras no son cuotas
    expect(s.totalPagado).toBe(6_500_000);
    expect(s.apartamentos).toEqual(["101", "202"]);
  });

  it("suman en el resumen general", () => {
    const g = getGeneralSummary(apartments, installments, extras);

    // 25.500.000 (cuotas) + 1.000.000 + 500.000 = 27.000.000
    expect(g.totalPagado).toBe(27_000_000);
    expect(g.totalPendiente).toBe(37_000_000); // 64.000.000 − 27.000.000
    // 27.000.000 / 64.000.000 × 100 = 42,1875
    expect(g.avance).toBeCloseTo(42.19, 1);
    expect(g.cuotasPagadas).toBe(8); // los extras no cambian el conteo
  });

  it("la suma de usuarios = total general (incluyendo extras)", () => {
    const totalUsuarios = users.reduce(
      (total, user) => total + getUserSummary(user, installments, extras).totalPagado,
      0
    );

    expect(totalUsuarios).toBe(getGeneralSummary(apartments, installments, extras).totalPagado);
  });
});
