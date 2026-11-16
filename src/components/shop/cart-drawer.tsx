import { cloneElement, useEffect, useState } from "react"
import { ArrowLeft, Banknote, Check, MessageCircle, Minus, Plus, ShoppingBag, Smartphone, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { buildWhatsAppUrl, cartCount, cartTotal, clearCart, customerStore, formatCOP, removeItem, setQty, useCart, type Customer, type Payment } from "@/lib/store"
import { Drawer } from "./drawer"
import { toast } from "./toast"

type Step = "cart" | "checkout" | "sent"

const PAYMENTS: { value: Payment; label: string; hint: string; icon: typeof Smartphone }[] = [
  { value: "Nequi", label: "Nequi", hint: "Te enviamos el número por WhatsApp", icon: Smartphone },
  { value: "Pago físico / Contraentrega", label: "Contraentrega", hint: "Pagas en efectivo al recibir", icon: Banknote },
]

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = useCart()
  const [step, setStep] = useState<Step>("cart")
  const [form, setForm] = useState<Customer>(customerStore.get())
  const [errors, setErrors] = useState<Partial<Record<keyof Customer, string>>>({})
  const [waUrl, setWaUrl] = useState("")
  const total = cartTotal(items)

  useEffect(() => {
    if (open && step !== "sent") setStep("cart")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const field = (k: keyof Customer, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const confirm = (e: React.FormEvent) => {
    e.preventDefault()
    const err: typeof errors = {}
    if (form.name.trim().length < 3) err.name = "Escribe tu nombre completo."
    if (!form.city.trim()) err.city = "¿En qué ciudad estás?"
    if (!form.hood.trim()) err.hood = "Escribe tu barrio."
    if (form.address.trim().length < 5) err.address = "Escribe la dirección exacta."
    if (!form.payment) err.payment = "Elige cómo vas a pagar."
    setErrors(err)
    const first = Object.keys(err)[0]
    if (first) {
      // Lleva el foco (no solo el scroll) al primer campo con error.
      const el = first === "payment" ? document.querySelector<HTMLElement>("#f-payment button") : document.getElementById("f-" + first)
      el?.focus({ preventScroll: true })
      el?.scrollIntoView({ block: "center", behavior: "smooth" })
      return
    }
    customerStore.set(form)
    const url = buildWhatsAppUrl(items, form)
    setWaUrl(url)
    window.open(url, "_blank", "noopener")
    setStep("sent")
  }

  const title = step === "cart" ? `Tu bolsa (${cartCount(items)})` : step === "checkout" ? "Datos de envío" : "¡Casi listo!"

  const footer =
    step === "cart" && items.length > 0 ? (
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Total productos</span>
          <span className="font-display text-3xl tabular-nums">{formatCOP(total)}</span>
        </div>
        <button type="button" onClick={() => setStep("checkout")} className="btn-primary w-full">
          Finalizar compra
        </button>
        <p className="mt-2 text-center text-xs text-muted-foreground">Siguiente paso: tus datos de envío</p>
      </div>
    ) : step === "checkout" ? (
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Total productos</span>
          <span className="font-display text-3xl tabular-nums">{formatCOP(total)}</span>
        </div>
        <p className="mb-3 mt-1 text-xs text-muted-foreground">El costo del envío te lo confirmamos por WhatsApp antes de pagar.</p>
        <button type="submit" form="checkout" className="btn-primary btn-whatsapp w-full">
          <MessageCircle className="size-5" /> Confirmar pedido por WhatsApp
        </button>
      </div>
    ) : undefined

  return (
    <Drawer open={open} onClose={onClose} title={title} footer={footer}>
      {/* Pasos */}
      {items.length > 0 && step !== "sent" && (
        <ol className="flex items-center gap-2 border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-[0.1em]">
          {["Bolsa", "Datos", "WhatsApp"].map((s, i) => {
            const active = (step === "cart" ? 0 : 1) === i
            const done = step === "checkout" && i === 0
            return (
              <li key={s} className={cn("flex items-center gap-2", active ? "text-foreground" : "text-muted-foreground")}>
                {i > 0 && <span className="h-px w-5 bg-border" />}
                <span className={cn("grid size-6 place-items-center rounded-full text-xs", active || done ? "bg-primary text-white" : "bg-muted")}>
                  {done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                </span>
                {s}
              </li>
            )
          })}
        </ol>
      )}

      {/* ── Bolsa ── */}
      {step === "cart" &&
        (items.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-20 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-muted">
              <ShoppingBag className="size-7 text-muted-foreground" />
            </span>
            <p className="mt-5 font-display text-2xl uppercase">Tu bolsa está vacía</p>
            <p className="mt-2 text-sm text-muted-foreground">Elige una prenda, su color y su talla.</p>
            <a href="#catalogo" onClick={onClose} className="btn-primary mt-6">
              Ver catálogo
            </a>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((i) => (
              <li key={i.key} className="flex gap-4 p-5">
                <img src={i.image} alt="" className="h-28 w-22 shrink-0 rounded-lg bg-muted object-cover" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight">{i.name}</h3>
                    <button type="button" onClick={() => { removeItem(i.key); toast(`Quitaste ${i.name}`) }} aria-label={`Eliminar ${i.name}`} className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:text-red-400">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {i.color} · Talla {i.size}
                  </p>
                  <p className="text-sm text-muted-foreground">{formatCOP(i.price)} c/u</p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex h-11 items-center rounded-full border border-border">
                      <button type="button" onClick={() => setQty(i.key, i.qty - 1)} aria-label={`Quitar una unidad de ${i.name}`} className="grid h-full w-11 place-items-center">
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums">{i.qty}</span>
                      <button type="button" onClick={() => setQty(i.key, Math.min(10, i.qty + 1))} aria-label={`Agregar una unidad de ${i.name}`} className="grid h-full w-11 place-items-center">
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <span className="font-display text-xl tabular-nums">{formatCOP(i.price * i.qty)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ))}

      {/* ── Datos de envío ── */}
      {step === "checkout" && (
        <form id="checkout" onSubmit={confirm} noValidate className="space-y-5 p-5">
          <button type="button" onClick={() => setStep("cart")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Volver a la bolsa
          </button>

          <Field id="name" label="Nombre completo" error={errors.name}>
            <input id="f-name" className="input" autoComplete="name" value={form.name} onChange={(e) => field("name", e.target.value)} placeholder="Ej: Laura Gómez" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="city" label="Ciudad" error={errors.city}>
              <input id="f-city" className="input" autoComplete="address-level2" value={form.city} onChange={(e) => field("city", e.target.value)} placeholder="Ej: Medellín" />
            </Field>
            <Field id="hood" label="Barrio" error={errors.hood}>
              <input id="f-hood" className="input" value={form.hood} onChange={(e) => field("hood", e.target.value)} placeholder="Ej: Laureles" />
            </Field>
          </div>
          <Field id="address" label="Dirección exacta" error={errors.address}>
            <input id="f-address" className="input" autoComplete="street-address" value={form.address} onChange={(e) => field("address", e.target.value)} placeholder="Ej: Cra 70 # 44-21, apto 302" />
          </Field>
          <Field id="notes" label="Indicaciones (opcional)">
            <input id="f-notes" className="input" value={form.notes} onChange={(e) => field("notes", e.target.value)} placeholder="Ej: portería, casa de rejas negras" />
          </Field>

          <fieldset id="f-payment" aria-describedby={errors.payment ? "e-payment" : undefined}>
            <legend className="mb-2 text-sm font-semibold">Método de pago</legend>
            <div className="grid gap-2">
              {PAYMENTS.map((m) => {
                const on = form.payment === m.value
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => field("payment", m.value)}
                    aria-pressed={on}
                    className={cn("flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition", on ? "border-primary bg-primary/10" : "border-border hover:border-foreground/40")}
                  >
                    <m.icon className={cn("size-6 shrink-0", on ? "text-primary-glow" : "text-muted-foreground")} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{m.label}</span>
                      <span className="block text-sm text-muted-foreground">{m.hint}</span>
                    </span>
                    <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2", on ? "border-primary bg-primary text-white" : "border-border")}>
                      {on && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                  </button>
                )
              })}
            </div>
            {errors.payment && <p id="e-payment" role="alert" className="mt-2 text-sm text-red-400">{errors.payment}</p>}
          </fieldset>

          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Al confirmar se abre WhatsApp con tu pedido ya escrito. Solo tienes que tocar <strong className="text-foreground">Enviar</strong>.
          </p>
        </form>
      )}

      {/* ── Enviado ── */}
      {step === "sent" && (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-whatsapp text-white">
            <MessageCircle className="size-8" />
          </span>
          <p className="mt-5 font-display text-3xl uppercase">Envía el mensaje</p>
          <p className="mt-2 max-w-xs text-[15px] text-muted-foreground">
            Abrimos WhatsApp con tu pedido listo. Toca <strong className="text-foreground">Enviar</strong> allá para que quede confirmado.
          </p>
          <a href={waUrl} target="_blank" rel="noopener" className="btn-ghost mt-6 w-full">
            ¿No se abrió? Abrir WhatsApp
          </a>
          <button
            type="button"
            onClick={() => {
              clearCart()
              setStep("cart")
              onClose()
              toast("¡Gracias por tu compra! Vaciamos tu bolsa.")
            }}
            className="btn-primary mt-3 w-full"
          >
            Ya lo envié, vaciar bolsa
          </button>
          <button type="button" onClick={() => setStep("checkout")} className="mt-4 text-sm text-muted-foreground underline underline-offset-4">
            Corregir mis datos
          </button>
        </div>
      )}
    </Drawer>
  )
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>> }) {
  // El campo anuncia su error a lectores de pantalla (aria-invalid + aria-describedby).
  const input = cloneElement(children, { "aria-invalid": error ? true : undefined, "aria-describedby": error ? "e-" + id : undefined })
  return (
    <div>
      <label htmlFor={"f-" + id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <div className={error ? "[&_.input]:border-red-400" : ""}>{input}</div>
      {error && <p id={"e-" + id} role="alert" className="mt-1.5 text-sm text-red-400">{error}</p>}
    </div>
  )
}
