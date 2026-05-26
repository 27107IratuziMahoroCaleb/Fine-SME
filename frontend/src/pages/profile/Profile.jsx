import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { useAuth } from '../../context/AuthContext'
import { mfaApi, authApi } from '../../services/api'

export default function Profile() {
  const { user, setUser } = useAuth()

  const [mfaState, setMfaState] = useState('idle') // idle | setup | confirm | disabling
  const [qrCode, setQrCode] = useState(null)
  const [secret, setSecret] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [message, setMessage] = useState(null) // { type: 'success'|'error', text }
  const [loading, setLoading] = useState(false)

  async function startSetup() {
    setLoading(true)
    setMessage(null)
    try {
      const { data } = await mfaApi.setup()
      setQrCode(data.qr_code)
      setSecret(data.secret)
      setMfaState('setup')
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to start MFA setup.' })
    } finally {
      setLoading(false)
    }
  }

  async function enableMfa() {
    if (totpCode.length !== 6) return
    setLoading(true)
    setMessage(null)
    try {
      await mfaApi.enable(totpCode)
      const { data } = await authApi.me()
      setUser(data)
      setMfaState('idle')
      setTotpCode('')
      setQrCode(null)
      setMessage({ type: 'success', text: 'MFA enabled. Your account is now protected with two-factor authentication.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Invalid code. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  async function disableMfa() {
    if (!disablePassword) return
    setLoading(true)
    setMessage(null)
    try {
      await mfaApi.disable(disablePassword)
      const { data } = await authApi.me()
      setUser(data)
      setMfaState('idle')
      setDisablePassword('')
      setMessage({ type: 'success', text: 'MFA has been disabled.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to disable MFA.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Account information and security settings</p>
        </div>

        {/* Account info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Account Details</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Full name</dt>
              <dd className="font-medium text-gray-900 dark:text-white mt-0.5">{user?.full_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="font-medium text-gray-900 dark:text-white mt-0.5">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Role</dt>
              <dd className="font-medium text-gray-900 dark:text-white mt-0.5 capitalize">{user?.role?.replace('_', ' ')}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Organization</dt>
              <dd className="font-medium text-gray-900 dark:text-white mt-0.5">{user?.organization || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Phone</dt>
              <dd className="font-medium text-gray-900 dark:text-white mt-0.5">{user?.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Member since</dt>
              <dd className="font-medium text-gray-900 dark:text-white mt-0.5">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
              </dd>
            </div>
          </dl>
        </div>

        {/* MFA */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Add an extra layer of security using an authenticator app.</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user?.mfa_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {user?.mfa_enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {message && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
              {message.text}
            </div>
          )}

          {!user?.mfa_enabled && mfaState === 'idle' && (
            <button
              onClick={startSetup}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Setting up…' : 'Enable MFA'}
            </button>
          )}

          {mfaState === 'setup' && qrCode && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code below.
              </p>
              <div className="flex flex-col items-center gap-3">
                <img
                  src={`data:image/png;base64,${qrCode}`}
                  alt="MFA QR Code"
                  className="w-44 h-44 rounded-xl border border-gray-200 dark:border-gray-600"
                />
                <p className="text-xs text-gray-400 font-mono break-all text-center max-w-xs">
                  Manual key: {secret}
                </p>
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">6-digit code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <button
                  onClick={enableMfa}
                  disabled={loading || totpCode.length !== 6}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Verifying…' : 'Confirm'}
                </button>
                <button
                  onClick={() => { setMfaState('idle'); setQrCode(null); setTotpCode('') }}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-sm rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {user?.mfa_enabled && mfaState === 'idle' && (
            <button
              onClick={() => { setMfaState('disabling'); setMessage(null) }}
              className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Disable MFA
            </button>
          )}

          {mfaState === 'disabling' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">Enter your current password to confirm disabling MFA.</p>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Password</label>
                  <input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary-500"
                  />
                </div>
                <button
                  onClick={disableMfa}
                  disabled={loading || !disablePassword}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Disabling…' : 'Disable'}
                </button>
                <button
                  onClick={() => { setMfaState('idle'); setDisablePassword('') }}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-sm rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
