/**
 * Full Chrome-dino-style endless runner rendered on a canvas. Supports jump,
 * duck, cacti, birds, running animation, and focus-based keyboard capture.
 *
 * Keyboard is only captured when `focused` prop is true AND `paused` is false.
 * When `focused` is false, the game does not capture any keyboard events,
 * allowing the chat input to receive key presses normally.
 *
 * When `paused` is true, the game loop still runs (keeps rendering the
 * current frame) but physics are frozen and input is ignored.
 *
 * Physics use altitude convention: y is positive upward from ground (y=0).
 */
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import css from './DinoGame.module.css'

/** Uniform scale factor for all pixel constants. */
const S = 1.35
const r = (px: number): number => Math.round(px * S)

/** Logical canvas size. */
const VIEW_W = r(400)
const VIEW_H = r(120)
/** Ground baseline y. */
const GROUND_Y = r(100)
/** Dino body box. */
const DINO_X = r(30)
const DINO_W = r(24)
const DINO_H = r(26)
const DUCK_H = r(16)
/** Obstacle geometry — smaller for a more forgiving game. */
const CACTUS_W = r(10)
const CACTUS_H: readonly [number, number, number] = [r(14), r(20), r(28)]
const BIRD_W = r(18)
const BIRD_H = r(10)
/** Physics — higher jump, lower gravity for more airtime. */
const GRAVITY = 1300
const JUMP_V = 620
const START_SPEED = 180
const MAX_SPEED = 580
const ACCEL = 4
const POINT_STEP = 28
const BEST_KEY = 'dsh.dino.best'

interface Obstacle { x: number; h: number; type: 'cactus' | 'bird'; birdY?: number }
type Overlay = 'idle' | 'running' | 'over' | 'done'
interface Player { start(): void; jump(): void; duck(active: boolean): void }

function readBest(): number {
  try {
    const raw = localStorage.getItem(BEST_KEY)
    const n = raw === null ? NaN : Number(raw)
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch { return 0 }
}
function persistBest(score: number): void {
  try { localStorage.setItem(BEST_KEY, String(score)) } catch { /* ignore */ }
}

/**
 * Full Chrome-dino game surface.
 */
export function DinoGame({
  t, busy, focused, paused, onFocus,
}: PropsLocale<'dino'> & {
  busy: boolean; focused: boolean; paused: boolean; onFocus: () => void
}): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const playerRef = useRef<Player | null>(null)
  const bestRef = useRef(readBest())
  const [overlay, setOverlay] = useState<Overlay>('idle')
  const [score, setScore] = useState(0)

  const focusedRef = useRef(focused); focusedRef.current = focused
  const pausedRef = useRef(paused); pausedRef.current = paused
  const prevBusy = useRef(busy)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const ctx = canvas.getContext('2d')
    if (ctx === null) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = VIEW_W * dpr; canvas.height = VIEW_H * dpr; ctx.scale(dpr, dpr)

    let raf = 0, last = performance.now()
    let speed = START_SPEED, vy = 0, y = 0
    let obstacles: Obstacle[] = [], spawnT = 1.2, birdSpawnT = 3.0
    let dist = 0, score = 0, started = false, over = false, ducking = false
    const groundY = GROUND_Y

    const rect = (x: number, yy: number, w: number, h: number, fill: string): void => {
      ctx.fillStyle = fill; ctx.fillRect(x, yy, w, h)
    }

    const drawScene = (): void => {
      ctx.clearRect(0, 0, VIEW_W, VIEW_H)
      ctx.fillStyle = '#f8f8f8'; ctx.fillRect(0, 0, VIEW_W, groundY)
      ctx.fillStyle = '#535353'; ctx.fillRect(0, groundY + 2, VIEW_W, 2)
      ctx.fillStyle = '#d0d0d0'
      for (let i = 0; i < VIEW_W; i += r(16)) ctx.fillRect(i, groundY - 1, r(8), 1)

      const bottom = groundY - y
      if (ducking) {
        rect(DINO_X, bottom - DUCK_H, DINO_W + r(8), DUCK_H, '#2f2f2f')
        rect(DINO_X + DINO_W + r(4), bottom - DUCK_H - r(4), r(6), r(6), '#2f2f2f')
      } else {
        rect(DINO_X, bottom - DINO_H, DINO_W, DINO_H, '#2f2f2f')
        rect(DINO_X + DINO_W - r(3), bottom - DINO_H - r(6), r(5), r(8), '#2f2f2f')
        rect(DINO_X + DINO_W - r(1), bottom - DINO_H - r(4), r(3), r(3), '#fff')
        const frame = Math.floor((dist / 80) % 2)
        if (frame === 0) {
          rect(DINO_X + r(2), bottom, r(4), r(6), '#2f2f2f')
          rect(DINO_X + r(16), bottom, r(4), r(6), '#2f2f2f')
        } else {
          rect(DINO_X + r(6), bottom, r(4), r(6), '#2f2f2f')
          rect(DINO_X + r(12), bottom, r(4), r(6), '#2f2f2f')
        }
      }

      for (const o of obstacles) {
        if (o.type === 'cactus') {
          const top = groundY - o.h
          rect(o.x, top, CACTUS_W, o.h, '#2f8f3f')
          rect(o.x - r(4), top + r(4), r(4), o.h - r(8), '#2f8f3f')
          rect(o.x + CACTUS_W, top + r(6), r(4), o.h - r(10), '#2f8f3f')
        } else if (o.type === 'bird' && o.birdY !== undefined) {
          const by = groundY - o.birdY
          const wingUp = Math.floor((dist / 120) % 2) === 0
          rect(o.x, by, BIRD_W, BIRD_H, '#2f2f2f')
          rect(o.x + r(2), wingUp ? by - r(6) : by + BIRD_H, BIRD_W - r(4), r(6), '#2f2f2f')
        }
      }

      if (pausedRef.current && started && !over) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H)
      }
    }

    const start = (): void => {
      speed = START_SPEED; vy = 0; y = 0; obstacles = []; spawnT = 1.2
      birdSpawnT = 3.0; dist = 0; score = 0; over = false; started = true; ducking = false
      setOverlay('running'); setScore(0)
    }
    const jump = (): void => {
      if (over || pausedRef.current) return
      if (Math.abs(y) < 0.01) { vy = JUMP_V; ducking = false }
    }
    const duck = (active: boolean): void => {
      if (over || pausedRef.current) return
      if (Math.abs(y) < 0.01) ducking = active; else ducking = false
    }
    const endRound = (): void => {
      over = true; started = false
      if (score > bestRef.current) { bestRef.current = score; persistBest(score) }
      setOverlay('over')
    }
    const spawnCactus = (): void => {
      const pick = CACTUS_H[Math.floor(Math.random() * CACTUS_H.length)]
      obstacles.push({ x: VIEW_W + r(10), h: pick ?? CACTUS_H[0], type: 'cactus' })
    }
    const spawnBird = (): void => {
      obstacles.push({ x: VIEW_W + r(10), h: BIRD_H, type: 'bird', birdY: Math.floor(Math.random() * 2) === 0 ? r(28) : r(50) })
    }

    const loop = (now: number): void => {
      const dt = Math.min((now - last) / 1000, 0.033); last = now
      if (!over) {
        if (started && !pausedRef.current) {
          speed = Math.min(MAX_SPEED, speed + ACCEL * dt); dist += speed * dt
          y += vy * dt
          if (y <= 0) { y = 0; vy = 0 } else { vy -= GRAVITY * dt }
          spawnT -= dt; birdSpawnT -= dt
          if (spawnT <= 0) { spawnT = Math.max(1.8, 3.5 - speed / 500); spawnCactus() }
          if (birdSpawnT <= 0) { birdSpawnT = Math.max(2.5, 4.0 - speed / 600); spawnBird() }
          obstacles = obstacles.map(o => ({ ...o, x: o.x - speed * dt })).filter(o => o.x + (o.type === 'bird' ? BIRD_W : CACTUS_W) > -r(10))
          const fresh = Math.floor(dist / POINT_STEP)
          if (fresh > score) { score = fresh; setScore(score) }
        }
        if (started) {
          const db = groundY - y, dh = ducking ? DUCK_H : DINO_H
          const dt2 = db - dh, dl = DINO_X, dr = DINO_W + DINO_X + (ducking ? r(8) : 0)
          for (const o of obstacles) {
            if (o.type === 'cactus') {
              if (dr - r(4) > o.x && dl + r(4) < o.x + CACTUS_W && db >= groundY - o.h) { endRound(); break }
            } else if (o.type === 'bird' && o.birdY !== undefined) {
              const bt = groundY - o.birdY - BIRD_H, bb = groundY - o.birdY
              if (dr - r(4) > o.x && dl + r(4) < o.x + BIRD_W && db >= bt && dt2 <= bb) { endRound(); break }
            }
          }
        }
        drawScene()
      } else { drawScene() }
      raf = requestAnimationFrame(loop)
    }

    const onKey = (ev: KeyboardEvent): void => {
      if (!focusedRef.current || pausedRef.current) return
      if (ev.code === 'Space' || ev.code === 'ArrowUp') {
        ev.preventDefault(); ev.stopPropagation()
        if (over) { start(); return }
        if (!started) { started = true; setOverlay('running') }
        jump()
      } else if (ev.code === 'ArrowDown') {
        ev.preventDefault(); ev.stopPropagation()
        if (over) { start(); return }
        if (!started) { started = true; setOverlay('running') }
        duck(true)
      } else if (ev.code === 'KeyR') { start() }
    }
    const onKeyUp = (ev: KeyboardEvent): void => {
      if (!focusedRef.current || pausedRef.current) return
      if (ev.code === 'ArrowDown') duck(false)
    }

    const player: Player = { start, jump, duck }; playerRef.current = player
    window.addEventListener('keydown', onKey, { capture: true })
    window.addEventListener('keyup', onKeyUp, { capture: true })
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey, { capture: true })
      window.removeEventListener('keyup', onKeyUp, { capture: true })
      playerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!busy && prevBusy.current) setOverlay(c => c === 'over' ? c : 'done')
    prevBusy.current = busy
  }, [busy])

  const onClick = (): void => {
    onFocus()
    if (paused) return
    const p = playerRef.current; if (p === null) return
    if (overlay === 'over') { p.start(); return }
    if (overlay === 'idle' || overlay === 'done') setOverlay('running')
    p.jump()
  }

  const hint = paused ? t('game.paused')
    : overlay === 'done' ? t('game.restart')
      : overlay === 'idle' ? t('game.play')
        : overlay === 'over' ? t('game.restart')
          : `${t('game.jump')} · ${t('game.duck')}`

  return (
    <div className={`${css.game} ${focused ? css.gameFocused : ''}`} data-overlay={overlay} onClick={onClick}>
      <div className={css.header}>
        <span className={css.title}>{t('game.title')}</span>
        <span className={css.score}>{t('game.score')} {score} · {t('game.best')} {bestRef.current}</span>
      </div>
      <canvas ref={canvasRef} className={css.canvas} style={{ width: VIEW_W, height: VIEW_H }} role="img" aria-label={t('game.title')} />
      {overlay === 'done' && <div className={css.done}>{t('game.subtitle')}</div>}
      <div className={css.hint}>{hint}</div>
      {focused && <div className={css.focusIndicator} />}
    </div>
  )
}
