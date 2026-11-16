import { useEffect, type RefObject } from "react"

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Mientras `active` sea true, Tab y Shift+Tab dan la vuelta dentro de `ref`
 * (no se escapan a la página de atrás). Al cerrar, el foco vuelve al botón que lo abrió.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, initial?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active) return
    const opener = document.activeElement as HTMLElement | null
    const box = ref.current
    ;(initial?.current ?? box)?.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !box) return
      const items = [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === box)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      opener?.focus?.({ preventScroll: true })
    }
  }, [active, ref, initial])
}
