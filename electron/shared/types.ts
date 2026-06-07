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
  intervalMs: number       // delay between clicks in milliseconds (5..1000)
  startBind: BindKey       // used in toggle mode
  holdBind: BindKey | null // used in hold mode (separate from any click target)
  anv: boolean             // anti-detection: jitter the interval randomly per click
}

export interface ClickerState {
  active: boolean
  totalClicks: number
  measuredCps: number
  startedAt: number | null
  capturing: 'start' | 'hold' | null
}

export const DEFAULT_SETTINGS: Settings = {
  mode: 'toggle',
  target: 'mouse',
  mouseButton: 'left',
  clickType: 'single',
  keyToSend: 'F',
  intervalMs: 67,
  startBind: { kind: 'keyboard', code: 'F6', label: 'F6' },
  holdBind: { kind: 'keyboard', code: 'F6', label: 'F6' },
  anv: false
}

export const DEFAULT_STATE: ClickerState = {
  active: false,
  totalClicks: 0,
  measuredCps: 0,
  startedAt: null,
  capturing: null
}
