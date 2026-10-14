import React from 'react'

const DEFAULT_CHIPS = [
  'Is this still available?',
  'Can we meet at the Central Library?',
  'Can we meet near the Hostel Gate?',
  'Are you open to negotiation?',
]

export function QuickReplies({ onSelectReply }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-2 px-4 no-scrollbar">
      {DEFAULT_CHIPS.map((chip, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelectReply(chip)}
          className="flex-shrink-0 text-[11px] font-medium bg-gray-100 hover:bg-primary-50 hover:text-primary text-gray-700 px-2.5 py-1 rounded-full border border-gray-200 transition-colors"
        >
          {chip}
        </button>
      ))}
    </div>
  )
}
