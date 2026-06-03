import { Mouse, Keyboard } from 'lucide-react'
import { SegmentedTabs } from '../ui/SegmentedTabs'
import { GlassCard } from '../ui/GlassCard'
import type { Target } from '../../types'

interface Props {
  value: Target
  onChange: (v: Target) => void
}

export function TargetTabs({ value, onChange }: Props) {
  return (
    <GlassCard label="Target">
      <SegmentedTabs
        layoutId="target-tabs"
        value={value}
        onChange={onChange}
        options={[
          { value: 'mouse', label: 'Mouse', icon: <Mouse className="h-3 w-3" /> },
          { value: 'keyboard', label: 'Keyboard', icon: <Keyboard className="h-3 w-3" /> }
        ]}
      />
    </GlassCard>
  )
}
