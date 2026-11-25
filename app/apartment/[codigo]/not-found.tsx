import Link from "next/link";

/**
 * "Apartamento no encontrado" (RF-9, CA-9.1): el código de la dirección
 * no coincide exacto con ninguno existente y la BD respondió.
 * Enlace "← Volver" al dashboard (CA-12.1); server component dentro del
 * root layout → respeta el tema claro/oscuro con tokens (regla 9).
 */
export default function ApartmentNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Apartamento no encontrado
      </h1>
      <p className="text-muted-foreground">
        La dirección no corresponde a un apartamento existente.
      </p>
      <Link
        href="/"
        className="rounded-md text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        ← Volver
      </Link>
    </main>
  );
}
