import { contextBridge, ipcRenderer } from 'electron'
import type { BindKey, ClickerState, Settings } from './shared/types'

const api = {
  getSettings: (): Promise<Settings> => ipcRenderer.invoke('settings:get'),
  saveSettings: (s: Settings): Promise<void> => ipcRenderer.invoke('settings:save', s),
  start: (): Promise<void> => ipcRenderer.invoke('clicker:start'),
  stop: (): Promise<void> => ipcRenderer.invoke('clicker:stop'),
  toggle: (): Promise<void> => ipcRenderer.invoke('clicker:toggle'),
  captureBind: (slot: 'start' | 'hold'): Promise<BindKey> =>
    ipcRenderer.invoke('bind:capture', slot),
  cancelCapture: (): Promise<void> => ipcRenderer.invoke('bind:cancel'),
  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
  closeWindow: (): Promise<void> => ipcRenderer.invoke('window:close'),
  togglePin: (): Promise<boolean> => ipcRenderer.invoke('window:toggle-pin'),
  onStateChange: (cb: (s: ClickerState) => void) => {
    const handler = (_: unknown, state: ClickerState) => cb(state)
    ipcRenderer.on('state:change', handler)
    return () => ipcRenderer.removeListener('state:change', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
