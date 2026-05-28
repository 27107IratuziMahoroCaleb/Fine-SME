import { forwardRef } from 'react'

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0"  y="16" width="8"  height="16" rx="2" fill="#2563eb" />
        <rect x="12" y="9"  width="8"  height="23" rx="2" fill="#2563eb" />
        <rect x="24" y="0"  width="8"  height="32" rx="2" fill="#2563eb" />
      </svg>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#1e3a8a', letterSpacing: '-0.03em', lineHeight: 1 }}>FINE</span>
          <span style={{ display: 'inline-block', width: 1.5, height: 13, background: '#cbd5e1', borderRadius: 1 }} />
          <span style={{ fontWeight: 600, fontSize: 18, color: '#2563eb', letterSpacing: '0.05em', lineHeight: 1 }}>SME</span>
        </div>
        <p style={{ fontSize: 9, color: '#6b7280', letterSpacing: '0.04em', marginTop: 3, lineHeight: 1 }}>
          Financial Sustainability Intelligence
        </p>
      </div>
    </div>
  )
}

const PrintDocument = forwardRef(function PrintDocument({ title, subtitle, children }, ref) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
  const printedStr = now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div ref={ref} style={{
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#111827',
      background: '#ffffff',
      padding: '40px 48px',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '1123px',
    }}>
      {/* Logo + date header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        borderBottom: '2px solid #2563eb', paddingBottom: 16, marginBottom: 28,
      }}>
        <Logo />
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2, margin: 0 }}>Report Date</p>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '2px 0 0 0' }}>{dateStr}</p>
          <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 4, letterSpacing: '0.05em', margin: '4px 0 0 0' }}>CONFIDENTIAL</p>
        </div>
      </div>

      {/* Title block */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, margin: '0 0 4px 0' }}>Official Report</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6, margin: '6px 0 0 0' }}>{subtitle}</p>}
        <div style={{ width: 48, height: 3, backgroundColor: '#2563eb', borderRadius: 2, marginTop: 10 }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1 }}>
        {children}
      </div>

      {/* Signature section */}
      <div style={{ borderTop: '1px solid #d1d5db', paddingTop: 24, marginTop: 40 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, margin: '0 0 20px 0' }}>Authorized Signatures</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
          {['Prepared by', 'Reviewed by', 'Approved by'].map(label => (
            <div key={label}>
              <div style={{ borderBottom: '1px solid #374151', height: 36, marginBottom: 6 }} />
              <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', margin: 0 }}>{label}</p>
              <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 2, margin: '2px 0 0 0' }}>Name &amp; Signature</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>FINE SME · For authorized use only</p>
        <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>Printed {printedStr}</p>
      </div>
    </div>
  )
})

export default PrintDocument
