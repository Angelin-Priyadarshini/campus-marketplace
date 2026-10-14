import { Star } from 'lucide-react'

export function StarRating({ value = 0, max = 5, onChange, size = 16 }) {
  return (
    <div className="flex gap-0.5" role={onChange ? 'radiogroup' : undefined} aria-label="Star rating">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={`${i < Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} ${onChange ? 'cursor-pointer hover:text-amber-400 transition-colors' : ''}`}
          onClick={() => onChange?.(i + 1)}
          role={onChange ? 'radio' : undefined}
          aria-checked={onChange ? i < Math.round(value) : undefined}
          aria-label={`${i + 1} star${i !== 0 ? 's' : ''}`}
          tabIndex={onChange ? 0 : undefined}
          onKeyDown={onChange ? (e) => { if (e.key === 'Enter' || e.key === ' ') onChange(i + 1) } : undefined}
        />
      ))}
    </div>
  )
}
