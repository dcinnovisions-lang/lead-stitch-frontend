import { useState, useEffect, useRef } from 'react'

interface UseInViewOptions {
  threshold?: number
  root?: Element | null
  rootMargin?: string
}

/**
 * Custom hook for animating numbers from 0 to target value
 */
export const useCountUp = (end: number, duration: number = 2000, start: boolean = false): number => {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (!start) {
      setCount(0)
      countRef.current = 0
      return
    }

    // Reset when starting
    setCount(0)
    countRef.current = 0
    startTimeRef.current = null

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime
      }

      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentCount = Math.floor(easeOut * end)

      setCount(currentCount)
      countRef.current = currentCount

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        setCount(end) // Ensure we end at exact value
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [end, duration, start])

  return count
}

/**
 * Hook to detect when element is in viewport using Intersection Observer
 */
export const useInView = (options: UseInViewOptions = {}): [React.RefObject<HTMLElement>, boolean] => {
  const [isInView, setIsInView] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const currentRef = ref.current
    if (!currentRef) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting)
    }, {
      threshold: 0.1,
      ...options,
    })

    observer.observe(currentRef)

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [options.threshold])

  return [ref, isInView]
}

