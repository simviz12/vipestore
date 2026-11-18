import { useSyncExternalStore } from "react"
import { WHATSAPP_NUMBER } from "@/config"

/* ───────── Tipos ───────── */
export const CATEGORIES = ["Hoodies", "Cargos", "Camisetas", "Accesorios"] as const
export type Category = (typeof CATEGORIES)[number]

export type SizeOption = { label: string; soldOut?: boolean }
export type ColorVariant = { id: string; name: string; hex: string; images: string[]; soldOut?: boolean }
export type Product = {
  id: string
  name: string
  price: number
  description: string
  tag?: string
  category?: Category | string
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
export type ShippingMethod = "Envío a domicilio" | "Recoger en tienda"
export type PaymentMethod = "Transferencia / Nequi" | "Contraentrega" | "Efectivo en tienda"
export type Customer = {
  name: string
  phone: string
  city: string
  ship: ShippingMethod
  addr: string
  pay: PaymentMethod
  notes: string
}

/* ───────── Utilidades ───────── */
export const uid = () => Math.random().toString(36).slice(2, 10)
export const formatCOP = (n: number) => "$" + Math.round(n).toLocaleString("es-CO")
export const isSoldOut = (p: Product) => p.colors.every((c) => c.soldOut) || p.sizes.every((s) => s.soldOut)

export function inferCategory(p: Product): Category {
  const c = p.category
  if (c === "Hoodies" || c === "Cargos" || c === "Camisetas" || c === "Accesorios") return c
  const n = (p.name + " " + p.description).toLowerCase()
  if (/cargo|pantal|jean|jogger|short/.test(n)) return "Cargos"
  if (/tee|camiset|playera|polo/.test(n)) return "Camisetas"
  if (/gorra|bolso|canguro|cadena|anillo|gafa|media|accesor|mochila/.test(n)) return "Accesorios"
  return "Hoodies"
}

const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&h=1000&fit=crop&q=80`
const makeSizes = (...labels: string[]): SizeOption[] => labels.map((label) => ({ label }))

/** Catálogo Viper Store. Se edita y reemplaza desde /admin. */
export const SEED: Product[] = [
  {
    id: "hoodie-asfalto",
    name: "Hoodie Asfalto",
    price: 189000,
    tag: "NUEVO",
    category: "Hoodies",
    description: "Algodón pesado 420 g · Corte oversize con capota estructurada.",
    sizes: makeSizes("XS", "S", "M", "L", "XL"),
    colors: [
      {
        id: "negro-asfalto",
        name: "Negro asfalto",
        hex: "#0B0D10",
        images: [u("1556821840-3a63f95609a7"), u("1578681994506-b8f463449011"), u("1618354691373-d851c5c3a990")],
      },
      {
        id: "azul-noche",
        name: "Azul noche",
        hex: "#1E3A5F",
        images: [u("1507680434567-5739c80be1ac"), u("1611312449408-fcece27cdbb7")],
      },
      {
        id: "gris-niebla",
        name: "Gris niebla",
        hex: "#8A94A3",
        images: [u("1601333144130-8cbb312386b6")],
      },
    ],
  },
  {
    id: "cargo-nocturno",
    name: "Cargo Nocturno",
    price: 169000,
    tag: "NUEVO",
    category: "Cargos",
    description: "Seis bolsillos utilitarios · Dril pesado con bota ajustable.",
    sizes: makeSizes("XS", "S", "M", "L", "XL"),
    colors: [
      {
        id: "grafito",
        name: "Grafito",
        hex: "#2A313B",
        images: [u("1624378439575-d8705ad7ae80"), u("1542272604-787c3835535d")],
      },
      {
        id: "negro",
        name: "Negro",
        hex: "#0B0D10",
        images: [u("1517438476312-10d79c077509")],
      },
    ],
  },
  {
    id: "tee-pulso-oversize",
    name: "Tee Pulso Oversize",
    price: 89000,
    tag: "NUEVO",
    category: "Camisetas",
    description: "Algodón 260 g · Hombro caído y estampado en tinta puff.",
    sizes: makeSizes("XS", "S", "M", "L", "XL"),
    colors: [
      {
        id: "azul-noche",
        name: "Azul noche",
        hex: "#1E3A5F",
        images: [u("1583743814966-8936f5b7be1a"), u("1521572163474-6864f9cf17ab")],
      },
      {
        id: "negro",
        name: "Negro",
        hex: "#0B0D10",
        images: [u("1618354691373-d851c5c3a990")],
      },
    ],
  },
  {
    id: "chaqueta-acero",
    name: "Chaqueta Acero",
    price: 249000,
    tag: "EXCLUSIVO",
    category: "Hoodies",
    description: "Cierres metálicos · Corte boxy resistente al viento nocturno.",
    sizes: [{ label: "XS" }, { label: "S" }, { label: "M" }, { label: "L" }, { label: "XL", soldOut: true }],
    colors: [
      {
        id: "gris-niebla",
        name: "Gris niebla",
        hex: "#8A94A3",
        images: [u("1551028719-00167b16eac5"), u("1520975954732-35dd22299614")],
      },
      {
        id: "negro",
        name: "Negro",
        hex: "#0B0D10",
        images: [u("1548126032-079a0fb0099d")],
      },
    ],
  },
  {
    id: "gorra-diamante",
    name: "Gorra Diamante",
    price: 69000,
    tag: "BÁSICO",
    category: "Accesorios",
    description: "Bordado 3D corona y diamante · Visera curva y broche metálico.",
    sizes: makeSizes("ÚNICA"),
    colors: [
      {
        id: "negro",
        name: "Negro",
        hex: "#0B0D10",
        images: [u("1588850561407-ed78c282e89b"), u("1521369909029-2afed882baee")],
      },
      {
        id: "azul-vitrina",
        name: "Azul vitrina",
        hex: "#1A4FA0",
        images: [u("1534215754734-18e55d13e346")],
      },
    ],
  },
  {
    id: "cargo-asfalto-wide",
    name: "Cargo Asfalto Wide",
    price: 179000,
    tag: "ÚLTIMAS",
    category: "Cargos",
    description: "Silueta wide leg pa' la calle · Costuras reforzadas.",
    sizes: [{ label: "XS", soldOut: true }, { label: "S" }, { label: "M" }, { label: "L" }, { label: "XL" }],
    colors: [
      {
        id: "negro",
        name: "Negro",
        hex: "#0B0D10",
        images: [u("1552374196-1ab2a1c593e8"), u("1523398002811-999ca8dec234")],
      },
    ],
  },
  {
    id: "tee-corona-oversize",
    name: "Tee Corona Oversize",
    price: 85000,
    tag: "BÁSICO",
    category: "Camisetas",
    description: "Algodón grueso peinado · Estampado Viper en espalda.",
    sizes: makeSizes("XS", "S", "M", "L", "XL"),
    colors: [
      {
        id: "blanco-tiza",
        name: "Blanco tiza",
        hex: "#F2F4F7",
        images: [u("1576566588028-4147f3842f27"), u("1521572163474-6864f9cf17ab")],
      },
      {
        id: "negro",
        name: "Negro",
        hex: "#0B0D10",
        images: [u("1583743814966-8936f5b7be1a")],
      },
    ],
  },
  {
    id: "bolso-cruzado-noche",
    name: "Bolso Cruzado Noche",
    price: 119000,
    tag: "NUEVO",
    category: "Accesorios",
    description: "Nylon balístico impermeable · Correa regulable y bolsillo oculto.",
    sizes: makeSizes("ÚNICA"),
    colors: [
      {
        id: "azul-noche",
        name: "Azul noche",
        hex: "#1E3A5F",
        images: [u("1553062407-98eeb64c6a62"), u("1548036328-c9fa89d128fa")],
      },
      {
        id: "negro",
        name: "Negro",
        hex: "#0B0D10",
        images: [u("1548036328-c9fa89d128fa")],
      },
    ],
  },
]

/* ───────── Almacén persistente (localStorage) ───────── */
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
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key !== key) return
      value = read()
      emit()
    })
  }
  return {
    get: () => value,
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

export const catalogStore = createStore<Product[]>("viper.catalog.v2", SEED)
export const cartStore = createStore<CartItem[]>("viper.cart.v2", [])
export const favoritesStore = createStore<string[]>("viper.favs.v1", [])
export const dropListStore = createStore<string[]>("viper.droplist.v1", [])
export const customerStore = createStore<Customer>("viper.customer.v2", {
  name: "",
  phone: "",
  city: "",
  ship: "Envío a domicilio",
  addr: "",
  pay: "Transferencia / Nequi",
  notes: "",
})

export const useCatalog = () => useSyncExternalStore(catalogStore.subscribe, catalogStore.get)
export const useCart = () => useSyncExternalStore(cartStore.subscribe, cartStore.get)
export const useFavorites = () => useSyncExternalStore(favoritesStore.subscribe, favoritesStore.get)

export function toggleFavorite(productId: string) {
  favoritesStore.set((ids) => (ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId]))
}

/* ───────── Carrito ───────── */
export function addToCart(p: Product, color: ColorVariant, size: string, qty = 1) {
  const key = `${p.id}|${color.id}|${size}`
  cartStore.set((items) => {
    const found = items.find((i) => i.key === key)
    if (found) return items.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i))
    return [
      ...items,
      {
        key,
        productId: p.id,
        name: p.name,
        price: p.price,
        color: color.name,
        size,
        image: color.images[0] ?? "",
        qty,
      },
    ]
  })
}

export const setQty = (key: string, qty: number) =>
  cartStore.set((items) => (qty <= 0 ? items.filter((i) => i.key !== key) : items.map((i) => (i.key === key ? { ...i, qty } : i))))
export const removeItem = (key: string) => cartStore.set((items) => items.filter((i) => i.key !== key))
export const clearCart = () => cartStore.set([])
export const cartTotal = (items: CartItem[]) => items.reduce((s, i) => s + i.price * i.qty, 0)
export const cartCount = (items: CartItem[]) => items.reduce((s, i) => s + i.qty, 0)

/* ───────── WhatsApp (573217214397) ───────── */
export function buildWhatsAppUrl(items: CartItem[], c: Customer) {
  const now = new Date()
  const two = (n: number) => String(n).padStart(2, "0")
  const code = `VS-${two(now.getDate())}${two(now.getMonth() + 1)}-${two(now.getHours())}${two(now.getMinutes())}`
  const units = cartCount(items)
  const lines = [
    `Hola Viper Store, quiero hacer este pedido (*#${code}*):`,
    "",
    ...items.map(
      (it) =>
        `- ${it.qty}x ${it.name}${it.color ? ` (${it.color})` : ""}${it.size ? ` · Talla ${it.size}` : ""} — ${formatCOP(it.price * it.qty)}`,
    ),
    "",
    `Total (${units} ${units === 1 ? "prenda" : "prendas"}): *${formatCOP(cartTotal(items))}*`,
    "",
    `Nombre: ${c.name.trim()}`,
    `Celular: ${c.phone.trim()}`,
    `Ciudad: ${c.city.trim()}`,
    `Entrega: ${c.ship}`,
    ...(c.ship === "Envío a domicilio" ? [`Dirección: ${c.addr.trim()}`] : []),
    `Pago: ${c.pay}`,
    ...(c.notes.trim() ? [`Nota: ${c.notes.trim()}`] : []),
  ]
  const num = String(WHATSAPP_NUMBER).replace(/\D/g, "")
  return `https://wa.me/${num}?text=${encodeURIComponent(lines.join("\n"))}`
}

export function buildDropListWhatsAppUrl(contact: string) {
  const num = String(WHATSAPP_NUMBER).replace(/\D/g, "")
  const text = `Hola Viper Store, quiero entrar a la lista VIP del Drop 04 "Nocturno". Mi contacto: ${contact}`
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`
}
