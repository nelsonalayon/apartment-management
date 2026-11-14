/**
 * Capa de datos: consultas a la base de datos MySQL local.
 *
 * Reemplaza a data/mock-data.ts en runtime; los componentes no cambian
 * porque devolvemos los mismos tipos de lib/types.ts.
 * Credenciales en .env.local (nunca en git ni en documentación).
 *
 * Nota de tipos: pool.query<T> exige T extends QueryResult, así que los
 * tipos de fila extienden RowDataPacket (patrón estándar de mysql2).
 */
import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2/promise";
import type { Apartment, ExtraPayment, Installment, User } from "@/lib/types";

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  // DATE → "YYYY-MM-DD" (lo espera lib/format.ts, sin desfases de zona horaria).
  dateStrings: true,
  connectionLimit: 5,
});

/** Fila de la tabla `apartamento` (ya con los alias de la query). */
interface ApartmentRow extends RowDataPacket {
  id: string;
  nombre: string;
  valorTotal: number;
  cuotaInicial: number;
}

/** Fila de la tabla `persona`. */
interface UserRow extends RowDataPacket {
  id: number;
  nombre: string;
}

/** Fila de `persona` con el hash del PIN (login). */
interface UserPinRow extends RowDataPacket {
  pin_hash: string | null;
}

/** Fila de `cuotas` con la fecha de pago desde el JOIN con `pagos`. */
interface InstallmentRow extends RowDataPacket {
  idcuota: number;
  numero_cuota: number;
  referenciaApto: string;
  valor_cuota: number;
  fecha_vencimiento: string;
  estado: string;
  quien_debe_pagar: number;
  fecha_pago: string | null;
}

/** Fila de la tabla `pagos_adicionales`. */
interface ExtraPaymentRow extends RowDataPacket {
  id_pago_extra: number;
  referenciaApto: string;
  monto: number;
  concepto: string | null;
  fecha_pago: string;
  quien_pago: number | null;
}

/**
 * Códigos cortos que usa el negocio ("apartamentos 101 y 202").
 * La BD solo guarda la referencia larga, así que se deriva aquí
 * (capa de datos) y los componentes solo lo muestran.
 */
const CODIGOS_CORTOS: Record<string, string> = {
  "Torre 1": "101",
  "Torre 2": "202",
};

/** Apartamentos reales (tabla `apartamento`). */
export async function getApartments(): Promise<Apartment[]> {
  const [rows] = await pool.query<ApartmentRow[]>(
    `SELECT referenciaApto AS id,
            nombre_apartamento AS nombre,
            COALESCE(Valor_apartamento, 0) AS valorTotal,
            COALESCE(cuota_inicial, 0) AS cuotaInicial
     FROM apartamento
     ORDER BY nombre_apartamento`
  );
  return rows.map((row) => ({
    ...row,
    codigo: CODIGOS_CORTOS[row.nombre] ?? row.nombre,
  }));
}

/** Pagadores reales (tabla `persona`). */
export async function getUsers(): Promise<User[]> {
  const [rows] = await pool.query<UserRow[]>(
    `SELECT idperson AS id, nombre FROM persona ORDER BY nombre`
  );
  return rows.map((row) => ({ id: String(row.id), nombre: row.nombre }));
}

/** Usuario por su id (para revalidar la sesión al leerla). null si no existe. */
export async function getUserById(id: string): Promise<User | null> {
  const [rows] = await pool.query<UserRow[]>(
    `SELECT idperson AS id, nombre FROM persona WHERE idperson = ?`,
    [id]
  );
  const row = rows[0];
  return row ? { id: String(row.id), nombre: row.nombre } : null;
}

/**
 * Hash scrypt del PIN de un usuario (columna `pin_hash` de `persona`).
 * null si el usuario no tiene PIN asignado → no puede iniciar sesión.
 */
export async function getUserPinHash(id: string): Promise<string | null> {
  const [rows] = await pool.query<UserPinRow[]>(
    `SELECT pin_hash FROM persona WHERE idperson = ?`,
    [id]
  );
  return rows[0]?.pin_hash ?? null;
}

/**
 * Cuotas reales (tabla `cuotas`) con la fecha de pago desde `pagos`.
 * El enum de la BD admite "vencida"; el MVP la muestra como "pendiente"
 * (hoy no hay ninguna en la base).
 */
export async function getInstallments(): Promise<Installment[]> {
  const [rows] = await pool.query<InstallmentRow[]>(
    `SELECT c.idcuota, c.numero_cuota, c.referenciaApto, c.valor_cuota,
            c.fecha_vencimiento, c.estado, c.quien_debe_pagar, p.fecha_pago
     FROM cuotas c
     LEFT JOIN pagos p ON p.idcuota = c.idcuota
     ORDER BY c.referenciaApto, c.numero_cuota`
  );

  return rows.map((row): Installment => {
    const pagada = row.estado === "pagada";
    return {
      id: String(row.idcuota),
      numero: row.numero_cuota,
      apartmentId: row.referenciaApto,
      valor: row.valor_cuota,
      fechaLimite: row.fecha_vencimiento,
      estado: pagada ? "pagada" : "pendiente",
      ...(pagada && {
        userId: String(row.quien_debe_pagar),
        fechaPago: row.fecha_pago ?? undefined,
      }),
    };
  });
}

/** Pagos adicionales reales (tabla `pagos_adicionales`). */
export async function getExtraPayments(): Promise<ExtraPayment[]> {
  const [rows] = await pool.query<ExtraPaymentRow[]>(
    `SELECT id_pago_extra, referenciaApto, monto, concepto, fecha_pago, quien_pago
     FROM pagos_adicionales
     ORDER BY fecha_pago, id_pago_extra`
  );

  return rows.map((row) => ({
    id: String(row.id_pago_extra),
    apartmentId: row.referenciaApto,
    monto: row.monto,
    concepto: row.concepto ?? undefined,
    fecha: row.fecha_pago,
    userId: row.quien_pago != null ? String(row.quien_pago) : undefined,
  }));
}
