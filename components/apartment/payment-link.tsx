import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Apartment } from "@/lib/types";

/**
 * Card "Pagar apartamento {codigo}" (RF-13, RF-15, RF-16): link nativo
 * al href de consignación de la BD (apartamento.link_consignacion) con
 * los parámetros apto e inmueble; sin linkConsignacion no renderiza nada.
 */
export function PaymentLink({ apartment }: { apartment: Apartment }) {
  if (!apartment.linkConsignacion) {
    return null;
  }

  const href =
    apartment.linkConsignacion +
    (apartment.linkConsignacion.includes("?") ? "&" : "?") +
    "apto=" +
    encodeURIComponent(apartment.id) +
    (apartment.numeroInmueble != null
      ? "&inmueble=" + encodeURIComponent(String(apartment.numeroInmueble))
      : "");
    console.log("this is apartment : " + JSON.stringify(apartment));

  return (
    <Card className="max-w-md">
      <CardHeader>        
        <CardTitle>Link para el pago de la cuota del apartamento {apartment.numeroInmueble}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Referencia del pago: {apartment.id}
        </p>
        <p className="text-sm text-muted-foreground">
          Torre y Apartamento: {apartment.numeroInmueble ?? "—"}
        </p>
        <Link
          href={href}
          className="w-fit rounded-md text-sm text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          target="_blank"
        >
          <Button>Acceder al pago</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
