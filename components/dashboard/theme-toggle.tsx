"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

/**
 * Estados del tema, en el orden en que los recorre el botón:
 * Sistema → Claro → Oscuro → Sistema...
 */
const opciones = [
  { valor: "system", titulo: "Tema: sistema", Icono: Monitor },
  { valor: "light", titulo: "Tema: claro", Icono: Sun },
  { valor: "dark", titulo: "Tema: oscuro", Icono: Moon },
] as const;

/** Estos 3 helpers permiten saber si estamos en el navegador sin usar efectos. */
const suscribir = () => () => {};
const esCliente = () => true;
const esServidor = () => false;

/**
 * Botón que cambia entre modo sistema, claro y oscuro.
 * La elección la guarda next-themes en localStorage.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // En el servidor no se conoce el tema guardado; en el navegador sí.
  // useSyncExternalStore devuelve false durante la hidratación (igual que el
  // servidor) y true después, evitando diferencias de render (errores de
  // hidratación) sin usar setState dentro de efectos.
  const montado = useSyncExternalStore(suscribir, esCliente, esServidor);

  // Durante la hidratación debe renderizarse EXACTAMENTE igual que el servidor
  // (theme = undefined): por eso TODO lo que depende del tema espera a montar,
  // no solo el icono. Si no, React detecta diferencias en aria-label/title.
  const actual = montado
    ? (opciones.find((opcion) => opcion.valor === theme) ?? opciones[0])
    : opciones[0];
  const siguiente = opciones[(opciones.indexOf(actual) + 1) % opciones.length];

  const Icono = actual.Icono;

  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      aria-label={`${actual.titulo}. Activar ${siguiente.titulo.toLowerCase()}`}
      title={`${actual.titulo} — clic para cambiar`}
      onClick={() => setTheme(siguiente.valor)}
    >
      <Icono />
    </Button>
  );
}
