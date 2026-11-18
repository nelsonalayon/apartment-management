import { describe, expect, it } from "vitest";
import { clearFailures, registerFailure, remainingLockMs } from "./rate-limit";

const WINDOW_MS = 5 * 60_000;

describe("rate-limit (límite de intentos de login)", () => {
  it("por debajo del límite no bloquea", () => {
    expect(registerFailure("bajo-1", 1_000)).toBe(0);
    expect(registerFailure("bajo-1", 2_000)).toBe(0);
    expect(registerFailure("bajo-1", 3_000)).toBe(0);
    expect(remainingLockMs("bajo-1", 3_000)).toBe(0);
  });

  it("al5º intento fallido bloquea durante la ventana", () => {
    for (let i = 0; i < 4; i++) expect(registerFailure("bloqueo", 10_000)).toBe(0);
    expect(registerFailure("bloqueo", 10_000)).toBe(WINDOW_MS);
    expect(remainingLockMs("bloqueo", 10_000)).toBe(WINDOW_MS);
    // El bloqueo va contando hacia atrás.
    expect(remainingLockMs("bloqueo", 10_000 + 60_000)).toBe(WINDOW_MS - 60_000);
  });

  it("tras vencer la ventana se vuelve a permitir", () => {
    for (let i = 0; i < 5; i++) registerFailure("vence", 100_000);
    expect(remainingLockMs("vence", 100_000 + WINDOW_MS - 1)).toBeGreaterThan(0);
    expect(remainingLockMs("vence", 100_000 + WINDOW_MS)).toBe(0);
    // Nueva ventana: el contador empezó de cero.
    expect(registerFailure("vence", 100_000 + WINDOW_MS)).toBe(0);
  });

  it("un login correcto limpia el contador", () => {
    for (let i = 0; i < 4; i++) registerFailure("limpia", 200_000);
    clearFailures("limpia");
    expect(registerFailure("limpia", 200_000)).toBe(0);
    expect(remainingLockMs("limpia", 200_000)).toBe(0);
  });

  it("las claves son independientes (un usuario no bloquea a otro)", () => {
    for (let i = 0; i < 5; i++) registerFailure("usuario-a", 300_000);
    expect(remainingLockMs("usuario-a", 300_000)).toBeGreaterThan(0);
    expect(remainingLockMs("usuario-b", 300_000)).toBe(0);
  });

  it("una clave desconocida no tiene bloqueo", () => {
    expect(remainingLockMs("nunca-vista", 400_000)).toBe(0);
  });
});
