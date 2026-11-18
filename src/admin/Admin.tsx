import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { STORE_NAME } from "@/config"
import {
  CATEGORIES,
  formatCOP,
  inferCategory,
  SEED,
  uid,
  useCatalog,
  type Category,
  type Product,
} from "@/lib/store"
import { hasSession, login, logout, saveCatalog, syncCatalog, uploadImage, useMode } from "@/lib/api"
import { Logo } from "@/components/site/logo"

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "ÚNICA"] as const
const TAG_OPTIONS = [
  { value: "NUEVO", label: "Nuevo" },
  { value: "EXCLUSIVO", label: "Exclusivo" },
  { value: "ÚLTIMAS", label: "Últimas unidades" },
  { value: "BÁSICO", label: "Básico" },
]

const COLOR_PRESETS: Record<string, string> = {
  negro: "#0B0D10",
  "negro asfalto": "#0B0D10",
  grafito: "#2A313B",
  gris: "#8A94A3",
  "gris niebla": "#8A94A3",
  azul: "#1A4FA0",
  "azul noche": "#1E3A5F",
  "azul eléctrico": "#2E8BFF",
  blanco: "#F2F4F7",
  "blanco tiza": "#F2F4F7",
  hueso: "#E8E2D5",
  verde: "#2E4C3B",
  rojo: "#B91C1C",
}

const msg = (e: unknown) => (e instanceof Error ? e.message : "Algo salió mal. Inténtalo de nuevo.")

type FormState = {
  editingId: string | null
  name: string
  price: string
  color: string
  hex: string
  cat: Category
  tag: string
  description: string
  img: string
  sizes: string[]
}

const BLANK_FORM: FormState = {
  editingId: null,
  name: "",
  price: "",
  color: "Negro",
  hex: "#0B0D10",
  cat: "Hoodies",
  tag: "NUEVO",
  description: "",
  img: "",
  sizes: ["XS", "S", "M", "L", "XL"],
}

function goHome(e: React.MouseEvent<HTMLAnchorElement>) {
  if (window.location.hash.startsWith("#/admin")) {
    e.preventDefault()
    window.location.hash = ""
  }
}

export default function Admin() {
  const [ok, setOk] = useState(hasSession)
  useEffect(() => {
    syncCatalog()
  }, [])
  return (
    <div className="min-h-[100dvh] bg-[#0B0D10] font-sans text-[#F2F4F7]">
      {ok ? (
        <CatalogPanel
          onLock={() => {
            logout()
            setOk(false)
          }}
        />
      ) : (
        <PinGate onOk={() => setOk(true)} />
      )}
    </div>
  )
}

function PinGate({ onOk }: { onOk: () => void }) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin.trim()) {
      setError("Escribe el PIN.")
      return
    }
    setBusy(true)
    try {
      await login(pin.trim())
      onOk()
    } catch (err) {
      setError(msg(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="border-b border-[#2A313B]">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="border border-[#2A313B] px-2 py-1 font-mono text-[11px] tracking-[0.18em] text-[#C3CAD4]">
              PANEL
            </span>
          </div>
          <a href="/" onClick={goHome} className="text-[14px] font-semibold text-[#7FB5FF] no-underline hover:text-[#B3D3FF]">
            Ver la tienda →
          </a>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-6 py-12">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 border border-[#2A313B] bg-[#1A1E24] p-7">
          <div className="flex flex-col gap-1.5">
            <div className="font-mono text-[11px] tracking-[0.18em] text-[#8A94A3]">ACCESO PRIVADO · {STORE_NAME.toUpperCase()}</div>
            <h1 className="m-0 font-display text-[40px] font-normal leading-none">GESTIONAR CATÁLOGO</h1>
            <p className="m-0 text-[14px] text-[#C3CAD4]">Escribe el PIN del administrador para agregar o quitar prendas.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-pin" className="text-[13px] text-[#C3CAD4]">
              PIN
            </label>
            <input
              id="admin-pin"
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value)
                if (error) setError("")
              }}
              placeholder="••••"
              className="vp-in h-12 w-full border border-[#3A424E] bg-[#0B0D10] px-4 text-center font-mono text-[22px] tracking-[0.45em] text-[#F2F4F7]"
            />
          </div>

          {error && (
            <div role="alert" className="bg-[#2A1714] px-3 py-2.5 text-[13px] text-[#FFB4A8]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="vs-press flex h-[52px] w-full items-center justify-center gap-2 border-0 bg-[#2E8BFF] text-[15px] font-bold tracking-[0.04em] text-[#0B0D10] disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "ENTRANDO…" : "ENTRAR AL PANEL"}
          </button>

          {import.meta.env.DEV && (
            <div className="font-mono text-[11px] text-[#8A94A3]">
              Modo desarrollo local · PIN de prueba: <span className="text-[#F2F4F7]">1234</span>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}

function CatalogPanel({ onLock }: { onLock: () => void }) {
  const catalog = useCatalog()
  const mode = useMode()

  const [form, setForm] = useState<FormState>(BLANK_FORM)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [freshId, setFreshId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const showNotice = (text: string) => {
    setNotice(text)
    window.setTimeout(() => {
      setNotice((curr) => (curr === text ? "" : curr))
    }, 3400)
  }

  const handleFile = async (file?: File | null) => {
    if (!file) return
    if (!/^image\//.test(file.type)) {
      setError("Ese archivo no es una imagen.")
      return
    }
    setError("")
    setUploading(true)
    try {
      const url = await uploadImage(file)
      setForm((prev) => ({ ...prev, img: url }))
    } catch (err) {
      setError(msg(err))
    } finally {
      setUploading(false)
    }
  }

  const toggleSize = (label: string) => {
    setForm((prev) => {
      if (label === "ÚNICA") return { ...prev, sizes: ["ÚNICA"] }
      const withoutUnica = prev.sizes.filter((s) => s !== "ÚNICA")
      const exists = withoutUnica.includes(label)
      const next = exists ? withoutUnica.filter((s) => s !== label) : [...withoutUnica, label]
      return { ...prev, sizes: next.length ? next : ["M"] }
    })
  }

  const handleColorInput = (val: string) => {
    const preset = COLOR_PRESETS[val.trim().toLowerCase()]
    setForm((prev) => ({ ...prev, color: val, ...(preset ? { hex: preset } : {}) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError("Ponle un nombre al producto.")
      return
    }
    const numericPrice = Number(form.price.replace(/[^\d]/g, ""))
    if (!numericPrice || numericPrice <= 0) {
      setError("Ponle un precio válido en pesos (ej. 189000).")
      return
    }

    setError("")
    setSaving(true)
    try {
      const id = form.editingId ?? `p${Date.now()}`
      const existing = form.editingId ? catalog.find((x) => x.id === form.editingId) : null
      const colorName = form.color.trim() || "Negro"
      const images = form.img.trim() ? [form.img.trim()] : []
      const sizes = (form.sizes.length ? form.sizes : ["S", "M", "L", "XL"]).map((label) => ({ label }))

      const product: Product = {
        id,
        name: form.name.trim(),
        price: numericPrice,
        description: form.description.trim() || "Algodón pesado · Corte oversize.",
        tag: form.tag,
        category: form.cat,
        sizes,
        colors: existing
          ? [
              {
                ...existing.colors[0],
                name: colorName,
                hex: form.hex,
                images: images.length ? images : existing.colors[0]?.images ?? [],
              },
              ...existing.colors.slice(1),
            ]
          : [{ id: uid(), name: colorName, hex: form.hex, images }],
      }

      const next = form.editingId
        ? catalog.map((x) => (x.id === form.editingId ? product : x))
        : [product, ...catalog]

      await saveCatalog(next)
      setForm(BLANK_FORM)
      setFreshId(id)
      showNotice(
        form.editingId
          ? `“${product.name}” actualizado.`
          : `“${product.name}” agregado y visible en la tienda.`,
      )
    } catch (err) {
      setError(msg(err))
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: string) => {
    setSaving(true)
    setError("")
    try {
      const next = catalog.filter((x) => x.id !== id)
      await saveCatalog(next)
      setConfirmId(null)
      if (form.editingId === id) setForm(BLANK_FORM)
      showNotice("Producto eliminado del catálogo.")
    } catch (err) {
      setError(msg(err))
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setSaving(true)
    setError("")
    try {
      await saveCatalog(SEED)
      setConfirmReset(false)
      setConfirmId(null)
      setForm(BLANK_FORM)
      showNotice("Catálogo restaurado al ejemplo Drop 04.")
    } catch (err) {
      setError(msg(err))
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (p: Product) => {
    const primary = p.colors[0]
    setForm({
      editingId: p.id,
      name: p.name,
      price: String(p.price),
      color: primary?.name || "Negro",
      hex: primary?.hex || "#0B0D10",
      cat: inferCategory(p),
      tag: p.tag || "NUEVO",
      description: p.description || "",
      img: primary?.images[0] || "",
      sizes: p.sizes.map((s) => s.label),
    })
    setError("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const withImgCount = catalog.filter((p) => Boolean(p.colors[0]?.images[0])).length

  return (
    <div className="min-h-[100dvh] w-full bg-[#0B0D10] text-[#F2F4F7]">
      {/* Header del Panel */}
      <header className="border-b border-[#2A313B]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <Logo size="sm" />
            <span className="border border-[#2A313B] px-2 py-1 font-mono text-[11px] tracking-[0.18em] text-[#C3CAD4]">
              PANEL
            </span>
            <span
              className="font-mono text-[11px] tracking-[0.12em]"
              style={{ color: mode === "remote" ? "#25D366" : "#8A94A3" }}
            >
              {mode === "remote" ? "● CONECTADO A BASE DE DATOS" : "● MODO LOCAL (ESTE NAVEGADOR)"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/" onClick={goHome} className="text-[14px] font-semibold text-[#7FB5FF] no-underline hover:text-[#B3D3FF]">
              Ver la tienda →
            </a>
            <button
              type="button"
              onClick={onLock}
              className="vs-press h-9 border border-[#2A313B] bg-transparent px-3.5 text-[13px] font-semibold text-[#C3CAD4]"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-5 pt-9 pb-16 sm:px-6">
        {/* Encabezado + Métricas */}
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="m-0 font-display text-[44px] font-normal leading-none sm:text-[52px]">CATÁLOGO</h1>
            <div className="text-[15px] text-[#C3CAD4]">
              Sube la foto, ponle nombre y precio, y sale en la tienda de una.
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col gap-0.5 bg-[#1A1E24] px-[18px] py-3">
              <span className="font-mono text-[11px] tracking-[0.15em] text-[#8A94A3]">PRODUCTOS</span>
              <span className="font-display text-[30px] leading-none">{catalog.length}</span>
            </div>
            <div className="flex flex-col gap-0.5 bg-[#1A1E24] px-[18px] py-3">
              <span className="font-mono text-[11px] tracking-[0.15em] text-[#8A94A3]">CON FOTO</span>
              <span className="font-display text-[30px] leading-none">{withImgCount}</span>
            </div>
          </div>
        </div>

        {notice && (
          <div role="status" className="vs-item mb-6 border border-[#2E8BFF]/40 bg-[#16243A] px-4 py-3 text-[14px] text-[#F2F4F7]">
            ✓ {notice}
          </div>
        )}

        {/* Layout 2 Columnas */}
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[400px_minmax(0,1fr)]">
          {/* Izquierda: Formulario Nuevo / Editar Producto */}
          <form
            onSubmit={handleSubmit}
            className="flex w-full min-w-0 flex-col gap-4 bg-[#1A1E24] p-6"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-mono text-[12px] tracking-[0.18em] text-[#8A94A3]">
                {form.editingId ? "EDITANDO PRODUCTO" : "NUEVO PRODUCTO"}
              </div>
              {form.editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setForm(BLANK_FORM)
                    setError("")
                  }}
                  className="border-0 bg-transparent p-0 text-[12px] font-semibold text-[#7FB5FF] underline"
                >
                  Cancelar edición
                </button>
              )}
            </div>

            {/* Dropzone de foto */}
            <label
              htmlFor="vp-file"
              onDragOver={(e) => {
                e.preventDefault()
                if (!dragging) setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                handleFile(e.dataTransfer.files?.[0])
              }}
              className="vp-drop relative flex h-[220px] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden text-[#C3CAD4]"
              style={{
                border: `2px dashed ${dragging ? "#2E8BFF" : "#3A424E"}`,
                background: dragging ? "#16243A" : "#0B0D10",
              }}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-7 w-7 animate-spin text-[#2E8BFF]" />
                  <span className="text-[13px] text-[#C3CAD4]">Procesando foto…</span>
                </div>
              ) : form.img ? (
                <>
                  <img src={form.img} alt="Vista previa de la foto" className="absolute inset-0 h-full w-full object-cover" />
                  <span className="absolute right-2.5 bottom-2.5 bg-[#0B0D10]/90 px-2.5 py-1.5 text-[12px] font-semibold text-[#F2F4F7]">
                    Cambiar foto
                  </span>
                </>
              ) : (
                <>
                  <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16V4M7 9l5-5 5 5" />
                    <path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
                  </svg>
                  <span className="text-[15px] font-semibold">Sube o arrastra la foto</span>
                  <span className="text-[13px] text-[#8A94A3]">JPG o PNG · se ajusta sola</span>
                </>
              )}
            </label>
            <input
              id="vp-file"
              type="file"
              accept="image/*"
              onChange={(e) => {
                handleFile(e.target.files?.[0])
                e.target.value = ""
              }}
              className="sr-only"
            />

            {/* Nombre */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="vp-name" className="text-[13px] text-[#C3CAD4]">
                Nombre
              </label>
              <input
                id="vp-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Hoodie Corona"
                className="vp-in h-[46px] w-full border border-[#3A424E] bg-[#0B0D10] px-3.5 text-[15px] text-[#F2F4F7]"
              />
            </div>

            {/* Precio + Color */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="vp-price" className="text-[13px] text-[#C3CAD4]">
                  Precio (COP)
                </label>
                <input
                  id="vp-price"
                  type="text"
                  inputMode="numeric"
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="189000"
                  className="vp-in h-[46px] w-full border border-[#3A424E] bg-[#0B0D10] px-3.5 text-[15px] text-[#F2F4F7]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="vp-color" className="text-[13px] text-[#C3CAD4]">
                  Color
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="vp-color"
                    type="text"
                    value={form.color}
                    onChange={(e) => handleColorInput(e.target.value)}
                    placeholder="Negro"
                    className="vp-in h-[46px] min-w-0 flex-1 border border-[#3A424E] bg-[#0B0D10] px-3 text-[15px] text-[#F2F4F7]"
                  />
                  <input
                    type="color"
                    aria-label="Tono del color"
                    value={form.hex}
                    onChange={(e) => setForm((prev) => ({ ...prev, hex: e.target.value }))}
                    className="h-[46px] w-[42px] shrink-0 cursor-pointer border border-[#3A424E] bg-[#0B0D10] p-1"
                  />
                </div>
              </div>
            </div>

            {/* Categoría + Etiqueta */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="vp-cat" className="text-[13px] text-[#C3CAD4]">
                  Categoría
                </label>
                <select
                  id="vp-cat"
                  value={form.cat}
                  onChange={(e) => setForm((prev) => ({ ...prev, cat: e.target.value as Category }))}
                  className="vp-in h-[46px] w-full border border-[#3A424E] bg-[#0B0D10] px-2.5 text-[15px] text-[#F2F4F7]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="vp-tag" className="text-[13px] text-[#C3CAD4]">
                  Etiqueta
                </label>
                <select
                  id="vp-tag"
                  value={form.tag}
                  onChange={(e) => setForm((prev) => ({ ...prev, tag: e.target.value }))}
                  className="vp-in h-[46px] w-full border border-[#3A424E] bg-[#0B0D10] px-2.5 text-[15px] text-[#F2F4F7]"
                >
                  {TAG_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tallas */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] text-[#C3CAD4]">Tallas disponibles</span>
              <div className="grid grid-cols-6 gap-1.5">
                {ALL_SIZES.map((s) => {
                  const on = form.sizes.includes(s)
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSize(s)}
                      className="vs-press h-10 text-[12px] font-semibold"
                      style={
                        on
                          ? { background: "#E8EAED", color: "#0B0D10", border: "1px solid #E8EAED" }
                          : { background: "#0B0D10", color: "#8A94A3", border: "1px solid #3A424E" }
                      }
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Descripción corta */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="vp-desc" className="text-[13px] text-[#C3CAD4]">
                Descripción corta (opcional)
              </label>
              <input
                id="vp-desc"
                type="text"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Algodón pesado 420 g · Corte oversize"
                className="vp-in h-[46px] w-full border border-[#3A424E] bg-[#0B0D10] px-3.5 text-[14px] text-[#F2F4F7]"
              />
            </div>

            {error && (
              <div role="alert" className="bg-[#2A1714] px-3 py-2.5 text-[13px] text-[#FFB4A8]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || uploading}
              className="vs-press flex h-[52px] items-center justify-center gap-2 border-0 bg-[#2E8BFF] text-[15px] font-bold tracking-[0.04em] text-[#0B0D10] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {form.editingId ? "GUARDAR CAMBIOS" : "AGREGAR AL CATÁLOGO"}
            </button>
          </form>

          {/* Derecha: Grid de Productos en la tienda ahora */}
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-mono text-[12px] tracking-[0.18em] text-[#8A94A3]">EN LA TIENDA AHORA</div>
              {confirmReset ? (
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-[#C3CAD4]">¿Restaurar ejemplo?</span>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={saving}
                    className="vs-press h-10 border-0 bg-[#E5484D] px-3.5 text-[13px] font-bold text-[#0B0D10]"
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="vs-press h-10 border border-[#3A424E] bg-transparent px-3.5 text-[13px] font-semibold text-[#F2F4F7]"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="vs-press h-10 border border-[#2A313B] bg-transparent px-3.5 text-[13px] font-semibold text-[#C3CAD4]"
                >
                  Volver al catálogo de ejemplo
                </button>
              )}
            </div>

            {catalog.length === 0 ? (
              <div className="border border-dashed border-[#3A424E] p-12 text-center text-[#C3CAD4]">
                El catálogo está vacío. Agrega tu primer producto a la izquierda.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {catalog.map((it) => {
                  const primary = it.colors[0]
                  const img = primary?.images[0] || ""
                  const confirming = confirmId === it.id
                  const meta = [inferCategory(it), primary?.name, formatCOP(it.price)].filter(Boolean).join(" · ")

                  return (
                    <div
                      key={it.id}
                      className={`flex flex-col bg-[#1A1E24] ${freshId === it.id ? "vp-new" : ""}`}
                    >
                      <div className="relative flex h-[220px] items-center justify-center overflow-hidden bg-[#2A313B]">
                        {img ? (
                          <img src={img} alt={it.name} className="absolute inset-0 h-full w-full object-cover" />
                        ) : (
                          <span className="font-mono text-[11px] text-[#B8BFCA]">SIN FOTO</span>
                        )}
                        <span className="absolute top-2.5 left-2.5 border border-[#2E8BFF] bg-[#0B0D10] px-2 py-1 font-mono text-[10px] tracking-[0.15em] text-[#F2F4F7]">
                          {it.tag || "NUEVO"}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col gap-1 px-3.5 py-3">
                        <div className="text-[15px] font-semibold text-[#F2F4F7]">{it.name}</div>
                        <div className="text-[13px] text-[#8A94A3]">{meta}</div>
                      </div>

                      <div className="px-3.5 pb-3.5">
                        {confirming ? (
                          <div className="flex items-center gap-2">
                            <span className="flex-1 text-[13px] text-[#C3CAD4]">¿Eliminar?</span>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => handleRemove(it.id)}
                              className="vs-press h-11 border-0 bg-[#E5484D] px-3.5 text-[13px] font-bold text-[#0B0D10]"
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmId(null)}
                              className="vs-press h-11 border border-[#3A424E] bg-transparent px-3.5 text-[13px] font-semibold text-[#F2F4F7]"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(it)}
                              className="vs-press flex h-11 items-center justify-center border border-[#3A424E] bg-transparent text-[13px] font-semibold text-[#F2F4F7]"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmId(it.id)}
                              aria-label={`Eliminar ${it.name}`}
                              className="vs-press flex h-11 items-center justify-center gap-1.5 border border-[#3A424E] bg-transparent text-[13px] font-semibold text-[#F2F4F7]"
                            >
                              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
                              </svg>
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
