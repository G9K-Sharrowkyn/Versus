/**
 * MechOverlay – decorative mechanical elements.
 * Performant: corners use CSS borders (no SVG), rotation uses div wrappers (GPU).
 * Hidden in audit / screenshot mode via CSS.
 */
export function MechOverlay() {
  return (
    <div
      className="mech-overlay absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 15 }}
      aria-hidden="true"
    >
      {/* ── Corner brackets – pure CSS borders, no SVG ── */}
      <div className="mech-corner mech-corner-tl" />
      <div className="mech-corner mech-corner-tr" />
      <div className="mech-corner mech-corner-bl" />
      <div className="mech-corner mech-corner-br" />

      {/* ── Targeting reticle – left side, div wrappers rotate (GPU) ── */}
      <div
        className="mech-reticle-anchor"
        style={{ position: 'absolute', left: 68, top: '50%', transform: 'translateY(-50%)' }}
      >
        {/* Outer ring – div rotates, SVG static */}
        <div
          className="mech-reticle-ring"
          style={{ animation: 'vv-mech-spin 9s linear infinite', willChange: 'transform' }}
        >
          <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
            <circle cx="55" cy="55" r="52" stroke="rgba(0,220,255,0.55)" strokeWidth="1.2" strokeDasharray="6 11" />
          </svg>
        </div>
        {/* Inner ring – counter-rotation */}
        <div
          className="mech-reticle-ring"
          style={{ animation: 'vv-mech-spin-rev 5.5s linear infinite', willChange: 'transform' }}
        >
          <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
            <circle cx="55" cy="55" r="38" stroke="rgba(0,220,255,0.4)" strokeWidth="0.9" strokeDasharray="3 9" />
          </svg>
        </div>
        {/* Static crosshairs + center dot */}
        <svg
          width="110" height="110" viewBox="0 0 110 110" fill="none"
          style={{ position: 'absolute', inset: 0 }}
        >
          <line x1="55" y1="5"  x2="55" y2="22"  stroke="rgba(0,220,255,0.6)" strokeWidth="1.2" />
          <line x1="55" y1="88" x2="55" y2="105" stroke="rgba(0,220,255,0.6)" strokeWidth="1.2" />
          <line x1="5"  y1="55" x2="22"  y2="55" stroke="rgba(0,220,255,0.6)" strokeWidth="1.2" />
          <line x1="88" y1="55" x2="105" y2="55" stroke="rgba(0,220,255,0.6)" strokeWidth="1.2" />
          {/* 45° ticks */}
          <line x1="17" y1="17" x2="26" y2="26" stroke="rgba(0,220,255,0.35)" strokeWidth="0.9" />
          <line x1="93" y1="17" x2="84" y2="26" stroke="rgba(0,220,255,0.35)" strokeWidth="0.9" />
          <line x1="17" y1="93" x2="26" y2="84" stroke="rgba(0,220,255,0.35)" strokeWidth="0.9" />
          <line x1="93" y1="93" x2="84" y2="84" stroke="rgba(0,220,255,0.35)" strokeWidth="0.9" />
          {/* Center dot */}
          <circle cx="55" cy="55" r="4" fill="rgba(0,220,255,0.85)" />
          <circle cx="55" cy="55" r="8" fill="none" stroke="rgba(0,220,255,0.35)" strokeWidth="0.8" />
        </svg>
      </div>

      {/* ── Vertical laser scan (left → right sweep) ── */}
      <div className="mech-vscan" />
    </div>
  )
}
