import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard } from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'

interface Props {
  keyToSend: string
  onChange: (v: string) => void
}

export function KeyboardSettings({ keyToSend, onChange }: Props) {
  const [listening, setListening] = useState(false)

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!listening) return
    e.preventDefault()
    e.stopPropagation()
    const v = e.key.length === 1 ? e.key.toUpperCase() : e.key
    onChange(v)
    setListening(false)
  }

  return (
    <GlassCard label="Keyboard">
      <div
        tabIndex={0}
        onKeyDown={handleKey}
        onBlur={() => setListening(false)}
        className="flex items-center justify-between gap-3 focus:outline-none"
      >
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Keyboard className="h-3.5 w-3.5" />
          Key to send
        </div>
        <AnimatePresence mode="wait">
          {listening ? (
            <motion.button
              key="listen"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: [1, 1.03, 1], opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ scale: { duration: 0.9, repeat: Infinity } }}
              className="rounded-lg border border-accent-cyan/50 bg-accent-cyan/10 px-3.5 py-1.5 text-[11px] font-bold text-accent-cyan"
            >
              Press a key…
            </motion.button>
          ) : (
            <motion.button
              key="value"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => {
                ;(e.currentTarget.parentElement?.parentElement as HTMLDivElement | null)?.focus()
                setListening(true)
              }}
              className="rounded-lg border border-white/10 bg-white/[0.05] px-3.5 py-1.5 font-mono text-[12px] font-bold text-white shadow-[0_0_12px_rgba(167,139,250,0.18)] hover:border-accent-violet/50"
            >
              {keyToSend}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  )
}
