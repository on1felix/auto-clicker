import Store from 'electron-store'
import { DEFAULT_SETTINGS, Settings } from './shared/types'

type Schema = { settings: Settings }

const store = new Store<Schema>({
  defaults: { settings: DEFAULT_SETTINGS },
  name: 'auto-clicker-settings'
})

export const settingsStore = {
  get(): Settings {
    return { ...DEFAULT_SETTINGS, ...(store.get('settings') as Settings) }
  },
  set(s: Settings) {
    store.set('settings', s)
  }
}
