import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, ArrowRight, Eye, ImagePlus, Settings2, Swords, Trophy, Upload, X } from 'lucide-react'
import type { Language } from '../../types'
import { StudioMenuButton } from '../StartScreen'
import { GifExportButton } from '../GifExportButton'
import { WebmExportButton } from '../WebmExportButton'
import { buildBattlePanels, parseTeamFormat, TEAM_PRESETS, type BattlePanel, type BattleSettings } from './advancedLayout'
import './AdvancedEditor.css'

type Portrait = { url: string; name: string; zoom: number; x: number; y: number }
type SlotDescription = { id: string; label: string }
const TEAM_COLORS = ['#78e5ed', '#ff87b6', '#b3a0ff', '#ffd27a']
const INITIAL_SETTINGS: BattleSettings = { mode: 'teams', teams: [2, 2], gauntletSize: 1, pairSplit: 'vertical' }

export function AdvancedEditor({ language, onBack }: { language: Language; onBack: () => void }) {
  const pl = language === 'pl'
  const [settings, setSettings] = useState<BattleSettings>(INITIAL_SETTINGS)
  const [format, setFormat] = useState('2 vs 2')
  const [editing, setEditing] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const [gap, setGap] = useState(18)
  const [showNames, setShowNames] = useState(true)
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
  const isGauntlet = settings.mode === 'gauntlet'
  const formatLabel = isGauntlet ? `${settings.gauntletSize} vs ${settings.gauntletSize * 7}` : settings.teams.join(' vs ')

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
    if (panel.role === 'boss') return 'BOSS'
    if (panel.role === 'challenger') return pl ? (settings.gauntletSize === 1 ? 'GŁÓWNA POSTAĆ' : 'GŁÓWNA DRUŻYNA') : (settings.gauntletSize === 1 ? 'CHALLENGER' : 'CHALLENGERS')
    if (panel.role === 'round') return `${pl ? 'ETAP' : 'ROUND'} ${panel.index + 1}`
    return `${pl ? 'DRUŻYNA' : 'TEAM'} ${panel.index + 1}`
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
    return (
      <button
        type="button" key={id} data-slot-id={id}
        className={`vs-advanced__portrait ${selected?.id === id && !presenting ? 'is-selected' : ''}`}
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
        {portrait ? (
          <>
            <img src={portrait.url} alt={portrait.name || label} draggable={false} style={{ objectPosition: `${portrait.x}% ${portrait.y}%`, transform: `translate(${(50 - portrait.x) * (portrait.zoom - 1)}%, ${(50 - portrait.y) * (portrait.zoom - 1)}%) scale(${portrait.zoom})` }} />
            {showNames && portrait.name && <span className="vs-advanced__caption">{portrait.name}</span>}
          </>
        ) : (
          <span className="vs-advanced__placeholder"><ImagePlus aria-hidden="true" /><span>{label}</span><small>{pl ? 'Kliknij lub upuść grafikę' : 'Click or drop an image'}</small></span>
        )}
      </button>
    )
  }

  const renderPanel = (panel: BattlePanel) => {
    const label = panelLabel(panel)
    const color = panel.role === 'boss' ? '#ffcf70' : panel.role === 'challenger' ? '#d3a0ff' : TEAM_COLORS[panel.index % TEAM_COLORS.length]
    const singleFreeForAll = !isGauntlet && settings.teams.every(count => count === 1)
    return (
      <section
        key={panel.id} data-panel-id={panel.id} aria-label={label}
        className={`vs-advanced__panel vs-advanced__panel--${panel.role} ${isGauntlet ? 'vs-simple-editor-frame' : ''}`}
        style={{ '--team-color': color, '--member-columns': panel.slots.length > 1 ? 2 : 1 } as CSSProperties}
      >
        {!singleFreeForAll && <span className="vs-advanced__panel-label">{panel.role === 'boss' && <Trophy size={13} aria-hidden="true" />}{label}</span>}
        <div className={`vs-advanced__members ${isGauntlet ? `vs-advanced__members--${settings.pairSplit}` : ''}`}>
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
              <div ref={exportCanvasRef} data-gif-export-root="advanced" className={`vs-advanced__canvas ${isGauntlet ? 'vs-advanced__canvas--gauntlet' : settings.teams.length > 2 ? 'vs-advanced__canvas--multi' : ''}`} style={{ '--panel-gap': `${gap}px` } as CSSProperties} data-battle-format={formatLabel}>
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
