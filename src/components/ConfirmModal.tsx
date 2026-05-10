interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  /** Red confirm button for destructive actions */
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-6 w-full max-w-sm shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-ui font-semibold text-near-black dark:text-gray-100 text-base mb-2">
          {title}
        </h3>
        <p className="font-ui text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium font-ui
                       border border-gray-200 dark:border-gray-600
                       text-gray-600 dark:text-gray-300
                       hover:bg-gray-50 dark:hover:bg-white/5
                       disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold font-ui text-white
                        disabled:opacity-50 transition-colors flex items-center justify-center gap-2
                        ${destructive
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-brand hover:bg-brand/90'
                        }`}
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
