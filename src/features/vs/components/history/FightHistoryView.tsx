import React, { useRef, useState, useEffect } from 'react'
import type { FightRecord, PortraitAdjust } from '../../../types'
import { AdjustableTemplateImage } from '../AdjustableTemplateImage'
import './FightHistoryView.css'

type FightHistoryViewProps = {
  fights: FightRecord[]
  onSelectFight: (fight: FightRecord) => void
  onUpdatePortraitAdjust: (adjustKey: string, adjust: PortraitAdjust) => void
  portraitAdjustments: Record<string, PortraitAdjust>
}

function HistoryPortrait({ 
  folder, 
  file, 
  alt, 
  adjustKey, 
  adjustments, 
  onAdjustChange, 
  onActivate 
}: { 
  folder: string; 
  file: string; 
  alt: string; 
  adjustKey: string; 
  adjustments: Record<string, PortraitAdjust>; 
  onAdjustChange: (key: string, adj: PortraitAdjust) => void; 
  onActivate: () => void; 
}) {
  const [currentFile, setCurrentFile] = useState(file)
  
  const getUrl = (f: string) => 
    `/api/fights/image?key=${encodeURIComponent(folder)}&file=${encodeURIComponent(f)}`

  return (
    <AdjustableTemplateImage
      imageUrl={getUrl(currentFile)}
      alt={alt}
      fallbackLabel="NO IMAGE"
      adjustKey={adjustKey}
      adjustments={adjustments}
      onAdjustChange={onAdjustChange}
      onAdjustCommit={onAdjustChange}
      onActivate={onActivate}
      plain
      onError={() => {
        if (currentFile === '1.png') setCurrentFile('1.jpg')
        else if (currentFile === '2.png') setCurrentFile('2.jpg')
      }}
    />
  )
}

export function FightHistoryView({ fights, onSelectFight, onUpdatePortraitAdjust, portraitAdjustments }: FightHistoryViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleWheel = (e: React.WheelEvent) => {
    if (containerRef.current) {
      containerRef.current.scrollTop += e.deltaY
    }
  }

  return (
    <section className="vs-history-view">
      <div 
        className="vs-history-scroll-container" 
        ref={containerRef}
        onWheel={handleWheel}
      >
        <div className="vs-history-title-panel">
          <h2 className="vs-history-title">Fight History</h2>
        </div>

        <div className="vs-history-grid">
          {fights.map((fight, index) => {
            const fighterAName = fight.fighterAName || 'Fighter A'
            const fighterBName = fight.fighterBName || 'Fighter B'
            const folderKey = fight.folderKey || ''

            const adjustKeyA = `history:${fight.id}:a`
            const adjustKeyB = `history:${fight.id}:b`

            return (
              <div 
                key={fight.id || index} 
                className="vs-history-fight-group"
              >
                <div className="history-card history-card--a">
                  <div className="history-card-media">
                    <HistoryPortrait
                      folder={folderKey}
                      file="1.png"
                      alt={fighterAName}
                      adjustKey={adjustKeyA}
                      adjustments={portraitAdjustments}
                      onAdjustChange={onUpdatePortraitAdjust}
                      onActivate={() => onSelectFight(fight)}
                    />
                  </div>
                  <div className="history-card-header">
                    <span className="history-card-id">ID-{(index * 2 + 1).toString().padStart(4, '0')}</span>
                    <div className="history-card-dot" />
                  </div>
                  <div className="history-card-footer">
                    <span>{fighterAName}</span>
                  </div>
                </div>
                
                <div className="history-card history-card--b">
                  <div className="history-card-media">
                    <HistoryPortrait
                      folder={folderKey}
                      file="2.png"
                      alt={fighterBName}
                      adjustKey={adjustKeyB}
                      adjustments={portraitAdjustments}
                      onAdjustChange={onUpdatePortraitAdjust}
                      onActivate={() => onSelectFight(fight)}
                    />
                  </div>
                  <div className="history-card-header">
                    <span className="history-card-id">ID-{(index * 2 + 2).toString().padStart(4, '0')}</span>
                    <div className="history-card-dot" />
                  </div>
                  <div className="history-card-footer">
                    <span>{fighterBName}</span>
                  </div>
                </div>
                <div className="vs-history-fight-label">{fighterAName} vs {fighterBName}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
