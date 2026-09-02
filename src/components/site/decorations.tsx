import { cn } from "@/lib/utils";

/** Deterministic pseudo-random so the server and client agree on positions. */
function scatter(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

const shapes = ["square", "circle", "ribbon", "triangle"] as const;
const colours = ["#b4614f", "#c9a227", "#e2b7ae", "#8f4839"];

/**
 * Falling gift-paper confetti. Purely decorative, so it is hidden from
 * assistive technology and disabled entirely under prefers-reduced-motion.
 */
export function Confetti({ count = 18, className }: { count?: number; className?: string }) {
  const pieces = Array.from({ length: count }, (_, index) => {
    const a = scatter(index + 1);
    const b = scatter(index + 41);
    const c = scatter(index + 97);
    return {
      left: `${(a * 100).toFixed(2)}%`,
      size: 6 + Math.round(b * 10),
      colour: colours[index % colours.length],
      shape: shapes[index % shapes.length],
      duration: `${(7 + c * 7).toFixed(2)}s`,
      delay: `${(-c * 12).toFixed(2)}s`,
      drift: `${Math.round((b - 0.5) * 120)}px`,
      spin: `${Math.round(180 + c * 540)}deg`,
      opacity: (0.25 + b * 0.35).toFixed(2),
    };
  });

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {pieces.map((piece, index) => (
        <span
          key={index}
          className="tgy-confetti absolute top-0 block"
          style={
            {
              left: piece.left,
              width: piece.size,
              height: piece.shape === "ribbon" ? piece.size * 2 : piece.size,
              backgroundColor: piece.shape === "triangle" ? "transparent" : piece.colour,
              borderRadius:
                piece.shape === "circle" ? "9999px" : piece.shape === "ribbon" ? "2px" : "1px",
              borderLeft: piece.shape === "triangle" ? `${piece.size / 2}px solid transparent` : undefined,
              borderRight: piece.shape === "triangle" ? `${piece.size / 2}px solid transparent` : undefined,
              borderBottom: piece.shape === "triangle" ? `${piece.size}px solid ${piece.colour}` : undefined,
              "--tgy-duration": piece.duration,
              "--tgy-delay": piece.delay,
              "--tgy-drift": piece.drift,
              "--tgy-spin": piece.spin,
              "--tgy-opacity": piece.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** Paper bunting, the kind strung across a room for a birthday. */
export function Bunting({ className }: { className?: string }) {
  const flags = Array.from({ length: 14 }, (_, index) => ({
    colour: colours[index % colours.length],
    delay: `${(scatter(index + 7) * 2).toFixed(2)}s`,
    duration: `${(4 + scatter(index + 13) * 3).toFixed(2)}s`,
  }));

  return (
    <div aria-hidden="true" className={cn("pointer-events-none flex justify-between gap-1 px-2", className)}>
      {flags.map((flag, index) => (
        <span
          key={index}
          className="tgy-sway block h-4 w-3 origin-top sm:h-5 sm:w-4"
          style={
            {
              backgroundColor: flag.colour,
              opacity: 0.55,
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              "--tgy-delay": flag.delay,
              "--tgy-duration": flag.duration,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
