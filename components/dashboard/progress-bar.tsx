import { cn } from "cn";

type ProgressBarProps = {
  /** Porcentaje de avance (0 a 100). */
  value: number;
  className?: string;
};

/**
 * Barra de progreso simple hecha con React + Tailwind (sin librerías).
 * El porcentaje siempre se limita entre 0 y 100.
 */
export function ProgressBar({ value, className }: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(safeValue)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-2.5 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
    >
      <div
        className="h-full rounded-full bg-primary transition-all motion-reduce:transition-none"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
