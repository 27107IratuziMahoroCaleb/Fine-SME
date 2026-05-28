import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { useAuth } from '../../context/AuthContext'
import { mfaApi, authApi, usersApi } from '../../services/api'

const INSTITUTION_TYPES = [
  { value: 'bank', label: 'Bank' },
  { value: 'microfinance', label: 'Microfinance' },
  { value: 'sacco', label: 'SACCO' },
  { value: 'development_program', label: 'Development Program' },
  { value: 'other', label: 'Other' },
]

function LockIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 ml-1 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function Field({ label, value, locked, children }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
        {label}
        {locked && <LockIcon />}
      </dt>
      {children ?? (
        <dd className={`text-sm font-medium ${locked ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
          {value || '—'}
        </dd>
      )}
    </div>
  )
}

export default function Profile() {
  const { user, setUser } = useAuth()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    full_name: user?.full_name ?? '',
    phone: user?.phone ?? '',
    organization: user?.organization ?? '',
    institution_type: user?.institution_type ?? '',
  })
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMessage, setPwMessage] = useState(null)

  async function changePassword(e) {
    e.preventDefault()
    setPwMessage(null)
    if (pwForm.next !== pwForm.confirm) {
      setPwMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (pwForm.next.length < 8) {
      setPwMessage({ type: 'error', text: 'New password must be at least 8 characters.' })
      return
    }
    setPwLoading(true)
    try {
      await authApi.changePassword(pwForm.current, pwForm.next)
      setPwForm({ current: '', next: '', confirm: '' })
      setPwMessage({ type: 'success', text: 'Password changed successfully.' })
    } catch (err) {
      setPwMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to change password.' })
    } finally {
      setPwLoading(false)
    }
  }

  const [mfaState, setMfaState] = useState('idle')
  const [qrCode, setQrCode] = useState(null)
  const [secret, setSecret] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [mfaMessage, setMfaMessage] = useState(null)
  const [mfaLoading, setMfaLoading] = useState(false)

  function startEdit() {
    setForm({
      full_name: user?.full_name ?? '',
      phone: user?.phone ?? '',
      organization: user?.organization ?? '',
      institution_type: user?.institution_type ?? '',
    })
    setSaveMessage(null)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setSaveMessage(null)
  }

  async function saveEdit() {
    setSaveLoading(true)
    setSaveMessage(null)
    try {
      const payload = {}
      if (form.full_name !== (user?.full_name ?? '')) payload.full_name = form.full_name
      if (form.phone !== (user?.phone ?? '')) payload.phone = form.phone || null
      if (form.organization !== (user?.organization ?? '')) payload.organization = form.organization || null
      if (form.institution_type !== (user?.institution_type ?? '')) payload.institution_type = form.institution_type || null

      if (Object.keys(payload).length > 0) {
        await usersApi.updateMe(payload)
      }
      const { data } = await authApi.me()
      setUser(data)
      setEditing(false)
      setSaveMessage({ type: 'success', text: 'Profile updated successfully.' })
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to save changes.' })
    } finally {
      setSaveLoading(false)
    }
  }

  async function startMfaSetup() {
    setMfaLoading(true)
    setMfaMessage(null)
    try {
      const { data } = await mfaApi.setup()
      setQrCode(data.qr_code)
      setSecret(data.secret)
      setMfaState('setup')
    } catch (err) {
      setMfaMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to start MFA setup.' })
    } finally {
      setMfaLoading(false)
    }
  }

  async function enableMfa() {
    if (totpCode.length !== 6) return
    setMfaLoading(true)
    setMfaMessage(null)
    try {
      await mfaApi.enable(totpCode)
      const { data } = await authApi.me()
      setUser(data)
      setMfaState('idle')
      setTotpCode('')
      setQrCode(null)
      setMfaMessage({ type: 'success', text: 'MFA enabled. Your account is now protected with two-factor authentication.' })
    } catch (err) {
      setMfaMessage({ type: 'error', text: err.response?.data?.detail || 'Invalid code. Please try again.' })
    } finally {
      setMfaLoading(false)
    }
  }

  async function disableMfa() {
    if (!disablePassword) return
    setMfaLoading(true)
    setMfaMessage(null)
    try {
      await mfaApi.disable(disablePassword)
      const { data } = await authApi.me()
      setUser(data)
      setMfaState('idle')
      setDisablePassword('')
      setMfaMessage({ type: 'success', text: 'MFA has been disabled.' })
    } catch (err) {
      setMfaMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to disable MFA.' })
    } finally {
      setMfaLoading(false)
    }
  }

  const inputClass = 'w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500'

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Account information and security settings</p>
        </div>

        {/* Account info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Account Details</h2>
            {!editing ? (
              <button
                onClick={startEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelEdit}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saveLoading}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition disabled:opacity-50"
                >
                  {saveLoading ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            )}
          </div>

          {saveMessage && (
            <div className={`mb-5 px-4 py-3 rounded-lg text-sm ${saveMessage.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
              {saveMessage.text}
            </div>
          )}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
            <Field label="Full name">
              {editing ? (
                <input
                  className={inputClass}
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Full name"
                />
              ) : (
                <dd className="text-sm font-medium text-gray-900 dark:text-white">{user?.full_name || '—'}</dd>
              )}
            </Field>

            <Field label="Email" locked>
              <dd className="text-sm font-medium text-gray-400 dark:text-gray-500">{user?.email || '—'}</dd>
            </Field>

            <Field label="Phone">
              {editing ? (
                <input
                  className={inputClass}
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+250 7xx xxx xxx"
                />
              ) : (
                <dd className="text-sm font-medium text-gray-900 dark:text-white">{user?.phone || '—'}</dd>
              )}
            </Field>

            <Field label="Role" locked>
              <dd className="text-sm font-medium text-gray-400 dark:text-gray-500 capitalize">{user?.role?.replace('_', ' ') || '—'}</dd>
            </Field>

            <Field label="Organization">
              {editing ? (
                <input
                  className={inputClass}
                  value={form.organization}
                  onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                  placeholder="Organization name"
                />
              ) : (
                <dd className="text-sm font-medium text-gray-900 dark:text-white">{user?.organization || '—'}</dd>
              )}
            </Field>

            <Field label="Institution type">
              {editing ? (
                <select
                  className={inputClass}
                  value={form.institution_type}
                  onChange={e => setForm(f => ({ ...f, institution_type: e.target.value }))}
                >
                  <option value="">— Select —</option>
                  {INSTITUTION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              ) : (
                <dd className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {user?.institution_type?.replace('_', ' ') || '—'}
                </dd>
              )}
            </Field>

            <Field label="Member since" locked>
              <dd className="text-sm font-medium text-gray-400 dark:text-gray-500">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
              </dd>
            </Field>
          </dl>
        </div>

        {/* Change Password */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Change Password</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Enter your current password to set a new one.</p>

          {pwMessage && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${pwMessage.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
              {pwMessage.text}
            </div>
          )}

          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Current password</label>
              <input
                type="password"
                required
                value={pwForm.current}
                onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                className={inputClass}
                placeholder="Your current password"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">New password</label>
                <input
                  type="password"
                  required
                  value={pwForm.next}
                  onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                  className={inputClass}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Confirm new password</label>
                <input
                  type="password"
                  required
                  value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  className={inputClass}
                  placeholder="Repeat new password"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pwLoading || !pwForm.current || !pwForm.next || !pwForm.confirm}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
              >
                {pwLoading ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>
        </div>

        {/* MFA */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Add an extra layer of security using an authenticator app.</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user?.mfa_enabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
              {user?.mfa_enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {mfaMessage && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${mfaMessage.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
              {mfaMessage.text}
            </div>
          )}

          {!user?.mfa_enabled && mfaState === 'idle' && (
            <button
              onClick={startMfaSetup}
              disabled={mfaLoading}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
            >
              {mfaLoading ? 'Setting up…' : 'Enable MFA'}
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
                  disabled={mfaLoading || totpCode.length !== 6}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                >
                  {mfaLoading ? 'Verifying…' : 'Confirm'}
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
              onClick={() => { setMfaState('disabling'); setMfaMessage(null) }}
              className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
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
                  disabled={mfaLoading || !disablePassword}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                >
                  {mfaLoading ? 'Disabling…' : 'Disable'}
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
