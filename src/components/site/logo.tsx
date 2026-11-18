import { cn } from "@/lib/utils"

/** Corona minimalista de Viper Store V2 */
export function CrownIcon({ className, strokeWidth = 2.4 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" className={className}>
      <path d="M5 21L3 7l9 6 8-10 8 10 9-6-2 14z" />
    </svg>
  )
}

/** Diamante geométrico de Viper Store V2 */
export function Diamond({ className, strokeWidth = 4 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 56" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" className={className}>
      <path d="M12 4h40l10 14-30 36L2 18z" />
      <path d="M2 18h60M22 18l10 36 10-36" />
    </svg>
  )
}

/** Logo horizontal: diamante + VIPER (Anton) + Store (Permanent Marker en azul eléctrico) */
export function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={cn("inline-flex items-center", size === "sm" ? "gap-2.5" : size === "lg" ? "gap-3.5" : "gap-2.5 sm:gap-3", className)}>
      <Diamond
        strokeWidth={size === "sm" ? 4.2 : 3.8}
        className={cn(
          "shrink-0 text-[#F2F4F7]",
          size === "sm" ? "h-[22px] w-[25px]" : size === "lg" ? "h-[38px] w-[44px]" : "h-[24px] w-[28px] sm:h-[28px] sm:w-[32px]",
        )}
      />
      <span className="inline-flex items-baseline gap-1.5 sm:gap-2">
        <span
          className={cn(
            "font-display uppercase leading-none tracking-[0.03em] text-[#F2F4F7]",
            size === "sm" ? "text-[24px]" : size === "lg" ? "text-[42px]" : "text-[24px] sm:text-[30px]",
          )}
        >
          VIPER
        </span>
        <span
          className={cn(
            "font-marker inline-block -rotate-[4deg] leading-none text-[#2E8BFF]",
            size === "sm" ? "text-[16px]" : size === "lg" ? "text-[28px]" : "text-[16px] sm:text-[20px]",
          )}
        >
          Store
        </span>
      </span>
    </span>
  )
}
