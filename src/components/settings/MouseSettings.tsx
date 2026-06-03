import { motion } from 'framer-motion'
import { GlassCard } from '../ui/GlassCard'
import type { ClickType, MouseButton } from '../../types'

interface Props {
  button: MouseButton
  clickType: ClickType
  onButtonChange: (v: MouseButton) => void
  onClickTypeChange: (v: ClickType) => void
}

const BUTTONS: { value: MouseButton; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'middle', label: 'Middle' }
]

const TYPES: { value: ClickType; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' }
]

export function MouseSettings({ button, clickType, onButtonChange, onClickTypeChange }: Props) {
  return (
    <GlassCard label="Mouse">
      <div className="space-y-2.5">
        <Row label="Button">
          <Chips value={button} options={BUTTONS} onChange={onButtonChange} />
        </Row>
        <Row label="Click type">
          <Chips value={clickType} options={TYPES} onChange={onClickTypeChange} />
        </Row>
      </div>
    </GlassCard>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-medium text-slate-400">{label}</span>
      {children}
    </div>
  )
}

function Chips<T extends string>({
  value,
  options,
  onChange
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1">
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <motion.button
            key={opt.value}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange(opt.value)}
            className={`relative rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              selected
                ? 'border-accent-cyan/40 bg-accent-cyan/15 text-white'
                : 'border-white/5 bg-white/[0.03] text-slate-400 hover:text-slate-100'
            }`}
            style={
              selected
                ? { boxShadow: '0 0 14px rgba(34,211,238,0.25)' }
                : undefined
            }
          >
            {opt.label}
          </motion.button>
        )
      })}
    </div>
  )
}
