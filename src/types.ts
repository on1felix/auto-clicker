// Re-export shared types from the main process for renderer use.
export type BindKey =
  | { kind: 'keyboard'; code: string; label: string }
  | { kind: 'mouse'; button: 'left' | 'right' | 'middle' | 'side1' | 'side2' }

export type ClickMode = 'toggle' | 'hold'
export type Target = 'mouse' | 'keyboard'
export type MouseButton = 'left' | 'right' | 'middle'
export type ClickType = 'single' | 'double'

export interface Settings {
  mode: ClickMode
  target: Target
  mouseButton: MouseButton
  clickType: ClickType
  keyToSend: string
  intervalMs: number
  startBind: BindKey
  holdBind: BindKey | null
  anv: boolean
}

export interface ClickerState {
  active: boolean
  totalClicks: number
  measuredCps: number
  startedAt: number | null
  capturing: 'start' | 'hold' | null
}

export interface Api {
  getSettings: () => Promise<Settings>
  saveSettings: (s: Settings) => Promise<void>
  start: () => Promise<void>
  stop: () => Promise<void>
  toggle: () => Promise<void>
  captureBind: (slot: 'start' | 'hold') => Promise<BindKey>
  cancelCapture: () => Promise<void>
  minimizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  togglePin: () => Promise<boolean>
  onStateChange: (cb: (s: ClickerState) => void) => () => void
}

declare global {
  interface Window {
    api: Api
  }
}
