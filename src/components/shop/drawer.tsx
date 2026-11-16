import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { useFocusTrap } from "@/hooks/use-focus-trap"
import { cn } from "@/lib/utils"

/** Panel lateral en computador, hoja inferior en celular. */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  const panel = useRef<HTMLDivElement>(null)
  useFocusTrap(panel, open)

  useEffect(() => {
    if (!open) return
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => {
      document.documentElement.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  return (
    <div className={cn("fixed inset-0 z-[80]", open ? "visible" : "invisible delay-300")} aria-hidden={!open}>
      <div onClick={onClose} className={cn("absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "absolute inset-x-0 bottom-0 flex max-h-[94dvh] flex-col rounded-t-2xl border-t border-border bg-surface outline-none transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]",
          "sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[480px] sm:rounded-none sm:border-l sm:border-t-0",
          open ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-x-full sm:translate-y-0",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-4">
          <h2 className="font-display text-2xl uppercase leading-none">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid size-11 shrink-0 place-items-center rounded-full border border-border transition-colors hover:border-foreground/50">
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="shrink-0 border-t border-border bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  )
}
