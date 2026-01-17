import { motion } from 'framer-motion'

const AIDetection = ({ data }) => {
  if (!data) {
    return (
      <div className="text-center py-12 text-gray-400">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <p>No AI detection data available</p>
      </div>
    )
  }

  const aiPercentage = data.ai_percentage || 0
  const humanPercentage = data.human_percentage || (100 - aiPercentage)
  const confidence = data.confidence || 'low'
  
  // Determine color based on AI percentage
  const getColor = (percentage) => {
    if (percentage < 20) return { bg: 'from-green-500 to-emerald-500', text: 'text-green-400', label: 'Mostly Human' }
    if (percentage < 40) return { bg: 'from-lime-500 to-green-500', text: 'text-lime-400', label: 'Largely Human' }
    if (percentage < 60) return { bg: 'from-yellow-500 to-orange-500', text: 'text-yellow-400', label: 'Mixed' }
    if (percentage < 80) return { bg: 'from-orange-500 to-red-500', text: 'text-orange-400', label: 'Largely AI' }
    return { bg: 'from-red-500 to-pink-500', text: 'text-red-400', label: 'Mostly AI' }
  }
  
  const colorScheme = getColor(aiPercentage)
  
  const confidenceColors = {
    low: 'bg-gray-500/20 text-gray-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-green-500/20 text-green-400'
  }

  return (
    <div className="space-y-6">
      {/* Main Score Display */}
      <div className="flex flex-col md:flex-row gap-8 items-center justify-center py-8">
        {/* AI Percentage Circle */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 100 }}
          className="relative"
        >
          <svg className="w-48 h-48 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="12"
            />
            {/* AI percentage arc */}
            <motion.circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="url(#aiGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${aiPercentage * 5.53} 553`}
              initial={{ strokeDasharray: '0 553' }}
              animate={{ strokeDasharray: `${aiPercentage * 5.53} 553` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className="text-5xl font-bold text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {aiPercentage}%
            </motion.span>
            <span className="text-sm text-gray-400 mt-1">AI Generated</span>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-4"
          >
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
            <div>
              <span className="text-2xl font-bold text-white">{humanPercentage}%</span>
              <span className="text-gray-400 ml-2">Human Written</span>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-4"
          >
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-500 to-red-500" />
            <div>
              <span className="text-2xl font-bold text-white">{aiPercentage}%</span>
              <span className="text-gray-400 ml-2">AI Generated</span>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${confidenceColors[confidence]}`}>
              {confidence} Confidence
            </span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className={`px-4 py-2 rounded-xl bg-gradient-to-r ${colorScheme.bg} bg-opacity-20`}
          >
            <span className="text-white font-semibold">{colorScheme.label}</span>
          </motion.div>
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/5 rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Analysis Summary
          </h3>
          <p className="text-gray-300 leading-relaxed">{data.summary}</p>
        </motion.div>
      )}

      {/* Detail Scores */}
      {data.details && Object.keys(data.details).length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/5 rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Detection Breakdown
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(data.details).map(([key, value], idx) => {
              const label = key.replace(/_/g, ' ').replace(/score/gi, '').trim()
              const isHuman = value > 50
              return (
                <motion.div 
                  key={key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + idx * 0.1 }}
                  className="bg-black/30 rounded-xl p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm capitalize">{label}</span>
                    <span className={`text-sm font-medium ${isHuman ? 'text-green-400' : 'text-red-400'}`}>
                      {isHuman ? 'Human-like' : 'AI-like'}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <motion.div 
                      className={`h-2 rounded-full ${isHuman ? 'bg-gradient-to-r from-green-500 to-cyan-500' : 'bg-gradient-to-r from-pink-500 to-red-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ delay: 1 + idx * 0.1, duration: 0.5 }}
                    />
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-xs text-gray-500">{value}% human-like</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Indicators Found */}
      {data.indicators_found && data.indicators_found.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-white/5 rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            AI Indicators Found
          </h3>
          <div className="space-y-3">
            {data.indicators_found.slice(0, 5).map((indicator, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 + idx * 0.1 }}
                className="flex items-start gap-3 bg-black/30 rounded-xl p-4"
              >
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  indicator.severity === 'high' ? 'bg-red-500' :
                  indicator.severity === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium">{indicator.indicator}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      indicator.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                      indicator.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {indicator.severity}
                    </span>
                  </div>
                  {indicator.file_pattern && (
                    <p className="text-gray-500 text-xs font-mono">{indicator.file_pattern}</p>
                  )}
                  {indicator.examples && indicator.examples.length > 0 && (
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                      "{indicator.examples[0]}"
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recommendation */}
      {data.recommendation && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20"
        >
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Recommendation
          </h3>
          <p className="text-gray-300 leading-relaxed">{data.recommendation}</p>
        </motion.div>
      )}
    </div>
  )
}

export default AIDetection
