/**
 * Root-scoped overlay entry that renders the dino game as a resizable
 * full-height right-side split panel with a looping brainrot video below it.
 *
 * Layout: [ game (top) | drag handle | brainrot video (bottom) ]
 * The vertical split ratio is adjustable via a drag handle.
 *
 * Pause logic:
 * - Click outside the panel → game pauses immediately
 * - Model finishes (busy→false) → game pauses for 2 seconds
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { DinoGame } from './DinoGame.tsx'
import css from './DinoOverlay.module.css'

export type DinoOverlayProps = PropsRuntime<'shell.overlay'> & PropsLocale<'dino'>

const GAMES = [
  { id: 'dino', label: 'Chrome Dino', comingSoon: false },
  { id: 'flappy', label: 'Flappy Bird', comingSoon: true },
  { id: 'tiktok', label: 'TikTok', comingSoon: true },
] as const

const PANEL_DEFAULT = 520
const PANEL_MIN = 320
const PANEL_MAX = 800
/** Default split ratio: game gets 38% of the panel body, video gets 62%. */
const SPLIT_DEFAULT = 0.38
const SPLIT_MIN = 0.15
const SPLIT_MAX = 0.75
const POST_RESPONSE_PAUSE_MS = 2000

/** The looping brainrot video: Minecraft parkour brainrot, on loop. */
const BRAINROT_URL = 'https://www.youtube-nocookie.com/embed/u7kdVe8q5zs?autoplay=1&mute=1&loop=1&playlist=u7kdVe8q5zs&controls=0&modestbranding=1&playsinline=1&iv_load_policy=3&start=2'

export function DinoOverlay(props: DinoOverlayProps): ReactNode {
  const running = props.useSessions(s =>
    s.current === undefined ? false : s.byId[s.current]?.running ?? false,
  )

  const [panelOpen, setPanelOpen] = useState(true)
  const [focused, setFocused] = useState(true)
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT)
  const [selectedGame, setSelectedGame] = useState('dino')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [paused, setPaused] = useState(false)
  const [splitRatio, setSplitRatio] = useState(SPLIT_DEFAULT)
  const panelRef = useRef<HTMLDivElement | null>(null)

  // --- Adjust conversation column width ---
  useEffect(() => {
    const frame = panelRef.current?.closest('[style*="grid-template"]') as HTMLElement | null
    if (frame === null) return
    const allCols = Array.from(frame.children) as HTMLElement[]
    const centerCol = allCols.find(el =>
      el.querySelector?.('[data-conversation-scroll]') !== null,
    ) as HTMLElement | null
    if (centerCol === null) return
    if (panelOpen) {
      centerCol.style.marginRight = `${panelWidth}px`
      centerCol.style.transition = 'margin-right 0.15s ease'
    } else {
      centerCol.style.marginRight = ''
      centerCol.style.transition = 'margin-right 0.15s ease'
    }
    return () => { centerCol.style.marginRight = ''; centerCol.style.transition = '' }
  }, [panelOpen, panelWidth])

  // --- Focus management ---
  useEffect(() => {
    const onPointerDown = (ev: PointerEvent): void => {
      if (panelRef.current === null) return
      const inside = ev.target instanceof Node && panelRef.current.contains(ev.target)
      setFocused(inside)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => { document.removeEventListener('pointerdown', onPointerDown, true) }
  }, [])

  // --- Pause on unfocus ---
  useEffect(() => { if (!focused) setPaused(true) }, [focused])

  // --- Pause for 2 seconds after model response ---
  const forcePauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!running && panelOpen) {
      setPaused(true)
      if (forcePauseTimer.current !== null) clearTimeout(forcePauseTimer.current)
      forcePauseTimer.current = setTimeout(() => {
        forcePauseTimer.current = null
        setFocused((f) => { if (f) setPaused(false); return f })
      }, POST_RESPONSE_PAUSE_MS)
    }
    return () => { if (forcePauseTimer.current !== null) { clearTimeout(forcePauseTimer.current); forcePauseTimer.current = null } }
  }, [running, panelOpen])

  // --- Auto-open when model starts streaming ---
  useEffect(() => {
    if (running) { setPanelOpen(true); setFocused(true); setPaused(false) }
  }, [running])

  // --- Resume when focused ---
  useEffect(() => { if (focused && forcePauseTimer.current === null) setPaused(false) }, [focused])

  const onClose = useCallback(() => { setPanelOpen(false); setFocused(false) }, [])
  const onGameFocus = useCallback(() => { setFocused(true) }, [])

  // --- Panel width drag handle ---
  const panelDrag = useRef({ active: false, startX: 0, startWidth: 0 })
  const onPanelDragStart = useCallback((e: React.PointerEvent): void => {
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId)
    panelDrag.current = { active: true, startX: e.clientX, startWidth: panelWidth }
  }, [panelWidth])
  const onPanelDragMove = useCallback((e: React.PointerEvent): void => {
    if (!panelDrag.current.active) return
    const dx = panelDrag.current.startX - e.clientX
    setPanelWidth(Math.min(PANEL_MAX, Math.max(PANEL_MIN, panelDrag.current.startWidth + dx)))
  }, [])
  const onPanelDragEnd = useCallback((): void => { panelDrag.current.active = false }, [])

  // --- Split ratio drag handle ---
  const splitDrag = useRef({ active: false, startY: 0, startRatio: 0 })
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const onSplitDragStart = useCallback((e: React.PointerEvent): void => {
    e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId)
    splitDrag.current = { active: true, startY: e.clientY, startRatio: splitRatio }
  }, [splitRatio])
  const onSplitDragMove = useCallback((e: React.PointerEvent): void => {
    if (!splitDrag.current.active || bodyRef.current === null) return
    const bodyRect = bodyRef.current.getBoundingClientRect()
    const dy = e.clientY - splitDrag.current.startY
    const newRatio = splitDrag.current.startRatio + dy / bodyRect.height
    setSplitRatio(Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, newRatio)))
  }, [])
  const onSplitDragEnd = useCallback((): void => { splitDrag.current.active = false }, [])

  // --- Game selector ---
  const onDropdownToggle = useCallback(() => setDropdownOpen(o => !o), [])
  const onGameSelect = useCallback((id: string) => { setSelectedGame(id); setDropdownOpen(false) }, [])

  if (!panelOpen) return null

  const selectedLabel = GAMES.find(g => g.id === selectedGame)?.label ?? 'Chrome Dino'
  const gameHeight = `calc(${Math.round(splitRatio * 100)}% - 2px)`
  const videoHeight = `calc(${Math.round((1 - splitRatio) * 100)}% - 2px)`

  return (
    <div ref={panelRef} className={`${css.panel} ${focused ? css.panelFocused : ''}`} style={{ width: panelWidth }}>
      {/* Panel width drag handle */}
      <div className={css.dragHandle}
        onPointerDown={onPanelDragStart} onPointerMove={onPanelDragMove}
        onPointerUp={onPanelDragEnd} onPointerCancel={onPanelDragEnd}
      />

      <div className={css.panelHeader}>
        <div className={css.gameSelector}>
          <button type="button" className={css.selectorButton} onClick={onDropdownToggle}>
            🎮 {selectedLabel} <span className={css.selectorArrow}>▾</span>
          </button>
          {dropdownOpen && (
            <div className={css.dropdown}>
              {GAMES.map(g => (
                <button key={g.id} type="button"
                  className={`${css.dropdownItem} ${g.id === selectedGame ? css.dropdownItemActive : ''} ${g.comingSoon ? css.dropdownItemDisabled : ''}`}
                  onClick={() => { if (!g.comingSoon) onGameSelect(g.id) }}
                  disabled={g.comingSoon}
                >
                  {g.label}
                  {g.comingSoon && <span className={css.comingSoon}>{props.t('game.comingsoon')}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" className={css.closeButton} onClick={onClose} aria-label="Close game panel">×</button>
      </div>

      <div ref={bodyRef} className={css.splitBody}>
        {/* Top: game */}
        <div className={css.splitTop} style={{ height: gameHeight }}>
          {selectedGame === 'dino' ? (
            <DinoGame t={props.t} busy={running} focused={focused} paused={paused} onFocus={onGameFocus} />
          ) : (
            <div className={css.comingSoonPlaceholder}>
              <div className={css.comingSoonIcon}>🚧</div>
              <div className={css.comingSoonText}>{selectedLabel}</div>
              <div className={css.comingSoonSubtext}>{props.t('game.comingsoon')}</div>
            </div>
          )}
        </div>

        {/* Split drag handle */}
        <div className={css.splitHandle}
          onPointerDown={onSplitDragStart} onPointerMove={onSplitDragMove}
          onPointerUp={onSplitDragEnd} onPointerCancel={onSplitDragEnd}
        />

        {/* Bottom: looping brainrot video */}
        <div className={css.splitBottom} style={{ height: videoHeight }}>
          <iframe
            className={css.videoIframe}
            src={BRAINROT_URL}
            title="Brainrot"
            allow="autoplay; encrypted-media"
            tabIndex={-1}
          />
        </div>
      </div>

      {!focused && (
        <div className={css.clickHint}>Click game to play · Click left to type</div>
      )}
    </div>
  )
}
