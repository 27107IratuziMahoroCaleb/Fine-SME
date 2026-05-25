import { forwardRef } from 'react'
import clsx from 'clsx'

const Input = forwardRef(function Input({ label, error, className, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <input
        ref={ref}
        className={clsx(
          'rounded-lg border px-3 py-2 text-sm outline-none transition',
          'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
          'placeholder:text-gray-400 dark:placeholder:text-gray-500',
          'focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900',
          error
            ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
            : 'border-gray-300 dark:border-gray-600',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
})

export default Input
