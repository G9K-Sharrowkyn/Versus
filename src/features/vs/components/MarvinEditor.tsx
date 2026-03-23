import { useState, useEffect, useRef } from 'react'
import { useMarvin } from '../hooks/useMarvin'

type SelectedElement = {
  el: HTMLElement
  id: string
  file: string
  type: 'const' | 'css'
}

export function MarvinEditor({ activeTemplateId }: { activeTemplateId: string }) {
  const isActive = useMarvin()
  const [hovered, setHovered] = useState<HTMLElement | null>(null)
  const [selected, setSelected] = useState<SelectedElement | null>(null)
  
  // Property States
  const [fontSize, setFontSize] = useState(20)
  const [blur, setBlur] = useState(0.2)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState('')

  const highlightRef = useRef<HTMLDivElement>(null)

  // Sync state with selected element
  useEffect(() => {
    if (!selected) return
    const style = window.getComputedStyle(selected.el)
    setFontSize(parseInt(style.fontSize) || 20)
    
    // Extract blur from text-shadow if possible
    const shadow = style.textShadow
    const match = shadow.match(/(\d+\.?\d*)px\s+rgba/i)
    if (match) setBlur(parseFloat(match[1]) / 10) // rough conversion
  }, [selected])

  // Global listeners
  useEffect(() => {
    if (!isActive) {
      setHovered(null)
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.dataset.marvinId) {
        setHovered(target)
      } else {
        setHovered(null)
      }
    }

    const handleClick = (e: MouseEvent) => {
      if (!isActive) return
      const target = e.target as HTMLElement
      if (target.dataset.marvinId) {
        e.preventDefault()
        e.stopPropagation()
        setSelected({
          el: target,
          id: target.dataset.marvinId,
          file: target.dataset.marvinFile || '',
          type: (target.dataset.marvinType as any) || 'const'
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick, true)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick, true)
    }
  }, [isActive])

  // Update Highlight Frame
  useEffect(() => {
    const target = selected?.el || hovered
    if (!target || !highlightRef.current) {
      if (highlightRef.current) highlightRef.current.style.display = 'none'
      return
    }

    const rect = target.getBoundingClientRect()
    highlightRef.current.style.display = 'block'
    highlightRef.current.style.top = `${rect.top}px`
    highlightRef.current.style.left = `${rect.left}px`
    highlightRef.current.style.width = `${rect.width}px`
    highlightRef.current.style.height = `${rect.height}px`
    highlightRef.current.style.borderColor = selected ? '#ff00ff' : '#00f2ff'
  }, [hovered, selected])

  const saveToSource = async (name: string, value: string) => {
    if (!selected) return
    setIsSaving(true)
    setStatus('Saving...')
    try {
      const res = await fetch('/api/marvin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: selected.file,
          name: name,
          value: value,
          type: selected.type
        })
      })
      const data = await res.json()
      if (data.ok) {
        setStatus('SAVED SUCCESSFULLY!')
        setTimeout(() => setStatus(''), 2000)
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setStatus('SAVE FAILED!')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isActive) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
      {/* Visual Highlight */}
      <div 
        ref={highlightRef}
        style={{ 
          position: 'absolute', 
          border: '2px solid #00f2ff', 
          boxShadow: '0 0 10px rgba(0, 242, 255, 0.5)',
          pointerEvents: 'none',
          transition: 'all 0.05s ease-out',
          zIndex: 10000
        }} 
      />

      {/* Status Bar */}
      <div style={{ 
        position: 'absolute', 
        bottom: 20, 
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.9)', 
        color: '#00f2ff', 
        padding: '10px 30px', 
        border: '2px solid #00f2ff',
        fontFamily: "'Chakra Petch', monospace",
        pointerEvents: 'auto',
        fontSize: '14px',
        letterSpacing: '0.1em'
      }}>
        MARVIN EDITOR ACTIVE | {status || (selected ? `EDITING: ${selected.id}` : 'SELECT ELEMENT')}
      </div>

      {/* Settings Panel */}
      {selected && (
        <div style={{
          position: 'absolute',
          top: '50%',
          right: 40,
          transform: 'translateY(-50%)',
          width: 320,
          background: 'rgba(10, 15, 30, 0.98)',
          border: '2px solid #ff00ff',
          padding: '25px',
          color: '#fff',
          fontFamily: "'Chakra Petch', sans-serif",
          pointerEvents: 'auto',
          boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h3 style={{ margin: 0, color: '#ff00ff', fontSize: '18px', borderBottom: '1px solid #ff00ff33', paddingBottom: '10px' }}>
            PROPERTY EDITOR
          </h3>
          
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Target: {selected.id}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Font Size */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Font Size</span>
                <span style={{ color: '#00f2ff' }}>{fontSize}px</span>
              </div>
              <input 
                type="range" min="10" max="300" value={fontSize}
                style={{ width: '100%', accentColor: '#00f2ff' }} 
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  setFontSize(val)
                  selected.el.style.fontSize = `${val}px`
                }} 
              />
            </div>
            
            {/* Reflection Blur */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Reflection Blur</span>
                <span style={{ color: '#00f2ff' }}>{blur.toFixed(2)}em</span>
              </div>
              <input 
                type="range" min="0" max="3" step="0.05" value={blur}
                style={{ width: '100%', accentColor: '#00f2ff' }}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  setBlur(val)
                  // Instant preview
                  const currentShadow = window.getComputedStyle(selected.el).textShadow
                  selected.el.style.textShadow = currentShadow.replace(/(\d+\.?\d*)px(?=\s+rgba)/i, `${val * 10}px`)
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              <button 
                onClick={() => setSelected(null)}
                style={{ padding: '12px', background: 'transparent', border: '1px solid #475569', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
              >
                CANCEL
              </button>
              
              <button 
                disabled={isSaving}
                onClick={async () => {
                  // If it's a constant, we need to format the whole shadow string
                  // This is a bit complex for a prototype, so we'll update the CONSTANT value
                  // For the sake of this demo, we'll update the REFLECTION variable
                  const newValue = `0 var(--tb-reflect-2-y) ${blur}em rgba(119, 226, 242, 0.8)`
                  await saveToSource(selected.id, newValue)
                }}
                style={{ padding: '12px', background: '#ff00ff', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >
                {isSaving ? 'WRITING...' : 'SAVE SOURCE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
