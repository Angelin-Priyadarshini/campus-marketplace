export function Input({ label, error, id, className = '', ...props }) {
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/gi, '-') : undefined)
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input-base ${error ? 'border-red-400 focus:ring-red-300 focus:border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
