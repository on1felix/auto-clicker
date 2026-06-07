import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSettingsStore } from './store/settingsStore'
import { useClickerState } from './hooks/useClickerState'
import { TitleBar } from './components/window/TitleBar'
import { GlassFrame } from './components/window/GlassFrame'
import { AnimatedMesh } from './components/background/AnimatedMesh'
import { ActivationButton } from './components/activation/ActivationButton'
import { ModeTabs } from './components/settings/ModeTabs'
import { TargetTabs } from './components/settings/TargetTabs'
import { MouseSettings } from './components/settings/MouseSettings'
import { KeyboardSettings } from './components/settings/KeyboardSettings'
import { IntervalSlider } from './components/settings/IntervalSlider'
import { AnvToggle } from './components/settings/AnvToggle'
import { StartBindCard } from './components/settings/StartBindCard'
import { HoldBindCard } from './components/settings/HoldBindCard'
import { LiveBanner } from './components/stats/LiveBanner'

export default function App() {
  const { settings, hydrated, hydrate, update } = useSettingsStore()
  const state = useClickerState()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!hydrated || !settings) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-xs text-slate-500">Loading…</div>
      </div>
    )
  }

  const captureStart = async () => {
    const bind = await window.api.captureBind('start')
    update({ startBind: bind })
  }
  const captureHold = async () => {
    const bind = await window.api.captureBind('hold')
    update({ holdBind: bind })
  }

  const toggle = () => window.api.toggle()

  const activeBind = settings.mode === 'hold' ? settings.holdBind : settings.startBind
  const bindLabel = activeBind
    ? activeBind.kind === 'keyboard'
      ? activeBind.label
      : `Mouse ${activeBind.button}`
    : '—'

  return (
    <div className="relative h-screen w-screen overflow-hidden rounded-[24px]">
      <GlassFrame active={state.active}>
        <AnimatedMesh intense={state.active} />

        <div className="relative z-10 flex h-full flex-col">
          <TitleBar />

          <div className="flex flex-col items-center px-5 pb-2 pt-0">
            <ActivationButton active={state.active} onToggle={toggle} />

            <div className="mt-2 flex h-7 items-center justify-center">
              <AnimatePresence mode="wait">
                {state.active ? (
                  <LiveBanner key="banner" state={state} />
                ) : (
                  <motion.p
                    key="hint"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400"
                  >
                    {settings.mode === 'hold' && !settings.holdBind
                      ? 'Set a hold bind below'
                      : `${bindLabel} → ${settings.mode === 'hold' ? 'hold' : 'toggle'}  ·  Esc = stop`}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="no-drag flex-1 space-y-2 overflow-hidden px-4 pb-3">
            <div className="grid grid-cols-2 gap-2">
              <ModeTabs value={settings.mode} onChange={(mode) => update({ mode })} />
              <TargetTabs value={settings.target} onChange={(target) => update({ target })} />
            </div>

            <IntervalSlider
              value={settings.intervalMs}
              onChange={(intervalMs) => update({ intervalMs })}
            />

            <AnvToggle
              value={settings.anv ?? false}
              onChange={(anv) => update({ anv })}
            />

            <AnimatePresence mode="wait">
              {settings.target === 'mouse' ? (
                <motion.div
                  key="mouse"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.18 }}
                >
                  <MouseSettings
                    button={settings.mouseButton}
                    clickType={settings.clickType}
                    onButtonChange={(mouseButton) => update({ mouseButton })}
                    onClickTypeChange={(clickType) => update({ clickType })}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="keyboard"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  <KeyboardSettings
                    keyToSend={settings.keyToSend}
                    onChange={(keyToSend) => update({ keyToSend })}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {settings.mode === 'toggle' ? (
              <StartBindCard
                bind={settings.startBind}
                capturing={state.capturing === 'start'}
                onCapture={captureStart}
              />
            ) : (
              <HoldBindCard
                holdBind={settings.holdBind}
                capturing={state.capturing === 'hold'}
                onCapture={captureHold}
              />
            )}
          </div>
        </div>
      </GlassFrame>
    </div>
  )
}
