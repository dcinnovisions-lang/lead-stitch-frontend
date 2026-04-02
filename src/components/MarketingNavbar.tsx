import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function MarketingNavbar() {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <div className="flex items-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-shrink-0"
            >
              <Link to="/" className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Lead Stitch
              </Link>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center space-x-2 sm:space-x-6"
          >
            <Link
              to="/login"
              className="text-gray-700 hover:text-blue-600 px-2 sm:px-4 py-1 sm:py-2 text-sm font-semibold transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register?intent=demo"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-8 py-1.5 sm:py-3 rounded-full text-sm font-bold hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              Book Demo
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  )
}

export default MarketingNavbar
