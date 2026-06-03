import { Repeat, Hand } from 'lucide-react'
import { SegmentedTabs } from '../ui/SegmentedTabs'
import { GlassCard } from '../ui/GlassCard'
import type { ClickMode } from '../../types'

interface Props {
  value: ClickMode
  onChange: (v: ClickMode) => void
}

export function ModeTabs({ value, onChange }: Props) {
  return (
    <GlassCard label="Activation mode">
      <SegmentedTabs
        layoutId="mode-tabs"
        value={value}
        onChange={onChange}
        options={[
          { value: 'toggle', label: 'Toggle', icon: <Repeat className="h-3 w-3" /> },
          { value: 'hold', label: 'Hold', icon: <Hand className="h-3 w-3" /> }
        ]}
      />
    </GlassCard>
  )
}
