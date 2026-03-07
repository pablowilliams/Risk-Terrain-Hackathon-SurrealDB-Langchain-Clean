import { useEffect } from 'react'
import { motion } from 'framer-motion'

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#080D1A',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Scanline texture */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          fontSize: 'clamp(40px, 8vw, 80px)',
          fontWeight: 800,
          fontFamily: "'Syne', sans-serif",
          color: '#F8FAFC',
          letterSpacing: -2,
          position: 'relative',
        }}
      >
        <motion.span
          animate={{
            textShadow: [
              '0 0 20px rgba(59,130,246,0)',
              '0 0 40px rgba(59,130,246,0.4)',
              '0 0 20px rgba(59,130,246,0)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          RISK
        </motion.span>
        <motion.span
          style={{ color: '#3B82F6' }}
          animate={{
            textShadow: [
              '0 0 20px rgba(59,130,246,0.2)',
              '0 0 60px rgba(59,130,246,0.6)',
              '0 0 20px rgba(59,130,246,0.2)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          TERRAIN
        </motion.span>
      </motion.div>

      {/* Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        style={{
          fontSize: 9,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: 4,
          color: '#334155',
          marginTop: 12,
        }}
      >
        S&amp;P 500 INTELLIGENCE PLATFORM
      </motion.div>

      {/* Loading bar */}
      <motion.div
        style={{
          position: 'absolute', bottom: 80,
          width: 120, height: 2,
          background: 'rgba(59,130,246,0.15)',
          borderRadius: 1, overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2.0, ease: 'easeInOut' }}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #1D4ED8, #3B82F6)',
            borderRadius: 1,
          }}
        />
      </motion.div>
    </motion.div>
  )
}
