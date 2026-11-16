import { cn } from "@/lib/utils"

/** Diamante de Viper Store, dibujado en vectores: nítido a cualquier tamaño. */
export function Diamond({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 58" className={className} aria-hidden="true" fill="none">
      {/* corona */}
      <path d="M2 21 14 4l8 17Z" fill="#7fb4ff" />
      <path d="M14 4h18L22 21Z" fill="#d6e9ff" />
      <path d="M32 4l10 17H22Z" fill="#a9ceff" />
      <path d="M32 4h18l-8 17Z" fill="#eef6ff" />
      <path d="M50 4l12 17H42Z" fill="#5c97ff" />
      {/* pabellón */}
      <path d="M2 21h20l10 34Z" fill="#2f6bff" />
      <path d="M22 21h20L32 55Z" fill="#6ea6ff" />
      <path d="M42 21h20L32 55Z" fill="#1c48c8" />
      {/* contorno y aristas */}
      <path d="M14 4h36l12 17-30 34L2 21Z" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M2 21h60M14 4l8 17 10 34M50 4l-8 17-10 34M32 4 22 21M32 4l10 17" stroke="#fff" strokeOpacity=".55" strokeWidth="1" strokeLinejoin="round" />
      {/* destello */}
      <path d="M49 9.5c.4 2.3 1.2 3.1 3.5 3.5-2.3.4-3.1 1.2-3.5 3.5-.4-2.3-1.2-3.1-3.5-3.5 2.3-.4 3.1-1.2 3.5-3.5Z" fill="#fff" />
    </svg>
  )
}

/** Logo completo: diamante + nombre. */
export function Logo({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  const lg = size === "lg"
  return (
    <span className={cn("inline-flex items-center", lg ? "gap-3.5" : "gap-2.5", className)}>
      <Diamond className={cn("shrink-0 drop-shadow-[0_0_14px_rgb(47_107_255/0.75)]", lg ? "h-12 w-auto" : "h-9 w-auto sm:h-10")} />
      <span className="flex flex-col leading-none">
        <span className={cn("font-display uppercase tracking-wide", lg ? "text-4xl" : "text-2xl sm:text-[1.7rem]")}>Viper</span>
        <span className={cn("font-sans font-extrabold uppercase text-primary-glow", lg ? "mt-1 text-[11px] tracking-[0.56em]" : "mt-0.5 text-[8px] tracking-[0.5em] sm:text-[9px]")}>Store</span>
      </span>
    </span>
  )
}

/** Sello redondo con el diamante, para usar como sticker. */
export function LogoBadge({ className }: { className?: string }) {
  return (
    <span className={cn("grid place-items-center rounded-full bg-[#0a0b0d] ring-4 ring-background shadow-[0_0_0_1px_rgb(134_168_255/0.5),0_18px_50px_-8px_rgb(47_107_255/0.8)]", className)}>
      <Diamond className="w-[52%] drop-shadow-[0_0_12px_rgb(47_107_255/0.9)]" />
    </span>
  )
}
