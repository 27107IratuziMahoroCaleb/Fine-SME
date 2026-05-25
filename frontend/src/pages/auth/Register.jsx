import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import AuthLayout from '../../components/layout/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../hooks/useTranslation'

const ROLES = [
  { value: 'lender', label: 'Lender' },
  { value: 'sme_advisor', label: 'SME Advisor' },
  { value: 'risk_analyst', label: 'Risk Analyst' },
  { value: 'program_manager', label: 'Program Manager' },
]

const INSTITUTION_TYPES = [
  { value: 'bank', label: 'Commercial Bank' },
  { value: 'microfinance', label: 'Microfinance Institution' },
  { value: 'sacco', label: 'SACCO' },
  { value: 'development_program', label: 'Development Program' },
  { value: 'other', label: 'Other' },
]

function PasswordStrength({ password }) {
  if (!password) return null
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500']
  return (
    <div className="mt-1">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= score ? colors[score] : 'bg-gray-200 dark:bg-gray-600'}`} />
        ))}
      </div>
      <p className={`text-xs ${score < 2 ? 'text-red-500' : score < 4 ? 'text-yellow-600' : 'text-green-600'}`}>
        {labels[score]}
      </p>
    </div>
  )
}

export default function Register() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { role: 'sme_advisor' },
  })
  const password = watch('password', '')

  async function onSubmit(data) {
    setServerError('')
    try {
      await registerUser(data)
      setSuccess(true)
    } catch (err) {
      setServerError(err.response?.data?.detail || 'Registration failed. Please try again.')
    }
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center py-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Account created!</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Your account is pending activation by an administrator.</p>
          <Button onClick={() => navigate('/login')} className="w-full">Go to Login</Button>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{t('auth.createAccount')}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('auth.createAccountSub')}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={t('auth.fullName')}
          placeholder="Jane Doe"
          error={errors.full_name?.message}
          {...register('full_name', { required: 'Full name is required' })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('auth.email')}
            type="email"
            placeholder="you@org.rw"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
            })}
          />
          <Input
            label={t('auth.phone')}
            type="tel"
            placeholder="+250 7xx xxx xxx"
            {...register('phone')}
          />
        </div>

        <Input
          label={t('auth.organisation')}
          placeholder="Bank / MFI / Program name"
          {...register('organization')}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.role')}</label>
            <select
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900"
              {...register('role', { required: true })}
            >
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('auth.institutionType')}</label>
            <select
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900"
              {...register('institution_type')}
            >
              <option value="">Select…</option>
              {INSTITUTION_TYPES.map((it) => <option key={it.value} value={it.value}>{it.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <Input
            label={t('auth.password')}
            type="password"
            placeholder="Min. 8 characters"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Min. 8 characters' },
            })}
          />
          <PasswordStrength password={password} />
        </div>

        {serverError && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{serverError}</p>
        )}

        <Button type="submit" loading={isSubmitting} className="w-full">
          {t('auth.register')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="text-primary-600 font-medium hover:underline">{t('auth.signIn')}</Link>
      </p>
    </AuthLayout>
  )
}
