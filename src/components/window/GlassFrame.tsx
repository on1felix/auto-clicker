import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  active: boolean
  children: ReactNode
}

export function GlassFrame({ active, children }: Props) {
  return (
    <div className="relative h-full w-full" style={{ padding: '2px' }}>
      {/* outer rotating ring shown when active */}
      <AnimatePresence>
        {active && (
          <motion.div
            key="outer-ring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.4, ease: 'easeOut' }
            }}
            className="conic-ring-slow absolute inset-0 rounded-[24px]"
            style={{
              filter: 'blur(8px)'
            }}
          />
        )}
      </AnimatePresence>

      <div
        className="glass-strong relative h-full w-full overflow-hidden rounded-[22px]"
        style={{
          boxShadow:
            '0 24px 60px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)'
        }}
      >
        {children}
      </div>
    </div>
  )
}
