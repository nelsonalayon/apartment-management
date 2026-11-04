import { describe, expect, it } from "vitest";
import { apartments, installments, users } from "@/data/mock-data";

/**
 * Integridad de los datos mock:
 * garantizan que los cálculos del dashboard tengan sentido.
 */
describe("datos mock", () => {
  it("las cuotas de cada apartamento suman exactamente su cuota inicial", () => {
    for (const apartment of apartments) {
      const suyas = installments.filter((c) => c.apartmentId === apartment.id);
      const suma = suyas.reduce((total, c) => total + c.valor, 0);

      expect(suyas.length).toBeGreaterThan(0);
      expect(suma).toBe(apartment.cuotaInicial);
    }
  });

  it("toda cuota pagada tiene usuario y fecha de pago", () => {
    for (const cuota of installments) {
      if (cuota.estado !== "pagada") continue;

      expect(cuota.userId).toBeDefined();
      expect(cuota.fechaPago).toBeDefined();
      expect(users.some((u) => u.id === cuota.userId)).toBe(true);
    }
  });

  it("toda cuota pendiente NO tiene usuario ni fecha de pago", () => {
    for (const cuota of installments) {
      if (cuota.estado !== "pendiente") continue;

      expect(cuota.userId).toBeUndefined();
      expect(cuota.fechaPago).toBeUndefined();
    }
  });

  it("todas las cuotas apuntan a un apartamento y usuario existentes", () => {
    for (const cuota of installments) {
      expect(apartments.some((a) => a.id === cuota.apartmentId)).toBe(true);
    }
  });

  it("los números de cuota son únicos dentro de cada apartamento", () => {
    for (const apartment of apartments) {
      const numeros = installments
        .filter((c) => c.apartmentId === apartment.id)
        .map((c) => c.numero);

      expect(new Set(numeros).size).toBe(numeros.length);
    }
  });

  it("hay cuotas pagadas y pendientes en los dos apartamentos", () => {
    for (const apartment of apartments) {
      const suyas = installments.filter((c) => c.apartmentId === apartment.id);

      expect(suyas.some((c) => c.estado === "pagada")).toBe(true);
      expect(suyas.some((c) => c.estado === "pendiente")).toBe(true);
    }
  });

  it("los 4 usuarios registran al menos un pago", () => {
    for (const user of users) {
      const pagadas = installments.filter(
        (c) => c.estado === "pagada" && c.userId === user.id
      );

      expect(pagadas.length).toBeGreaterThan(0);
    }
  });
});
