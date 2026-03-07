import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import RiskTerrain from '../components/dashboard/RiskTerrain'

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ width: '100vw', height: '100vh', position: 'relative' }}
    >
      <RiskTerrain />
      {/* Clickable overlay on the RISKTERRAIN logo area → back to landing */}
      <div
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 200,
          height: 52,
          cursor: 'pointer',
          zIndex: 100,
        }}
        title="Back to home"
      />
    </motion.div>
  )
}
