import { Suspense } from "react";
import { ApartmentCard } from "@/components/dashboard/apartment-card";
import { Header } from "@/components/dashboard/header";
import { InstallmentsSection } from "@/components/dashboard/installments-section";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SummaryHero } from "@/components/dashboard/summary-hero";
import { UsersSummary } from "@/components/dashboard/users-summary";
import {
  getApartments,
  getExtraPayments,
  getInstallments,
  getUsers,
} from "@/data/db";
import {
  getApartmentSummary,
  getGeneralSummary,
  getUserSummary,
} from "@/lib/calculations";

/**
 * Dashboard principal (Server Component).
 * Los datos reales se leen de MySQL en cada request: el shell (Header)
 * se sirve al instante y el contenido entra por streaming detrás de
 * <Suspense> (patrón de Cache Components para datos frescos).
 */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <Header />

      <Suspense fallback={<DashboardLoading />}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}

/** Mientras la BD responde, el shell ya está en pantalla. */
function DashboardLoading() {
  return (
    <section
      className="flex flex-col gap-8"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Cargando datos de la base de datos...</span>
      <div className="h-44 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
      <div className="h-24 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-56 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
        <div className="h-56 animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
      </div>
    </section>
  );
}

/** Consulta la BD y arma los resúmenes con cálculos puros. */
async function DashboardContent() {
  const [apartments, users, installments, extras] = await Promise.all([
    getApartments(),
    getUsers(),
    getInstallments(),
    getExtraPayments(),
  ]);

  const general = getGeneralSummary(apartments, installments, extras);
  const apartmentSummaries = apartments.map((apartment) =>
    getApartmentSummary(apartment, installments, extras)
  );
  const userSummaries = users.map((user) =>
    getUserSummary(user, installments, extras)
  );

  return (
    <>
      {/* ---------- Resumen general (hero + franja de stats) ---------- */}
      <section className="flex flex-col gap-4" aria-label="Resumen general">
        <SummaryHero summary={general} />
        <SummaryCards summary={general} />
      </section>

      {/* ---------- Apartamentos ---------- */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Apartamentos</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {apartmentSummaries.map((summary) => (
            <ApartmentCard key={summary.apartment.id} summary={summary} />
          ))}
        </div>
      </section>

      {/* ---------- Usuarios ---------- */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Usuarios</h2>
        <UsersSummary summaries={userSummaries} apartments={apartments} />
      </section>

      {/* ---------- Cuotas ---------- */}
      <InstallmentsSection
        installments={installments}
        apartments={apartments}
        users={users}
      />
    </>
  );
}
