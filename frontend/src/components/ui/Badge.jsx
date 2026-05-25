import clsx from 'clsx'

const styles = {
  low:          'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  medium:       'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  high:         'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  critical:     'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  active:       'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  acknowledged: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  resolved:     'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  pending:      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  in_progress:  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  implemented:  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  dismissed:    'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500',
  micro:        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  small:        'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  medium_size:  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  default:      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
}

export default function Badge({ value, label }) {
  const raw = (value || '').toLowerCase().replace(' ', '_')
  const key = raw === 'medium' && label === undefined ? 'medium' : raw
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', styles[key] || styles.default)}>
      {label || value}
    </span>
  )
}
