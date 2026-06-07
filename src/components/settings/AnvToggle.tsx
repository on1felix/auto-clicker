import { motion, AnimatePresence } from 'framer-motion'
import { Shield } from 'lucide-react'

interface Props {
  value: boolean
  onChange: (v: boolean) => void
}

/**
 * ANV — Anti-Noise Variance. When on, the engine randomizes the click
 * interval slightly so an AV / anti-cheat sees an irregular cadence.
 * UI: a neon pill switch with a shield icon above it whose edges glow
 * with the same gradient as the switch when active.
 */
export function AnvToggle({ value, onChange }: Props) {
  return (
    <div className="glass relative flex items-center gap-3 rounded-2xl px-3 py-2"
      style={{
        boxShadow: '0 6px 24px -8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)'
      }}
    >
      {/* Shield with neon halo (above-left of switch) */}
      <div className="relative flex h-9 w-9 items-center justify-center">
        {/* outer glow that fades in/out */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full"
          initial={false}
          animate={{ opacity: value ? 1 : 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          style={{
            background:
              'radial-gradient(circle, rgba(34,211,238,0.55) 0%, rgba(167,139,250,0.35) 45%, transparent 70%)',
            filter: 'blur(8px)'
          }}
        />
        {/* shield body — outline morphs into glowing edge */}
        <motion.div
          className="relative flex h-7 w-7 items-center justify-center"
          initial={false}
          animate={{
            scale: value ? 1.08 : 1,
            filter: value
              ? 'drop-shadow(0 0 6px rgba(34,211,238,0.9)) drop-shadow(0 0 10px rgba(167,139,250,0.55))'
              : 'drop-shadow(0 0 0px rgba(0,0,0,0))'
          }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <Shield
            className="h-6 w-6"
            strokeWidth={2}
            style={{
              color: value ? '#67e8f9' : 'rgb(148 163 184 / 0.75)',
              transition: 'color 0.45s ease-out'
            }}
          />
        </motion.div>
      </div>

      {/* Label + sublabel */}
      <div className="flex min-w-0 flex-1 flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold tracking-[0.22em] text-white">ANV</span>
          <AnimatePresence>
            {value && (
              <motion.span
                key="dot"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.25 }}
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{
                  background: '#22d3ee',
                  boxShadow: '0 0 6px #22d3ee, 0 0 10px rgba(34,211,238,0.6)'
                }}
              />
            )}
          </AnimatePresence>
        </div>
        <span className="mt-1 text-[9px] uppercase tracking-[0.14em] text-slate-500">
          Anti-detection jitter
        </span>
      </div>

      {/* Neon switch */}
      <NeonSwitch value={value} onChange={onChange} />
    </div>
  )
}

function NeonSwitch({ value, onChange }: Props) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="relative h-7 w-[52px] shrink-0 cursor-pointer rounded-full outline-none focus:outline-none"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* track */}
      <motion.span
        className="absolute inset-0 rounded-full"
        initial={false}
        animate={{
          background: value
            ? 'linear-gradient(135deg, rgba(34,211,238,0.42), rgba(167,139,250,0.42))'
            : 'rgba(255,255,255,0.06)',
          borderColor: value ? 'rgba(34,211,238,0.55)' : 'rgba(255,255,255,0.08)',
          boxShadow: value
            ? '0 0 14px rgba(34,211,238,0.55), 0 0 22px rgba(167,139,250,0.35), inset 0 1px 0 rgba(255,255,255,0.12)'
            : 'inset 0 1px 0 rgba(255,255,255,0.05)'
        }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ borderWidth: 1, borderStyle: 'solid' }}
      />

      {/* knob — base (always visible, never re-colored) */}
      <motion.span
        className="absolute left-1 block h-5 w-5 rounded-full"
        style={{
          top: 3,
          background: 'radial-gradient(circle at 30% 30%, #f8fafc, #cbd5e1 70%)',
          boxShadow:
            '0 2px 6px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.5)'
        }}
        animate={{ x: value ? 24 : 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      >
        {/* knob — active tint, fades in/out on top of the base */}
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-full"
          initial={false}
          animate={{ opacity: value ? 1 : 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          style={{
            background:
              'radial-gradient(circle at 30% 30%, #e0fbff, #c7d2fe 70%)',
            boxShadow:
              '0 0 6px rgba(125,211,252,0.55), inset 0 1px 0 rgba(255,255,255,0.55)'
          }}
        />
      </motion.span>
    </button>
  )
}
