import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard } from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'

interface Props {
  keyToSend: string
  onChange: (v: string) => void
}

export function KeyboardSettings({ keyToSend, onChange }: Props) {
  const [listening, setListening] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!listening) return
    e.preventDefault()
    e.stopPropagation()
    const v = e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toUpperCase() : e.key
    onChange(v)
    setListening(false)
  }

  return (
    <GlassCard label="Keyboard">
      <div
        ref={boxRef}
        tabIndex={0}
        onKeyDown={handleKey}
        onBlur={() => setListening(false)}
        className="flex items-center justify-between gap-3 focus:outline-none"
      >
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Keyboard className="h-3.5 w-3.5" />
          Key to send
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {listening ? (
            <motion.button
              key="listen"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="rounded-lg border border-accent-cyan/50 bg-accent-cyan/10 px-3.5 py-1.5 text-[11px] font-bold text-accent-cyan"
            >
              <motion.span
                className="inline-block"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
              >
                Press a key…
              </motion.span>
            </motion.button>
          ) : (
            <motion.button
              key="chip"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={() => {
                boxRef.current?.focus()
                setListening(true)
              }}
              className="rounded-lg border border-white/10 bg-white/[0.05] px-3.5 py-1.5 font-mono text-[12px] font-bold text-white shadow-[0_0_12px_rgba(167,139,250,0.18)] hover:border-accent-violet/50"
            >
              <motion.span
                key={keyToSend}
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="inline-block"
              >
{keyToSend === ' ' ? 'Space' : keyToSend}
              </motion.span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </GlassCard>
  )
}
