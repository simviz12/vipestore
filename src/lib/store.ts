import { useSyncExternalStore } from "react"
import { WHATSAPP_NUMBER } from "@/config"

/* ───────── Tipos ───────── */
export type SizeOption = { label: string; soldOut?: boolean }
export type ColorVariant = { id: string; name: string; hex: string; images: string[]; soldOut?: boolean }
export type Product = {
  id: string
  name: string
  price: number
  description: string
  tag?: string
  sizes: SizeOption[]
  colors: ColorVariant[]
}
export type CartItem = {
  key: string
  productId: string
  name: string
  price: number
  color: string
  size: string
  image: string
  qty: number
}
export type Payment = "Nequi" | "Pago físico / Contraentrega"
export type Customer = { name: string; city: string; hood: string; address: string; notes: string; payment: Payment | "" }

/* ───────── Utilidades ───────── */
export const uid = () => Math.random().toString(36).slice(2, 10)
export const formatCOP = (n: number) => "$" + Math.round(n).toLocaleString("es-CO")
export const isSoldOut = (p: Product) => p.colors.every((c) => c.soldOut) || p.sizes.every((s) => s.soldOut)

const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&h=1000&fit=crop&q=80`
const sizes = (...l: string[]): SizeOption[] => l.map((label) => ({ label }))

/** Catálogo de ejemplo. Se reemplaza desde /admin. */
export const SEED: Product[] = [
  {
    id: "biker",
    name: "Chaqueta Biker",
    price: 249000,
    tag: "Más vendida",
    description: "Cuero sintético con cierres metálicos y corte ajustado. La que nunca falla.",
    sizes: sizes("S", "M", "L", "XL"),
    colors: [{ id: "negro", name: "Negro", hex: "#111111", images: [u("1520975954732-35dd22299614"), u("1521223890158-f9f7c3d5d504"), u("1551028719-00167b16eac5")] }],
  },
  {
    id: "denim",
    name: "Chaqueta Denim Crown",
    price: 189000,
    tag: "Nuevo",
    description: "Jean rígido de corte clásico. Tres lavados para combinar con todo.",
    sizes: sizes("S", "M", "L", "XL"),
    colors: [
      { id: "claro", name: "Azul claro", hex: "#9cc4e4", images: [u("1495105787522-5334e3ffa0ef"), u("1516257984-b1b4d707412e"), u("1543076447-215ad9ba6923")] },
      { id: "oscuro", name: "Azul oscuro", hex: "#1f3a5f", images: [u("1611312449408-fcece27cdbb7")] },
      { id: "gris", name: "Gris", hex: "#9aa0a6", images: [u("1601333144130-8cbb312386b6")] },
    ],
  },
  {
    id: "bomber",
    name: "Bomber Street",
    price: 169000,
    description: "Liviana, con puños en resorte. Para el día a día.",
    sizes: [{ label: "S" }, { label: "M" }, { label: "L" }, { label: "XL", soldOut: true }],
    colors: [
      { id: "terracota", name: "Terracota", hex: "#b5613c", images: [u("1591047139829-d91aecb6caea")] },
      { id: "negro", name: "Negro", hex: "#111111", images: [u("1548126032-079a0fb0099d")] },
    ],
  },
  {
    id: "puffer",
    name: "Puffer Night",
    price: 219000,
    tag: "Nuevo",
    description: "Acolchada y abrigada sin pesar. Lista para el frío.",
    sizes: sizes("M", "L", "XL"),
    colors: [{ id: "negro", name: "Negro", hex: "#111111", images: [u("1614031679232-0dae776a72ee"), u("1557418669-db3f781a58c0")] }],
  },
  {
    id: "parka",
    name: "Parka Utility",
    price: 229000,
    description: "Cuatro bolsillos, capota y tela resistente al agua.",
    sizes: sizes("S", "M", "L"),
    colors: [{ id: "verde", name: "Verde militar", hex: "#4b5320", images: [u("1548883354-94bcfe321cbb"), u("1544022613-e87ca75a784a")] }],
  },
  {
    id: "rompevientos",
    name: "Rompevientos Night",
    price: 159000,
    description: "Corte oversize con bloques de color. Se guarda en nada.",
    sizes: sizes("S", "M", "L", "XL"),
    colors: [{ id: "negro", name: "Negro", hex: "#111111", images: [u("1523398002811-999ca8dec234")] }],
  },
  {
    id: "sherpa",
    name: "Chaqueta Sherpa",
    price: 239000,
    description: "Forro de ovejero por dentro, actitud por fuera.",
    sizes: sizes("S", "M", "L"),
    colors: [{ id: "cafe", name: "Café", hex: "#6b4a34", images: [u("1608063615781-e2ef8c73d114"), u("1559551409-dadc959f76b8")] }],
  },
  {
    id: "overshirt",
    name: "Overshirt Navy",
    price: 149000,
    description: "Entre camisa y chaqueta. La capa perfecta.",
    sizes: sizes("S", "M", "L", "XL"),
    colors: [{ id: "navy", name: "Azul noche", hex: "#1b2536", images: [u("1507680434567-5739c80be1ac")] }],
  },
  {
    id: "buzo-crew",
    name: "Buzo Crew Logo",
    price: 119000,
    tag: "Nuevo",
    description: "Buzo cuello redondo de algodón grueso con logo pequeño al pecho.",
    sizes: sizes("S", "M", "L", "XL"),
    colors: [
      { id: "negro", name: "Negro", hex: "#111111", images: [u("1578681994506-b8f463449011")] },
      { id: "vino", name: "Vino", hex: "#8a1c3a", images: [u("1552374196-1ab2a1c593e8")] },
      { id: "rosa", name: "Rosa palo", hex: "#e8c9cf", images: [u("1516826957135-700dedea698c")] },
    ],
  },
  {
    id: "abrigo-cuadros",
    name: "Abrigo Cuadros",
    price: 259000,
    description: "Abrigo largo de cuadros blanco y negro. Elegante sin dejar la calle.",
    sizes: sizes("S", "M", "L"),
    colors: [{ id: "bn", name: "Blanco y negro", hex: "#d9d9d9", images: [u("1525450824786-227cbef70703")] }],
  },
  {
    id: "fleece",
    name: "Fleece Polar",
    price: 139000,
    description: "Polar suave y abrigado para las noches frías.",
    sizes: sizes("S", "M", "L", "XL"),
    colors: [{ id: "rojo", name: "Rojo", hex: "#d7372b", images: [u("1604644401890-0bd678c83788")] }],
  },
  {
    id: "tee-original",
    name: "Tee Original",
    price: 79000,
    description: "Camiseta de algodón con estampado azul al frente.",
    sizes: sizes("S", "M", "L", "XL"),
    colors: [
      { id: "arena", name: "Arena", hex: "#d8cbb4", images: [u("1576566588028-4147f3842f27")] },
      { id: "negro", name: "Negro", hex: "#111111", images: [u("1618354691373-d851c5c3a990")] },
    ],
  },
]

/* ───────── Almacén persistente (localStorage) ─────────
 * Para conectar un backend en el futuro, basta reemplazar read/write
 * de cada store por llamadas a la API; los componentes no cambian. */
function createStore<T>(key: string, initial: T) {
  const listeners = new Set<() => void>()
  const read = (): T => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  }
  let value = read()
  const emit = () => listeners.forEach((l) => l())
  if (typeof window !== "undefined")
    window.addEventListener("storage", (e) => {
      if (e.key !== key) return
      value = read()
      emit()
    })
  return {
    get: () => value,
    /** Devuelve false si el navegador no pudo guardar (p. ej. almacenamiento lleno). */
    set(next: T | ((prev: T) => T)): boolean {
      const v = typeof next === "function" ? (next as (p: T) => T)(value) : next
      try {
        localStorage.setItem(key, JSON.stringify(v))
      } catch {
        return false
      }
      value = v
      emit()
      return true
    },
    subscribe(l: () => void) {
      listeners.add(l)
      return () => void listeners.delete(l)
    },
  }
}

export const catalogStore = createStore<Product[]>("viper.catalog.v1", SEED)
export const cartStore = createStore<CartItem[]>("viper.cart.v1", [])
export const customerStore = createStore<Customer>("viper.customer.v1", { name: "", city: "", hood: "", address: "", notes: "", payment: "" })

export const useCatalog = () => useSyncExternalStore(catalogStore.subscribe, catalogStore.get)
export const useCart = () => useSyncExternalStore(cartStore.subscribe, cartStore.get)

/* ───────── Carrito ───────── */
export function addToCart(p: Product, color: ColorVariant, size: string, qty = 1) {
  const key = `${p.id}|${color.id}|${size}`
  cartStore.set((items) => {
    const found = items.find((i) => i.key === key)
    if (found) return items.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i))
    return [...items, { key, productId: p.id, name: p.name, price: p.price, color: color.name, size, image: color.images[0] ?? "", qty }]
  })
}
export const setQty = (key: string, qty: number) =>
  cartStore.set((items) => (qty <= 0 ? items.filter((i) => i.key !== key) : items.map((i) => (i.key === key ? { ...i, qty } : i))))
export const removeItem = (key: string) => cartStore.set((items) => items.filter((i) => i.key !== key))
export const clearCart = () => cartStore.set([])
export const cartTotal = (items: CartItem[]) => items.reduce((s, i) => s + i.price * i.qty, 0)
export const cartCount = (items: CartItem[]) => items.reduce((s, i) => s + i.qty, 0)

/* ───────── WhatsApp ───────── */
export function buildWhatsAppUrl(items: CartItem[], c: Customer) {
  const now = new Date()
  const two = (n: number) => String(n).padStart(2, "0")
  const code = `VS-${two(now.getDate())}${two(now.getMonth() + 1)}-${two(now.getHours())}${two(now.getMinutes())}`
  const units = cartCount(items)
  const rule = "━━━━━━━━━━━━━━━"
  const lines = [
    "🛍️ *NUEVO PEDIDO · VIPER STORE*",
    `Pedido *#${code}*`,
    rule,
    "",
    "👤 *DATOS DEL CLIENTE*",
    `• *Nombre:* ${c.name.trim()}`,
    `• *Ciudad:* ${c.city.trim()}`,
    `• *Barrio:* ${c.hood.trim()}`,
    `• *Dirección:* ${c.address.trim()}`,
    ...(c.notes.trim() ? [`• *Indicaciones:* ${c.notes.trim()}`] : []),
    "",
    `🧥 *PRODUCTOS* (${units} ${units === 1 ? "unidad" : "unidades"})`,
    ...items.flatMap((i, n) => [
      "",
      `*${n + 1}. ${i.name}*`,
      `   Color: ${i.color}  |  Talla: ${i.size}`,
      `   ${i.qty} × ${formatCOP(i.price)} = *${formatCOP(i.price * i.qty)}*`,
    ]),
    "",
    rule,
    `💰 *TOTAL PRODUCTOS: ${formatCOP(cartTotal(items))}*`,
    `🚚 *Envío:* por confirmar`,
    `💳 *Pago:* ${c.payment}`,
    rule,
    "",
    "Quedo atento a la confirmación. ¡Gracias! 🙌",
  ]
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`
}
