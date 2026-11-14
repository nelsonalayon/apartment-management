/**
 * Asigna PINs de 4 dígitos a los usuarios (tabla `persona`).
 *
 * - Crea la columna `pin_hash` si no existe (ALTER TABLE idempotente).
 * - Guarda cada PIN como hash scrypt con la misma función que usa
 *   el login (lib/auth.ts) → una sola implementación del algoritmo.
 * - Imprime los PINs UNA sola vez: después no se pueden recuperar.
 *
 * Uso:
 *   node scripts/set-pins.mts           # solo asigna a quien no tiene
 *   node scripts/set-pins.mts --reset   # regenera TODOS los PINs
 */
import fs from "node:fs";
import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2/promise";
import { generatePin, hashPin } from "../lib/auth.ts";

/** Lee .env.local (mismo patrón que scripts/db-diagnostic.mjs). */
const env: Record<string, string> = {};
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  if (line.trim().startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}

const reset = process.argv.includes("--reset");

const conn = await mysql.createConnection({
  host: env.DATABASE_HOST,
  port: Number(env.DATABASE_PORT ?? 3306),
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
});

// 1) Columna pin_hash (idempotente)
const [cols] = await conn.query<RowDataPacket[]>(
  `SHOW COLUMNS FROM persona LIKE 'pin_hash'`
);
if (cols.length === 0) {
  await conn.query(`ALTER TABLE persona ADD COLUMN pin_hash VARCHAR(255) NULL`);
  console.log("Columna `pin_hash` creada en `persona`.");
}

// 2) PINs que faltan (o todos, con --reset)
type PersonaRow = RowDataPacket & {
  idperson: number;
  nombre: string;
  pin_hash: string | null;
};

const [users] = await conn.query<PersonaRow[]>(
  `SELECT idperson, nombre, pin_hash FROM persona ORDER BY nombre`
);

const asignados: { nombre: string; pin: string }[] = [];

for (const user of users) {
  if (user.pin_hash && !reset) continue;

  let pin = generatePin();
  while (asignados.some((a) => a.pin === pin)) pin = generatePin();

  await conn.query(`UPDATE persona SET pin_hash = ? WHERE idperson = ?`, [
    hashPin(pin),
    user.idperson,
  ]);
  asignados.push({ nombre: user.nombre, pin });
}

await conn.end();

if (asignados.length === 0) {
  console.log(
    "Todos los usuarios ya tienen PIN (usa --reset para regenerarlos)."
  );
} else {
  console.log("\nPINs asignados (guárdalos: no se pueden recuperar después):\n");
  for (const a of asignados) console.log(`  ${a.nombre}: ${a.pin}`);
  console.log("");
}
