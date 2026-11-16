import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowDown, Check, Instagram, MessageCircle, Search, X } from "lucide-react"
import RunwayLookbook, { type RunwayLook } from "@/components/ui/runway-lookbook"
import { Header } from "@/components/site/header"
import { Logo, LogoBadge } from "@/components/site/logo"
import { CartDrawer } from "@/components/shop/cart-drawer"
import { ProductDrawer } from "@/components/shop/product-drawer"
import { Toaster } from "@/components/shop/toast"
import { useReveal } from "@/hooks/use-reveal"
import { INSTAGRAM_URL, WHATSAPP_NUMBER } from "@/config"
import { syncCatalog } from "@/lib/api"
import { cartCount, formatCOP, isSoldOut, useCart, useCatalog, type Product } from "@/lib/store"

const WA_CHAT = `https://wa.me/${WHATSAPP_NUMBER}`
const ticker = ["Nuevo drop", "Good vibes only", "Local support local", "Viper Store", "Ropa tan chimba"]
const QUICK = ["Chaqueta", "Buzo", "Negro", "Azul", "Nuevo"]
const FIRST = 8

/** Minúsculas y sin tildes, para que "cafe" encuentre "Café". */
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

function Marquee({ className = "" }: { className?: string }) {
  const row = [...ticker, ...ticker, ...ticker, ...ticker]
  return (
    <div className={"overflow-hidden " + className} aria-hidden>
      <div className="marquee flex w-max">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center">
            {row.map((t, i) => (
              <span key={i} className="flex items-center gap-6 pr-6 font-display text-2xl uppercase sm:text-4xl">
                {t}
                <span className="opacity-50">///</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductCard({ p, onOpen }: { p: Product; onOpen: () => void }) {
  const out = isSoldOut(p)
  const cover = (p.colors.find((c) => !c.soldOut) ?? p.colors[0])?.images[0]
  return (
    <button type="button" onClick={onOpen} className="group flex flex-col text-left" aria-label={`Ver ${p.name}, ${formatCOP(p.price)}`}>
      <div className="relative overflow-hidden rounded-2xl bg-muted shadow-soft ring-1 ring-border transition duration-300 group-hover:ring-foreground/40">
        <img
          src={cover}
          alt=""
          loading="lazy"
          className={"aspect-[4/5] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] " + (out ? "opacity-40 grayscale" : "")}
        />
        {(out || p.tag) && (
          <span className={"label absolute left-2.5 top-2.5 rounded-lg px-2 py-1 " + (out ? "bg-red-600 text-white" : "bg-white text-black")}>
            {out ? "Agotado" : p.tag}
          </span>
        )}
      </div>
      {/* Nombre a 2 líneas fijas: precio y botón quedan alineados en toda la fila */}
      <div className="mt-3 flex flex-1 flex-col px-0.5">
        <h3 className="line-clamp-2 min-h-[2lh] text-[15px] font-semibold leading-tight">{p.name}</h3>
        <div className="mb-3 mt-1.5 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold tabular-nums text-primary-glow">{formatCOP(p.price)}</span>
          <span className="flex items-center gap-1">
            {p.colors.map((c) => (
              <span key={c.id} title={c.name} className={"size-3.5 rounded-full ring-1 ring-white/30 " + (c.soldOut ? "opacity-30" : "")} style={{ background: c.hex }} />
            ))}
          </span>
        </div>
        <span className="mt-auto inline-flex min-h-11 items-center justify-center rounded-full border border-border px-3 text-center text-sm font-semibold transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-white">
          {out ? "Ver detalles" : "Elegir talla y color"}
        </span>
      </div>
    </button>
  )
}

/** Mini pantallas del proceso real (decorativas: el texto del paso ya lo explica). */
function StepPreview({ step, product }: { step: number; product?: Product }) {
  const name = product?.name ?? "Tu prenda"
  const price = product ? formatCOP(product.price) : ""
  const color = product?.colors.find((c) => !c.soldOut) ?? product?.colors[0]
  if (step === 0)
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 items-center gap-1.5 rounded-full border-2 border-primary bg-primary/10 pl-1 pr-3 text-xs font-semibold">
            <span className="grid size-5 place-items-center rounded-full ring-1 ring-ink/20" style={{ background: color?.hex ?? "#0a0b0d" }}>
              <Check className="size-3 text-white mix-blend-difference" strokeWidth={3} />
            </span>
            {color?.name ?? "Negro"}
          </span>
        </div>
        <div className="flex gap-1.5">
          {["S", "M", "L", "XL"].map((s) => (
            <span key={s} className={"grid h-8 min-w-9 place-items-center rounded-lg border-2 text-xs font-semibold " + (s === "M" ? "border-primary bg-primary text-white" : "border-ink/15")}>
              {s}
            </span>
          ))}
        </div>
      </div>
    )
  if (step === 1)
    return (
      <div className="space-y-2 text-xs">
        {[
          ["Nombre completo", "Laura Gómez"],
          ["Dirección exacta", "Cra 70 # 44-21, Laureles"],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="mb-1 font-semibold text-ink/60">{k}</p>
            <p className="flex h-8 items-center rounded-lg border border-ink/15 bg-white px-3">{v}</p>
          </div>
        ))}
      </div>
    )
  return (
    <div className="ml-auto max-w-[92%] rounded-lg rounded-tr-none bg-[#d9fdd3] p-3 text-xs leading-relaxed text-ink">
      <p className="font-bold">🛍️ NUEVO PEDIDO · VIPER STORE</p>
      <p className="mt-1 truncate">1 × {name} · Talla M</p>
      {price && <p className="font-semibold tabular-nums">Total productos: {price}</p>}
      <p className="mt-1 text-right text-[11px] text-ink/50">✓✓</p>
    </div>
  )
}

const STEPS = [
  { k: "Elige tu prenda", v: "Toca la que te guste, escoge color y talla, y agrégala a la bolsa." },
  { k: "Llena tus datos", v: "Nombre, dirección de entrega y si pagas por Nequi o contraentrega." },
  { k: "Confirma por WhatsApp", v: "Se abre el chat con tu pedido ya escrito. Solo tocas Enviar." },
]

export default function App() {
  const catalog = useCatalog()
  const cart = useCart()
  const [productId, setProductId] = useState<string | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [showAll, setShowAll] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  useReveal()
  useEffect(() => {
    syncCatalog()
  }, [])

  const product = catalog.find((p) => p.id === productId) ?? null
  const closeProduct = useCallback(() => setProductId(null), [])
  const closeCart = useCallback(() => setCartOpen(false), [])
  const openCart = useCallback(() => setCartOpen(true), [])

  const goCatalog = (opts?: { all?: boolean; focus?: boolean }) => {
    if (opts?.all) {
      setShowAll(true)
      setQuery("")
    }
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" })
    if (opts?.focus) window.setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 500)
  }

  /* Buscador: nombre, descripción, etiqueta y colores */
  const q = norm(query.trim())
  const results = useMemo(
    () => (q ? catalog.filter((p) => norm([p.name, p.description, p.tag ?? "", ...p.colors.map((c) => c.name)].join(" ")).includes(q)) : catalog),
    [catalog, q],
  )
  const visible = q || showAll ? results : results.slice(0, FIRST)
  const hidden = results.length - visible.length

  /* Lookbook: las primeras prendas disponibles del catálogo real */
  const lookProducts = useMemo(() => catalog.filter((p) => !isSoldOut(p) && p.colors.some((c) => c.images.length)).slice(0, 6), [catalog])
  const looks: RunwayLook[] = useMemo(
    () =>
      lookProducts.map((p) => {
        const colors = p.colors.filter((c) => !c.soldOut && c.images.length)
        return {
          src: colors[0].images[0],
          alt: p.name,
          products: colors.slice(0, 3).map((c) => ({ name: `${p.name} · ${c.name}`, price: formatCOP(p.price), src: c.images[0] })),
        }
      }),
    [lookProducts],
  )

  return (
    <div id="top" className="grain relative min-h-screen overflow-x-clip bg-background text-foreground">
      <a href="#catalogo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-foreground focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-background">
        Saltar al catálogo
      </a>
      <Header cart={cartCount(cart)} onCart={openCart} onSearch={() => goCatalog({ focus: true })} />

      <main>
        {/* ───────── PORTADA ───────── */}
        <section className="relative isolate pt-20 sm:pt-24">
          <div className="mx-auto grid max-w-[1400px] gap-10 px-4 pb-10 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:pb-0">
            <div className="relative z-10 flex flex-col justify-center lg:col-span-6 lg:py-16">
              <h1 className="font-display uppercase leading-[0.84]">
                <span className="hero-in block text-[clamp(4.2rem,15vw,11rem)]" style={{ ["--d" as string]: "80ms" }}>
                  Ropa tan
                </span>
                <span className="hero-in relative block text-[clamp(4.2rem,15vw,11rem)]" style={{ ["--d" as string]: "160ms" }}>
                  <span className="relative z-10 text-primary">chimba</span>
                  <svg aria-hidden viewBox="0 0 300 20" className="absolute -bottom-1 left-0 w-[min(60%,26rem)] text-primary/60" preserveAspectRatio="none">
                    <path d="M2 14 C 60 4, 140 4, 298 10" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" className="draw" />
                  </svg>
                </span>
              </h1>

              <p className="hero-in mt-8 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg" style={{ ["--d" as string]: "320ms" }}>
                Ropa con corona. Elige tu prenda, su color y su talla, y confirma el pedido por WhatsApp en un minuto.
              </p>

              <div className="hero-in mt-9 flex flex-col gap-3 sm:flex-row" style={{ ["--d" as string]: "400ms" }}>
                <button type="button" onClick={() => goCatalog({ all: true })} className="btn-primary group">
                  Ver todo el catálogo
                  <ArrowDown className="size-4 transition-transform duration-200 group-hover:translate-y-0.5" />
                </button>
                <button type="button" onClick={() => goCatalog({ focus: true })} className="btn-ghost">
                  <Search className="size-4" /> Buscar una prenda
                </button>
              </div>
            </div>

            <div className="relative lg:col-span-6 lg:py-10">
              <div className="hero-in relative mx-auto max-w-[560px] lg:ml-auto" style={{ ["--d" as string]: "200ms" }}>
                <div className="relative overflow-hidden rounded-2xl shadow-lift ring-1 ring-white/10 sm:rotate-[1.5deg]">
                  <img src="/img/fachada.jpeg" alt="Vitrina de Viper Store con grafiti azul: Hptas no vendan ropa tan chimba" className="aspect-[4/5] w-full object-cover" {...{ fetchpriority: "high" }} />
                </div>
                <span className="sticker absolute -left-3 top-8 -rotate-[8deg] bg-primary text-white sm:-left-8">Good vibes only ☺</span>
                <span className="sticker absolute -right-2 top-1/2 rotate-[6deg] bg-foreground text-background sm:-right-6">Local support local</span>
                <LogoBadge className="absolute -bottom-6 left-6 size-24 -rotate-6 sm:size-28" />
              </div>
            </div>
          </div>

          <p aria-hidden className="select-none overflow-hidden whitespace-nowrap text-center font-display text-[19.5vw] uppercase leading-[0.8] text-white/[0.05] lg:-mt-6">
            Viper Store
          </p>
        </section>

        <div className="relative z-10 -mt-[4vw] py-6">
          <Marquee className="-rotate-2 bg-primary py-3 text-white sm:py-4" />
        </div>

        {/* ───────── LOOKBOOK con la ropa del catálogo ───────── */}
        {looks.length >= 2 && (
          <section id="lookbook" aria-label="Lookbook">
            <RunwayLookbook
              className="vs-look"
              looks={looks}
              loop={false}
              scrollPerLook={0.45}
              nav={[]}
              title="Lookbook · Drop 01"
              blurb="La ropa del drop, en fila. Baja con el scroll: la del frente es la que puedes pedir."
              lookLabel="Look"
              caption={(i) =>
                lookProducts[i] && (
                  <div className="look-cap">
                    <span className="look-name">{lookProducts[i].name}</span>
                    <span className="look-price">{formatCOP(lookProducts[i].price)}</span>
                  </div>
                )
              }
              ctaLabel="Elegir talla y color →"
              onShopLook={(i) => lookProducts[i] && setProductId(lookProducts[i].id)}
              onCardClick={(i) => lookProducts[i] && setProductId(lookProducts[i].id)}
              ariaLabel="Lookbook Viper Store"
            />
          </section>
        )}

        {/* ───────── CATÁLOGO ───────── */}
        <section id="catalogo" className="mx-auto max-w-[1400px] scroll-mt-20 px-4 py-16 sm:px-8 sm:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-[clamp(3rem,8vw,6rem)] uppercase leading-[0.85]">Toda la ropa</h2>
            <p className="max-w-xs text-[15px] text-muted-foreground">Toca una prenda para ver sus fotos y elegir color y talla.</p>
          </div>

          {/* Buscador */}
          <div className="mt-8">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <label htmlFor="buscar" className="sr-only">Buscar en el catálogo</label>
              <input
                id="buscar"
                ref={searchRef}
                type="search"
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busca una prenda o un color…"
                className="input h-14 rounded-full pl-12 pr-14 [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button type="button" onClick={() => { setQuery(""); searchRef.current?.focus() }} aria-label="Borrar búsqueda" className="absolute right-1.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:text-foreground">
                  <X className="size-5" />
                </button>
              )}
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {QUICK.map((t) => {
                const on = norm(t) === q
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setQuery(on ? "" : t)}
                    aria-pressed={on}
                    className={"label h-11 shrink-0 rounded-full border px-4 transition-colors " + (on ? "border-primary bg-primary text-white" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground")}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
            <p className="label mt-4 text-muted-foreground" aria-live="polite">
              {q ? `${results.length} ${results.length === 1 ? "resultado" : "resultados"} para “${query.trim()}”` : `${catalog.length} prendas`}
            </p>
          </div>

          {catalog.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-border bg-surface p-10 text-center text-muted-foreground">Estamos preparando el próximo drop. Vuelve pronto.</p>
          ) : results.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-border bg-surface p-10 text-center">
              <p className="font-display text-3xl uppercase">No encontramos “{query.trim()}”</p>
              <p className="mt-2 text-muted-foreground">Prueba con otra palabra o mira todo el catálogo.</p>
              <button type="button" onClick={() => goCatalog({ all: true })} className="btn-primary mt-6">
                Ver todo el catálogo
              </button>
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
                {visible.map((p) => (
                  <ProductCard key={p.id} p={p} onOpen={() => setProductId(p.id)} />
                ))}
              </div>
              {!q && results.length > FIRST && (
                <div className="mt-12 flex justify-center">
                  <button type="button" onClick={() => setShowAll((v) => !v)} className={showAll ? "btn-ghost w-full sm:w-auto" : "btn-primary w-full sm:w-auto"}>
                    {showAll ? "Ver menos" : `Ver todo el catálogo (${hidden} más)`}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ───────── CÓMO COMPRAR (sección clara) ───────── */}
        <section id="como-comprar" className="scroll-mt-20 bg-paper py-16 text-ink sm:py-24">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
            <h2 data-reveal className="font-display text-[clamp(3rem,8vw,6rem)] uppercase leading-[0.85]">
              Tres pasos y listo
            </h2>
            <ol className="mt-10 grid gap-3 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.k} data-reveal style={{ ["--d" as string]: `${i * 80}ms` }} className="flex flex-col rounded-2xl bg-white p-6 shadow-soft ring-1 ring-ink/10 sm:p-8">
                  <p className="text-sm font-bold text-primary">Paso {i + 1}</p>
                  <h3 className="mt-2 font-display text-3xl uppercase">{s.k}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{s.v}</p>
                  <div aria-hidden className="mt-6 rounded-lg bg-paper/70 p-4 ring-1 ring-ink/5 md:mt-auto">
                    <StepPreview step={i} product={lookProducts[0] ?? catalog[0]} />
                  </div>
                </li>
              ))}
            </ol>
            <button type="button" onClick={() => goCatalog({ all: true })} className="btn-primary mt-8 w-full sm:w-auto">
              Empezar: ver todo el catálogo
            </button>
          </div>
        </section>

        {/* ───────── LA TIENDA ───────── */}
        <section id="tienda" className="mx-auto max-w-[1400px] scroll-mt-20 px-4 py-16 sm:px-8 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div data-reveal className="relative order-2 lg:order-1">
              <img src="/img/fachada.jpeg" alt="Fachada de Viper Store de noche" loading="lazy" className="aspect-square w-full rounded-2xl object-cover object-bottom shadow-lift ring-1 ring-white/10" />
              <span className="sticker absolute -top-4 right-6 rotate-[5deg] bg-primary text-white">Ven a verla ☺</span>
            </div>
            <div className="order-1 lg:order-2">
              <h2 data-reveal className="font-display text-[clamp(3rem,8vw,6rem)] uppercase leading-[0.85]">
                Una vitrina que no pasa desapercibida
              </h2>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">¿Dudas de talla o disponibilidad? Escríbenos y te respondemos por WhatsApp.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={WA_CHAT} target="_blank" rel="noopener" className="btn-primary">
                  <MessageCircle className="size-4" /> Escribir por WhatsApp
                </a>
                {INSTAGRAM_URL && (
                  <a href={INSTAGRAM_URL} target="_blank" rel="noopener" className="btn-ghost">
                    <Instagram className="size-4" /> Seguir en Instagram
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ───────── PIE ───────── */}
      <footer className="relative overflow-hidden border-t border-border bg-surface">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <Logo size="lg" />
            <p className="mt-3 text-sm text-muted-foreground">Good vibes only · Local support local</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground" aria-label="Pie">
            <a href="#lookbook" className="hover:text-foreground">Lookbook</a>
            <a href="#catalogo" className="hover:text-foreground">Catálogo</a>
            <a href="#como-comprar" className="hover:text-foreground">Cómo comprar</a>
            <a href="#/admin" className="hover:text-foreground">Admin</a>
          </nav>
          <a href={WA_CHAT} target="_blank" rel="noopener" aria-label="WhatsApp" className="grid size-11 place-items-center rounded-full border border-border transition-colors hover:border-primary hover:text-primary-glow">
            <MessageCircle className="size-5" />
          </a>
        </div>
        <p aria-hidden className="select-none whitespace-nowrap text-center font-display text-[26vw] uppercase leading-[0.8] text-primary">
          Viper
        </p>
        <p className="label border-t border-border py-5 text-center text-muted-foreground">© 2026 Viper Store</p>
      </footer>

      <ProductDrawer product={product} onClose={closeProduct} onOpenCart={openCart} />
      <CartDrawer open={cartOpen} onClose={closeCart} />
      <Toaster />
    </div>
  )
}
