import { useEffect, useRef, useState } from 'react'

/**
 * useIntersectionObserver – fires a callback when the target element
 * enters or leaves the viewport.
 *
 * @param {object}  options
 * @param {number}  options.threshold   – intersection ratio threshold (0–1)
 * @param {string}  options.rootMargin  – root margin (CSS string)
 * @param {boolean} options.freezeOnceVisible – stop observing after first visibility
 * @returns {{ ref, entry, isVisible }}
 */
export function useIntersectionObserver({
  threshold = 0,
  rootMargin = '0px',
  freezeOnceVisible = false,
} = {}) {
  const ref = useRef(null)
  const [entry, setEntry] = useState(null)
  const frozen = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || frozen.current) return

    const observer = new IntersectionObserver(
      ([e]) => {
        setEntry(e)
        if (freezeOnceVisible && e.isIntersecting) {
          frozen.current = true
          observer.disconnect()
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, freezeOnceVisible])

  return { ref, entry, isVisible: !!entry?.isIntersecting }
}
