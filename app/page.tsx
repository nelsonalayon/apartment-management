import { ApartmentCard } from "@/components/dashboard/apartment-card";
import { Header } from "@/components/dashboard/header";
import { InstallmentsSection } from "@/components/dashboard/installments-section";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { UsersSummary } from "@/components/dashboard/users-summary";
import {
  getApartmentSummary,
  getGeneralSummary,
  getUserSummary,
} from "@/lib/calculations";
import { apartments, installments, users } from "@/data/mock-data";

/**
 * Dashboard principal (Server Component).
 * Los cálculos se hacen aquí a partir de los datos mock
 * y el resultado se pasa a los componentes como props.
 */
export default function Home() {
  const general = getGeneralSummary(apartments, installments);
  const apartmentSummaries = apartments.map((apartment) =>
    getApartmentSummary(apartment, installments)
  );
  const userSummaries = users.map((user) =>
    getUserSummary(user, installments)
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <Header />

      {/* ---------- Resumen general ---------- */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Resumen general
        </h2>
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
        <UsersSummary summaries={userSummaries} />
      </section>

      {/* ---------- Cuotas ---------- */}
      <InstallmentsSection
        installments={installments}
        apartments={apartments}
        users={users}
      />
    </main>
  );
}
