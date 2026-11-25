"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Estado de error RF-11 (spec 001): la BD no responde.
 * El reintento es manual y libre (CA-11.1): el botón re-ejecuta el
 * Server Component en la misma URL con router.refresh(); sin reintentos
 * automáticos ni límite. Si vuelve a fallar, se muestra este mismo
 * mensaje. Nunca se pintan datos vacíos ni inventados (CA-11.2).
 */
export function DataError() {
  const router = useRouter();

  return (
    <Card role="status" aria-live="polite">
      <CardHeader>
        <CardTitle>No se pudieron cargar los datos</CardTitle>
        <CardDescription>
          La base de datos no responde en este momento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => router.refresh()}>Reintentar</Button>
      </CardContent>
    </Card>
  );
}
