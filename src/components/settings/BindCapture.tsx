import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crosshair, Mouse } from 'lucide-react'
import type { BindKey } from '../../types'

interface Props {
  label: string
  bind: BindKey | null
  capturing: boolean
  onCapture: () => Promise<void>
  onCancel?: () => void
  placeholder?: string
}

function bindLabel(bind: BindKey | null, placeholder = 'Not set'): string {
  if (!bind) return placeholder
  if (bind.kind === 'keyboard') return bind.label
  return `Mouse ${bind.button}`
}

export function BindChip({ label, bind, capturing, onCapture, placeholder }: Props) {
  const [hover, setHover] = useState(false)

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <Crosshair className="h-3.5 w-3.5" />
        {label}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {capturing ? (
          <motion.button
            key="capturing"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2 rounded-lg border border-accent-cyan/50 bg-accent-cyan/10 px-3.5 py-1.5 text-[11px] font-bold text-accent-cyan"
          >
            <motion.span
              className="flex items-center gap-2"
              animate={{ x: [0, -1, 1, -1, 0] }}
              transition={{
                duration: 0.3,
                repeat: Infinity,
                repeatDelay: 0.9
              }}
            >
              <Mouse className="h-3 w-3 animate-pulse" />
              Press key or mouse…
            </motion.span>
          </motion.button>
        ) : (
          <motion.button
            key="chip"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: 0.18 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onCapture}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className="rounded-lg border border-white/10 bg-white/[0.05] px-3.5 py-1.5 font-mono text-[12px] font-bold text-white hover:border-accent-violet/50"
            style={{
              boxShadow: hover
                ? '0 0 16px rgba(167,139,250,0.35)'
                : '0 0 10px rgba(167,139,250,0.12)'
            }}
          >
            {bindLabel(bind, placeholder)}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
