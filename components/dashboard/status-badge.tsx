import { Badge } from "@/components/ui/badge";
import type { InstallmentState } from "@/lib/types";

/** Etiqueta de estado: verde para pagada, naranja para pendiente. */
export function StatusBadge({ estado }: { estado: InstallmentState }) {
  if (estado === "pagada") {
    return <Badge>Pagada</Badge>;
  }

  return (
    <Badge
      variant="outline"
      className="border-amber-300 bg-amber-50 font-medium text-amber-700"
    >
      Pendiente
    </Badge>
  );
}
