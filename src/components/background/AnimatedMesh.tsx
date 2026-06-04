import { motion } from 'framer-motion'

interface Props {
  intense?: boolean
}

export function AnimatedMesh({ intense = false }: Props) {
  const speed = intense ? 0.6 : 1
  const opacity = intense ? 0.85 : 0.6
  // ~1.4s smooth crossfade between idle and active intensities.
  const opacityTransition = { duration: 1.4, ease: 'easeOut' as const }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-bg-deep via-bg-base to-bg-mid" />
      <motion.div
        className="absolute -left-20 -top-20 h-[380px] w-[380px] rounded-full"
        style={{
          background: 'radial-gradient(circle, #22d3ee 0%, transparent 65%)',
          filter: 'blur(70px)'
        }}
        animate={{
          x: [0, 60, -10, 30, 0],
          y: [0, 40, 80, 20, 0],
          opacity
        }}
        transition={{
          x: { duration: 18 * speed, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 18 * speed, repeat: Infinity, ease: 'easeInOut' },
          opacity: opacityTransition
        }}
      />
      <motion.div
        className="absolute -right-32 top-1/3 h-[420px] w-[420px] rounded-full"
        style={{
          background: 'radial-gradient(circle, #a78bfa 0%, transparent 65%)',
          filter: 'blur(80px)'
        }}
        animate={{
          x: [0, -40, 20, -60, 0],
          y: [0, -30, 40, 10, 0],
          opacity
        }}
        transition={{
          x: { duration: 22 * speed, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 22 * speed, repeat: Infinity, ease: 'easeInOut' },
          opacity: opacityTransition
        }}
      />
      <motion.div
        className="absolute -bottom-24 left-1/3 h-[360px] w-[360px] rounded-full"
        style={{
          background: 'radial-gradient(circle, #f472b6 0%, transparent 60%)',
          filter: 'blur(90px)'
        }}
        animate={{
          x: [0, 40, -30, 10, 0],
          y: [0, -50, -20, 30, 0],
          opacity: opacity * 0.7
        }}
        transition={{
          x: { duration: 26 * speed, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 26 * speed, repeat: Infinity, ease: 'easeInOut' },
          opacity: opacityTransition
        }}
      />
      {/* subtle noise/vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)'
        }}
      />
    </div>
  )
}
