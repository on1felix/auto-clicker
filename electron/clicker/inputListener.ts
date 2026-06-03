import { uIOhook, UiohookKey } from 'uiohook-napi'
import type { BindKey } from '../shared/types'

type Handler = () => void
type CaptureHandler = (bind: BindKey) => void

const KEY_CODE_TO_LABEL: Record<number, string> = Object.entries(UiohookKey).reduce(
  (acc, [label, code]) => {
    if (typeof code === 'number') acc[code] = label
    return acc
  },
  {} as Record<number, string>
)

function mouseButtonName(button: number): BindKey['kind'] extends 'mouse' ? 'left' | 'right' | 'middle' | 'side1' | 'side2' : never {
  switch (button) {
    case 1:
      return 'left' as any
    case 2:
      return 'right' as any
    case 3:
      return 'middle' as any
    case 4:
      return 'side1' as any
    case 5:
      return 'side2' as any
    default:
      return 'left' as any
  }
}

function eventToBind(e: { keycode?: number; button?: number }): BindKey | null {
  if (e.keycode !== undefined) {
    const label = KEY_CODE_TO_LABEL[e.keycode] ?? `Key#${e.keycode}`
    return { kind: 'keyboard', code: label, label }
  }
  if (e.button !== undefined) {
    return { kind: 'mouse', button: mouseButtonName(e.button) }
  }
  return null
}

function bindMatchesKey(bind: BindKey, e: { keycode?: number; button?: number }): boolean {
  if (bind.kind === 'keyboard' && e.keycode !== undefined) {
    const code = (UiohookKey as Record<string, number>)[bind.code]
    return code === e.keycode
  }
  if (bind.kind === 'mouse' && e.button !== undefined) {
    return mouseButtonName(e.button) === bind.button
  }
  return false
}

class InputListener {
  private started = false
  private startBind: BindKey | null = null
  private holdBind: BindKey | null = null
  private mode: 'toggle' | 'hold' = 'toggle'

  private onToggle: Handler | null = null
  private onHoldStart: Handler | null = null
  private onHoldEnd: Handler | null = null
  private onPanic: Handler | null = null
  private captureCb: CaptureHandler | null = null

  private startBindDown = false
  private holdBindDown = false

  // FIFO timestamp queues of mouse events expected from our own synthetic clicks
  // (per button). Engine pushes a timestamp before sending a click; listener
  // pops the oldest entry when a matching event arrives. Entries older than
  // SYNTHETIC_TTL_MS are auto-pruned so a missed event doesn't permanently
  // block real release detection.
  private syntheticDownQ: Record<string, number[]> = {}
  private syntheticUpQ: Record<string, number[]> = {}
  private static readonly SYNTHETIC_TTL_MS = 1500

  markSyntheticMouse(button: 'left' | 'right' | 'middle') {
    const now = Date.now()
    ;(this.syntheticDownQ[button] ??= []).push(now)
    ;(this.syntheticUpQ[button] ??= []).push(now)
  }

  resetSynthetic() {
    this.syntheticDownQ = {}
    this.syntheticUpQ = {}
  }

  private prune(queue: number[], now: number) {
    while (queue.length && now - queue[0] > InputListener.SYNTHETIC_TTL_MS) queue.shift()
  }

  private consumeSynthetic(
    map: Record<string, number[]>,
    e: { button?: number }
  ): boolean {
    if (e.button === undefined) return false
    const name = mouseButtonName(e.button)
    const q = map[name]
    if (!q) return false
    const now = Date.now()
    this.prune(q, now)
    if (q.length === 0) return false
    q.shift()
    return true
  }

  start() {
    if (this.started) return
    this.started = true
    uIOhook.on('keydown', (e) => this.handleDown(e))
    uIOhook.on('keyup', (e) => this.handleUp(e))
    uIOhook.on('mousedown', (e) => this.handleDown(e))
    uIOhook.on('mouseup', (e) => this.handleUp(e))
    try {
      uIOhook.start()
    } catch (err) {
      console.error('[inputListener] uIOhook.start failed:', err)
    }
  }

  stop() {
    if (!this.started) return
    try {
      uIOhook.stop()
    } catch {
      // noop
    }
    this.started = false
  }

  configure(opts: {
    mode: 'toggle' | 'hold'
    startBind: BindKey
    holdBind: BindKey | null
  }) {
    this.mode = opts.mode
    this.startBind = opts.startBind
    this.holdBind = opts.holdBind
    this.startBindDown = false
    this.holdBindDown = false
    this.resetSynthetic()
  }

  setCallbacks(cb: {
    onToggle: Handler
    onHoldStart: Handler
    onHoldEnd: Handler
    onPanic: Handler
  }) {
    this.onToggle = cb.onToggle
    this.onHoldStart = cb.onHoldStart
    this.onHoldEnd = cb.onHoldEnd
    this.onPanic = cb.onPanic
  }

  captureNext(cb: CaptureHandler) {
    this.captureCb = cb
  }

  cancelCapture() {
    this.captureCb = null
  }

  private handleDown(e: { keycode?: number; button?: number }) {
    if (this.captureCb) {
      const bind = eventToBind(e)
      if (bind) {
        const cb = this.captureCb
        this.captureCb = null
        cb(bind)
      }
      return
    }

    // Panic stop: ESC always halts the engine, regardless of bind config.
    // This is the user's safety hatch if a runaway click loop blocks normal UI.
    if (e.keycode === UiohookKey.Escape) {
      this.onPanic?.()
      // fall through so other handlers still see ESC if needed; no toggle/hold
      // bind should ever be ESC, but if it is, it'll only stop, never start.
      return
    }

    // Swallow our own synthetic clicks before bind matching.
    if (this.consumeSynthetic(this.syntheticDownQ, e)) return

    const effectiveHoldBind = this.holdBind

    if (this.mode === 'toggle') {
      if (this.startBind && bindMatchesKey(this.startBind, e) && !this.startBindDown) {
        this.startBindDown = true
        this.onToggle?.()
      }
    } else {
      if (effectiveHoldBind && bindMatchesKey(effectiveHoldBind, e) && !this.holdBindDown) {
        this.holdBindDown = true
        this.onHoldStart?.()
      }
    }
  }

  private handleUp(e: { keycode?: number; button?: number }) {
    if (this.consumeSynthetic(this.syntheticUpQ, e)) return

    if (this.startBind && bindMatchesKey(this.startBind, e)) {
      this.startBindDown = false
    }
    if (this.holdBind && bindMatchesKey(this.holdBind, e)) {
      if (this.mode === 'hold' && this.holdBindDown) {
        this.holdBindDown = false
        this.onHoldEnd?.()
      } else {
        this.holdBindDown = false
      }
    }
  }
}

export const inputListener = new InputListener()
