import { motion } from 'framer-motion'
import { Timer } from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'

interface Props {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}

export function IntervalSlider({ value, onChange, min = 5, max = 1000 }: Props) {
  // log scale so low ms range is easier to fine-tune
  const logMin = Math.log10(min)
  const logMax = Math.log10(max)
  const logVal = Math.log10(Math.max(min, Math.min(max, value)))
  const pct = ((logVal - logMin) / (logMax - logMin)) * 100

  const handleChange = (rangePct: number) => {
    const lv = logMin + (rangePct / 100) * (logMax - logMin)
    const ms = Math.round(Math.pow(10, lv))
    onChange(ms)
  }

  const cps = (1000 / Math.max(1, value)).toFixed(value < 50 ? 1 : 0)

  return (
    <GlassCard label="Interval">
      <div className="flex items-center gap-3">
        <Timer className="h-4 w-4 text-accent-cyan" />
        <div className="relative flex-1">
          <div className="h-2 rounded-full bg-white/5">
            <motion.div
              className="h-2 rounded-full"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #22d3ee, #a78bfa, #f472b6)',
                boxShadow: `0 0 ${8 + (100 - pct) * 0.2}px rgba(34,211,238,${0.25 + (100 - pct) * 0.004})`
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={pct}
            onChange={(e) => handleChange(Number(e.target.value))}
            className="absolute inset-0 h-2 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(255,255,255,0.6)]"
          />
        </div>
        <div className="flex min-w-[78px] flex-col items-end leading-none">
          <div className="flex items-baseline gap-1">
            <motion.span
              key={value}
              initial={{ y: -3, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.13 }}
              className="font-mono text-xl font-bold text-white"
            >
              {value}
            </motion.span>
            <span className="text-[10px] font-semibold uppercase text-slate-500">ms</span>
          </div>
          <span className="text-[9px] uppercase tracking-wider text-slate-500">≈ {cps} cps</span>
        </div>
      </div>
    </GlassCard>
  )
}
