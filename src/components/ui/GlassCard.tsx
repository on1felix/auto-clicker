import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
  label?: string
  className?: string
}

export function GlassCard({ children, label, className = '' }: Props) {
  return (
    <motion.div
      layout
      className={`glass relative rounded-2xl p-2.5 ${className}`}
      style={{
        boxShadow: '0 6px 24px -8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)'
      }}
    >
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400/80">
            {label}
          </span>
        </div>
      )}
      {children}
    </motion.div>
  )
}
