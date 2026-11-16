import { useEffect, useState } from "react"
import { Check, Minus, Plus, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"
import { addToCart, formatCOP, isSoldOut, type Product } from "@/lib/store"
import { Drawer } from "./drawer"
import { toast } from "./toast"

export function ProductDrawer({ product, onClose, onOpenCart }: { product: Product | null; onClose: () => void; onOpenCart: () => void }) {
  // Conserva el último producto mientras el panel se cierra.
  const [shown, setShown] = useState<Product | null>(product)
  useEffect(() => {
    if (product) setShown(product)
  }, [product])

  return shown ? <Panel key={shown.id} product={shown} open={!!product} onClose={onClose} onOpenCart={onOpenCart} /> : null
}

function Panel({ product: p, open, onClose, onOpenCart }: { product: Product; open: boolean; onClose: () => void; onOpenCart: () => void }) {
  const availableColors = p.colors.filter((c) => !c.soldOut)
  const availableSizes = p.sizes.filter((s) => !s.soldOut)
  // Si solo hay una opción disponible, se elige sola: un paso menos.
  const [colorId, setColorId] = useState<string | null>(availableColors.length === 1 ? availableColors[0].id : null)
  const [size, setSize] = useState<string | null>(availableSizes.length === 1 ? availableSizes[0].label : null)
  const [qty, setQty] = useState(1)
  const [imgIdx, setImgIdx] = useState(0)
  const [missing, setMissing] = useState<"" | "color" | "talla" | "ambos">("")

  const color = p.colors.find((c) => c.id === colorId) ?? null
  const preview = color ?? availableColors[0] ?? p.colors[0]
  const images = preview?.images ?? []
  const soldOut = isSoldOut(p)

  const pickColor = (id: string) => {
    setColorId(id)
    setImgIdx(0) // la galería cambia a las fotos de ese color
    setMissing((m) => (m === "ambos" ? "talla" : m === "color" ? "" : m))
  }
  const pickSize = (s: string) => {
    setSize(s)
    setMissing((m) => (m === "ambos" ? "color" : m === "talla" ? "" : m))
  }

  const submit = () => {
    if (!color || !size) {
      setMissing(!color && !size ? "ambos" : !color ? "color" : "talla")
      return
    }
    addToCart(p, color, size, qty)
    toast(`Agregado: ${p.name} · ${color.name} · Talla ${size}`, { label: "Ver bolsa", run: onOpenCart })
    onClose()
  }

  const cta = soldOut
    ? "Agotado"
    : !color && !size
      ? "Elige color y talla"
      : !color
        ? "Elige un color"
        : !size
          ? "Elige una talla"
          : `Agregar a la bolsa · ${formatCOP(p.price * qty)}`

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={p.name}
      footer={
        <div>
          {missing && (
            <p role="alert" className="mb-3 rounded-lg bg-primary/15 px-4 py-2.5 text-sm text-primary-glow">
              {missing === "ambos" ? "Te falta elegir el color y la talla." : missing === "color" ? "Te falta elegir el color." : "Te falta elegir la talla."} Tócalos arriba 👆
            </p>
          )}
          <div className="flex gap-3">
            <div className="flex h-13 shrink-0 items-center rounded-full border border-border">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Quitar uno" className="grid h-full w-11 place-items-center">
                <Minus className="size-4" />
              </button>
              <span className="w-6 text-center font-semibold tabular-nums">{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(10, q + 1))} aria-label="Agregar uno" className="grid h-full w-11 place-items-center">
                <Plus className="size-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={soldOut}
              className={cn("btn-primary min-w-0 flex-1 px-4", (!color || !size) && !soldOut && "bg-muted text-foreground hover:bg-muted", soldOut && "opacity-50")}
            >
              {color && size && <ShoppingBag className="size-4 shrink-0" />}
              <span className="truncate">{cta}</span>
            </button>
          </div>
        </div>
      }
    >
      {/* Galería: muestra las fotos del color elegido */}
      <div className="relative bg-muted">
        {images[imgIdx] ? (
          <img key={images[imgIdx]} src={images[imgIdx]} alt={`${p.name} en color ${preview.name}`} className="fade-in aspect-[4/5] max-h-[52dvh] w-full object-cover sm:max-h-none" />
        ) : (
          <div className="grid aspect-[4/5] place-items-center text-sm text-muted-foreground">Sin foto</div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium backdrop-blur">Color: {preview?.name}</span>
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-5 pt-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setImgIdx(i)}
              aria-label={`Foto ${i + 1}`}
              className={cn("size-16 shrink-0 overflow-hidden rounded-lg ring-2 ring-offset-2 ring-offset-surface transition", i === imgIdx ? "ring-primary" : "ring-transparent opacity-60")}
            >
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="space-y-7 p-5">
        <div>
          <p className="font-display text-3xl text-primary-glow">{formatCOP(p.price)}</p>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{p.description}</p>
        </div>

        {/* 1. Color */}
        <fieldset className={cn("rounded-2xl transition", (missing === "color" || missing === "ambos") && "ring-2 ring-primary ring-offset-8 ring-offset-surface")}>
          <legend className="mb-3 flex w-full items-baseline justify-between text-sm">
            <span className="font-semibold uppercase tracking-[0.12em]">1. Color</span>
            <span className={color ? "text-foreground" : "text-muted-foreground"}>{color ? color.name : "Elige uno"}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {p.colors.map((c) => {
              const on = c.id === colorId
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={c.soldOut}
                  onClick={() => pickColor(c.id)}
                  aria-pressed={on}
                  className={cn(
                    "flex h-12 items-center gap-2.5 rounded-full border-2 pl-2 pr-4 text-sm font-medium transition",
                    on ? "border-primary bg-primary/10" : "border-border hover:border-foreground/40",
                    c.soldOut && "cursor-not-allowed opacity-40",
                  )}
                >
                  <span className="grid size-7 place-items-center rounded-full ring-1 ring-white/25" style={{ background: c.hex }}>
                    {on && <Check className="size-4 text-white mix-blend-difference" strokeWidth={3} />}
                  </span>
                  <span className={c.soldOut ? "line-through" : ""}>{c.name}</span>
                  {c.soldOut && <span className="text-xs">Agotado</span>}
                </button>
              )
            })}
          </div>
        </fieldset>

        {/* 2. Talla */}
        <fieldset className={cn("rounded-2xl transition", (missing === "talla" || missing === "ambos") && "ring-2 ring-primary ring-offset-8 ring-offset-surface")}>
          <legend className="mb-3 flex w-full items-baseline justify-between text-sm">
            <span className="font-semibold uppercase tracking-[0.12em]">2. Talla</span>
            <span className={size ? "text-foreground" : "text-muted-foreground"}>{size ?? "Elige una"}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {p.sizes.map((s) => {
              const on = s.label === size
              return (
                <button
                  key={s.label}
                  type="button"
                  disabled={s.soldOut}
                  onClick={() => pickSize(s.label)}
                  aria-pressed={on}
                  className={cn(
                    "relative grid h-12 min-w-14 place-items-center rounded-lg border-2 px-3 text-sm font-semibold transition",
                    on ? "border-primary bg-primary text-white" : "border-border hover:border-foreground/40",
                    s.soldOut && "cursor-not-allowed opacity-40 line-through",
                  )}
                >
                  {s.label}
                </button>
              )
            })}
          </div>
          {p.sizes.some((s) => s.soldOut) && <p className="mt-2 text-xs text-muted-foreground">Las tallas tachadas están agotadas.</p>}
        </fieldset>
      </div>
    </Drawer>
  )
}
