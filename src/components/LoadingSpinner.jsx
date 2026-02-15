import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-indigo-600`} />
      {text && <span className="text-gray-600 dark:text-gray-400">{text}</span>}
    </div>
  )
}

// Full screen loading overlay
export function LoadingOverlay({ show, text = 'Loading...' }) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999999] flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  )
}

// Success message component
export function SuccessMessage({ show, message = 'Success!', onClose }) {
  if (!show) return null

  return (
    <div className="fixed top-4 right-4 z-[999999] animate-slide-in">
      <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
        <span>🎉</span>
        <span>{message}</span>
        {onClose && (
          <button onClick={onClose} className="ml-2 hover:bg-green-600 rounded px-1">
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
