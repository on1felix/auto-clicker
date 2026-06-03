import { motion } from 'framer-motion'

interface Option<T extends string> {
  value: T
  label: string
  icon?: React.ReactNode
}

interface Props<T extends string> {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
  layoutId: string
}

export function SegmentedTabs<T extends string>({ options, value, onChange, layoutId }: Props<T>) {
  return (
    <div className="relative flex rounded-xl border border-white/5 bg-black/30 p-1">
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden px-1.5 py-1.5 text-[11px] font-semibold tracking-wide"
          >
            {selected && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(167,139,250,0.25))',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow:
                    '0 4px 16px rgba(34,211,238,0.15), inset 0 1px 0 rgba(255,255,255,0.08)'
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span
              className={`relative z-10 flex min-w-0 items-center justify-center gap-1 whitespace-nowrap transition-colors ${
                selected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.icon}
              <span className="truncate">{opt.label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
