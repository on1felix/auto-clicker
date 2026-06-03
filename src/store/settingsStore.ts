import { create } from 'zustand'
import type { Settings } from '../types'

interface SettingsState {
  settings: Settings | null
  hydrated: boolean
  hydrate: () => Promise<void>
  update: (patch: Partial<Settings>) => void
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
const scheduleSave = (s: Settings) => {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    window.api.saveSettings(s).catch(console.error)
  }, 180)
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  hydrated: false,
  hydrate: async () => {
    const s = await window.api.getSettings()
    set({ settings: s, hydrated: true })
  },
  update: (patch) => {
    const current = get().settings
    if (!current) return
    const next = { ...current, ...patch }
    set({ settings: next })
    scheduleSave(next)
  }
}))
