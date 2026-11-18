import { useEffect } from "react"
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER, FREE_SHIPPING_FROM } from "@/config"
import { formatCOP } from "@/lib/store"

export type InfoModalType = "sizes" | "shipping" | "returns" | null

export function InfoModal({ type, onClose }: { type: InfoModalType; onClose: () => void }) {
  useEffect(() => {
    if (!type) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [type, onClose])

  if (!type) return null

  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola Viper Store, tengo una pregunta sobre mi pedido.")}`

  return (
    <div className="fixed inset-0 z-[92] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="vs-fade absolute inset-0 w-full border-0 bg-[rgba(5,6,8,0.78)]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="vs-pop relative flex max-h-[calc(100dvh-32px)] w-full max-w-[540px] flex-col overflow-y-auto border border-[#2A313B] bg-[#0B0D10] text-[#F2F4F7]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#2A313B] px-6 py-5">
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] text-[#8A94A3]">VIPER STORE · INFO</div>
            <h3 className="mt-1 font-display text-[32px] leading-none">
              {type === "sizes" && "GUÍA DE TALLAS"}
              {type === "shipping" && "ENVÍOS A TODA COLOMBIA"}
              {type === "returns" && "CAMBIOS Y DEVOLUCIONES"}
            </h3>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="vs-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#2A313B] bg-transparent text-[#E8EAED]"
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 px-6 py-5 text-[14px] leading-relaxed text-[#C3CAD4]">
          {type === "sizes" && (
            <>
              <p>
                Nuestros hoodies y camisetas tienen <strong className="text-[#F2F4F7]">corte oversize de calle</strong> (hombro caído y caída amplia). Si prefieres un fit más ajustado, pide una talla menos.
              </p>
              <div className="overflow-x-auto border border-[#2A313B]">
                <table className="w-full border-collapse text-left font-mono text-[12px]">
                  <thead>
                    <tr className="border-b border-[#2A313B] bg-[#1A1E24] text-[#8A94A3]">
                      <th className="px-3 py-2.5">TALLA</th>
                      <th className="px-3 py-2.5">PECHO (cm)</th>
                      <th className="px-3 py-2.5">LARGO (cm)</th>
                      <th className="px-3 py-2.5">CARGO CINTURA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["XS", "54", "67", "28"],
                      ["S", "57", "70", "30"],
                      ["M", "60", "73", "32"],
                      ["L", "63", "76", "34"],
                      ["XL", "66", "79", "36"],
                    ].map(([t, p, l, c]) => (
                      <tr key={t} className="border-b border-[#2A313B] last:border-b-0">
                        <td className="px-3 py-2.5 font-semibold text-[#F2F4F7]">{t}</td>
                        <td className="px-3 py-2.5">{p}</td>
                        <td className="px-3 py-2.5">{l}</td>
                        <td className="px-3 py-2.5">{c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[13px] text-[#8A94A3]">¿Dudas con tu talla? Escríbenos tu estatura y peso por WhatsApp y te asesoramos de una.</p>
            </>
          )}

          {type === "shipping" && (
            <>
              <div className="border border-[#2E8BFF]/40 bg-[#16243A] p-4 text-[#F2F4F7]">
                <div className="font-mono text-[11px] tracking-[0.16em] text-[#2E8BFF]">ENVÍO GRATIS</div>
                <p className="mt-1 text-[14px]">En pedidos desde {formatCOP(FREE_SHIPPING_FROM)} a ciudades principales de Colombia.</p>
              </div>
              <div className="space-y-2.5">
                <div className="bg-[#1A1E24] p-3.5">
                  <div className="font-semibold text-[#F2F4F7]">Domicilio local / Contraentrega</div>
                  <div className="mt-0.5 text-[13px] text-[#8A94A3]">Entrega mismo día o siguiente día hábil. Puedes pagar al recibir o por Nequi / transferencia.</div>
                </div>
                <div className="bg-[#1A1E24] p-3.5">
                  <div className="font-semibold text-[#F2F4F7]">Envíos nacionales</div>
                  <div className="mt-0.5 text-[13px] text-[#8A94A3]">2 a 4 días hábiles por transportadora certificada con guía de rastreo a tu WhatsApp.</div>
                </div>
                <div className="bg-[#1A1E24] p-3.5">
                  <div className="font-semibold text-[#F2F4F7]">Recoger en tienda</div>
                  <div className="mt-0.5 text-[13px] text-[#8A94A3]">Separas tu prenda por WhatsApp y pasas directo por nuestra vitrina sin costo de envío.</div>
                </div>
              </div>
            </>
          )}

          {type === "returns" && (
            <>
              <p>
                Queremos que la prenda te quede melo. Tienes <strong className="text-[#F2F4F7]">15 días calendario</strong> desde que recibes tu pedido para pedir cambio de talla o color.
              </p>
              <ul className="space-y-2 text-[13px]">
                <li className="bg-[#1A1E24] p-3">• La prenda debe estar nueva, sin uso, sin lavado y con sus etiquetas originales.</li>
                <li className="bg-[#1A1E24] p-3">• Por ser drops limitados, si tu talla se agotó te damos saldo a favor para el siguiente drop o cambio por otra referencia.</li>
                <li className="bg-[#1A1E24] p-3">• Escríbenos directo al WhatsApp <strong className="text-[#F2F4F7]">{WHATSAPP_DISPLAY}</strong> con tu número de pedido.</li>
              </ul>
            </>
          )}
        </div>

        <div className="flex gap-3 border-t border-[#2A313B] px-6 py-4">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="vs-press flex h-12 flex-1 items-center justify-center bg-[#25D366] font-semibold text-[14px] text-[#0B0D10]"
          >
            Hablar por WhatsApp
          </a>
          <button
            type="button"
            onClick={onClose}
            className="vs-press h-12 border border-[#3A424E] bg-transparent px-5 font-semibold text-[14px] text-[#F2F4F7]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
