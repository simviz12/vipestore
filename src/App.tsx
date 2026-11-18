import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  FREE_SHIPPING_FROM,
  INSTAGRAM_URL,
  TIKTOK_URL,
  WHATSAPP_DISPLAY,
  WHATSAPP_NUMBER,
} from "@/config"
import { BRAND_FACHADA_IMG, BRAND_LOGO_IMG, CATEGORY_IMAGES } from "@/lib/assets"
import { syncCatalog } from "@/lib/api"
import {
  addToCart,
  cartCount,
  CATEGORIES,
  formatCOP,
  inferCategory,
  isSoldOut,
  useCart,
  useCatalog,
  type Category,
  type ColorVariant,
  type Product,
} from "@/lib/store"
import { Logo } from "@/components/site/logo"
import { ProductSheet } from "@/components/shop/product-sheet"
import { CheckoutFlow, type CheckoutStage } from "@/components/shop/checkout-flow"
import { InfoModal, type InfoModalType } from "@/components/shop/info-modals"

type FilterOption = "Todo" | Category
type Flyer = { id: number; x: number; y: number; tx: number; ty: number; go: boolean }
type ToastState = { id: number; text: string } | null

const FILTER_LABELS: FilterOption[] = ["Todo", ...CATEGORIES]

const CATEGORY_TILES: { num: string; label: string; cat: Category; img: string; accent: string }[] = [
  { num: "01", label: "HOODIES", cat: "Hoodies", img: CATEGORY_IMAGES.Hoodies, accent: "#1A1E24" },
  { num: "02", label: "CARGOS", cat: "Cargos", img: CATEGORY_IMAGES.Cargos, accent: "#1E3A5F" },
  { num: "03", label: "CAMISETAS", cat: "Camisetas", img: CATEGORY_IMAGES.Camisetas, accent: "#1A1E24" },
  { num: "04", label: "ACCESORIOS", cat: "Accesorios", img: CATEGORY_IMAGES.Accesorios, accent: "#2A313B" },
]

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

const LOOKBOOK_BG = "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&h=1100&fit=crop&q=80"

export default function App() {
  const catalog = useCatalog()
  const cart = useCart()
  const count = cartCount(cart)

  const [filter, setFilter] = useState<FilterOption>("Todo")
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [stage, setStage] = useState<CheckoutStage>("off")
  const [infoModal, setInfoModal] = useState<InfoModalType>(null)
  const [activeHotspot, setActiveHotspot] = useState<number>(0)

  // Animación carrito volador, rebote y toast
  const [flyers, setFlyers] = useState<Flyer[]>([])
  const [justAdded, setJustAdded] = useState<Record<string, number>>({})
  const [bump, setBump] = useState(0)
  const [toast, setToast] = useState<ToastState>(null)
  const seqRef = useRef(0)
  const timersRef = useRef<number[]>([])
  const cartBtnRef = useRef<HTMLButtonElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    syncCatalog()
  }, [])

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms)
    timersRef.current.push(t)
  }, [])

  const triggerFlyAndAdd = useCallback(
    (p: Product, color: ColorVariant, size: string, e?: React.MouseEvent<HTMLButtonElement>) => {
      const btn = e?.currentTarget
      const cartEl = cartBtnRef.current
      let x = window.innerWidth / 2
      let y = window.innerHeight / 2
      let tx = window.innerWidth - 60
      let ty = 48
      if (btn) {
        const r = btn.getBoundingClientRect()
        x = r.left + r.width / 2
        y = r.top + r.height / 2
      }
      if (cartEl) {
        const c = cartEl.getBoundingClientRect()
        tx = c.left + c.width / 2
        ty = c.top + c.height / 2
      }

      const id = ++seqRef.current
      setFlyers((prev) => [...prev, { id, x, y, tx, ty, go: false }])
      setJustAdded((prev) => ({ ...prev, [p.id]: id }))

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFlyers((prev) => prev.map((f) => (f.id === id ? { ...f, go: true } : f)))
        })
      })

      schedule(() => {
        addToCart(p, color, size, 1)
        setFlyers((prev) => prev.filter((f) => f.id !== id))
        setBump((b) => b + 1)
        setToast({ id, text: `${p.name} agregado` })
      }, 680)

      schedule(() => {
        setJustAdded((prev) => {
          if (prev[p.id] !== id) return prev
          const copy = { ...prev }
          delete copy[p.id]
          return copy
        })
        setToast((prev) => (prev && prev.id === id ? null : prev))
      }, 3200)
    },
    [schedule],
  )

  const handleQuickAdd = useCallback(
    (p: Product, e: React.MouseEvent<HTMLButtonElement>) => {
      if (isSoldOut(p)) {
        setSelectedProduct(p)
        return
      }
      const color = p.colors.find((c) => !c.soldOut) ?? p.colors[0]
      const size =
        p.sizes.find((s) => !s.soldOut && s.label === "M")?.label ??
        p.sizes.find((s) => !s.soldOut)?.label ??
        p.sizes[0]?.label ??
        "M"
      triggerFlyAndAdd(p, color, size, e)
    },
    [triggerFlyAndAdd],
  )

  const filteredProducts = useMemo(() => {
    const q = norm(query.trim())
    return catalog.filter((p) => {
      const cat = inferCategory(p)
      if (filter !== "Todo" && cat !== filter) return false
      if (!q) return true
      const haystack = norm(
        [p.name, p.description, p.tag ?? "", cat, ...p.colors.map((c) => c.name)].join(" "),
      )
      return haystack.includes(q)
    })
  }, [catalog, filter, query])

  const jumpToCategory = (cat: FilterOption) => {
    setFilter(cat)
    document.getElementById("tienda")?.scrollIntoView({ behavior: "smooth" })
  }

  // Prendas para el lookbook interactivo "Arma tu outfit"
  const outfitPieces = useMemo(() => {
    const hoodie = catalog.find((p) => inferCategory(p) === "Hoodies" && !isSoldOut(p)) ?? catalog[0]
    const cargo = catalog.find((p) => inferCategory(p) === "Cargos" && !isSoldOut(p)) ?? catalog[1] ?? catalog[0]
    const acc = catalog.find((p) => inferCategory(p) === "Accesorios" && !isSoldOut(p)) ?? catalog[2] ?? catalog[0]
    return [
      { product: hoodie, left: "44%", top: "24%", label: "Parte superior" },
      { product: cargo, left: "56%", top: "52%", label: "Pantalón" },
      { product: acc, left: "34%", top: "64%", label: "Accesorio" },
    ].filter((x) => Boolean(x.product))
  }, [catalog])

  const handleExploreLooks = () => {
    if (outfitPieces[activeHotspot]?.product) {
      setSelectedProduct(outfitPieces[activeHotspot].product)
    } else {
      document.getElementById("tienda")?.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleAddFullOutfit = () => {
    outfitPieces.forEach(({ product }) => {
      if (!product || isSoldOut(product)) return
      const c = product.colors.find((x) => !x.soldOut) ?? product.colors[0]
      const s =
        product.sizes.find((x) => !x.soldOut && x.label === "M")?.label ??
        product.sizes.find((x) => !x.soldOut)?.label ??
        "M"
      addToCart(product, c, s, 1)
    })
    setBump((b) => b + 1)
    const id = ++seqRef.current
    setToast({ id, text: `Look completo (${outfitPieces.length} prendas) agregado` })
    schedule(() => {
      setToast((prev) => (prev && prev.id === id ? null : prev))
    }, 3400)
  }

  const bumpClass = bump === 0 ? "" : bump % 2 ? "vs-bump-a" : "vs-bump-b"
  const showMobileBar = count > 0 && stage === "off" && !selectedProduct && !infoModal
  const waDirect = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola Viper Store, quiero más información sobre las prendas disponibles.")}`

  return (
    <div className="min-h-[100dvh] w-full bg-[#0B0D10] font-sans text-[#E8EAED]">
      {/* ───────── Top Marquee Eléctrico ───────── */}
      <div className="overflow-hidden whitespace-nowrap bg-[#2E8BFF] py-2 font-mono text-[11px] font-medium tracking-[0.14em] text-[#0B0D10] sm:py-2.5 sm:text-[12px] sm:tracking-[0.16em]">
        <div className="vs-marquee">
          {[0, 1, 2, 3].map((k) => (
            <span key={k} className="pr-10 sm:pr-12">
              ROPA TAN CHIMBA QUE NO SE REPITE ✦ ENVÍO GRATIS DESDE {formatCOP(FREE_SHIPPING_FROM)} ✦ PEDIDOS POR WHATSAPP {WHATSAPP_DISPLAY} ✦ LOCAL SUPPORT LOCAL ✦ MEDELLÍN · ENVÍOS A TODA COLOMBIA ✦
            </span>
          ))}
        </div>
      </div>

      {/* ───────── Header Sticky ───────── */}
      <header className="sticky top-0 z-40 border-b border-[#2A313B] bg-[#0B0D10]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-3.5">
          <a href="#inicio" aria-label="Viper Store, inicio" className="shrink-0 no-underline">
            <Logo />
          </a>

          <nav className="hidden items-center gap-6 text-[14px] font-medium xl:gap-8 xl:text-[15px] lg:flex">
            <a href="#tienda" className="whitespace-nowrap text-[#E8EAED] transition-colors hover:text-[#2E8BFF]">
              Catálogo
            </a>
            <button
              type="button"
              onClick={() => jumpToCategory("Hoodies")}
              className="whitespace-nowrap border-0 bg-transparent p-0 text-[14px] font-medium text-[#E8EAED] transition-colors hover:text-[#2E8BFF] xl:text-[15px]"
            >
              Hoodies
            </button>
            <button
              type="button"
              onClick={() => jumpToCategory("Cargos")}
              className="whitespace-nowrap border-0 bg-transparent p-0 text-[14px] font-medium text-[#E8EAED] transition-colors hover:text-[#2E8BFF] xl:text-[15px]"
            >
              Cargos
            </button>
            <button
              type="button"
              onClick={() => jumpToCategory("Camisetas")}
              className="whitespace-nowrap border-0 bg-transparent p-0 text-[14px] font-medium text-[#E8EAED] transition-colors hover:text-[#2E8BFF] xl:text-[15px]"
            >
              Camisetas
            </button>
            <button
              type="button"
              onClick={() => jumpToCategory("Accesorios")}
              className="whitespace-nowrap border-0 bg-transparent p-0 text-[14px] font-medium text-[#E8EAED] transition-colors hover:text-[#2E8BFF] xl:text-[15px]"
            >
              Accesorios
            </button>
            <a href="#outfit" className="whitespace-nowrap text-[#E8EAED] transition-colors hover:text-[#2E8BFF]">
              Arma tu outfit
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              aria-label="Buscar prendas"
              aria-expanded={searchOpen}
              onClick={() => {
                setSearchOpen((v) => !v)
                if (!searchOpen) {
                  setTimeout(() => document.getElementById("tienda")?.scrollIntoView({ behavior: "smooth" }), 80)
                }
              }}
              className="vs-press flex h-11 w-11 items-center justify-center rounded-full border bg-transparent text-[#E8EAED]"
              style={{ borderColor: searchOpen || query ? "#2E8BFF" : "#2A313B" }}
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </button>

            <button
              ref={cartBtnRef}
              type="button"
              data-cart="1"
              onClick={() => {
                setToast(null)
                setStage("cart")
              }}
              aria-label={`Abrir carrito (${count})`}
              className={`vs-press ${bumpClass} flex h-11 items-center gap-2 rounded-full border border-[#2A313B] bg-[#1A1E24] pr-1.5 pl-3 text-[14px] font-semibold text-[#E8EAED] sm:gap-2.5 sm:pr-2 sm:pl-4`}
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                <path d="M5 8h14l-1 12H6L5 8z" />
                <path d="M9 8V6a3 3 0 016 0v2" />
              </svg>
              <span className="hidden sm:inline">Carrito</span>
              <span
                className="flex h-[26px] min-w-[26px] items-center justify-center rounded-full px-1.5 font-mono text-[12px] transition-colors sm:text-[13px]"
                style={
                  count > 0
                    ? { background: "#2E8BFF", color: "#0B0D10" }
                    : { background: "#2A313B", color: "#B8BFCA" }
                }
              >
                {count}
              </span>
            </button>
          </div>
        </div>

        {/* Barra de búsqueda desplegable */}
        {searchOpen && (
          <div className="border-t border-[#2A313B] bg-[#0B0D10]">
            <div className="mx-auto flex max-w-[1280px] items-center gap-2.5 px-4 py-3 sm:px-6">
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar hoodie, cargo, negro, gorra..."
                className="vp-in h-11 flex-1 border border-[#3A424E] bg-[#1A1E24] px-4 text-[16px] text-[#F2F4F7] placeholder:text-[#8A94A3] sm:text-[15px]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="vs-press h-11 border border-[#2A313B] bg-transparent px-4 text-[13px] font-semibold text-[#C3CAD4]"
                >
                  Limpiar
                </button>
              )}
              <button
                type="button"
                aria-label="Cerrar búsqueda"
                onClick={() => setSearchOpen(false)}
                className="vs-press flex h-11 w-11 items-center justify-center border border-[#2A313B] bg-transparent text-[#E8EAED]"
              >
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ───────── Hero Principal (Vitrina limpia sin ícono VIPER TV) ───────── */}
      <section
        id="inicio"
        className="relative flex min-h-[520px] items-end overflow-hidden border-b border-[#2A313B] md:min-h-[580px] lg:min-h-[620px]"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <img
            className="vs-kb absolute inset-0 h-full w-full object-cover"
            src={BRAND_FACHADA_IMG}
            alt="Fachada Viper Store"
            style={{ objectPosition: "center 42%" }}
          />
          <div className="vs-sweep" />
        </div>

        {/* Gradientes limpios para contraste */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 md:hidden"
          style={{
            background:
              "linear-gradient(0deg, rgba(11,13,16,1) 0%, rgba(11,13,16,.84) 40%, rgba(11,13,16,.28) 76%, rgba(11,13,16,.45) 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden md:block"
          style={{
            background:
              "linear-gradient(90deg, rgba(11,13,16,.95) 0%, rgba(11,13,16,.80) 44%, rgba(11,13,16,.30) 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 bottom-0 left-0 h-[140px]"
          style={{ background: "linear-gradient(0deg, #0B0D10, rgba(11,13,16,0))" }}
        />

        {/* Contenido Hero con espaciado respirable */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-wrap items-end justify-between gap-8 px-4 pt-16 pb-8 sm:px-6 md:py-16 lg:py-20">
          <div className="flex min-w-0 max-w-[720px] flex-col gap-5 md:gap-6">
            <div className="inline-flex w-fit items-center gap-2 border border-[#2E8BFF]/40 bg-[#0B0D10]/80 px-3 py-1.5 font-mono text-[11px] font-medium tracking-[0.16em] text-[#F2F4F7] backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-[#2E8BFF] animate-pulse" />
              VIPER STORE · STREETWEAR COLOMBIANO
            </div>

            <h1 className="m-0 font-display text-[54px] font-normal leading-[0.98] tracking-[0.01em] text-[#F2F4F7] sm:text-[78px] lg:text-[106px]">
              <span className="block">ROPA TAN</span>
              <span className="font-marker my-1 inline-block -rotate-[2.5deg] text-[62px] leading-[1.08] text-[#2E8BFF] sm:my-1.5 sm:text-[88px] lg:text-[118px]">
                chimba
              </span>
              <span className="block">QUE NO SE REPITE.</span>
            </h1>

            <p className="m-0 max-w-[500px] text-[15px] leading-[1.6] text-[#D5DAE1] sm:text-[17px]">
              Hoodies pesados, cargos y camisetas en negro, blanco y azul eléctrico. Piezas limitadas, hechas pa&apos; la calle.
            </p>

            {/* CTAs */}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <a
                href="#tienda"
                className="vs-press inline-flex h-[52px] items-center justify-center bg-[#2E8BFF] px-8 text-[15px] font-bold tracking-[0.04em] text-[#0B0D10] no-underline shadow-[0_4px_24px_rgba(46,139,255,0.35)]"
              >
                VER CATÁLOGO
              </a>
              <a
                href={waDirect}
                target="_blank"
                rel="noopener noreferrer"
                className="vs-press inline-flex h-[52px] items-center justify-center border border-[#3A424E] bg-[#1A1E24]/90 px-6 text-[14px] font-semibold text-[#F2F4F7] no-underline backdrop-blur-sm hover:border-[#25D366] hover:text-[#25D366]"
              >
                WhatsApp ({WHATSAPP_DISPLAY})
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── 4 Categorías con imágenes reales (Móvil 2x2 y Desktop 4x1) ───────── */}
      <section className="mx-auto max-w-[1280px] px-4 pt-12 sm:px-6 sm:pt-16">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {CATEGORY_TILES.map((tile) => (
            <button
              key={tile.num}
              type="button"
              onClick={() => jumpToCategory(tile.cat)}
              className="vs-tile group relative flex h-[156px] flex-col justify-between overflow-hidden border border-[#2A313B] p-4 text-left sm:h-[210px] sm:p-5"
              style={{ backgroundColor: tile.accent }}
            >
              <img
                src={tile.img}
                alt={tile.label}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-55 transition-transform duration-500 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ background: "linear-gradient(180deg, rgba(11,13,16,0.35) 0%, rgba(11,13,16,0.88) 100%)" }}
              />
              <span className="relative z-10 font-mono text-[11px] tracking-[0.16em] text-[#C3CAD4] sm:text-[12px]">
                {tile.num}
              </span>
              <span className="relative z-10 font-display text-[26px] leading-none text-[#F2F4F7] sm:text-[34px]">
                {tile.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ───────── Catálogo: LO MÁS MOVIDO ───────── */}
      <section id="tienda" className="mx-auto max-w-[1280px] pt-14 sm:px-6 sm:pt-20">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4 px-4 sm:mb-8 sm:px-0">
          <div>
            <h2 className="m-0 font-display text-[36px] font-normal leading-none text-[#F2F4F7] sm:text-[52px]">
              LO MÁS MOVIDO
            </h2>
            {query.trim() && (
              <p className="mt-2 font-mono text-[12px] text-[#8A94A3]">
                Mostrando {filteredProducts.length} resultados para &ldquo;{query.trim()}&rdquo;
              </p>
            )}
          </div>

          {/* Filtros Desktop */}
          <div className="hidden flex-wrap gap-2 sm:flex">
            {FILTER_LABELS.map((l) => {
              const on = filter === l
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setFilter(l)}
                  className="vs-press h-11 rounded-full px-5 text-[14px] font-semibold"
                  style={
                    on
                      ? { background: "#E8EAED", color: "#0B0D10", border: "1px solid #E8EAED" }
                      : { background: "transparent", color: "#E8EAED", border: "1px solid #2A313B" }
                  }
                >
                  {l}
                </button>
              )
            })}
          </div>
        </div>

        {/* Filtros scroll horizontal en móvil */}
        <div className="vs-scroll flex gap-2 overflow-x-auto px-4 pb-5 sm:hidden">
          {FILTER_LABELS.map((l) => {
            const on = filter === l
            return (
              <button
                key={l}
                type="button"
                onClick={() => setFilter(l)}
                className="vs-press h-10 shrink-0 rounded-full px-4 text-[13px] font-semibold"
                style={
                  on
                    ? { background: "#F2F4F7", color: "#0B0D10", border: "1px solid #F2F4F7" }
                    : { background: "transparent", color: "#F2F4F7", border: "1px solid #2A313B" }
                }
              >
                {l}
              </button>
            )
          })}
        </div>

        {/* Grid de Productos */}
        {filteredProducts.length === 0 ? (
          <div className="mx-4 border border-dashed border-[#3A424E] px-6 py-14 text-center sm:mx-0">
            <div className="font-display text-[28px] text-[#F2F4F7]">NO ENCONTRAMOS PRENDAS</div>
            <p className="mt-2 text-[14px] text-[#8A94A3]">Prueba otra categoría o limpia el buscador.</p>
            <button
              type="button"
              onClick={() => {
                setFilter("Todo")
                setQuery("")
              }}
              className="vs-press mt-5 h-11 bg-[#2E8BFF] px-6 text-[14px] font-bold text-[#0B0D10]"
            >
              Ver todo el catálogo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 px-4 sm:grid-cols-2 sm:gap-6 sm:px-0 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((p) => {
              const soldOut = isSoldOut(p)
              const primaryColor = p.colors.find((c) => !c.soldOut) ?? p.colors[0]
              const img = primaryColor?.images[0] ?? ""
              const added = Boolean(justAdded[p.id])

              return (
                <article key={p.id} className="vs-card flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(p)}
                    aria-label={`Ver ${p.name}, ${formatCOP(p.price)}`}
                    className="vs-photo relative flex aspect-[4/5] w-full flex-col justify-between overflow-hidden border-0 bg-[#1A1E24] p-2.5 text-left sm:p-3.5"
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={p.name}
                        loading="lazy"
                        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 ${soldOut ? "opacity-40 grayscale" : ""}`}
                      />
                    ) : (
                      <span className="mt-auto font-mono text-[10px] text-[#8A94A3] sm:text-[12px]">[FOTO PRODUCTO]</span>
                    )}
                    <span
                      className="relative z-10 self-start bg-[#0B0D10]/90 px-2 py-1 font-mono text-[9px] tracking-[0.14em] text-[#F2F4F7] sm:px-2.5 sm:py-1 sm:text-[11px]"
                      style={{ border: `1px solid ${soldOut ? "#E5484D" : "#2E8BFF"}` }}
                    >
                      {soldOut ? "AGOTADO" : p.tag || "NUEVO"}
                    </span>
                  </button>

                  {/* Info producto */}
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(p)}
                    className="flex flex-1 flex-col gap-1 border-0 bg-transparent p-0 text-left sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-1 text-[14px] font-semibold leading-snug text-[#F2F4F7] sm:text-[16px]">
                        {p.name}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-1.5 text-[12px] text-[#8A94A3] sm:text-[13px]">
                        <span className="truncate">{primaryColor?.name ?? "Negro"}</span>
                        <span className="shrink-0 font-mono text-[#F2F4F7] sm:hidden">{formatCOP(p.price)}</span>
                      </div>
                    </div>
                    <div className="hidden shrink-0 font-mono text-[14px] text-[#E8EAED] sm:block">
                      {formatCOP(p.price)}
                    </div>
                  </button>

                  {/* Botón Agregar rápido */}
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(p, e)}
                    className="vs-press mt-auto h-11 w-full text-[13px] font-bold sm:text-[14px] sm:font-semibold"
                    style={
                      soldOut
                        ? { background: "transparent", color: "#8A94A3", border: "1px solid #2A313B" }
                        : added
                          ? { background: "#2E8BFF", color: "#0B0D10", border: "1px solid #2E8BFF" }
                          : { background: "transparent", color: "#F2F4F7", border: "1px solid #3A424E" }
                    }
                  >
                    <span className="sm:hidden">{soldOut ? "Ver detalles" : added ? "✓ Agregado" : "Agregar +"}</span>
                    <span className="hidden sm:inline">
                      {soldOut ? "Agotado · Ver detalles" : added ? "✓ Agregado al carrito" : "Agregar rápido +"}
                    </span>
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* ───────── ARMA TU OUTFIT (EL LOOK COMPLETO, EN UN CLIC) ───────── */}
      <section id="outfit" className="mx-auto max-w-[1280px] px-4 pt-16 sm:px-6 sm:pt-24">
        <div className="grid grid-cols-1 overflow-hidden border border-[#2A313B] bg-[#1A1E24] lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-5 p-7 sm:p-12 lg:p-14">
            <div className="font-mono text-[13px] tracking-[0.2em] text-[#8A94A3]">
              ARMA TU OUTFIT
            </div>

            <h2 className="m-0 font-display text-[44px] font-normal uppercase leading-[1.0] text-[#F2F4F7] sm:text-[56px]">
              EL LOOK COMPLETO,
              <br />
              EN UN CLIC.
            </h2>

            <p className="m-0 max-w-[440px] text-[15px] leading-[1.55] text-[#B8BFCA] sm:text-[17px]">
              Cada foto del lookbook tiene puntos sobre las prendas. Toca, elige talla y agrega todo el outfit junto.
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExploreLooks}
                className="vs-press inline-flex h-[52px] items-center justify-center border-0 bg-[#E8EAED] px-7 text-[15px] font-bold text-[#0B0D10] transition-colors hover:bg-white"
              >
                Explorar looks
              </button>
              <button
                type="button"
                onClick={handleAddFullOutfit}
                className="vs-press inline-flex h-[52px] items-center justify-center border border-[#3A424E] bg-transparent px-6 text-[14px] font-semibold text-[#F2F4F7] transition-colors hover:border-[#2E8BFF] hover:text-[#2E8BFF]"
              >
                + Agregar todo el outfit
              </button>
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden bg-[#2A313B] sm:min-h-[480px] lg:min-h-[520px]">
            <img
              src={LOOKBOOK_BG}
              alt="Lookbook Viper Store"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0D10]/85 via-transparent to-[#0B0D10]/20" />
            <span className="absolute top-5 left-5 bg-[#0B0D10]/85 px-3 py-1.5 font-mono text-[11px] tracking-[0.15em] text-[#C3CAD4]">
              LOOK 01 · COLECCIÓN
            </span>

            {/* 3 Hotspots interactivos */}
            {outfitPieces.map((spot, idx) => {
              const active = activeHotspot === idx
              return (
                <button
                  key={spot.product.id + idx}
                  type="button"
                  aria-label={`Ver ${spot.product.name}`}
                  onClick={() => setActiveHotspot(idx)}
                  className="vs-hotspot absolute -mt-3.5 -ml-3.5 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-[#0B0D10] p-0 transition-transform"
                  style={{
                    left: spot.left,
                    top: spot.top,
                    background: active ? "#F2F4F7" : "#2E8BFF",
                    transform: active ? "scale(1.25)" : "scale(1)",
                  }}
                >
                  <span className="h-2 w-2 rounded-full bg-[#0B0D10]" />
                </button>
              )
            })}

            {/* Tarjeta flotante de la prenda activa */}
            {outfitPieces[activeHotspot]?.product && (
              <div className="absolute right-4 bottom-4 left-4 flex items-center justify-between gap-3 border border-[#2A313B] bg-[#0B0D10]/95 p-4 backdrop-blur-sm">
                <div className="min-w-0">
                  <div className="font-mono text-[10px] tracking-[0.16em] text-[#2E8BFF]">
                    {outfitPieces[activeHotspot].label.toUpperCase()}
                  </div>
                  <div className="mt-0.5 truncate text-[15px] font-semibold text-[#F2F4F7]">
                    {outfitPieces[activeHotspot].product.name}
                  </div>
                  <div className="mt-0.5 font-mono text-[13px] text-[#C3CAD4]">
                    {formatCOP(outfitPieces[activeHotspot].product.price)}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(outfitPieces[activeHotspot].product)}
                    className="vs-press h-10 border border-[#3A424E] bg-transparent px-3.5 text-[12px] font-semibold text-[#F2F4F7]"
                  >
                    Ver detalles
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(outfitPieces[activeHotspot].product, e)}
                    className="vs-press h-10 border-0 bg-[#2E8BFF] px-4 text-[12px] font-bold text-[#0B0D10]"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ───────── Footer con marca de agua gigante ───────── */}
      <footer className={`mx-auto max-w-[1280px] px-4 pt-16 sm:px-6 sm:pt-24 ${showMobileBar ? "pb-28 sm:pb-12" : "pb-12"}`}>
        <div className="flex flex-wrap items-end gap-x-5 gap-y-2 sm:gap-x-7">
          <div className="font-display text-[72px] leading-[0.86] tracking-[0.02em] text-[#1A1E24] sm:text-[116px] lg:text-[152px]">
            VIPER
          </div>
          <div className="font-marker -rotate-[4deg] pb-1 text-[34px] leading-none text-[#1A4FA0] sm:pb-2 sm:text-[52px] lg:text-[68px]">
            Store
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-6 border-t border-[#2A313B] pt-6 text-[13px] text-[#8A94A3] sm:text-[14px]">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              type="button"
              onClick={() => setInfoModal("shipping")}
              className="border-0 bg-transparent p-0 text-[13px] text-[#8A94A3] hover:text-[#F2F4F7] sm:text-[14px]"
            >
              Envíos
            </button>
            <button
              type="button"
              onClick={() => setInfoModal("returns")}
              className="border-0 bg-transparent p-0 text-[13px] text-[#8A94A3] hover:text-[#F2F4F7] sm:text-[14px]"
            >
              Cambios y devoluciones
            </button>
            <button
              type="button"
              onClick={() => setInfoModal("sizes")}
              className="border-0 bg-transparent p-0 text-[13px] text-[#8A94A3] hover:text-[#F2F4F7] sm:text-[14px]"
            >
              Guía de tallas
            </button>
            <a href={waDirect} target="_blank" rel="noopener noreferrer" className="text-[#8A94A3] no-underline hover:text-[#F2F4F7]">
              Contacto ({WHATSAPP_DISPLAY})
            </a>
            <a href="#/admin" className="text-[#8A94A3] no-underline hover:text-[#2E8BFF]">
              Panel
            </a>
          </div>
          <div className="flex items-center gap-6">
            {INSTAGRAM_URL && (
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-[#8A94A3] no-underline hover:text-[#F2F4F7]">
                Instagram
              </a>
            )}
            {TIKTOK_URL && (
              <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" className="text-[#8A94A3] no-underline hover:text-[#F2F4F7]">
                TikTok
              </a>
            )}
          </div>
        </div>
      </footer>

      {/* ───────── Barra inferior flotante en móvil cuando hay items ───────── */}
      {showMobileBar && (
        <div className="fixed right-3 bottom-[max(14px,env(safe-area-inset-bottom))] left-3 z-30 md:hidden">
          <button
            type="button"
            onClick={() => {
              setToast(null)
              setStage("cart")
            }}
            className="vs-press flex h-[56px] w-full items-center justify-between border-0 bg-[#F2F4F7] pr-2 pl-[18px] text-[14px] font-bold text-[#0B0D10]"
            style={{ boxShadow: "0 12px 32px rgba(0,0,0,0.6)" }}
          >
            <span>
              {count} {count === 1 ? "prenda" : "prendas"} en tu carrito
            </span>
            <span className="flex h-10 items-center bg-[#2E8BFF] px-3.5 text-[#0B0D10]">Ver carrito</span>
          </button>
        </div>
      )}

      {/* ───────── Bolsitas voladoras hacia el carrito ───────── */}
      {flyers.map((fl) => (
        <div
          key={fl.id}
          aria-hidden="true"
          style={{
            position: "fixed",
            zIndex: 65,
            pointerEvents: "none",
            width: 44,
            height: 44,
            borderRadius: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#2E8BFF",
            color: "#0B0D10",
            boxShadow: "0 10px 28px rgba(0,0,0,.55), 0 0 0 4px rgba(11,13,16,.9)",
            transition:
              "left .68s cubic-bezier(.55,0,.85,.45), top .68s cubic-bezier(.15,.6,.35,1), transform .68s ease-in, opacity .68s ease-in",
            left: (fl.go ? fl.tx : fl.x) - 22,
            top: (fl.go ? fl.ty : fl.y) - 22,
            transform: fl.go ? "scale(.35) rotate(-20deg)" : "scale(1.1)",
            opacity: fl.go ? 0.5 : 1,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
            <path d="M5 8h14l-1 12H6L5 8z" />
            <path d="M9 8V6a3 3 0 016 0v2" />
          </svg>
        </div>
      ))}

      {/* ───────── Toast de agregado al carrito ───────── */}
      {toast && stage === "off" && (
        <div
          role="status"
          className="vs-toast fixed bottom-[82px] left-1/2 z-[70] flex max-w-[calc(100%-24px)] -translate-x-1/2 items-center gap-3.5 bg-[#E8EAED] py-2.5 pr-2.5 pl-4 text-[13px] font-semibold text-[#0B0D10] sm:bottom-7 sm:gap-4 sm:text-[14px]"
          style={{ boxShadow: "0 16px 40px rgba(0,0,0,0.55)" }}
        >
          <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#1E3A5F] text-[#E8EAED]">
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5 9-10" />
            </svg>
          </span>
          <span className="truncate">{toast.text}</span>
          <button
            type="button"
            onClick={() => {
              setToast(null)
              setStage("cart")
            }}
            className="vs-press h-10 shrink-0 border-0 bg-[#0B0D10] px-4 text-[13px] font-bold text-[#E8EAED]"
          >
            Ver carrito
          </button>
        </div>
      )}

      {/* ───────── Ficha de Producto ───────── */}
      <ProductSheet
        product={selectedProduct}
        catalog={catalog}
        onClose={() => setSelectedProduct(null)}
        onAdd={triggerFlyAndAdd}
        onOpenCart={() => setStage("cart")}
        onOpenSizeGuide={() => setInfoModal("sizes")}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      {/* ───────── Flujo de Carrito + Datos + Cinemática + WhatsApp ───────── */}
      <CheckoutFlow
        stage={stage}
        onStageChange={setStage}
        onCartMutate={() => setBump((b) => b + 1)}
      />

      {/* ───────── Modales de Info (Guía de tallas, Envíos, Cambios) ───────── */}
      <InfoModal type={infoModal} onClose={() => setInfoModal(null)} />
    </div>
  )
}
