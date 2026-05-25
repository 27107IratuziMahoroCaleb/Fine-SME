import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import AuthLayout from '../../components/layout/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../hooks/useTranslation'

const DEMO_ACCOUNTS = [
  { role: 'Admin',           email: 'admin@finesme.com',    password: 'admin1234',  badge: 'bg-purple-100 text-purple-700' },
  { role: 'Lender',          email: 'alice@bk.rw',          password: 'Password1!', badge: 'bg-blue-100 text-blue-700' },
  { role: 'SME Advisor',     email: 'diane@sme.rw',         password: 'Password1!', badge: 'bg-green-100 text-green-700' },
  { role: 'Risk Analyst',    email: 'eric@sacco.rw',        password: 'Password1!', badge: 'bg-orange-100 text-orange-700' },
  { role: 'Program Manager', email: 'grace@minecofin.rw',   password: 'Password1!', badge: 'bg-teal-100 text-teal-700' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm()

  async function onSubmit(data) {
    setServerError('')
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (err) {
      setServerError(err.response?.data?.detail || 'Login failed. Please try again.')
    }
  }

  function fillDemo(account) {
    setValue('email', account.email, { shouldValidate: true })
    setValue('password', account.password, { shouldValidate: true })
  }

  return (
    <AuthLayout>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{t('auth.welcomeBack')}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('auth.signInSub')}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={t('auth.email')}
          type="email"
          placeholder="you@organisation.rw"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
          })}
        />
        <Input
          label={t('auth.password')}
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password', { required: 'Password is required' })}
        />

        {serverError && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{serverError}</p>
        )}

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 cursor-pointer">
            <input type="checkbox" className="rounded" /> {t('auth.rememberMe')}
          </label>
          <Link to="/forgot-password" className="text-primary-600 hover:underline">
            {t('auth.forgotPwd')}
          </Link>
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full">
          {t('auth.signIn')}
        </Button>
      </form>

      <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-5">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">{t('auth.demoAccounts')}</p>
        <div className="grid grid-cols-1 gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => fillDemo(a)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left group"
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.badge}`}>{a.role}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{a.email}</span>
              </div>
              <span className="text-xs text-gray-300 dark:text-gray-600 group-hover:text-primary-400">{t('auth.fillDemo')}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="text-primary-600 font-medium hover:underline">
          {t('auth.createOne')}
        </Link>
      </p>
    </AuthLayout>
  )
}
