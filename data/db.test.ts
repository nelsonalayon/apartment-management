/**
 * Tests de la capa de datos: `getApartments` con los campos de la
 * consignación (`link_consignacion`, `numeroInmueble`) añadidos en T01.
 *
 * El nombre de la columna de la BD es `apartamento.numeroInmueble`
 * (verificado con `node scripts/db-diagnostic.mjs`).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Apartment } from "@/lib/types";

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock("mysql2/promise", () => ({
  default: {
    createPool: () => ({ query: queryMock }),
  },
}));

import { getApartments } from "@/data/db";

/** Apartamento con los campos de consignación que se esperan (T02). */
type ApartamentoConVinculos = Apartment & {
  linkConsignacion?: string;
  numeroInmueble?: number;
};

describe("getApartments — link_consignacion y numeroInmueble", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("el SELECT pide link_consignacion y numeroInmueble de apartamento", async () => {
    queryMock.mockResolvedValue([[]]);
    await getApartments();

    const sql = String(queryMock.mock.calls[0][0]);
    expect(sql).toContain("apartamento.link_consignacion AS linkConsignacion");
    expect(sql).toContain("apartamento.numeroInmueble");
  });

  it("devuelve linkConsignacion y numeroInmueble leídos de la BD", async () => {
    queryMock.mockResolvedValue([
      [
        {
          id: "Torre 1",
          nombre: "Torre 1",
          valorTotal: 100,
          cuotaInicial: 50,
          linkConsignacion: "https://ejemplo.local/pagos/101",
          numeroInmueble: 101,
        },
      ],
    ]);

    const a = (await getApartments())[0] as ApartamentoConVinculos;
    expect(a.linkConsignacion).toBe("https://ejemplo.local/pagos/101");
    expect(a.numeroInmueble).toBe(101);
  });

  it("los campos quedan sin null (null → undefined, como en getInstallments)", async () => {
    queryMock.mockResolvedValue([
      [
        {
          id: "Torre 1",
          nombre: "Torre 1",
          valorTotal: 0,
          cuotaInicial: 0,
          linkConsignacion: null,
          numeroInmueble: null,
        },
      ],
    ]);

    const a = (await getApartments())[0] as ApartamentoConVinculos;
    expect(a.linkConsignacion).toBeUndefined();
    expect(a.numeroInmueble).toBeUndefined();
  });
});
