export function Avatar({ src, name = '', size = 'md', className = '' }) {
  const sizes = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-20 w-20 text-2xl'
  }
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return src ? (
    <img
      src={src}
      alt={name}
      className={`rounded-full object-cover ${sizes[size]} ${className}`}
      loading="lazy"
    />
  ) : (
    <div
      className={`rounded-full bg-primary-100 text-primary-800 font-semibold flex items-center justify-center ${sizes[size]} ${className}`}
      aria-label={name || 'User avatar'}
    >
      {initials || '?'}
    </div>
  )
}
