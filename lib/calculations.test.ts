import { describe, expect, it } from "vitest";
import {
  getApartmentSummary,
  getGeneralSummary,
  getUserApartmentSummary,
  getUserSummary,
} from "@/lib/calculations";
import { buildPaymentRows } from "@/lib/installments";
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

  it("avance exacto al 100% → pendiente 0 (caso 6)", () => {
    // Pagado justo = cuota inicial (500.000), sin pasarse
    const cuotas: Installment[] = [
      { id: "c1", numero: 1, apartmentId: "x", valor: 500_000, fechaLimite: "2026-01-01", estado: "pagada", userId: "ana", fechaPago: "2026-01-01" },
    ];

    const s = getApartmentSummary(fakeApartment, cuotas);

    expect(s.valorPagado).toBe(500_000);
    expect(s.avance).toBe(100);
    expect(s.valorPendiente).toBe(0);
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

describe("getUserApartmentSummary", () => {
  const ana = users.find((u) => u.id === "ana")!;
  const carlos = users.find((u) => u.id === "carlos")!;
  const andres = users.find((u) => u.id === "andres")!;

  it("suma solo los pagos del apartamento indicado (caso 5)", () => {
    const en101 = getUserApartmentSummary(ana, apto101!, installments, extras);
    const en202 = getUserApartmentSummary(ana, apto202!, installments, extras);

    // 101: cuotas 1 y 3 (6.000.000) + extra e1 (1.000.000)
    expect(en101.cuotasPagadas).toBe(2);
    expect(en101.totalPagado).toBe(7_000_000);
    // 202: solo su cuota 3 (3.500.000); nada del 101 se mezcla
    expect(en202.cuotasPagadas).toBe(1);
    expect(en202.totalPagado).toBe(3_500_000);
  });

  it("usuario solo con extras en el apartamento → tienePagos true (CA-7.1)", () => {
    // Carlos no tiene cuotas pagadas en el 202, solo el extra e2
    const en202 = getUserApartmentSummary(carlos, apto202!, installments, extras);

    expect(en202.cuotasPagadas).toBe(0);
    expect(en202.totalPagado).toBe(500_000);
    expect(en202.tienePagos).toBe(true);
  });

  it("sin pagos en el apartamento → tienePagos false (caso 13)", () => {
    // Andrés no pagó nada en el 101 (ni cuotas ni extras)
    const andresEn101 = getUserApartmentSummary(andres, apto101!, installments, extras);
    expect(andresEn101.cuotasPagadas).toBe(0);
    expect(andresEn101.totalPagado).toBe(0);
    expect(andresEn101.tienePagos).toBe(false);

    // ...pero sí tiene pago en el 202 (su cuota 2)
    const andresEn202 = getUserApartmentSummary(andres, apto202!, installments, extras);
    expect(andresEn202.tienePagos).toBe(true);
    expect(andresEn202.totalPagado).toBe(3_500_000);
  });
});

describe("estados vacíos (defensa, RF-10)", () => {
  const aptoVacio: Apartment = {
    id: "vacio",
    codigo: "vacio",
    nombre: "Apartamento vacío",
    valorTotal: 1_000_000,
    cuotaInicial: 1_000_000,
  };

  it("apartamento sin ningún pago → resumen en 0, avance 0 (caso 13)", () => {
    const s = getApartmentSummary(aptoVacio, [], []);

    expect(s.totalCuotas).toBe(0);
    expect(s.cuotasPagadas).toBe(0);
    expect(s.valorPagado).toBe(0);
    expect(s.valorPendiente).toBe(1_000_000); // todo sigue pendiente
    expect(s.avance).toBe(0);
  });

  it("sin cuotas pero con extras → avance > 0 (caso 12)", () => {
    const extrasVacio: ExtraPayment[] = [
      { id: "ev1", apartmentId: "vacio", monto: 100_000, concepto: "separación", fecha: "2026-01-10", userId: "ana" },
    ];
    const s = getApartmentSummary(aptoVacio, [], extrasVacio);

    expect(s.totalCuotas).toBe(0); // "sin cuotas registradas"
    expect(s.valorPagado).toBe(100_000);
    expect(s.valorPendiente).toBe(900_000);
    expect(s.avance).toBe(10); // 100.000 / 1.000.000 × 100
  });
});

describe("flujo de la página del apartamento", () => {
  // Reproduce el orden de la página: alcance → resumen → filas → usuarios.

  it("el código exacto 101/202 se encuentra; direcciones inválidas no (RF-9)", () => {
    const buscar = (codigo: string) => apartments.find((a) => a.codigo === codigo);

    expect(buscar("101")).toBeDefined();
    expect(buscar("202")).toBeDefined();
    expect(buscar("101 ")).toBeUndefined(); // espacio sobrante
    expect(buscar("")).toBeUndefined(); // vacío
    expect(buscar("303")).toBeUndefined(); // no existe
    expect(buscar("abc")).toBeUndefined(); // letras
  });

  it("101: resumen, filas (extras arriba) y lista de usuarios", () => {
    const apto = apartments.find((a) => a.codigo === "101")!;
    const extras101 = extras.filter((e) => e.apartmentId === apto.id);
    const cuotas101 = installments.filter((c) => c.apartmentId === apto.id);

    // 1) Resumen (RF-5): 16.000.000 pagados (15.000.000 cuotas + 1.000.000 extra)
    const resumen = getApartmentSummary(apto, installments, extras101);
    expect(resumen.valorPagado).toBe(16_000_000);
    expect(resumen.valorPendiente).toBe(20_000_000);
    expect(resumen.avance).toBeCloseTo(44.44, 1);

    // 2) Filas (RF-6/RF-8): el extra e1 primero, luego las 12 cuotas 1..12
    const filas = buildPaymentRows(cuotas101, extras101);
    expect(filas).toHaveLength(13);
    expect(filas[0]).toMatchObject({ tipo: "extra", id: "e1" });
    expect(
      filas.slice(1).map((fila) => (fila.tipo === "cuota" ? fila.numero : -1))
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    // 3) Usuarios (RF-7): ana, carlos y laura; Andrés no pagó nada en el 101
    const usuarios = users
      .map((user) => getUserApartmentSummary(user, apto, installments, extras101))
      .filter((s) => s.tienePagos);

    expect(usuarios.map((s) => s.user.id)).toEqual(["ana", "carlos", "laura"]);

    // 4) La suma de lo pagado por cada usuario = valorPagado del resumen
    const sumaUsuarios = usuarios.reduce((total, s) => total + s.totalPagado, 0);
    expect(sumaUsuarios).toBe(resumen.valorPagado); // 7M + 6M + 3M = 16M
  });
});
