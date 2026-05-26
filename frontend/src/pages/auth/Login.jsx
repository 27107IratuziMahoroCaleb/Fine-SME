import { useRef, useState } from 'react'
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
  const { login, completeMfaLogin } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [serverError, setServerError] = useState('')
  const [mfaStep, setMfaStep] = useState(false)
  const [tempToken, setTempToken] = useState('')
  const [totpCode, setTotpCode] = useState(['', '', '', '', '', ''])
  const [mfaLoading, setMfaLoading] = useState(false)
  const totpRefs = useRef([])

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm()

  async function onSubmit(data) {
    setServerError('')
    try {
      const result = await login(data.email, data.password)
      if (result?.mfa_required) {
        setTempToken(result.temp_token)
        setMfaStep(true)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setServerError(err.response?.data?.detail || 'Login failed. Please try again.')
    }
  }

  function fillDemo(account) {
    setValue('email', account.email, { shouldValidate: true })
    setValue('password', account.password, { shouldValidate: true })
  }

  function handleTotpChange(i, val) {
    const digits = val.replace(/\D/g, '').slice(0, 1)
    const next = [...totpCode]
    next[i] = digits
    setTotpCode(next)
    if (digits && i < 5) totpRefs.current[i + 1]?.focus()
  }

  function handleTotpKeyDown(i, e) {
    if (e.key === 'Backspace' && !totpCode[i] && i > 0) {
      totpRefs.current[i - 1]?.focus()
    }
  }

  async function submitMfa() {
    const code = totpCode.join('')
    if (code.length !== 6) return
    setMfaLoading(true)
    setServerError('')
    try {
      await completeMfaLogin(tempToken, code)
      navigate('/dashboard')
    } catch (err) {
      setServerError(err.response?.data?.detail || 'Invalid code. Please try again.')
      setTotpCode(['', '', '', '', '', ''])
      totpRefs.current[0]?.focus()
    } finally {
      setMfaLoading(false)
    }
  }

  if (mfaStep) {
    return (
      <AuthLayout>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Two-Factor Authentication</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter the 6-digit code from your authenticator app.</p>

        <div className="flex justify-center gap-2 mb-6">
          {totpCode.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (totpRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleTotpChange(i, e.target.value)}
              onKeyDown={(e) => handleTotpKeyDown(i, e)}
              className="w-11 h-14 text-center text-xl font-bold border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none transition-colors"
            />
          ))}
        </div>

        {serverError && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 mb-4">{serverError}</p>
        )}

        <Button onClick={submitMfa} loading={mfaLoading} className="w-full" disabled={totpCode.join('').length !== 6}>
          Verify
        </Button>
        <button
          type="button"
          onClick={() => { setMfaStep(false); setServerError('') }}
          className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ← Back to login
        </button>
      </AuthLayout>
    )
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
