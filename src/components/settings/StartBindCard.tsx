import { GlassCard } from '../ui/GlassCard'
import { BindChip } from './BindCapture'
import type { BindKey } from '../../types'

interface Props {
  bind: BindKey
  capturing: boolean
  onCapture: () => Promise<void>
}

export function StartBindCard({ bind, capturing, onCapture }: Props) {
  return (
    <GlassCard label="Trigger bind">
      <BindChip
        label="Start / stop"
        bind={bind}
        capturing={capturing}
        onCapture={onCapture}
      />
    </GlassCard>
  )
}
