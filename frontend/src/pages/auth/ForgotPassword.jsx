import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import AuthLayout from '../../components/layout/AuthLayout'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { authApi } from '../../services/api'
import { useTranslation } from '../../hooks/useTranslation'

const STEPS = { EMAIL: 'email', OTP: 'otp', PASSWORD: 'password', DONE: 'done' }

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [step, setStep] = useState(STEPS.EMAIL)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef([])

  const emailForm = useForm()
  const passForm = useForm()

  async function onEmailSubmit({ email: e }) {
    setLoading(true)
    try {
      await authApi.forgotPassword(e)
      setEmail(e)
      setStep(STEPS.OTP)
    } catch {
      emailForm.setError('email', { message: 'Something went wrong. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  function handleOtpChange(index, value) {
    if (!/^\d?$/.test(value)) return
    const next = [...otp]
    next[index] = value
    setOtp(next)
    setOtpError('')
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e) {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (digits.length === 6) {
      setOtp(digits.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  async function onOtpSubmit() {
    const code = otp.join('')
    if (code.length < 6) {
      setOtpError('Enter all 6 digits')
      return
    }
    setLoading(true)
    try {
      await authApi.verifyOtp(email, code)
      setStep(STEPS.PASSWORD)
    } catch (err) {
      setOtpError(err?.response?.data?.detail || 'Invalid or expired code')
    } finally {
      setLoading(false)
    }
  }

  async function onPasswordSubmit({ new_password, confirm_password }) {
    if (new_password !== confirm_password) {
      passForm.setError('confirm_password', { message: 'Passwords do not match' })
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword(email, otp.join(''), new_password)
      setStep(STEPS.DONE)
    } catch (err) {
      passForm.setError('new_password', {
        message: err?.response?.data?.detail || 'Reset failed. Start over.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      {step === STEPS.DONE && (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Password reset!</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Your password has been updated. You can now sign in.</p>
          <Button className="w-full" onClick={() => navigate('/login')}>Go to sign in</Button>
        </div>
      )}

      {step === STEPS.EMAIL && (
        <>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Reset your password</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Enter your registered email and we'll send you a 6-digit code.
          </p>
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@organisation.rw"
              error={emailForm.formState.errors.email?.message}
              {...emailForm.register('email', {
                required: 'Email is required',
                pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
              })}
            />
            <Button type="submit" loading={loading} className="w-full">
              Send code
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            <Link to="/login" className="text-primary-600 hover:underline">Back to sign in</Link>
          </p>
        </>
      )}

      {step === STEPS.OTP && (
        <>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Enter your code</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            We sent a 6-digit code to <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>.
            It expires in 15 minutes.
          </p>

          <div className="flex gap-2 justify-between mb-2" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className={`w-12 h-14 text-center text-2xl font-bold border rounded-lg outline-none transition-colors
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  ${otpError
                    ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-900'
                  }`}
              />
            ))}
          </div>
          {otpError && <p className="text-sm text-red-500 mb-2">{otpError}</p>}

          <Button loading={loading} className="w-full mt-4" onClick={onOtpSubmit}>
            Verify code
          </Button>

          <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Didn't receive it?{' '}
            <button
              type="button"
              className="text-primary-600 hover:underline font-medium"
              onClick={() => {
                setOtp(['', '', '', '', '', ''])
                setOtpError('')
                setStep(STEPS.EMAIL)
              }}
            >
              Try again
            </button>
          </p>
        </>
      )}

      {step === STEPS.PASSWORD && (
        <>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Set a new password</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Choose a strong password for your account.</p>
          <form onSubmit={passForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <Input
              label="New password"
              type="password"
              placeholder="Min. 8 characters"
              error={passForm.formState.errors.new_password?.message}
              {...passForm.register('new_password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Must be at least 8 characters' },
              })}
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="Repeat your new password"
              error={passForm.formState.errors.confirm_password?.message}
              {...passForm.register('confirm_password', { required: 'Please confirm your password' })}
            />
            <Button type="submit" loading={loading} className="w-full">
              Reset password
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  )
}
