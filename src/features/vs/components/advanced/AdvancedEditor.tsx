import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, ArrowRight, Eye, ImagePlus, Settings2, Swords, Trophy, Upload, X } from 'lucide-react'
import type { Language } from '../../types'
import { StudioMenuButton } from '../StartScreen'
import { GifExportButton } from '../GifExportButton'
import { WebmExportButton } from '../WebmExportButton'
import {
  VOTED_FRAME_BLEED,
  VOTED_FRAME_BLUR,
  VOTED_FRAME_DURATION_MS,
  VOTED_FRAME_GLOW_RATIO,
  VOTED_FRAME_LINE_WIDTH,
  createVotedFrameGradient,
  roundedRectPath,
} from '../../frameAnimation'
import { buildBattlePanels, parseTeamFormat, TEAM_PRESETS, type BattlePanel, type BattleSettings } from './advancedLayout'
import './AdvancedEditor.css'

type Portrait = { url: string; name: string; zoom: number; x: number; y: number }
type SlotDescription = { id: string; label: string }
type LabelOverrides = {
  teams: Record<number, string>
  rounds: Record<number, string>
  challenger: string
  boss: string
}
const TEAM_COLORS = ['#78e5ed', '#ff87b6', '#b3a0ff', '#ffd27a']
const INITIAL_SETTINGS: BattleSettings = { mode: 'teams', teams: [2, 2], gauntletSize: 1, pairSplit: 'vertical' }
const EMPTY_LABEL_OVERRIDES: LabelOverrides = { teams: {}, rounds: {}, challenger: '', boss: '' }
function VotedFrameDecoration() {
  const glowCanvasRef = useRef<HTMLCanvasElement>(null)
  const borderCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = glowCanvasRef.current
    const borderCanvas = borderCanvasRef.current
    const shell = canvas?.parentElement
    const frame = shell?.querySelector<HTMLElement>('.vs-advanced__portrait--voted-frame')
    if (!canvas || !borderCanvas || !shell || !frame) return

    let animationFrame = 0
    let lastDraw = -Infinity
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pixelRatio = Math.max(2, Math.min(3, window.devicePixelRatio || 1))
    const glowCanvas = document.createElement('canvas')

    const draw = (timestamp: number) => {
      const rect = frame.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      const computed = window.getComputedStyle(frame)
      const radius = Number.parseFloat(computed.borderTopLeftRadius) || 16
      const cssWidth = rect.width + VOTED_FRAME_BLEED * 2
      const cssHeight = rect.height + VOTED_FRAME_BLEED * 2
      const bitmapWidth = Math.max(1, Math.round(cssWidth * pixelRatio))
      const bitmapHeight = Math.max(1, Math.round(cssHeight * pixelRatio))

      canvas.style.left = `-${VOTED_FRAME_BLEED}px`
      canvas.style.top = `-${VOTED_FRAME_BLEED}px`
      canvas.style.width = `${cssWidth}px`
      canvas.style.height = `${cssHeight}px`
      if (canvas.width !== bitmapWidth || canvas.height !== bitmapHeight) {
        canvas.width = bitmapWidth
        canvas.height = bitmapHeight
      }
      const borderBitmapWidth = Math.max(1, Math.round(rect.width * pixelRatio))
      const borderBitmapHeight = Math.max(1, Math.round(rect.height * pixelRatio))
      borderCanvas.style.width = `${rect.width}px`
      borderCanvas.style.height = `${rect.height}px`
      if (borderCanvas.width !== borderBitmapWidth || borderCanvas.height !== borderBitmapHeight) {
        borderCanvas.width = borderBitmapWidth
        borderCanvas.height = borderBitmapHeight
      }
      const glowBitmapWidth = Math.max(1, Math.round(cssWidth * VOTED_FRAME_GLOW_RATIO))
      const glowBitmapHeight = Math.max(1, Math.round(cssHeight * VOTED_FRAME_GLOW_RATIO))
      if (glowCanvas.width !== glowBitmapWidth || glowCanvas.height !== glowBitmapHeight) {
        glowCanvas.width = glowBitmapWidth
        glowCanvas.height = glowBitmapHeight
      }

      const context = canvas.getContext('2d')
      const borderContext = borderCanvas.getContext('2d')
      const glowContext = glowCanvas.getContext('2d')
      if (!context || !borderContext || !glowContext) return
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.clearRect(0, 0, canvas.width, canvas.height)
      glowContext.setTransform(1, 0, 0, 1, 0, 0)
      glowContext.clearRect(0, 0, glowCanvas.width, glowCanvas.height)
      glowContext.setTransform(VOTED_FRAME_GLOW_RATIO, 0, 0, VOTED_FRAME_GLOW_RATIO, 0, 0)

      const lineWidth = VOTED_FRAME_LINE_WIDTH
      const left = VOTED_FRAME_BLEED + lineWidth / 2
      const top = VOTED_FRAME_BLEED + lineWidth / 2
      const width = Math.max(1, rect.width - lineWidth)
      const height = Math.max(1, rect.height - lineWidth)
      const centerX = VOTED_FRAME_BLEED + rect.width / 2
      const centerY = VOTED_FRAME_BLEED + rect.height / 2
      const angle = reducedMotion ? 0 : ((timestamp % VOTED_FRAME_DURATION_MS) / VOTED_FRAME_DURATION_MS) * Math.PI * 2
      const createFrameGradient = (target: CanvasRenderingContext2D) => (
        createVotedFrameGradient(target, angle, centerX, centerY, left, top, width, height)
      )

      const strokeGlow = (blur: number, glowWidth: number) => {
        glowContext.save()
        glowContext.globalAlpha = 1
        glowContext.filter = `blur(${blur}px)`
        glowContext.lineWidth = glowWidth
        glowContext.strokeStyle = createFrameGradient(glowContext)
        roundedRectPath(glowContext, left, top, width, height, Math.max(1, radius - lineWidth / 2))
        glowContext.stroke()
        glowContext.restore()
      }

      // PostCard.css renders a complete blurred copy of the gradient border.
      // Canvas spreads a thin stroke more faintly, so the broad and close
      // layers reproduce the measured falloff of that CSS blur at high DPR.
      strokeGlow(VOTED_FRAME_BLUR * VOTED_FRAME_GLOW_RATIO, lineWidth * 3)
      strokeGlow((VOTED_FRAME_BLUR * VOTED_FRAME_GLOW_RATIO) / 2, lineWidth * 2)

      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.drawImage(glowCanvas, 0, 0, canvas.width, canvas.height)

      borderContext.setTransform(1, 0, 0, 1, 0, 0)
      borderContext.clearRect(0, 0, borderCanvas.width, borderCanvas.height)
      borderContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      const borderLeft = lineWidth / 2
      const borderTop = lineWidth / 2
      const borderWidth = Math.max(1, rect.width - lineWidth)
      const borderHeight = Math.max(1, rect.height - lineWidth)
      const borderGradient = createVotedFrameGradient(
        borderContext,
        angle,
        rect.width / 2,
        rect.height / 2,
        borderLeft,
        borderTop,
        borderWidth,
        borderHeight,
      )
      borderContext.lineWidth = lineWidth
      borderContext.strokeStyle = borderGradient
      roundedRectPath(borderContext, borderLeft, borderTop, borderWidth, borderHeight, Math.max(1, radius - lineWidth / 2))
      borderContext.stroke()
    }

    const tick = (timestamp: number) => {
      if (timestamp - lastDraw >= 1000 / 30) {
        draw(timestamp)
        lastDraw = timestamp
      }
      if (!reducedMotion) animationFrame = window.requestAnimationFrame(tick)
    }

    const resizeObserver = new ResizeObserver(() => draw(performance.now()))
    resizeObserver.observe(frame)
    draw(performance.now())
    if (!reducedMotion) animationFrame = window.requestAnimationFrame(tick)

    return () => {
      resizeObserver.disconnect()
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <>
      <canvas ref={glowCanvasRef} className="vs-advanced__voted-frame-decoration" aria-hidden="true" />
      <canvas ref={borderCanvasRef} className="vs-advanced__voted-frame-border" aria-hidden="true" />
    </>
  )
}

export function AdvancedEditor({ language, onBack }: { language: Language; onBack: () => void }) {
  const pl = language === 'pl'
  const [settings, setSettings] = useState<BattleSettings>(INITIAL_SETTINGS)
  const [format, setFormat] = useState('2 vs 2')
  const [editing, setEditing] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const [gap, setGap] = useState(18)
  const [showNames, setShowNames] = useState(true)
  const [labelOverrides, setLabelOverrides] = useState<LabelOverrides>(EMPTY_LABEL_OVERRIDES)
  const [portraits, setPortraits] = useState<Record<string, Portrait>>({})
  const [selected, setSelected] = useState<SlotDescription | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadSlotRef = useRef<string | null>(null)
  const urlsRef = useRef(new Map<string, string>())
  const pendingLoadsRef = useRef(new Map<string, symbol>())
  const setupTitleRef = useRef<HTMLHeadingElement>(null)
  const editorTitleRef = useRef<HTMLHeadingElement>(null)
  const exportCanvasRef = useRef<HTMLDivElement>(null)
  const parsedTeams = parseTeamFormat(format)
  const panels = buildBattlePanels(settings)
  const selectedPortrait = selected ? portraits[selected.id] : null
  const selectedPanel = selected ? panels.find(panel => panel.slots.includes(selected.id)) ?? null : null
  const isGauntlet = settings.mode === 'gauntlet'
  const isOneVsOne = !isGauntlet && settings.teams.length === 2 && settings.teams.every(count => count === 1)
  const usesVotedFrames = !isGauntlet
    && settings.teams.length === 2
    && settings.teams[0] === settings.teams[1]
    && (settings.teams[0] === 1 || settings.teams[0] === 2)
  const formatLabel = isGauntlet ? `${settings.gauntletSize} vs ${settings.gauntletSize * 7}` : settings.teams.join(' vs ')

  const defaultTeamLabel = (index: number) => `TEAM ${index + 1}`
  const defaultRoundLabel = (index: number) => `Fight ${index + 1}`
  const defaultChallengerLabel = 'Main Fighter'

  useEffect(() => {
    const urls = urlsRef.current
    const pending = pendingLoadsRef.current
    return () => {
      pending.clear()
      urls.forEach(url => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && presenting) setPresenting(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [presenting])

  useEffect(() => {
    if (presenting) return
    if (editing) editorTitleRef.current?.focus()
    else setupTitleRef.current?.focus()
  }, [editing, presenting])

  const panelLabel = (panel: BattlePanel) => {
    if (panel.role === 'boss') return labelOverrides.boss.trim() || 'BOSS'
    if (panel.role === 'challenger') return labelOverrides.challenger.trim() || defaultChallengerLabel
    if (panel.role === 'round') return labelOverrides.rounds[panel.index]?.trim() || defaultRoundLabel(panel.index)
    return labelOverrides.teams[panel.index]?.trim() || defaultTeamLabel(panel.index)
  }

  const updateLabelOverride = (patch: Partial<LabelOverrides>) => {
    setLabelOverrides(current => ({ ...current, ...patch }))
  }

  const updateTeamLabel = (index: number, value: string) => {
    setLabelOverrides(current => ({
      ...current,
      teams: { ...current.teams, [index]: value },
    }))
  }

  const updateRoundLabel = (index: number, value: string) => {
    setLabelOverrides(current => ({
      ...current,
      rounds: { ...current.rounds, [index]: value },
    }))
  }

  const panelOverride = (panel: BattlePanel) => {
    if (panel.role === 'boss') return labelOverrides.boss
    if (panel.role === 'challenger') return labelOverrides.challenger
    if (panel.role === 'round') return labelOverrides.rounds[panel.index] ?? ''
    return labelOverrides.teams[panel.index] ?? ''
  }

  const updatePanelLabel = (panel: BattlePanel, value: string) => {
    if (panel.role === 'boss') updateLabelOverride({ boss: value })
    else if (panel.role === 'challenger') updateLabelOverride({ challenger: value })
    else if (panel.role === 'round') updateRoundLabel(panel.index, value)
    else updateTeamLabel(panel.index, value)
  }

  const loadImage = async (slotId: string, file: File) => {
    setError('')
    if (!file.type.startsWith('image/')) {
      setError(pl ? 'Wybierz plik graficzny, np. JPG, PNG lub WebP.' : 'Choose an image file, such as JPG, PNG or WebP.')
      return
    }
    const request = Symbol(slotId)
    pendingLoadsRef.current.set(slotId, request)
    const url = URL.createObjectURL(file)
    try {
      const image = new Image()
      image.src = url
      await image.decode()
      if (pendingLoadsRef.current.get(slotId) !== request) {
        URL.revokeObjectURL(url)
        return
      }
      const oldUrl = urlsRef.current.get(slotId)
      if (oldUrl) URL.revokeObjectURL(oldUrl)
      urlsRef.current.set(slotId, url)
      setPortraits(current => ({ ...current, [slotId]: { url, name: file.name.replace(/\.[^.]+$/, ''), zoom: 1, x: 50, y: 50 } }))
    } catch {
      URL.revokeObjectURL(url)
      if (pendingLoadsRef.current.get(slotId) === request) {
        setError(pl ? 'Nie udało się odczytać tej grafiki. Spróbuj innego pliku.' : 'This image could not be read. Try another file.')
      }
    } finally {
      if (pendingLoadsRef.current.get(slotId) === request) pendingLoadsRef.current.delete(slotId)
    }
  }

  const chooseImage = (slot: SlotDescription) => {
    uploadSlotRef.current = slot.id
    setSelected(slot)
    fileInputRef.current?.click()
  }

  const updatePortrait = (patch: Partial<Portrait>) => {
    if (!selected) return
    setPortraits(current => current[selected.id] ? { ...current, [selected.id]: { ...current[selected.id], ...patch } } : current)
  }

  const openBoard = () => {
    if (settings.mode === 'teams' && !parsedTeams) return
    if (parsedTeams && settings.mode === 'teams') setSettings(current => ({ ...current, teams: parsedTeams }))
    setError('')
    setSelected(null)
    setEditing(true)
  }

  const renderSlot = (id: string, label: string) => {
    const portrait = portraits[id]
    const slot = { id, label }
    const content = portrait ? (
      <>
        <img src={portrait.url} alt={portrait.name || label} draggable={false} style={{ objectPosition: `${portrait.x}% ${portrait.y}%`, transform: `translate(${(50 - portrait.x) * (portrait.zoom - 1)}%, ${(50 - portrait.y) * (portrait.zoom - 1)}%) scale(${portrait.zoom})` }} />
        {showNames && portrait.name && <span className="vs-advanced__caption"><span className="vs-advanced__caption-text">{portrait.name}</span></span>}
      </>
    ) : (
      <span className="vs-advanced__placeholder"><ImagePlus aria-hidden="true" /><span>{label}</span><small>{pl ? 'Kliknij lub upuść grafikę' : 'Click or drop an image'}</small></span>
    )
    const portraitButton = (
      <button
        type="button" key={id} data-slot-id={id}
        className={`vs-advanced__portrait ${usesVotedFrames ? 'vs-advanced__portrait--voted-frame' : ''} ${selected?.id === id && !presenting ? 'is-selected' : ''}`}
        aria-label={`${portrait ? (pl ? 'Edytuj' : 'Edit') : (pl ? 'Dodaj grafikę' : 'Add image')}: ${label}`}
        disabled={presenting}
        onClick={() => portrait ? setSelected(slot) : chooseImage(slot)}
        onDragOver={event => { if (!presenting) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy' } }}
        onDrop={event => {
          event.preventDefault()
          if (presenting) return
          const file = event.dataTransfer.files[0]
          if (file) { setSelected(slot); void loadImage(id, file) }
        }}
      >
        {usesVotedFrames ? (
          <>
            <span className="vs-advanced__frame-sparkles" data-gif-export-sparkles aria-hidden="true" />
            <div className="vs-advanced__portrait-inner">{content}</div>
          </>
        ) : content}
      </button>
    )
    return usesVotedFrames
      ? <div key={id} className="vs-advanced__portrait-shell"><VotedFrameDecoration />{portraitButton}</div>
      : portraitButton
  }

  const renderPanel = (panel: BattlePanel) => {
    const label = panelLabel(panel)
    const color = isGauntlet
      ? panel.role === 'boss'
        ? '#ffcf70'
        : panel.role === 'challenger'
          ? '#ff5f6d'
          : '#78b7ff'
      : TEAM_COLORS[panel.index % TEAM_COLORS.length]
    const singleFreeForAll = !isGauntlet && settings.teams.length > 2 && settings.teams.every(count => count === 1)
    return (
      <section
        key={panel.id} data-panel-id={panel.id} aria-label={label}
        className={`vs-advanced__panel vs-advanced__panel--${panel.role}`}
        style={{ '--team-color': color, '--member-columns': panel.slots.length > 1 ? 2 : 1 } as CSSProperties}
      >
        {!singleFreeForAll && <span className="vs-advanced__panel-label">{panel.role === 'boss' && <Trophy size={13} aria-hidden="true" />}<span className="vs-advanced__panel-label-text">{label}</span></span>}
        <div className={`vs-advanced__members ${!isGauntlet && panel.slots.length === 1 ? 'vs-advanced__members--single' : ''} ${isGauntlet ? `vs-advanced__members--${settings.pairSplit}` : ''}`}>
          {panel.slots.map((id, member) => renderSlot(id, `${label} · ${member + 1}`))}
        </div>
      </section>
    )
  }

  return (
    <section className={`vs-advanced ${presenting ? 'is-presenting' : ''}`} aria-label="Advanced">
      {!presenting && <StudioMenuButton language={language} onClick={onBack} />}
      {!editing ? (
        <div className="vs-advanced__setup">
          <div className="vs-advanced__setup-heading"><span className="vs-advanced__eyebrow">ADVANCED STUDIO</span><h1 ref={setupTitleRef} tabIndex={-1}>{pl ? 'Jakie starcie tworzymy?' : 'What is your next matchup?'}</h1><p>{pl ? 'Wybierz format. Potem dodaj grafiki i dopasuj ich kadry.' : 'Choose a format. Then add images and adjust their framing.'}</p></div>
          <fieldset className="vs-advanced__mode-options"><legend>{pl ? 'Rodzaj walki' : 'Battle type'}</legend>
            <button type="button" aria-pressed={!isGauntlet} onClick={() => setSettings(current => ({ ...current, mode: 'teams' }))}><Swords /><strong>X vs X</strong><span>{pl ? 'Drużyny lub każdy na każdego' : 'Teams or free-for-all'}</span></button>
            <button type="button" aria-pressed={isGauntlet} onClick={() => setSettings(current => ({ ...current, mode: 'gauntlet' }))}><Trophy /><strong>Gauntlet</strong><span>{pl ? 'Sześć etapów i finałowy boss' : 'Six rounds and the final boss'}</span></button>
          </fieldset>
          <div className="vs-advanced__setup-options">
            {isGauntlet ? (
              <>
                <fieldset className="vs-advanced__presets"><legend>{pl ? 'Liczba postaci' : 'Number of characters'}</legend>{([1, 2] as const).map(count => <button key={count} type="button" aria-pressed={settings.gauntletSize === count} onClick={() => setSettings(current => ({ ...current, gauntletSize: count }))}>{count} vs {count * 7}</button>)}</fieldset>
                {settings.gauntletSize === 2 && <label className="vs-advanced__field">{pl ? 'Podział paneli dla par' : 'Split paired panels'}<select aria-label={pl ? 'Podział paneli dla par' : 'Split paired panels'} value={settings.pairSplit} onChange={event => setSettings(current => ({ ...current, pairSplit: event.target.value === 'horizontal' ? 'horizontal' : 'vertical' }))}><option value="vertical">{pl ? 'Obok siebie (podział pionowy)' : 'Side by side (vertical split)'}</option><option value="horizontal">{pl ? 'Jedna nad drugą (jak w przykładzie)' : 'Stacked (like the reference)'}</option></select></label>}
                <p className="vs-advanced__setup-note">{pl ? 'Etapy 1–6 po lewej, główna postać lub para po prawej, BOSS pod nią. Odstępy odsłaniają kosmiczne tło.' : 'Rounds 1–6 on the left, the challenger or pair on the right, BOSS below. Gaps reveal the cosmic background.'}</p>
              </>
            ) : (
              <>
                <fieldset className="vs-advanced__presets"><legend>{pl ? 'Gotowe układy' : 'Layout presets'}</legend>{TEAM_PRESETS.map(preset => <button type="button" key={preset} aria-pressed={format === preset} onClick={() => setFormat(preset)}>{preset}</button>)}</fieldset>
                <label className="vs-advanced__field">{pl ? 'Własny układ' : 'Custom layout'}<input value={format} onChange={event => setFormat(event.target.value)} aria-invalid={!parsedTeams} aria-describedby="advanced-format-hint" spellCheck={false} /></label>
                <p id="advanced-format-hint" className={`vs-advanced__setup-note ${!parsedTeams ? 'is-error' : ''}`}>{pl ? 'Od 2 do 4 drużyn, po 1–8 postaci. Np. 1 vs 2, 3 vs 3 lub 1 vs 1 vs 1 vs 1.' : '2–4 teams, with 1–8 characters each. E.g. 1 vs 2, 3 vs 3 or 1 vs 1 vs 1 vs 1.'}</p>
              </>
            )}
          </div>
          <fieldset className="vs-advanced__label-editor">
            <legend>{pl ? 'Napisy na planszy' : 'Board labels'}</legend>
            <p>{pl ? 'Zostaw pole puste, aby użyć domyślnej nazwy.' : 'Leave a field empty to use its default label.'}</p>
            {isGauntlet ? (
              <div className="vs-advanced__label-grid">
                {Array.from({ length: 6 }, (_, index) => (
                  <label className="vs-advanced__field" key={`round-label-${index}`}><span>{defaultRoundLabel(index)}</span><input value={labelOverrides.rounds[index] ?? ''} placeholder={defaultRoundLabel(index)} onChange={event => updateRoundLabel(index, event.target.value)} /></label>
                ))}
                <label className="vs-advanced__field"><span>{pl ? 'Główna postać / drużyna' : 'Challenger'}</span><input value={labelOverrides.challenger} placeholder={defaultChallengerLabel} onChange={event => updateLabelOverride({ challenger: event.target.value })} /></label>
                <label className="vs-advanced__field"><span>{pl ? 'Boss' : 'Boss'}</span><input value={labelOverrides.boss} placeholder="BOSS" onChange={event => updateLabelOverride({ boss: event.target.value })} /></label>
              </div>
            ) : (
              <div className="vs-advanced__label-grid">
                {(parsedTeams ?? settings.teams).map((_, index) => (
                  <label className="vs-advanced__field" key={`team-label-${index}`}><span>{pl ? `Drużyna ${index + 1}` : `Team ${index + 1}`}</span><input value={labelOverrides.teams[index] ?? ''} placeholder={defaultTeamLabel(index)} onChange={event => updateTeamLabel(index, event.target.value)} /></label>
                ))}
              </div>
            )}
            <button type="button" className="vs-advanced__label-reset" onClick={() => setLabelOverrides(EMPTY_LABEL_OVERRIDES)}>{pl ? 'Przywróć domyślne napisy' : 'Restore default labels'}</button>
          </fieldset>
          <button type="button" className="vs-advanced__primary" disabled={!isGauntlet && !parsedTeams} onClick={openBoard}>{pl ? 'Otwórz planszę' : 'Open board'}<ArrowRight size={18} /></button>
        </div>
      ) : (
        <>
          {!presenting && <header className="vs-advanced__toolbar">
            <button type="button" onClick={() => { setSelected(null); setEditing(false) }}><ArrowLeft size={16} />{pl ? 'Układ' : 'Layout'}</button>
            <h1 ref={editorTitleRef} tabIndex={-1}>Advanced <span>{isGauntlet ? 'Gauntlet · ' : ''}{formatLabel}</span></h1>
            <label className="vs-advanced__gap-control">{pl ? 'Odstępy' : 'Gaps'}<input type="range" aria-label={pl ? 'Odstępy' : 'Gaps'} min="8" max="36" value={gap} onChange={event => setGap(Number(event.target.value))} /><output>{gap}</output></label>
            <label className="vs-advanced__names-control"><input type="checkbox" checked={showNames} onChange={event => setShowNames(event.target.checked)} />{pl ? 'Nazwy' : 'Names'}</label>
            <button type="button" onClick={() => { setSelected(null); setPresenting(true) }}><Eye size={17} />{pl ? 'Podgląd' : 'Preview'}</button>
            <GifExportButton targetRef={exportCanvasRef} filename={`versus-verse-${isGauntlet ? `gauntlet-${formatLabel}` : formatLabel}`} />
            <WebmExportButton targetRef={exportCanvasRef} filename={`versus-verse-${isGauntlet ? `gauntlet-${formatLabel}` : formatLabel}`} />
          </header>}
          {error && !presenting && <p className="vs-advanced__error" role="alert">{error}<button type="button" onClick={() => setError('')} aria-label={pl ? 'Zamknij komunikat' : 'Dismiss message'}><X size={15} /></button></p>}
          <div className={`vs-advanced__workspace ${selected && !presenting ? 'has-inspector' : ''}`}>
            <div className="vs-advanced__stage-wrap">
              <div ref={exportCanvasRef} data-gif-export-root="advanced" className={`vs-advanced__canvas ${isGauntlet ? 'vs-advanced__canvas--gauntlet' : isOneVsOne ? 'vs-advanced__canvas--duel-1v1' : settings.teams.length > 2 ? 'vs-advanced__canvas--multi' : ''}`} style={{ '--panel-gap': `${gap}px` } as CSSProperties} data-battle-format={formatLabel}>
                <div className="vs-advanced__cosmos vs-simple-editor-sparkly" aria-hidden="true" />
                <div data-gif-export-foreground="advanced" className={`vs-advanced__scene ${isGauntlet ? 'vs-advanced__scene--gauntlet' : `vs-advanced__scene--teams vs-advanced__scene--${settings.teams.length}-teams`}`}>
                  {panels.map(renderPanel)}
                  {!isGauntlet && (settings.teams.length === 2 ? <span className="vs-advanced__versus vs-advanced__versus--center vs-simple-editor-vs-text" aria-hidden="true">VS</span> : <>
                    <span className="vs-advanced__versus vs-advanced__versus--top vs-simple-editor-vs-text" aria-hidden="true">VS</span>
                    <span className="vs-advanced__versus vs-advanced__versus--left vs-simple-editor-vs-text" aria-hidden="true">VS</span>
                    <span className="vs-advanced__versus vs-advanced__versus--right vs-simple-editor-vs-text" aria-hidden="true">VS</span>
                    {settings.teams.length === 4 && <><span className="vs-advanced__versus vs-advanced__versus--bottom vs-simple-editor-vs-text" aria-hidden="true">VS</span><span className="vs-advanced__versus vs-advanced__versus--center vs-simple-editor-vs-text" aria-hidden="true">VS</span></>}
                  </>)}
                </div>
              </div>
            </div>
            {selected && !presenting && <aside className="vs-advanced__inspector" aria-label={pl ? 'Edycja grafiki' : 'Image editor'}>
              <div className="vs-advanced__inspector-heading"><Settings2 size={17} /><strong>{pl ? 'Grafika i kadr' : 'Image and framing'}</strong><button type="button" onClick={() => setSelected(null)} aria-label={pl ? 'Zamknij edycję grafiki' : 'Close image editor'}><X size={17} /></button></div>
              <p>{selected.label}</p>
              {isGauntlet && selectedPanel && <label className="vs-advanced__field">{selectedPanel.role === 'round' ? (pl ? 'Nazwa etapu' : 'Fight label') : (pl ? 'Nazwa panelu' : 'Panel label')}<input value={panelOverride(selectedPanel) || panelLabel(selectedPanel)} onChange={event => updatePanelLabel(selectedPanel, event.target.value)} /></label>}
              <button type="button" className="vs-advanced__upload" onClick={() => chooseImage(selected)}><Upload size={16} />{pl ? 'Wybierz grafikę' : 'Choose image'}</button>
              {selectedPortrait && <>
                <label className="vs-advanced__field">{pl ? 'Nazwa postaci' : 'Character name'}<input value={selectedPortrait.name} onChange={event => updatePortrait({ name: event.target.value })} /></label>
                <label className="vs-advanced__field">{pl ? 'Powiększenie' : 'Zoom'}<input type="range" min="1" max="3" step="0.05" value={selectedPortrait.zoom} onChange={event => updatePortrait({ zoom: Number(event.target.value) })} /></label>
                <label className="vs-advanced__field">{pl ? 'Pozycja pozioma' : 'Horizontal position'}<input type="range" min="0" max="100" value={selectedPortrait.x} onChange={event => updatePortrait({ x: Number(event.target.value) })} /></label>
                <label className="vs-advanced__field">{pl ? 'Pozycja pionowa' : 'Vertical position'}<input type="range" min="0" max="100" value={selectedPortrait.y} onChange={event => updatePortrait({ y: Number(event.target.value) })} /></label>
                <button type="button" onClick={() => updatePortrait({ zoom: 1, x: 50, y: 50 })}>{pl ? 'Wyśrodkuj kadr' : 'Reset framing'}</button>
              </>}
              <p className="vs-advanced__inspector-hint">{pl ? 'Grafikę możesz też przeciągnąć na dowolny panel. Zmiana układu zachowuje wczytane grafiki podczas pracy w Advanced.' : 'You can also drop an image onto any panel. Layout changes keep your images while you work in Advanced.'}</p>
            </aside>}
          </div>
          {presenting && <button type="button" className="vs-advanced__exit-preview" onClick={() => setPresenting(false)}><Settings2 size={16} />{pl ? 'Edytuj' : 'Edit'} <kbd>Esc</kbd></button>}
        </>
      )}
      <input type="file" accept="image/*" ref={fileInputRef} className="vs-advanced__file-input" aria-label={pl ? 'Plik grafiki' : 'Image file'} onChange={event => {
        const file = event.target.files?.[0]
        const id = uploadSlotRef.current
        if (file && id) void loadImage(id, file)
        event.target.value = ''
      }} />
    </section>
  )
}
