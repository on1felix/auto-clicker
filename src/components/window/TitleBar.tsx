import { useState } from 'react'
import { motion } from 'framer-motion'
import { Minus, X, Pin } from 'lucide-react'

export function TitleBar() {
  const [pinned, setPinned] = useState(false)

  const handlePin = async () => {
    const next = await window.api.togglePin()
    setPinned(next)
  }

  return (
    <div className="drag relative flex h-10 items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-accent-cyan to-accent-violet shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300/80">
          Auto Clicker
        </span>
      </div>
      <div className="no-drag flex items-center gap-1">
        <WindowButton onClick={handlePin} active={pinned} title="Always on top">
          <Pin className="h-3.5 w-3.5" />
        </WindowButton>
        <WindowButton onClick={() => window.api.minimizeWindow()} title="Minimize">
          <Minus className="h-3.5 w-3.5" />
        </WindowButton>
        <WindowButton onClick={() => window.api.closeWindow()} danger title="Close">
          <X className="h-3.5 w-3.5" />
        </WindowButton>
      </div>
    </div>
  )
}

function WindowButton({
  children,
  onClick,
  active,
  danger,
  title
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  danger?: boolean
  title?: string
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      title={title}
      className={[
        'flex h-7 w-7 items-center justify-center rounded-lg border transition-colors',
        active
          ? 'border-accent-cyan/40 bg-accent-cyan/15 text-accent-cyan'
          : 'border-white/5 bg-white/[0.03] text-slate-400 hover:text-slate-100',
        danger ? 'hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-300' : ''
      ].join(' ')}
    >
      {children}
    </motion.button>
  )
}
