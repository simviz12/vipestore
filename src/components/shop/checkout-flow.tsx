import { useEffect, useRef, useState } from "react"
import { FREE_SHIPPING_FROM } from "@/config"
import {
  buildWhatsAppUrl,
  cartCount,
  cartTotal,
  clearCart,
  customerStore,
  formatCOP,
  setQty,
  useCart,
  type Customer,
  type PaymentMethod,
  type ShippingMethod,
} from "@/lib/store"

export type CheckoutStage = "off" | "cart" | "form" | "anim" | "done"

const FAR_BUILDINGS = [
  [60, 90],
  [40, 130],
  [70, 70],
  [50, 110],
  [44, 150],
  [64, 80],
  [52, 120],
]
const NEAR_BUILDINGS = [
  [80, 150],
  [64, 100],
  [90, 190],
  [70, 120],
  [84, 170],
  [60, 90],
  [76, 140],
]

const SHIP_OPTIONS: ShippingMethod[] = ["Envío a domicilio", "Recoger en tienda"]
const PAY_OPTIONS: PaymentMethod[] = ["Transferencia / Nequi", "Contraentrega", "Efectivo en tienda"]

function WhatsAppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M4 20l1.3-4A8 8 0 1 1 8.4 19z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-1.8-1-1 .9a4 4 0 0 1-2.4-2.4l.9-1-1-1.8z" />
    </svg>
  )
}

function playOrderSounds(actxRef: React.MutableRefObject<AudioContext | null>) {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    const ctx = actxRef.current || (actxRef.current = new AC())
    if (ctx.state === "suspended") ctx.resume()
    const playDing = (at: number, freqs: number[], vol: number) => {
      freqs.forEach((f, i) => {
        const t = ctx.currentTime + at + i * 0.11
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = "sine"
        o.frequency.value = f
        g.gain.setValueAtTime(0.0001, t)
        g.gain.exponentialRampToValueAtTime(vol, t + 0.012)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7)
        o.connect(g)
        g.connect(ctx.destination)
        o.start(t)
        o.stop(t + 0.75)
      })
    }
    playDing(0.72, [880], 0.12)
    playDing(0.92, [988], 0.12)
    playDing(1.12, [1175], 0.12)
    playDing(2.15, [1318.5, 1760], 0.32)
  } catch {
    // audio opcional
  }
}

export function CheckoutFlow({
  stage,
  onStageChange,
  onCartMutate,
}: {
  stage: CheckoutStage
  onStageChange: (next: CheckoutStage) => void
  onCartMutate: () => void
}) {
  const items = useCart()
  const count = cartCount(items)
  const total = cartTotal(items)
  const [form, setForm] = useState<Customer>(() => customerStore.get())
  const [error, setError] = useState("")
  const [waUrl, setWaUrl] = useState("")
  const timerRef = useRef<number | null>(null)
  const actxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (stage === "off") return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (stage === "cart" || stage === "form")) {
        onStageChange("off")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [stage, onStageChange])

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  const updateField = <K extends keyof Customer>(key: K, val: Customer[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val }
      customerStore.set(next)
      return next
    })
    if (error) setError("")
  }

  const handleSendOrder = (e: React.FormEvent) => {
    e.preventDefault()
    let err = ""
    if (!form.name.trim()) err = "Escribe tu nombre."
    else if (form.phone.replace(/\D/g, "").length < 7) err = "Revisa el celular, parece incompleto."
    else if (!form.city.trim()) err = "Escribe tu ciudad."
    else if (form.ship === "Envío a domicilio" && !form.addr.trim()) err = "Falta la dirección de entrega."
    if (err) {
      setError(err)
      return
    }

    const url = buildWhatsAppUrl(items, form)
    setWaUrl(url)
    setError("")
    playOrderSounds(actxRef)
    onStageChange("anim")

    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      try {
        window.open(url, "_blank", "noopener,noreferrer")
      } catch {
        // El usuario siempre tiene el botón directo en la pantalla final
      }
      onStageChange("done")
    }, 2750)
  }

  const handleFinish = () => {
    clearCart()
    onCartMutate()
    onStageChange("off")
  }

  if (stage === "off") return null

  /* ───────── 1. CARRITO (Drawer desktop / Bottom Sheet móvil) ───────── */
  if (stage === "cart") {
    const missingForFree = Math.max(0, FREE_SHIPPING_FROM - total)
    return (
      <div className="fixed inset-0 z-[80]">
        <button
          type="button"
          aria-label="Cerrar carrito"
          onClick={() => onStageChange("off")}
          className="vs-fade absolute inset-0 w-full border-0 bg-[rgba(5,6,8,0.72)]"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tu carrito"
          className="vs-sheet md:vs-drawer absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col border-t border-[#2A313B] bg-[#0B0D10] text-[#E8EAED] md:inset-y-0 md:left-auto md:max-h-none md:w-[420px] md:border-t-0 md:border-l"
        >
          {/* Handle móvil */}
          <div className="flex justify-center pt-2 md:hidden">
            <span className="h-1 w-10 rounded-full bg-[#3A424E]" />
          </div>

          <div className="flex items-center justify-between border-b border-[#2A313B] px-5 py-4 md:px-6 md:py-5">
            <div className="font-display text-[28px] leading-none md:text-[30px]">
              TU CARRITO <span className="text-[#2E8BFF]">({count})</span>
            </div>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => onStageChange("off")}
              className="vs-press flex h-11 w-11 items-center justify-center rounded-full border border-[#2A313B] bg-transparent text-[#E8EAED]"
            >
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {count > 0 && (
            <div className="border-b border-[#2A313B] bg-[#12161C] px-5 py-2.5 font-mono text-[11px] tracking-[0.08em] text-[#C3CAD4] md:px-6">
              {missingForFree === 0
                ? "✦ TIENES ENVÍO GRATIS EN ESTE PEDIDO"
                : `TE FALTAN ${formatCOP(missingForFree)} PARA ENVÍO GRATIS`}
            </div>
          )}

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4 md:px-6">
            {count === 0 ? (
              <div className="flex flex-col items-center gap-2.5 py-12 text-center">
                <div className="font-display text-[28px] leading-none">AÚN NADA POR AQUÍ</div>
                <div className="text-[15px] text-[#B8BFCA]">Dale &ldquo;Agregar rápido&rdquo; a algo del drop.</div>
              </div>
            ) : (
              items.map((it) => (
                <div key={it.key} className="vs-item flex items-center gap-3.5 bg-[#1A1E24] p-3">
                  <div className="h-[74px] w-[62px] shrink-0 overflow-hidden bg-[#2A313B]">
                    {it.image ? (
                      <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-mono text-[9px] text-[#8A94A3]">VIPER</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold text-[#F2F4F7]">{it.name}</div>
                    <div className="mt-0.5 text-[12px] text-[#8A94A3]">
                      {it.color} · Talla {it.size}
                    </div>
                    <div className="mt-1 font-mono text-[13px] text-[#C3CAD4]">{formatCOP(it.price)}</div>
                  </div>
                  <div className="flex items-center border border-[#2A313B]">
                    <button
                      type="button"
                      aria-label="Quitar uno"
                      onClick={() => {
                        setQty(it.key, it.qty - 1)
                        onCartMutate()
                      }}
                      className="vs-press flex h-11 w-9 items-center justify-center border-0 bg-transparent text-[18px] text-[#E8EAED]"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-mono text-[13px] text-[#F2F4F7]">{it.qty}</span>
                    <button
                      type="button"
                      aria-label="Agregar uno"
                      onClick={() => {
                        setQty(it.key, it.qty + 1)
                        onCartMutate()
                      }}
                      className="vs-press flex h-11 w-9 items-center justify-center border-0 bg-transparent text-[18px] text-[#E8EAED]"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-[#2A313B] px-5 pt-4 pb-[max(24px,env(safe-area-inset-bottom))] md:px-6 md:py-6">
            <div className="flex items-center justify-between text-[15px]">
              <span className="text-[#B8BFCA]">Subtotal</span>
              <span className="font-mono text-[16px] text-[#F2F4F7]">{formatCOP(total)}</span>
            </div>
            <button
              type="button"
              disabled={count === 0}
              onClick={() => {
                setError("")
                onStageChange("form")
              }}
              className="vs-press h-[54px] border-0 text-[15px] font-bold tracking-[0.04em] disabled:cursor-not-allowed"
              style={
                count > 0
                  ? { background: "#2E8BFF", color: "#0B0D10" }
                  : { background: "#2A313B", color: "#8A94A3" }
              }
            >
              COMPRAR
            </button>
            <button
              type="button"
              onClick={() => onStageChange("off")}
              className="vs-press h-11 border border-[#2A313B] bg-transparent text-[14px] font-semibold text-[#E8EAED]"
            >
              Seguir comprando
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ───────── 2. FORMULARIO DE PEDIDO (PASO 1 DE 2) ───────── */
  if (stage === "form") {
    return (
      <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center md:p-4">
        <button
          type="button"
          aria-label="Cerrar"
          onClick={() => onStageChange("off")}
          className="vs-fade absolute inset-0 w-full border-0 bg-[rgba(5,6,8,0.78)]"
        />
        <form
          onSubmit={handleSendOrder}
          role="dialog"
          aria-modal="true"
          aria-label="Datos para tu pedido"
          className="vs-sheet md:vs-pop relative flex max-h-[92dvh] w-full flex-col overflow-hidden border-t border-[#2A313B] bg-[#0B0D10] text-[#F2F4F7] md:max-h-[calc(100dvh-32px)] md:w-[560px] md:border"
        >
          <div className="flex justify-center pt-2 md:hidden">
            <span className="h-1 w-10 rounded-full bg-[#3A424E]" />
          </div>

          <div className="flex items-start justify-between gap-4 border-b border-[#2A313B] px-5 py-4 md:px-6 md:py-5">
            <div className="flex flex-col gap-1">
              <div className="font-mono text-[11px] tracking-[0.18em] text-[#8A94A3]">
                PASO 1 DE 2 · TUS DATOS · {count} {count === 1 ? "PRENDA" : "PRENDAS"}
              </div>
              <div className="font-display text-[28px] leading-none md:text-[34px]">
                ¿A DÓNDE TE LO <span className="font-marker text-[#2E8BFF]">mandamos</span>?
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                aria-label="Volver al carrito"
                onClick={() => onStageChange("cart")}
                className="vs-press flex h-11 w-11 items-center justify-center rounded-full border border-[#2A313B] bg-transparent text-[#E8EAED]"
              >
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => onStageChange("off")}
                className="vs-press hidden h-11 w-11 items-center justify-center rounded-full border border-[#2A313B] bg-transparent text-[#E8EAED] md:flex"
              >
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
            {/* Resumen del pedido */}
            <div className="flex flex-col gap-1.5 bg-[#1A1E24] px-3.5 py-3">
              <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.15em] text-[#8A94A3]">
                <span>TU PEDIDO · {count} {count === 1 ? "PRENDA" : "PRENDAS"}</span>
                <span className="text-[#F2F4F7]">{formatCOP(total)}</span>
              </div>
              {items.map((it) => (
                <div key={it.key} className="flex justify-between gap-3 text-[13px]">
                  <span className="truncate">
                    {it.qty}× {it.name}{" "}
                    <span className="text-[#8A94A3]">
                      · {it.color} · {it.size}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[#C3CAD4]">{formatCOP(it.price * it.qty)}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ck-name" className="text-[13px] text-[#C3CAD4]">
                Nombre completo
              </label>
              <input
                id="ck-name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Juan Pérez"
                className="vp-in h-12 w-full border border-[#3A424E] bg-[#1A1E24] px-3.5 text-[16px] text-[#F2F4F7] md:bg-[#0B0D10] md:text-[15px]"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ck-phone" className="text-[13px] text-[#C3CAD4]">
                  Celular (WhatsApp)
                </label>
                <input
                  id="ck-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="300 000 0000"
                  className="vp-in h-12 w-full border border-[#3A424E] bg-[#1A1E24] px-3.5 text-[16px] text-[#F2F4F7] md:bg-[#0B0D10] md:text-[15px]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ck-city" className="text-[13px] text-[#C3CAD4]">
                  Ciudad
                </label>
                <input
                  id="ck-city"
                  type="text"
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="Medellín"
                  className="vp-in h-12 w-full border border-[#3A424E] bg-[#1A1E24] px-3.5 text-[16px] text-[#F2F4F7] md:bg-[#0B0D10] md:text-[15px]"
                />
              </div>
            </div>

            {/* Entrega */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] text-[#C3CAD4]">Entrega</span>
              <div className="grid grid-cols-2 gap-2">
                {SHIP_OPTIONS.map((opt) => {
                  const active = form.ship === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updateField("ship", opt)}
                      className="vs-press min-h-[46px] px-3 text-left text-[13px] font-semibold text-[#F2F4F7] md:text-[14px]"
                      style={
                        active
                          ? { background: "#16243A", border: "2px solid #2E8BFF" }
                          : { background: "#1A1E24", border: "2px solid #2A313B" }
                      }
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>

            {form.ship === "Envío a domicilio" && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ck-addr" className="text-[13px] text-[#C3CAD4]">
                  Dirección y barrio
                </label>
                <input
                  id="ck-addr"
                  type="text"
                  autoComplete="street-address"
                  value={form.addr}
                  onChange={(e) => updateField("addr", e.target.value)}
                  placeholder="Cra 00 # 00-00, barrio"
                  className="vp-in h-12 w-full border border-[#3A424E] bg-[#1A1E24] px-3.5 text-[16px] text-[#F2F4F7] md:bg-[#0B0D10] md:text-[15px]"
                />
              </div>
            )}

            {/* Pago */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] text-[#C3CAD4]">Pago</span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {PAY_OPTIONS.map((opt) => {
                  const active = form.pay === opt
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updateField("pay", opt)}
                      className="vs-press min-h-[46px] px-3 text-left text-[13px] font-semibold text-[#F2F4F7]"
                      style={
                        active
                          ? { background: "#16243A", border: "2px solid #2E8BFF" }
                          : { background: "#1A1E24", border: "2px solid #2A313B" }
                      }
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="ck-notes" className="text-[13px] text-[#C3CAD4]">
                Talla o nota (opcional)
              </label>
              <input
                id="ck-notes"
                type="text"
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Ej. Entregar después de las 5 pm"
                className="vp-in h-12 w-full border border-[#3A424E] bg-[#1A1E24] px-3.5 text-[16px] text-[#F2F4F7] md:bg-[#0B0D10] md:text-[15px]"
              />
            </div>

            {error && (
              <div role="alert" className="bg-[#2A1714] px-3 py-2.5 text-[13px] text-[#FFB4A8]">
                {error}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5 border-t border-[#2A313B] px-5 pt-4 pb-[max(22px,env(safe-area-inset-bottom))] md:px-6 md:py-5">
            <button
              type="submit"
              className="vs-press flex h-[56px] w-full items-center justify-center gap-2.5 border-0 bg-[#25D366] text-[15px] font-bold tracking-[0.03em] text-[#0B0D10] md:text-[16px]"
            >
              <WhatsAppIcon size={22} />
              <span>COMPRAR POR WHATSAPP</span>
            </button>
            <div className="text-center text-[12px] text-[#8A94A3]">
              Te abrimos WhatsApp con el pedido escrito. Allá confirmas el pago y el envío.
            </div>
          </div>
        </form>
      </div>
    )
  }

  /* ───────── 3. CINEMÁTICA VIPER TV · REC (PEDIDO EN CAMINO) ───────── */
  if (stage === "anim") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-[95] flex flex-col items-center justify-center gap-5 overflow-hidden bg-[#05070A]"
      >
        <div className="absolute top-0 left-0 right-0 flex h-[9%] min-h-[48px] items-center justify-between bg-black px-5 font-mono text-[11px] tracking-[0.18em] text-[#C3CAD4]">
          <span className="flex items-center gap-2">
            <svg aria-hidden="true" width="16" height="14" viewBox="0 0 64 56" fill="none" stroke="#2E8BFF" strokeWidth="4.5" strokeLinejoin="round">
              <path d="M12 4h40l10 14-30 36L2 18z" />
              <path d="M2 18h60M22 18l10 36 10-36" />
            </svg>
            VIPER STORE
          </span>
          <span>PEDIDO EN CAMINO</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[9%] min-h-[44px] bg-black" />

        <div
          aria-hidden="true"
          className="relative h-[320px] w-full max-w-[760px] overflow-hidden sm:h-[340px]"
          style={{ background: "linear-gradient(180deg, #05070A 0%, #0B1424 100%)" }}
        >
          {/* Luna */}
          <div
            className="absolute top-[34px] right-[12%] h-[46px] w-[46px] rounded-full bg-[#F2F4F7] opacity-85"
            style={{ boxShadow: "0 0 40px rgba(242,244,247,0.35)" }}
          />
          {/* Skyline lejano */}
          <div className="cv-sky" style={{ bottom: 78, animationDuration: "9s" }}>
            {[0, 1, 2, 3].flatMap((rep) =>
              FAR_BUILDINGS.map(([w, h], idx) => (
                <div
                  key={`far-${rep}-${idx}`}
                  style={{ width: w, height: h, marginRight: 6, flexShrink: 0, backgroundColor: "#10141A" }}
                />
              )),
            )}
          </div>
          {/* Skyline cercano con ventanas azules */}
          <div className="cv-sky" style={{ bottom: 70, animationDuration: "4s" }}>
            {[0, 1, 2, 3].flatMap((rep) =>
              NEAR_BUILDINGS.map(([w, h], idx) => (
                <div
                  key={`near-${rep}-${idx}`}
                  style={{
                    width: w,
                    height: h,
                    marginRight: 6,
                    flexShrink: 0,
                    backgroundColor: "#1A1E24",
                    backgroundImage:
                      "repeating-linear-gradient(0deg, rgba(0,0,0,0) 0 10px, rgba(46,139,255,.18) 10px 13px), repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 8px, #1A1E24 8px 14px)",
                  }}
                />
              )),
            )}
          </div>

          {/* Grafiti neón Viper */}
          <div className="cv-glow font-marker absolute top-[70px] left-[8%] -rotate-[6deg] text-[34px] text-[#CFE3FF]">
            Viper
          </div>

          {/* Carretera y líneas de velocidad */}
          <div className="absolute right-0 bottom-0 left-0 h-[72px] border-t-2 border-[#2A313B] bg-[#0E1116]" />
          <div className="cv-lane" style={{ bottom: 32 }} />
          <div className="cv-speed" style={{ top: 150, animationDelay: "0.1s" }} />
          <div className="cv-speed" style={{ top: 196, animationDelay: "0.35s", width: 80 }} />
          <div className="cv-speed" style={{ top: 236, animationDelay: "0.5s" }} />

          {/* Carrito con paquetes cayendo */}
          <div className="cv-cart">
            <div className="cv-bob relative h-[132px] w-[150px]">
              <div className="cv-drop absolute top-[26px] left-[46px] h-[30px] w-[26px] bg-[#2E8BFF]" style={{ animationDelay: "0.7s" }} />
              <div className="cv-drop absolute top-[20px] left-[76px] h-[36px] w-[28px] bg-[#F2F4F7]" style={{ animationDelay: "0.9s" }} />
              <div
                className="cv-drop absolute top-[8px] left-[62px] h-[18px] w-[22px] border-2 border-[#F2F4F7] bg-[#1A4FA0]"
                style={{ animationDelay: "1.1s" }}
              />
              <svg width="150" height="132" viewBox="0 0 170 150" fill="none" className="absolute top-0 left-0">
                <path d="M6 20h22l18 86h96l16-60H38" stroke="#F2F4F7" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M46 106l-6 14h110" stroke="#F2F4F7" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                <g className="cv-wheel">
                  <circle cx="60" cy="136" r="10" stroke="#2E8BFF" strokeWidth="6" />
                  <path d="M60 128v16" stroke="#2E8BFF" strokeWidth="3" />
                </g>
                <g className="cv-wheel">
                  <circle cx="134" cy="136" r="10" stroke="#2E8BFF" strokeWidth="6" />
                  <path d="M134 128v16" stroke="#2E8BFF" strokeWidth="3" />
                </g>
              </svg>
              <div
                className="absolute top-[60px] left-[-70px] h-[3px] w-[60px]"
                style={{ background: "linear-gradient(90deg, rgba(46,139,255,0), #2E8BFF)" }}
              />
              <div
                className="absolute top-[82px] left-[-50px] h-[3px] w-[40px]"
                style={{ background: "linear-gradient(90deg, rgba(46,139,255,0), #2E8BFF)" }}
              />
            </div>
          </div>

          <div className="cv-flash" />

          {/* Badge de WhatsApp */}
          <div
            className="cv-wa absolute top-1/2 left-1/2 -mt-[56px] -ml-[56px] flex h-[112px] w-[112px] items-center justify-center rounded-full bg-[#25D366] text-[#0B0D10]"
            style={{ boxShadow: "0 0 0 10px rgba(37,211,102,0.2), 0 0 60px rgba(37,211,102,0.5)" }}
          >
            <WhatsAppIcon size={56} />
          </div>
        </div>

        <div className="relative flex flex-col gap-2 px-5 text-center">
          <div className="font-display text-[36px] leading-none text-[#F2F4F7] sm:text-[40px]">
            TU PEDIDO VA <span className="font-marker text-[#2E8BFF]">volando</span>
          </div>
          <div className="text-[14px] text-[#C3CAD4]">Abriendo WhatsApp con tu pedido escrito…</div>
        </div>
        <div className="relative h-1 w-[240px] bg-[#1A1E24]">
          <div className="cv-bar h-1 bg-[#25D366]" />
        </div>
      </div>
    )
  }

  /* ───────── 4. CONFIRMACIÓN FINAL (PASO 2 DE 2) ───────── */
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[rgba(5,6,8,0.9)] p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pedido enviado"
        className="vs-pop flex w-full max-w-[460px] flex-col items-center gap-4 border border-[#2A313B] bg-[#0B0D10] p-8 text-center text-[#F2F4F7]"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-[#0B0D10]">
          <svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5 9-10" />
          </svg>
        </div>
        <div className="font-mono text-[11px] tracking-[0.18em] text-[#8A94A3]">PASO 2 DE 2</div>
        <div className="font-display text-[36px] leading-none">
          ¡LISTO, <span className="font-marker text-[#2E8BFF]">parce</span>!
        </div>
        <div className="text-[15px] leading-relaxed text-[#C3CAD4]">
          Tu pedido quedó escrito en WhatsApp. Solo dale enviar y te confirmamos pago y envío.
        </div>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="vs-press flex h-[54px] w-full items-center justify-center gap-2 bg-[#25D366] text-[15px] font-bold text-[#0B0D10]"
        >
          <WhatsAppIcon size={20} />
          Abrir WhatsApp otra vez
        </a>
        <button
          type="button"
          onClick={handleFinish}
          className="vs-press h-12 w-full border border-[#3A424E] bg-transparent text-[14px] font-semibold text-[#F2F4F7]"
        >
          Volver a la tienda
        </button>
      </div>
    </div>
  )
}
