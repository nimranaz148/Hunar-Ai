import { Mascot, type MascotVariant } from "./Mascot";

const BG: Record<MascotVariant, string> = {
  hijab: "bg-[var(--color-marigold)]",
  dupatta: "bg-[var(--color-lilac)]",
};

/**
 * Round face-crop of the mascot, used wherever an AI agent speaks instead of a generic robot icon.
 * `size` is in px. The mascot art is 400x520 with the face centred at (200, 258); it is scaled so
 * the face fills the circle.
 */
export function MascotAvatar({ size = 40, variant = "hijab", className = "" }: { size?: number; variant?: MascotVariant; className?: string }) {
  const width = size * 1.9;
  const height = width * 1.3;
  return (
    <span
      aria-hidden
      className={`relative inline-block shrink-0 overflow-hidden rounded-full border-2 border-[var(--color-ink)] ${BG[variant]} ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="absolute block" style={{ width, height, left: size / 2 - width / 2, top: size / 2 - height * (258 / 520) }}>
        <Mascot variant={variant} className="h-full w-full" />
      </span>
    </span>
  );
}
