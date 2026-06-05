import { motion, AnimatePresence } from 'framer-motion'
import { Power, Square } from 'lucide-react'
import { ActivePulse } from './ActivePulse'

interface Props {
  active: boolean
  onToggle: () => void
}

export function ActivationButton({ active, onToggle }: Props) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 170, height: 170 }}>
      <AnimatePresence>{active && <ActivePulse key="pulse" />}</AnimatePresence>

      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
        className="relative flex h-[130px] w-[130px] items-center justify-center overflow-hidden rounded-full glass-strong outline-none focus:outline-none focus-visible:outline-none"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12), rgba(255,255,255,0.04) 70%)',
          boxShadow:
            '0 10px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)'
        }}
      >
        {/* Active-state overlay: fades in/out smoothly */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full"
          initial={false}
          animate={{ opacity: active ? 1 : 0 }}
          transition={{ duration: active ? 1.0 : 0.9, ease: 'easeOut' }}
          style={{
            background:
              'radial-gradient(circle at 30% 30%, rgba(34,211,238,0.35), rgba(167,139,250,0.18) 70%)',
            boxShadow:
              '0 0 60px rgba(34,211,238,0.45), inset 0 0 30px rgba(167,139,250,0.25)'
          }}
        />

        <AnimatePresence mode="wait">
          {active ? (
            <motion.div
              key="stop"
              initial={{ opacity: 0, scale: 0.6, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: 90 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              className="relative z-10 flex flex-col items-center gap-1.5"
            >
              <Square className="h-7 w-7 fill-white text-white" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/90">
                Stop
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="start"
              initial={{ opacity: 0, scale: 0.6, rotate: 90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: -90 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              className="relative z-10 flex flex-col items-center gap-1.5"
            >
              <Power className="h-8 w-8 text-slate-100" strokeWidth={2.4} />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-200">
                Start
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
