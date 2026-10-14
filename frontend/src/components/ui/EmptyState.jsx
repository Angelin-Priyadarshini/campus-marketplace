import { PackageOpen } from 'lucide-react'

export function EmptyState({ icon: Icon = PackageOpen, title = 'Nothing here yet', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <Icon size={48} className="text-gray-300 mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  )
}
