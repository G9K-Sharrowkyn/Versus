import { ArrowRight, Clapperboard, Images, LayoutGrid, Plus, Swords, UserRound, Workflow } from 'lucide-react'
import type { Language } from '../types'
import './StartScreen.css'

type StartScreenProps = {
  language: Language
  onToggleLanguage: () => void
  onOpenIntro: () => void
  onOpenFights: () => void
  onOpenSimple: () => void
  onOpenAdvanced: () => void
}

export function StudioMenuButton({ language, onClick }: { language: Language; onClick: () => void }) {
  return (
    <button type="button" className="vs-studio-menu" onClick={onClick}>
      <LayoutGrid size={16} aria-hidden="true" />
      {language === 'pl' ? 'Menu główne' : 'Main menu'}
    </button>
  )
}

export function StartScreen({ language, onToggleLanguage, onOpenIntro, onOpenFights, onOpenSimple, onOpenAdvanced }: StartScreenProps) {
  const pl = language === 'pl'
  const cards = [
    {
      id: 'intro', number: '01', Icon: Clapperboard,
      category: pl ? 'Wejściówka' : 'Opening sequence',
      title: 'Darkseid is.',
      description: pl ? 'Oryginalna animacja otwierająca i przejście do wyszukiwarki walk.' : 'The original opening animation and the gateway to fight search.',
      action: pl ? 'Pokaż intro' : 'Show intro',
      detail: pl ? 'Naciśnij spację po wejściu' : 'Press space after entering',
      onClick: onOpenIntro,
    },
    {
      id: 'fights', number: '02', Icon: Swords,
      category: pl ? 'Studio walk' : 'Fight studio',
      title: pl ? 'Dodawanie walk' : 'Add fights',
      description: pl ? 'Twórz nowe starcia, wybieraj szablony i zarządzaj biblioteką walk.' : 'Create matchups, choose templates and manage your fight library.',
      action: pl ? 'Otwórz studio' : 'Open studio',
      detail: pl ? 'Walki · Szablony · Biblioteka' : 'Fights · Templates · Library',
      onClick: onOpenFights,
    },
    {
      id: 'simple', number: '03', Icon: Images,
      category: pl ? 'Szybkie zestawienie' : 'Quick matchup',
      title: 'Simple',
      description: pl ? 'Dwie postacie, Twoje grafiki i kolorowe, animowane tło. Gotowe do zestawienia.' : 'Two characters, your images and a colorful animated background. Ready to face off.',
      action: pl ? 'Otwórz Simple' : 'Open Simple',
      detail: pl ? 'Grafiki · Animowane tło' : 'Images · Animated background',
      onClick: onOpenSimple,
    },
    {
      id: 'advanced', number: '04', Icon: Workflow,
      category: pl ? 'Więcej możliwości' : 'More possibilities',
      title: 'Advanced',
      description: pl ? 'Walki drużynowe, każdy na każdego i gauntlety. Ułóż własne starcie.' : 'Team battles, free-for-all matchups and gauntlets. Build your own showdown.',
      action: pl ? 'Otwórz Advanced' : 'Open Advanced',
      detail: pl ? 'Drużyny · Gauntlet · Własny układ' : 'Teams · Gauntlet · Custom layout',
      onClick: onOpenAdvanced,
    },
  ]

  return (
    <main className="vs-launcher">
      <div className="vs-launcher__shell">
        <header className="vs-launcher__header">
          <div className="vs-launcher__brand"><span className="vs-launcher__mark">V<span>V</span>V</span><span>VERSUS VERSE VAULT</span></div>
          <button type="button" className="vs-launcher__language" onClick={onToggleLanguage} aria-label={pl ? 'Switch to English' : 'Przełącz na polski'}>
            <span className={pl ? 'is-active' : ''}>PL</span><span aria-hidden="true">/</span><span className={!pl ? 'is-active' : ''}>EN</span>
          </button>
        </header>

        <section className="vs-launcher__content" aria-labelledby="vs-launcher-title">
          <div className="vs-launcher__heading">
            <p className="vs-launcher__eyebrow"><span />{pl ? 'Twoja przestrzeń tworzenia' : 'Your creative space'}</p>
            <h1 id="vs-launcher-title">{pl ? 'Od czego zaczynamy?' : 'Where do we begin?'}</h1>
            <p>{pl ? 'Wybierz widok i wejdź do swojego uniwersum.' : 'Choose a view and step into your universe.'}</p>
          </div>

          <div className="vs-launcher__grid">
            {cards.map(({ id, number, Icon, category, title, description, action, detail, onClick }) => (
              <button type="button" key={id} className={`vs-launcher__card vs-launcher__card--${id}`} onClick={onClick} aria-labelledby={`vs-launcher-${id}-title`} aria-describedby={`vs-launcher-${id}-description`}>
                <div className="vs-launcher__preview" aria-hidden="true">
                  <span className="vs-launcher__number">{number}</span>
                  {id === 'intro' ? (
                    <div className="vs-launcher__darkseid"><span>DARKSEID IS.</span><strong>DARKSEID IS.</strong><span>DARKSEID IS.</span></div>
                  ) : id === 'fights' ? (
                    <div className="vs-launcher__fight-preview"><div><UserRound /><i /><i /></div><span>VS</span><div><UserRound /><i /><i /></div><b><Plus size={16} /></b></div>
                  ) : id === 'advanced' ? (
                    <div className="vs-launcher__advanced-preview"><div>{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</div><div><UserRound /><b>BOSS</b></div></div>
                  ) : (
                    <div className="vs-launcher__simple-preview"><div><UserRound /></div><span>VS</span><div><UserRound /></div></div>
                  )}
                  <span className="vs-launcher__preview-label"><Icon size={14} />{category}</span>
                </div>
                <div className="vs-launcher__card-body">
                  <h2 id={`vs-launcher-${id}-title`}>{title}</h2>
                  <p id={`vs-launcher-${id}-description`}>{description}</p>
                  <span className="vs-launcher__detail">{detail}</span>
                  <span className="vs-launcher__action">{action}<ArrowRight size={19} aria-hidden="true" /></span>
                </div>
              </button>
            ))}
          </div>
        </section>
        <footer className="vs-launcher__footer"><span>VERSUS VERSE VAULT</span><span>{pl ? 'Każde starcie zaczyna się tutaj.' : 'Every matchup starts here.'}</span></footer>
      </div>
    </main>
  )
}