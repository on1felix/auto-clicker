import { EventEmitter } from 'events'
import { inputSender } from './inputSender'
import { inputListener } from './inputListener'
import { settingsStore } from '../store'
import {
  BindKey,
  ClickerState,
  DEFAULT_STATE,
  Settings
} from '../shared/types'

class ClickerEngine extends EventEmitter {
  private state: ClickerState = { ...DEFAULT_STATE }
  private settings: Settings = settingsStore.get()
  private timer: NodeJS.Timeout | null = null
  private statsTimer: NodeJS.Timeout | null = null
  private clicksWindow: number[] = []

  init() {
    inputListener.setCallbacks({
      onToggle: () => this.toggle(),
      // Hold-mode press: if engine is already running, treat as a stop signal
      // (tap-to-stop fallback in case release isn't detected for any reason).
      onHoldStart: () => {
        if (this.state.active) this.stop()
        else this.start()
      },
      onHoldEnd: () => this.stop(),
      onPanic: () => this.stop()
    })
    inputListener.configure(this.settings)
    inputListener.start()
    inputSender.prewarm()
  }

  shutdown() {
    this.stop()
    inputListener.stop()
    inputSender.shutdown()
  }

  getSettings(): Settings {
    return this.settings
  }

  saveSettings(s: Settings) {
    const wasActive = this.state.active
    if (wasActive) this.stop()
    this.settings = s
    settingsStore.set(s)
    inputListener.configure(s)
    if (wasActive) this.start()
  }

  getState(): ClickerState {
    return this.state
  }

  start() {
    if (this.state.active) return
    this.state = {
      active: true,
      totalClicks: 0,
      measuredCps: 0,
      startedAt: Date.now(),
      capturing: this.state.capturing
    }
    this.clicksWindow = []
    // Tell the input sender how long each button/key press should be held.
    // Games like GTA 5 ignore zero-hold synthetic clicks; ~15 ms is a sweet
    // spot. At very short intervals we shrink the hold so PowerShell doesn't
    // fall behind the click loop.
    const intervalMs = Math.max(5, Math.round(this.settings.intervalMs))
    const holdMs = Math.max(2, Math.min(15, intervalMs - 4))
    inputSender.setHoldMs(holdMs)
    this.scheduleNext()
    this.statsTimer = setInterval(() => this.emitState(), 120)
    this.emitState()
  }

  stop() {
    if (!this.state.active && !this.timer) return
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    if (this.statsTimer) clearInterval(this.statsTimer)
    this.statsTimer = null
    this.state = { ...this.state, active: false, startedAt: null }
    inputListener.resetSynthetic()
    this.emitState()
  }

  toggle() {
    if (this.state.active) this.stop()
    else this.start()
  }

  captureBind(slot: 'start' | 'hold'): Promise<BindKey> {
    this.state = { ...this.state, capturing: slot }
    this.emitState()
    return new Promise((resolve) => {
      inputListener.captureNext((bind) => {
        // Apply the new bind immediately so the listener stops using the
        // previous bind even before the renderer's debounced save round-trips.
        if (slot === 'start') this.settings = { ...this.settings, startBind: bind }
        else this.settings = { ...this.settings, holdBind: bind }
        settingsStore.set(this.settings)
        inputListener.configure(this.settings)
        this.state = { ...this.state, capturing: null }
        this.emitState()
        resolve(bind)
      })
    })
  }

  cancelCapture() {
    inputListener.cancelCapture()
    this.state = { ...this.state, capturing: null }
    this.emitState()
  }

  private scheduleNext() {
    const intervalMs = Math.max(5, Math.min(5000, Math.round(this.settings.intervalMs)))
    this.timer = setTimeout(() => this.tick(), intervalMs)
  }

  private tick() {
    if (!this.state.active) return
    if (this.settings.target === 'mouse') {
      // Tell the listener to ignore the next mousedown/mouseup of this button
      // so our own click loop doesn't get treated as a real release in hold mode.
      inputListener.markSyntheticMouse(this.settings.mouseButton)
      if (this.settings.clickType === 'double') {
        inputListener.markSyntheticMouse(this.settings.mouseButton)
      }
    }
    inputSender.tick(
      this.settings.target,
      this.settings.mouseButton,
      this.settings.clickType,
      this.settings.keyToSend
    )
    const now = Date.now()
    this.state.totalClicks += 1
    this.clicksWindow.push(now)
    const cutoff = now - 1000
    while (this.clicksWindow.length && this.clicksWindow[0] < cutoff) {
      this.clicksWindow.shift()
    }
    this.state.measuredCps = this.clicksWindow.length
    this.scheduleNext()
  }

  private emitState() {
    this.emit('state', this.state)
  }
}

export const engine = new ClickerEngine()
