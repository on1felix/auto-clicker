import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Target as TargetIcon, Clock } from 'lucide-react'
import type { ClickerState } from '../../types'

function formatDuration(ms: number): string {
  if (ms <= 0) return '0s'
  const sec = Math.floor(ms / 1000)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}h${m}m${s}s`
  if (m > 0) return `${m}m${s}s`
  return `${s}s`
}

interface Props {
  state: ClickerState
}

export function LiveBanner({ state }: Props) {
  const [runtime, setRuntime] = useState(0)

  useEffect(() => {
    if (!state.active || !state.startedAt) {
      setRuntime(0)
      return
    }
    setRuntime(Date.now() - state.startedAt)
    const id = setInterval(() => {
      setRuntime(Date.now() - (state.startedAt ?? Date.now()))
    }, 220)
    return () => clearInterval(id)
  }, [state.active, state.startedAt])

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.22 }}
      className="flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 backdrop-blur-md"
      style={{ boxShadow: '0 0 18px rgba(34,211,238,0.12)' }}
    >
      <Stat icon={<Activity className="h-3 w-3 text-accent-cyan" />} value={state.measuredCps.toString()} label="cps" accent />
      <Divider />
      <Stat icon={<TargetIcon className="h-3 w-3 text-slate-400" />} value={state.totalClicks.toLocaleString()} label="clicks" />
      <Divider />
      <Stat icon={<Clock className="h-3 w-3 text-slate-400" />} value={formatDuration(runtime)} label="time" />
    </motion.div>
  )
}

function Divider() {
  return <span className="h-3 w-px bg-white/10" />
}

function Stat({
  icon,
  value,
  label,
  accent
}: {
  icon: React.ReactNode
  value: string
  label: string
  accent?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <motion.span
        key={value}
        initial={{ y: -2, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.13 }}
        className={`font-mono text-[13px] font-bold leading-none ${accent ? 'text-shimmer' : 'text-white'}`}
      >
        {value}
      </motion.span>
      <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
    </div>
  )
}
