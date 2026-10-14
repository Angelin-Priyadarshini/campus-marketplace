import React from 'react'
import { CheckCircle2, Circle, XCircle, Clock } from 'lucide-react'
import { formatRelativeTime } from '../../utils/format'

export function OrderTimeline({ events = [], currentStatus }) {
  const steps = [
    { key: 'pending', label: 'Requested' },
    { key: 'accepted', label: 'Accepted by Seller' },
    { key: 'completed', label: 'Handover Completed' },
  ]

  const isFailed = currentStatus === 'cancelled' || currentStatus === 'rejected'

  return (
    <div className="py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-gray-200 z-0" />

        {isFailed ? (
          <div className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-700 py-2.5 px-4 rounded-xl border border-red-200 z-10">
            <XCircle size={18} />
            <span className="text-xs font-semibold uppercase">
              Order {currentStatus}
            </span>
          </div>
        ) : (
          steps.map((step, idx) => {
            const isCompleted =
              (currentStatus === 'accepted' && idx <= 1) ||
              (currentStatus === 'completed' && idx <= 2) ||
              (currentStatus === 'pending' && idx === 0)

            return (
              <div key={step.key} className="flex flex-col items-center z-10 bg-white px-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted
                      ? 'bg-primary border-primary text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={16} /> : <Circle size={14} />}
                </div>
                <span className="text-[11px] font-medium text-gray-700 mt-1.5 text-center">
                  {step.label}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* Events History Log */}
      {events.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Audit Trail
          </h4>
          <div className="space-y-1.5">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-gray-400" />
                  <span>
                    Status moved from <strong className="text-gray-700">{ev.from_status || 'start'}</strong> to{' '}
                    <strong className="text-gray-700">{ev.to_status}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-gray-400">
                  {formatRelativeTime(ev.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
