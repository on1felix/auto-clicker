import { motion } from 'framer-motion'

export function ActivePulse() {
  return (
    <>
      {/* rotating conic ring */}
      <div
        className="conic-ring pointer-events-none absolute inset-0 rounded-full"
        style={{
          padding: '2px',
          WebkitMask:
            'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          filter: 'drop-shadow(0 0 10px rgba(34,211,238,0.45))'
        }}
      />

      {/* pulsing halo */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(34,211,238,0.45) 0%, rgba(167,139,250,0.25) 50%, transparent 70%)'
        }}
        animate={{ scale: [1, 1.45, 1], opacity: [0.7, 0, 0.7] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(167,139,250,0.35) 0%, transparent 65%)'
        }}
        animate={{ scale: [1, 1.7, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
      />

      {/* shimmer particles */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const angle = (i / 8) * Math.PI * 2
        const radius = 92
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        return (
          <motion.span
            key={i}
            className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
            style={{
              background: i % 2 === 0 ? '#22d3ee' : '#a78bfa',
              boxShadow: '0 0 8px currentColor',
              color: i % 2 === 0 ? '#22d3ee' : '#a78bfa',
              x: x - 3,
              y: y - 3
            }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              delay: i * 0.18,
              ease: 'easeInOut'
            }}
          />
        )
      })}
    </>
  )
}
