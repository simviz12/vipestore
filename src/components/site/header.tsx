import { useEffect, useRef, useState } from "react"
import { Menu, Search, ShoppingBag, X } from "lucide-react"
import { useFocusTrap } from "@/hooks/use-focus-trap"
import { cn } from "@/lib/utils"
import { Logo } from "./logo"

const links = [
  { href: "#lookbook", label: "Lookbook" },
  { href: "#catalogo", label: "Catálogo" },
  { href: "#como-comprar", label: "Cómo comprar" },
  { href: "#tienda", label: "La tienda" },
]

export function Header({ cart, onCart, onSearch }: { cart: number; onCart: () => void; onSearch: () => void }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menu = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  useFocusTrap(menu, open, closeBtn)

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on()
    window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [])

  useEffect(() => {
    if (!open) return
    document.documentElement.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => {
      document.documentElement.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
          scrolled ? "border-b border-border/70 bg-background/85 backdrop-blur-md" : "border-b border-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:h-20 sm:px-8">
          <a href="#top" aria-label="Viper Store, inicio">
            <Logo />
          </a>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="label rounded-full px-4 py-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onSearch} className="grid size-11 place-items-center rounded-full border border-border transition-colors hover:border-foreground/50" aria-label="Buscar en el catálogo">
              <Search className="size-5" />
            </button>
            <button
              type="button"
              onClick={onCart}
              className="relative flex h-11 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-transform active:scale-[0.96]"
              aria-label={`Abrir bolsa, ${cart} productos`}
            >
              <ShoppingBag className="size-4" />
              <span className="hidden sm:inline">Bolsa</span>
              <span
                key={cart}
                className={cn(
                  "grid h-5 min-w-5 place-items-center rounded-full px-1 text-xs tabular-nums [animation:pop_.35s_cubic-bezier(.2,.8,.3,1)]",
                  cart > 0 ? "bg-primary text-white" : "bg-background/15",
                )}
              >
                {cart}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid size-11 place-items-center rounded-full border border-border lg:hidden"
              aria-label="Abrir menú"
              aria-expanded={open}
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Menú móvil */}
      <div
        ref={menu}
        className={cn(
          "fixed inset-0 z-[60] flex flex-col bg-background transition-[opacity,visibility] duration-300 lg:hidden",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Logo />
          <button ref={closeBtn} type="button" onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full border border-border" aria-label="Cerrar menú">
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col justify-center gap-2 px-6" aria-label="Móvil">
          {links.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={cn(
                "border-b border-border py-4 font-display text-4xl uppercase transition-[opacity,transform] duration-500",
                open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
              )}
              style={{ transitionDelay: open ? `${80 + i * 50}ms` : "0ms" }}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <p className="px-6 pb-8 font-tag text-2xl text-primary">Good vibes only ☺</p>
      </div>
    </>
  )
}
