import { describe, expect, it } from "vitest";
import { formatCOP, formatDate, formatPercent } from "@/lib/format";

describe("formatCOP", () => {
  it("formatea pesos colombianos sin espacio después del $", () => {
    expect(formatCOP(75_000_000)).toBe("$75.000.000");
    expect(formatCOP(64_000_000)).toBe("$64.000.000");
    expect(formatCOP(1_234_567)).toBe("$1.234.567");
    expect(formatCOP(0)).toBe("$0");
  });
});

describe("formatPercent", () => {
  it("usa coma decimal y máximo 2 decimales", () => {
    expect(formatPercent(39.84375)).toBe("39,84%");
    expect(formatPercent(41.666666)).toBe("41,67%");
    expect(formatPercent(37.5)).toBe("37,5%");
    expect(formatPercent(100)).toBe("100%");
    expect(formatPercent(0)).toBe("0%");
  });
});

describe("formatDate", () => {
  it("muestra día, mes y año de la fecha ISO", () => {
    expect(formatDate("2026-01-15")).toBe("15 de ene de 2026");
    expect(formatDate("2026-12-20")).toBe("20 de dic de 2026");
  });

  it("no se desfaza por zona horaria (usa el día exacto del ISO)", () => {
    // Si se creara con new Date("2026-01-15") en UTC-5, podría ser 14 ene.
    expect(formatDate("2026-01-15").startsWith("15")).toBe(true);
  });
});
