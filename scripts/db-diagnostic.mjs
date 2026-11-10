// Diagnóstico: muestra el esquema real de la BD para mapearlo a lib/types.ts
// Uso: node scripts/db-diagnostic.mjs   (lee .env.local sin dependencias extra)
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const env = {};
const raw = await readFile(new URL("../.env.local", import.meta.url), "utf8");
for (const line of raw.split(/\r?\n/)) {
  if (line.trim().startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}

if (!env.DATABASE_USER) {
  console.error("Falta DATABASE_USER en .env.local");
  process.exit(1);
}

const conn = await mysql.createConnection({
  host: env.DATABASE_HOST || "localhost",
  port: Number(env.DATABASE_PORT || 3306),
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD || "",
});

console.log(`Conectado a MySQL en ${env.DATABASE_HOST || "localhost"}:${env.DATABASE_PORT || 3306} como ${env.DATABASE_USER}`);

const [dbs] = await conn.query("SHOW DATABASES");
const names = dbs.map((r) => Object.values(r)[0]);
console.log(`\nBases de datos disponibles: ${names.join(", ")}`);

if (!env.DATABASE_NAME) {
  console.error("\nFalta DATABASE_NAME en .env.local — elegí una de las anteriores.");
  await conn.end();
  process.exit(1);
}

console.log(`Usando: ${env.DATABASE_NAME}`);

const [tables] = await conn.query(`SHOW TABLES IN \`${env.DATABASE_NAME}\``);
if (tables.length === 0) {
  console.log("La base no tiene tablas.");
  await conn.end();
  process.exit(0);
}

for (const row of tables) {
  const table = Object.values(row)[0];
  const [countRows] = await conn.query(`SELECT COUNT(*) AS total FROM \`${env.DATABASE_NAME}\`.\`${table}\``);
  console.log(`\n=== ${table} (${countRows[0].total} filas) ===`);
  const [desc] = await conn.query(`DESCRIBE \`${env.DATABASE_NAME}\`.\`${table}\``);
  console.table(desc.map((d) => ({ Campo: d.Field, Tipo: d.Type, Key: d.Key, Null: d.Null })));
  const [sample] = await conn.query(`SELECT * FROM \`${env.DATABASE_NAME}\`.\`${table}\` LIMIT 3`);
  console.log("Muestra (3 filas):");
  console.log(JSON.stringify(sample, null, 2));
}

await conn.end();
console.log("\nDiagnóstico completado.");
