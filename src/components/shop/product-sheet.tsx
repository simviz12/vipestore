import { useEffect, useMemo, useState } from "react"
import {
  formatCOP,
  isSoldOut,
  toggleFavorite,
  useFavorites,
  type ColorVariant,
  type Product,
} from "@/lib/store"

type ProductSheetProps = {
  product: Product | null
  catalog: Product[]
  onClose: () => void
  onAdd: (p: Product, color: ColorVariant, size: string, e?: React.MouseEvent<HTMLButtonElement>) => void
  onOpenCart: () => void
  onOpenSizeGuide: () => void
  onSelectProduct: (p: Product) => void
}

export function ProductSheet({
  product,
  catalog,
  onClose,
  onAdd,
  onOpenCart,
  onOpenSizeGuide,
  onSelectProduct,
}: ProductSheetProps) {
  const favorites = useFavorites()
  const [colorIdx, setColorIdx] = useState(0)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [size, setSize] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const [crossAdded, setCrossAdded] = useState(false)

  useEffect(() => {
    if (!product) return
    const firstAvailColor = Math.max(
      0,
      product.colors.findIndex((c) => !c.soldOut),
    )
    setColorIdx(firstAvailColor)
    setPhotoIdx(0)
    // Si solo hay una talla disponible (ej. ÚNICA), la dejamos lista; si hay varias, el usuario elige como en el diseño
    const availSizes = product.sizes.filter((s) => !s.soldOut)
    setSize(availSizes.length === 1 ? availSizes[0].label : null)
    setAdded(false)
    setCrossAdded(false)
  }, [product])

  useEffect(() => {
    if (!product) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [product, onClose])

  const crossSell = useMemo(() => {
    if (!product) return null
    const others = catalog.filter((p) => p.id !== product.id && !isSoldOut(p))
    return others.find((p) => p.category !== product.category) ?? others[0] ?? null
  }, [product, catalog])

  if (!product) return null

  const soldOut = isSoldOut(product)
  const color = product.colors[colorIdx] ?? product.colors[0]
  const photos = color?.images ?? []
  const currentImg = photos[photoIdx] ?? photos[0] ?? ""
  const isFav = favorites.includes(product.id)

  let ctaLabel = "ELIGE TU TALLA"
  if (soldOut) ctaLabel = "AGOTADO"
  else if (added) ctaLabel = "AGREGADO ✓ · VER CARRITO"
  else if (size) ctaLabel = `AGREGAR AL CARRITO · ${size}`

  const handleCta = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (soldOut) return
    if (added) {
      onClose()
      onOpenCart()
      return
    }
    if (!size) return
    onAdd(product, color, size, e)
    setAdded(true)
  }

  const handleCrossAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (!crossSell) return
    const c = crossSell.colors.find((x) => !x.soldOut) ?? crossSell.colors[0]
    const s = crossSell.sizes.find((x) => !x.soldOut)?.label ?? crossSell.sizes[0]?.label ?? "M"
    onAdd(crossSell, c, s, e)
    setCrossAdded(true)
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Cerrar ficha"
        onClick={onClose}
        className="vs-fade absolute inset-0 w-full border-0 bg-[rgba(5,6,8,0.8)]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="vs-sheet sm:vs-pop relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#0B0D10] text-[#E8EAED] sm:h-auto sm:max-h-[92dvh] sm:max-w-[900px] sm:flex-row sm:border sm:border-[#2A313B]"
      >
        {/* Botones flotantes arriba (Volver + Favorito) */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 sm:right-auto sm:w-1/2">
          <button
            type="button"
            aria-label="Volver"
            onClick={onClose}
            className="vs-press pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#2A313B] bg-[#0B0D10]/90 text-[#E8EAED]"
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
            onClick={() => toggleFavorite(product.id)}
            className="vs-press pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#2A313B] bg-[#0B0D10]/90"
            style={{ color: isFav ? "#2E8BFF" : "#E8EAED" }}
          >
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={isFav ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            >
              <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" />
            </svg>
          </button>
        </div>

        {/* Columna izquierda / superior: Foto del producto */}
        <div
          className="relative flex h-[43dvh] min-h-[300px] shrink-0 flex-col justify-end overflow-hidden p-4 sm:h-auto sm:min-h-[580px] sm:w-1/2"
          style={{ backgroundColor: color?.hex === "#0B0D10" ? "#1A1E24" : color?.hex || "#1A1E24" }}
          onClick={() => {
            if (photos.length > 1) setPhotoIdx((i) => (i + 1) % photos.length)
          }}
        >
          {currentImg ? (
            <img
              src={currentImg}
              alt={`${product.name} - ${color.name}`}
              className="absolute inset-0 h-full w-full cursor-pointer object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center font-mono text-[12px] tracking-[0.15em] text-[#8A94A3]">
              SIN FOTO
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0B0D10]/85 to-transparent" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="bg-[#0B0D10]/70 px-2 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[#C3CAD4]">
              {color.name}
            </span>
            {photos.length > 1 && (
              <div className="flex gap-1.5">
                {photos.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Ver foto ${idx + 1}`}
                    onClick={(ev) => {
                      ev.stopPropagation()
                      setPhotoIdx(idx)
                    }}
                    className="h-[4px] w-[20px] border-0 p-0 transition-colors"
                    style={{ background: idx === photoIdx ? "#E8EAED" : "#4A525E" }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha / inferior: Info + selectores + CTA */}
        <div className="flex min-h-0 flex-1 flex-col sm:w-1/2">
          <div className="flex-1 space-y-5 overflow-y-auto px-5 pt-5 pb-4 sm:px-7 sm:pt-7">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-block bg-[#2E8BFF] px-2 py-1 font-mono text-[11px] font-medium tracking-[0.15em] text-[#0B0D10]">
                  {soldOut ? "AGOTADO" : `${product.tag || "ORIGINAL"} · QUEDAN POCAS`}
                </span>
                <button
                  type="button"
                  aria-label="Cerrar"
                  onClick={onClose}
                  className="vs-press hidden h-9 w-9 items-center justify-center rounded-full border border-[#2A313B] bg-transparent text-[#E8EAED] sm:flex"
                >
                  <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="m-0 font-display text-[34px] font-normal uppercase leading-none text-[#F2F4F7]">
                  {product.name}
                </h2>
                <span className="shrink-0 font-mono text-[16px] text-[#F2F4F7]">{formatCOP(product.price)}</span>
              </div>
              <p className="m-0 text-[14px] leading-relaxed text-[#8A94A3]">
                {product.description || "Algodón pesado · Corte oversize"}
              </p>
            </div>

            {/* Selector de Color */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[13px] text-[#B8BFCA]">
                Color: <strong className="text-[#E8EAED]">{color.name}</strong>
              </span>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((c, i) => {
                  const active = i === colorIdx
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={c.soldOut}
                      aria-label={c.name + (c.soldOut ? " (Agotado)" : "")}
                      onClick={() => {
                        setColorIdx(i)
                        setPhotoIdx(0)
                        setAdded(false)
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-transparent p-0 transition-colors disabled:cursor-not-allowed disabled:opacity-35"
                      style={{ border: `2px solid ${active ? "#E8EAED" : "#2A313B"}` }}
                    >
                      <span
                        className="h-[30px] w-[30px] rounded-full border border-[#4A525E]"
                        style={{ backgroundColor: c.hex }}
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selector de Talla */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#B8BFCA]">Talla</span>
                <button
                  type="button"
                  onClick={onOpenSizeGuide}
                  className="border-0 bg-transparent p-0 text-[13px] text-[#B8BFCA] underline underline-offset-4 hover:text-[#F2F4F7]"
                >
                  Guía de tallas
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {product.sizes.map((s) => {
                  const on = size === s.label
                  return (
                    <button
                      key={s.label}
                      type="button"
                      disabled={s.soldOut}
                      onClick={() => {
                        setSize(s.label)
                        setAdded(false)
                      }}
                      className="vs-press h-11 text-[14px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-35 disabled:line-through"
                      style={
                        on
                          ? { background: "#E8EAED", color: "#0B0D10", border: "1px solid #E8EAED" }
                          : { background: "transparent", color: "#E8EAED", border: "1px solid #2A313B" }
                      }
                    >
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Completa el look */}
            {crossSell && (
              <div
                onClick={() => onSelectProduct(crossSell)}
                className="flex cursor-pointer items-center gap-3 rounded-[4px] bg-[#1A1E24] p-2.5 transition-colors hover:bg-[#222833]"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden bg-[#2A313B]">
                  {crossSell.colors[0]?.images[0] && (
                    <img src={crossSell.colors[0].images[0]} alt={crossSell.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] text-[#8A94A3]">Completa el look</div>
                  <div className="truncate text-[14px] font-semibold text-[#F2F4F7]">
                    {crossSell.name} · {crossSell.colors[0]?.name}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Agregar ${crossSell.name}`}
                  onClick={handleCrossAdd}
                  className="vs-press flex h-11 w-11 shrink-0 items-center justify-center text-[20px]"
                  style={
                    crossAdded
                      ? { background: "#2E8BFF", color: "#0B0D10", border: "1px solid #2E8BFF" }
                      : { background: "transparent", color: "#E8EAED", border: "1px solid #2A313B" }
                  }
                >
                  {crossAdded ? "✓" : "+"}
                </button>
              </div>
            )}
          </div>

          {/* Sticky CTA inferior */}
          <div className="border-t border-[#2A313B] bg-[#0B0D10] px-5 pt-3.5 pb-[max(22px,env(safe-area-inset-bottom))] sm:px-7">
            <button
              type="button"
              onClick={handleCta}
              disabled={soldOut || (!size && !added)}
              className="vs-press h-[54px] w-full border-0 text-[15px] font-bold tracking-[0.04em] text-[#0B0D10] transition-colors disabled:cursor-not-allowed"
              style={{
                background: soldOut ? "#2A313B" : added ? "#25D366" : size ? "#2E8BFF" : "#8A94A3",
                color: soldOut ? "#8A94A3" : "#0B0D10",
              }}
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
