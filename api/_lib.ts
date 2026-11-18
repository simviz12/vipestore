import { timingSafeEqual } from "node:crypto"
import { Redis } from "@upstash/redis"

export const CATALOG_KEY = "viper:catalog:v1"
const MAX_FAILS = 8
const LOCK_SECONDS = 15 * 60

/** Cliente de Redis (Upstash, desde el Marketplace de Vercel). null si no está configurado. */
export function db(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? new Redis({ url, token }) : null
}

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  })

const ipOf = (req: Request) => (req.headers.get("x-forwarded-for") || "anon").split(",")[0].trim()

function samePin(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/**
 * Revisa el PIN del encabezado x-admin-pin contra la variable ADMIN_PIN.
 * Devuelve null si está bien, o la respuesta de error que hay que enviar.
 * Tras varios intentos fallidos bloquea esa IP 15 minutos.
 */
export async function requireAdmin(req: Request): Promise<Response | null> {
  const expected = process.env.ADMIN_PIN
  if (!expected) return json({ error: "Falta configurar ADMIN_PIN en Vercel." }, 503)

  const r = db()
  const failKey = `viper:fails:${ipOf(req)}`
  if (r && Number(await r.get(failKey)) >= MAX_FAILS)
    return json({ error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." }, 429)

  if (samePin(req.headers.get("x-admin-pin") || "", expected)) {
    if (r) await r.del(failKey)
    return null
  }
  if (r) {
    const n = await r.incr(failKey)
    if (n === 1) await r.expire(failKey, LOCK_SECONDS)
  }
  return json({ error: "PIN incorrecto." }, 401)
}

const isStr = (v: unknown, max = 500): v is string => typeof v === "string" && v.length <= max
const isUrl = (v: unknown) => isStr(v, 2000) && /^(https:\/\/|\/)/.test(v)

/** Valida la forma del catálogo antes de guardarlo. Devuelve un mensaje de error o null. */
export function validateCatalog(data: unknown): string | null {
  if (!Array.isArray(data)) return "El catálogo debe ser una lista."
  if (data.length > 300) return "Máximo 300 productos."
  for (const p of data as Record<string, unknown>[]) {
    const label = isStr(p?.name) && p.name ? `“${p.name}”` : "un producto"
    if (!isStr(p?.id, 80) || !p.id) return `Falta el id de ${label}.`
    if (!isStr(p.name, 120) || !p.name.trim()) return "Hay un producto sin nombre."
    if (typeof p.price !== "number" || !(p.price > 0) || p.price > 100_000_000) return `Precio inválido en ${label}.`
    if (!isStr(p.description, 1000)) return `Descripción inválida en ${label}.`
    if (p.tag !== undefined && !isStr(p.tag, 40)) return `Etiqueta inválida en ${label}.`
    if (p.category !== undefined && !isStr(p.category, 40)) return `Categoría inválida en ${label}.`
    if (!Array.isArray(p.sizes) || !p.sizes.length || p.sizes.some((s) => !isStr(s?.label, 10))) return `Tallas inválidas en ${label}.`
    if (!Array.isArray(p.colors) || !p.colors.length) return `${label} necesita al menos un color.`
    for (const c of p.colors as Record<string, unknown>[]) {
      if (!isStr(c?.id, 80) || !isStr(c.name, 60) || !isStr(c.hex, 20)) return `Color inválido en ${label}.`
      if (!Array.isArray(c.images) || c.images.length > 12 || !c.images.every(isUrl))
        return `Las fotos del color “${String(c.name)}” en ${label} deben ser enlaces válidos (máximo 12).`
    }
  }
  return null
}
