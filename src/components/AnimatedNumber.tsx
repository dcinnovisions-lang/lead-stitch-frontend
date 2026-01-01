import { useCountUp, useInView } from '../hooks/useCountUp'

interface AnimatedNumberProps {
  value: number | string
  duration?: number
  suffix?: string
  prefix?: string
  className?: string
}

/**
 * Component that animates a number from 0 to target value when in view
 */
export default function AnimatedNumber({ 
  value, 
  duration = 2000, 
  suffix = '', 
  prefix = '',
  className = '' 
}: AnimatedNumberProps) {
  const [ref, isInView] = useInView({ threshold: 0.3 })
  
  const extractNumber = (val: number | string): number => {
    if (typeof val === 'number') return val
    const match = val.toString().match(/(\d+\.?\d*)/)
    return match ? parseFloat(match[1]) : 0
  }

  const extractSuffix = (val: number | string): string => {
    if (typeof val === 'number') return suffix
    const match = val.toString().match(/\d+\.?\d*([^\d]+)/)
    return match ? match[1] : suffix
  }

  const numericValue = extractNumber(value)
  const finalSuffix = extractSuffix(value) || suffix
  const count = useCountUp(numericValue, duration, isInView)

  return (
    <span ref={ref} className={className}>
      {prefix}{count}{finalSuffix}
    </span>
  )
}

