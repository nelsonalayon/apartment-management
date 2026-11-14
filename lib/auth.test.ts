import { describe, expect, it } from "vitest";
import {
  generatePin,
  hashPin,
  signSession,
  verifyPin,
  verifySession,
} from "./auth";

describe("PINs", () => {
  it("generatePin devuelve siempre 4 dígitos", () => {
    for (let i = 0; i < 100; i++) {
      expect(generatePin()).toMatch(/^\d{4}$/);
    }
  });

  it("hashPin → verifyPin acepta el PIN correcto", () => {
    const stored = hashPin("4271");

    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(verifyPin("4271", stored)).toBe(true);
  });

  it("verifyPin rechaza el PIN incorrecto", () => {
    const stored = hashPin("4271");

    expect(verifyPin("4272", stored)).toBe(false);
    expect(verifyPin("", stored)).toBe(false);
  });

  it("el mismo PIN se hashea con sal distinta cada vez", () => {
    expect(hashPin("4271")).not.toBe(hashPin("4271"));
  });

  it("verifyPin rechaza hashes manipulados o con formato inválido", () => {
    const valid = hashPin("4271");
    const [algo, salt] = valid.split("$");

    expect(verifyPin("4271", `${algo}$${salt}$AAAA`)).toBe(false);
    expect(verifyPin("4271", "")).toBe(false);
    expect(verifyPin("4271", "nada")).toBe(false);
    expect(verifyPin("4271", "scrypt$solo-dos-partes")).toBe(false);
    expect(verifyPin("4271", "sha256$abc$def")).toBe(false);
  });
});

describe("sesión firmada", () => {
  const secret = "secreto-de-prueba";
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;

  it("firma y verifica correctamente", () => {
    const value = signSession("1738900000239", exp, secret);

    expect(verifySession(value, secret)).toEqual({
      userId: "1738900000239",
      expiresAt: exp,
    });
  });

  it("rechaza un valor manipulado", () => {
    const value = signSession("1", exp, secret);
    const tampered = `9.${value.split(".")[1]}.${value.split(".")[2]}`;

    expect(verifySession(tampered, secret)).toBeNull();
  });

  it("rechaza otra clave secreta distinta", () => {
    const value = signSession("1", exp, secret);

    expect(verifySession(value, "otro-secreto")).toBeNull();
  });

  it("rechaza una sesión expirada", () => {
    const past = Math.floor(Date.now() / 1000) - 1;
    const value = signSession("1", past, secret);

    expect(verifySession(value, secret)).toBeNull();
  });

  it("rechaza formatos inválidos", () => {
    expect(verifySession("", secret)).toBeNull();
    expect(verifySession("sin-firma", secret)).toBeNull();
    expect(verifySession("..", secret)).toBeNull();
    expect(verifySession("1.abc.xyz", secret)).toBeNull();
  });
});
