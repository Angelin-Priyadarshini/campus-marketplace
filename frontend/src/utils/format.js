export const formatPrice = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)

// Alias used throughout the UI
export const formatCurrency = formatPrice


export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return ''
  const now = new Date()
  // Backend returns UTC timestamps without 'Z' — force UTC parsing
  const normalized = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
  const date = new Date(normalized)
  const diffMs = now - date
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} h ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const STATUS_LABELS = {
  active: 'Active',
  reserved: 'Reserved',
  sold: 'Sold',
  hidden: 'Hidden',
  deleted: 'Deleted',
  expired: 'Expired',
  pending: 'Pending',
  accepted: 'Accepted',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
}

export const STATUS_VARIANTS = {
  active: 'success',
  reserved: 'warning',
  sold: 'default',
  hidden: 'danger',
  deleted: 'danger',
  expired: 'default',
  pending: 'warning',
  accepted: 'primary',
  completed: 'success',
  cancelled: 'default',
  rejected: 'danger',
}
