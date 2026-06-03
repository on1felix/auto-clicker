import { GlassCard } from '../ui/GlassCard'
import { BindChip } from './BindCapture'
import type { BindKey } from '../../types'

interface Props {
  holdBind: BindKey | null
  capturing: boolean
  onCapture: () => Promise<void>
}

export function HoldBindCard({ holdBind, capturing, onCapture }: Props) {
  return (
    <GlassCard label="Hold bind">
      <BindChip
        label="Hold to click"
        bind={holdBind}
        capturing={capturing}
        onCapture={onCapture}
        placeholder="Click to bind"
      />
      <p className="mt-2 text-[10px] leading-snug text-slate-500">
        Pick a key or mouse side button. Don't bind the same button the clicker
        is sending, or you may lock yourself out. Press <span className="font-mono text-accent-cyan">Esc</span> anytime to panic-stop.
      </p>
    </GlassCard>
  )
}
