import { useState, useCallback, useEffect, useRef } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import SplashScreen from './components/SplashScreen'

function MouseTracker() {
  const ref = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: -100, y: -100 })
  const visible = useRef(false)
  const raf = useRef(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (!visible.current) {
        visible.current = true
        if (ref.current) ref.current.style.opacity = '1'
      }
    }
    const onLeave = () => {
      visible.current = false
      if (ref.current) ref.current.style.opacity = '0'
    }
    const loop = () => {
      if (ref.current) {
        ref.current.style.transform =
          `translate(${pos.current.x - 20}px, ${pos.current.y - 20}px)`
      }
      raf.current = requestAnimationFrame(loop)
    }
    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    raf.current = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: '1.5px solid rgba(59,130,246,0.4)',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 99999,
        opacity: 0,
        transition: 'opacity 0.3s ease, width 0.2s ease, height 0.2s ease',
        mixBlendMode: 'screen',
      }}
    />
  )
}

export default function App() {
  const location = useLocation()
  const [showSplash, setShowSplash] = useState(true)

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false)
  }, [])

  return (
    <>
      <MouseTracker />
      <AnimatePresence mode="wait">
        {showSplash ? (
          <SplashScreen key="splash" onComplete={handleSplashComplete} />
        ) : (
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        )}
      </AnimatePresence>
    </>
  )
}
