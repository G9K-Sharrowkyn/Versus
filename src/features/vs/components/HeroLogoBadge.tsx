import { useEffect, useRef, useState } from 'react'

type Hero = {
  id: string
  label: string
  color: string
  glow: string
  glowSoft: string
  glowFar: string
}

const HEROES: Hero[] = [
  {
    id: 'batman',
    label: 'BATMAN',
    color: '#6aaeff',
    glow: 'rgba(106, 174, 255, 0.55)',
    glowSoft: 'rgba(106, 174, 255, 0.22)',
    glowFar: 'rgba(106, 174, 255, 0.08)',
  },
  {
    id: 'flash',
    label: 'FLASH',
    color: '#ffd700',
    glow: 'rgba(255, 215, 0, 0.6)',
    glowSoft: 'rgba(255, 185, 0, 0.22)',
    glowFar: 'rgba(255, 150, 0, 0.08)',
  },
  {
    id: 'superman',
    label: 'SUPERMAN',
    color: '#ff4455',
    glow: 'rgba(255, 68, 85, 0.55)',
    glowSoft: 'rgba(255, 68, 85, 0.22)',
    glowFar: 'rgba(255, 68, 85, 0.08)',
  },
]

function BatmanSvg({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 130" className="w-full h-full" fill="none">
      {/* Wings */}
      <path
        fill={color}
        d="
          M100,32
          L88,10 L80,28
          C64,20 40,24 22,38
          C6,52 7,74 22,68
          C28,65 30,75 38,70
          C45,66 46,54 55,49
          C62,45 66,39 76,37
          L80,54 C82,60 86,65 92,66
          C96,67 98,66 100,64
          C102,66 104,67 108,66
          C114,65 118,60 120,54
          L124,37
          C134,39 138,45 145,49
          C154,54 155,66 162,70
          C170,75 172,65 178,68
          C193,74 194,52 178,38
          C160,24 136,20 120,28
          L112,10 Z
        "
      />
      {/* Body gap */}
      <ellipse cx="100" cy="58" rx="6" ry="10" fill="#090d18" opacity="0.6" />
    </svg>
  )
}

function FlashSvg({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 130" className="w-full h-full" fill="none">
      <path
        fill={color}
        d="M63,6 L30,66 L52,66 L37,124 L82,54 L60,54 Z"
      />
      {/* Subtle inner highlight */}
      <path
        fill="rgba(255,255,255,0.18)"
        d="M63,6 L48,46 L60,46 Z"
      />
    </svg>
  )
}

function SupermanSvg({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 130" className="w-full h-full" fill="none">
      {/* Shield outline */}
      <path
        fill={color}
        fillOpacity="0.22"
        stroke={color}
        strokeWidth="2.5"
        d="M50,6 L92,30 L82,92 L50,124 L18,92 L8,30 Z"
      />
      {/* S letter */}
      <text
        x="50"
        y="94"
        textAnchor="middle"
        fontSize="74"
        fontWeight="900"
        fill={color}
        fontFamily="Arial Black, Impact, sans-serif"
        letterSpacing="-2"
      >
        S
      </text>
    </svg>
  )
}

const LOGO_COMPONENTS = {
  batman: BatmanSvg,
  flash: FlashSvg,
  superman: SupermanSvg,
} as const

const CYCLE_MS = 3800
const EXIT_MS = 380

export function HeroLogoBadge() {
  const [heroIdx, setHeroIdx] = useState(0)
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter')
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const startCycle = () => {
      timerRef.current = window.setTimeout(() => {
        setPhase('exit')
        timerRef.current = window.setTimeout(() => {
          setHeroIdx((i) => (i + 1) % HEROES.length)
          setPhase('enter')
          startCycle()
        }, EXIT_MS)
      }, CYCLE_MS)
    }
    startCycle()
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  const hero = HEROES[heroIdx]
  const LogoComp = LOGO_COMPONENTS[hero.id as keyof typeof LOGO_COMPONENTS]
  const logoClass = phase === 'enter' ? 'hero-logo-enter' : 'hero-logo-exit'

  return (
    <div
      className="hero-logo-badge-root absolute bottom-5 right-6 pointer-events-none select-none"
      style={{ zIndex: 20 }}
      aria-hidden="true"
    >
      {/* Badge ring */}
      <div
        className="hero-badge-ring relative flex items-center justify-center rounded-full border-2"
        style={{
          width: 72,
          height: 72,
          borderColor: hero.color,
          '--hero-glow': hero.glow,
          '--hero-glow-soft': hero.glowSoft,
          '--hero-glow-far': hero.glowFar,
          background: `radial-gradient(circle at 38% 32%, ${hero.color}1a, transparent 65%), #090d18`,
          transition: 'border-color 0.55s ease, background 0.55s ease',
        } as React.CSSProperties}
      >
        {/* Outer rotating dashes */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ animation: 'vv-mech-spin 11s linear infinite' }}
        >
          <svg viewBox="0 0 72 72" className="w-full h-full">
            <circle
              cx="36" cy="36" r="34"
              fill="none"
              stroke={hero.color}
              strokeWidth="0.7"
              strokeDasharray="5 13"
              opacity="0.45"
            />
          </svg>
        </div>
        {/* Inner counter-rotating ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ animation: 'vv-mech-spin-rev 6.5s linear infinite' }}
        >
          <svg viewBox="0 0 72 72" className="w-full h-full">
            <circle
              cx="36" cy="36" r="27"
              fill="none"
              stroke={hero.color}
              strokeWidth="0.5"
              strokeDasharray="2 9"
              opacity="0.3"
            />
          </svg>
        </div>
        {/* Logo */}
        <div
          key={`${hero.id}-${heroIdx}`}
          className={`w-10 h-10 ${logoClass}`}
        >
          <LogoComp color={hero.color} />
        </div>
      </div>
      {/* Hero label */}
      <p
        className="text-center mt-1.5 text-[7px] font-bold tracking-[0.26em] uppercase"
        style={{
          color: hero.color,
          opacity: 0.65,
          transition: 'color 0.55s ease',
          textShadow: `0 0 8px ${hero.glow}`,
        }}
      >
        {hero.label}
      </p>
    </div>
  )
}
