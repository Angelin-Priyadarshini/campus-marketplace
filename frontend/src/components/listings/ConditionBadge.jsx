import React from 'react'
import { Badge } from '../ui'

const CONDITION_LABELS = {
  new: 'Brand New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
}

const CONDITION_VARIANTS = {
  new: 'success',
  like_new: 'primary',
  good: 'info',
  fair: 'warning',
  poor: 'danger',
}

export function ConditionBadge({ condition, className = '' }) {
  const label = CONDITION_LABELS[condition] || condition
  const variant = CONDITION_VARIANTS[condition] || 'default'
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}
