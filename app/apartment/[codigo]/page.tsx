import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ApartmentSummary } from "@/components/apartment/apartment-summary";
import { ApartmentUsers } from "@/components/apartment/apartment-users";
import { DataError } from "@/components/apartment/data-error";
import {  CardHeader } from "@/components/ui/card";
import { InstallmentsTable } from "@/components/apartment/installments-table";
import { PaymentLink } from "@/components/apartment/payment-link";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import {
  getApartments,
  getExtraPayments,
  getInstallments,
  getUsers,
} from "@/data/db";
import {
  getApartmentSummary,
  getUserApartmentSummary,
} from "@/lib/calculations";
import { buildPaymentRows } from "@/lib/installments";
import { getCurrentUser } from "@/lib/session";
import type {
  Apartment,
  ExtraPayment,
  Installment,
  User,
} from "@/lib/types";

/**
 * Página del apartamento (spec 001, Server Component).
 * Shell al instante (Header + "← Volver"); params, sesión, BD y
 * cálculos dentro de <Suspense> con skeleton (mismo patrón que el
 * dashboard). Sin generateStaticParams: params y BD son de runtime.
 * NOTA (Cache Components, Next 16): no se puede forzar dynamic = "force-dynamic".
 */
export default function ApartmentPage({
  params,
}: PageProps<"/apartment/[codigo]">) {  
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <Header />
      
        <Link
          href="/"         
        >
          <Button size="lg">
            <span>←  Volver al dashboard principal</span>
          </Button>
        </Link>      
      

      <Suspense fallback={<ApartmentLoading />}>
        <ApartmentContent params={params} />
      </Suspense>
    </main>
  );
}

/** Mientras la BD responde, el shell ya está en pantalla. */
function ApartmentLoading() {
  return (
    <section
      className="flex flex-col gap-8"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Cargando datos del apartamento...</span>
      <div className="h-40 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
      <div className="h-64 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
      <div className="h-32 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
    </section>
  );
}

/**
 * Contenido bajo Suspense (plan §6, pseudocódigo A):
 * 1) params → 2) sesión (try aquí; redirect fuera) → 3) consultas
 * (try, todo o nada) → 4) notFound() fuera del try → 5) alcance por
 * apartamento → 6) cálculos puros → 7) render.
 */
async function ApartmentContent({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;

  // 2) Sesión (RF-1): sin cookie o inválida → login, sin consultar la BD
  // de apartamentos. Si la BD falla al revalidar → RF-11 (nunca login
  // como error ni "no encontrado"); redirect() queda fuera del try.
  let user: User | null;
  try {
    user = await getCurrentUser();
  } catch (e) {
    return <DataError />;
  }
  if (!user) {
    // CA-1.1: llevar al login recordando la dirección pedida (CA-1.3 via T26).
    redirect("/login?next=" + encodeURIComponent("/apartment/" + codigo));
  }

  // 3) Consultas (RF-11): todo o nada; una sola falla → DataError,
  // nunca datos mezclados (CA-11.4) ni "no encontrado" (CA-11.3).
  let apartments: Apartment[];
  let installments: Installment[];
  let extras: ExtraPayment[];
  let users: User[];
  try {
    [apartments, installments, extras, users] = await Promise.all([
      getApartments(),
      getInstallments(),
      getExtraPayments(),
      getUsers(),
    ]);
  } catch {
    return <DataError />;
  }

  // 4) Dirección exacta (RF-9): fuera del try para que notFound() no
  // caiga en el catch; "101 " o "303" no coinciden → no encontrado.
  const apartment = apartments.find((item) => item.codigo === codigo);
  if (!apartment) {
    notFound();
  }

  // 5) Alcance (RF-4): solo lo de este apartamento (CA-4.2).
  const cuotas = installments.filter(
    (cuota) => cuota.apartmentId === apartment.id
  );
  const extrasApartamento = extras.filter(
    (extra) => extra.apartmentId === apartment.id
  );

  // 6) Cálculos puros (lib): resumen, filas y usuarios con pagos aquí.
  const resumen = getApartmentSummary(apartment, cuotas, extrasApartamento);
  const filas = buildPaymentRows(cuotas, extrasApartamento);
  const usuarios = users
    .map((usuario) =>
      getUserApartmentSummary(usuario, apartment, cuotas, extrasApartamento)
    )
    .filter((summary) => summary.tienePagos);

  // 7) Render (RF-5, RF-6, RF-7, RF-8).
  return (
    <>
      <CardHeader>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Detalles del Apartamento {apartment.numeroInmueble}
        </h1>        
      </CardHeader>
      <ApartmentSummary summary={resumen} />
      <PaymentLink apartment={apartment} />
      <InstallmentsTable
        filas={filas}
        totalCuotas={cuotas.length}
        users={users}
      />
      <ApartmentUsers summaries={usuarios} />
    </>
  );
}
