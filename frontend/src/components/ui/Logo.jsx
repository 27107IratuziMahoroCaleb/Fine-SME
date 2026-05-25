// FINE SME — Logo component
// Mark: 3 ascending bars (bar chart / letter F motif)
// SVG viewBox 0 0 32 32

function Mark({ size = 32, color = '#2563eb' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0"  y="16" width="8"  height="16" rx="2" fill={color} />
      <rect x="12" y="9"  width="8"  height="23" rx="2" fill={color} />
      <rect x="24" y="0"  width="8"  height="32" rx="2" fill={color} />
    </svg>
  )
}

// ── Compact (inline): Mark + FINE | SME — sidebar, nav, footer ──
export function LogoCompact({
  markColor = '#2563eb',
  fineColor = '#1e293b',
  smeColor  = '#2563eb',
  size = 'md',
}) {
  const cfg = {
    sm: { mark: 20, font: 13, gap: 8  },
    md: { mark: 26, font: 16, gap: 10 },
    lg: { mark: 32, font: 20, gap: 12 },
  }[size] || { mark: 26, font: 16, gap: 10 }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: cfg.gap }}>
      <Mark size={cfg.mark} color={markColor} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 700,
          fontSize: cfg.font,
          color: fineColor,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>FINE</span>
        <span style={{
          width: 1.5,
          height: cfg.font * 0.72,
          background: 'rgba(148,163,184,0.35)',
          borderRadius: 1,
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 600,
          fontSize: cfg.font,
          color: smeColor,
          letterSpacing: '0.05em',
          lineHeight: 1,
        }}>SME</span>
      </div>
    </div>
  )
}

// ── Stacked: icon container + FINE + SME + optional tagline — auth pages ──
export function LogoStacked({
  markColor  = '#2563eb',
  fineColor  = '#1e293b',
  smeColor   = '#2563eb',
  tagColor   = null,
  iconBg     = null,
  markSize   = 44,
}) {
  const iconContent = (
    <Mark size={iconBg ? Math.round(markSize * 0.55) : markSize} color={markColor} />
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {iconBg ? (
        <div style={{
          width: markSize, height: markSize,
          background: iconBg,
          borderRadius: '22%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          {iconContent}
        </div>
      ) : iconContent}

      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 800,
          fontSize: 28,
          color: fineColor,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          margin: 0,
        }}>FINE</p>
        <p style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 600,
          fontSize: 12,
          color: smeColor,
          letterSpacing: '0.28em',
          lineHeight: 1.4,
          margin: '3px 0 0',
        }}>SME</p>
        {tagColor && (
          <p style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 400,
            fontSize: 10,
            color: tagColor,
            letterSpacing: '0.04em',
            marginTop: 6,
          }}>Financial Sustainability Intelligence</p>
        )}
      </div>
    </div>
  )
}

// ── Icon: mark in colored square — standalone icon use ──────────
export function LogoIcon({
  size    = 36,
  bg      = '#2563eb',
  color   = '#ffffff',
  radius  = '22%',
}) {
  return (
    <div style={{
      width: size, height: size,
      background: bg,
      borderRadius: radius,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Mark size={Math.round(size * 0.56)} color={color} />
    </div>
  )
}

export default LogoCompact
