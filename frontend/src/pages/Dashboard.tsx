import { motion } from 'framer-motion'
import RiskTerrain from '../components/dashboard/RiskTerrain'

export default function Dashboard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <RiskTerrain />
    </motion.div>
  )
}
