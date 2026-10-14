import React from 'react'
import { AlertCircle, Check, X, EyeOff, UserX } from 'lucide-react'
import { formatRelativeTime } from '../../utils/format'
import { Badge, Button } from '../ui'

export function ReportCard({ report, onResolve }) {
  const isResolved = report.status !== 'open'

  return (
    <div className="card p-5 bg-white border border-gray-200 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant={
              report.status === 'open'
                ? 'danger'
                : report.status === 'resolved'
                ? 'success'
                : 'default'
            }
          >
            {report.status.toUpperCase()}
          </Badge>
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            {report.reason.replace('_', ' ')}
          </span>
        </div>
        <span className="text-[11px] text-gray-400">
          {formatRelativeTime(report.created_at)}
        </span>
      </div>

      <div>
        <p className="text-xs text-gray-500">
          Reported Target:{' '}
          <strong className="text-gray-900">
            {report.target_type === 'listing' ? 'Listing' : 'User'}: {report.target_name}
          </strong>
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Filed by: <strong className="text-gray-700">{report.reporter_name}</strong>
        </p>
        {report.details && (
          <p className="text-xs bg-gray-50 p-2.5 rounded-lg text-gray-700 mt-2 italic border border-gray-100">
            "{report.details}"
          </p>
        )}
      </div>

      {!isResolved && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          {report.target_type === 'listing' ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onResolve(report.id, 'hide_listing')}
              className="gap-1.5"
            >
              <EyeOff size={14} />
              Hide Listing
            </Button>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onResolve(report.id, 'suspend_user')}
              className="gap-1.5"
            >
              <UserX size={14} />
              Suspend User
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onResolve(report.id, 'dismiss')}
            className="text-gray-600 hover:bg-gray-100"
          >
            Dismiss Report
          </Button>
        </div>
      )}

      {isResolved && report.resolution_note && (
        <p className="text-[11px] text-gray-500 pt-2 border-t border-gray-100">
          Resolution note: <span className="text-gray-700 font-medium">{report.resolution_note}</span>
        </p>
      )}
    </div>
  )
}
