import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Tabs from './components/Tabs'
import Chat from './components/Chat'
import FileTree from './components/FileTree'
import DependencyGraph from './components/DependencyGraph'
import Report from './components/Report'
import AIDetection from './components/AIDetection'
import './App.css'

function App() {
  const [repoUrl, setRepoUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [completedSteps, setCompletedSteps] = useState([])
  const [analysisData, setAnalysisData] = useState(null)
  const [error, setError] = useState(null)
  const [currentStep, setCurrentStep] = useState(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [showReport, setShowReport] = useState(false)
  const reportRef = useRef(null)

  const handlePrintReport = () => {
    setShowReport(true)
    // Give time for the report to render before printing
    setTimeout(() => {
      window.print()
    }, 300)
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const steps = [
    { id: 'clone', label: 'Cloning Repository', description: 'Fetching source code from GitHub' },
    { id: 'analyze', label: 'Deep Analysis', description: 'AI scanning architecture & patterns' },
    { id: 'docs', label: 'Generating Insights', description: 'Creating documentation & guides' }
  ]

  const validateRepoFormat = (url) => {
    const trimmed = url.trim()
    const fullUrlPattern = /^https?:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+(\.git)?$/
    return fullUrlPattern.test(trimmed)
  }

  const analyzeRepo = async () => {
    const trimmedUrl = repoUrl.trim()
    
    if (!trimmedUrl) {
      setError('Please enter a GitHub repository URL')
      return
    }

    if (!validateRepoFormat(trimmedUrl)) {
      setError('Invalid URL format. Example: https://github.com/username/repo.git')
      return
    }

    setIsAnalyzing(true)
    setCompletedSteps([])
    setError(null)
    setAnalysisData(null)

    try {
      setCurrentStep('clone')
      await new Promise(resolve => setTimeout(resolve, 2000))
      setCompletedSteps(['clone'])

      setCurrentStep('analyze')
      await new Promise(resolve => setTimeout(resolve, 2500))
      setCompletedSteps(['clone', 'analyze'])

      setCurrentStep('docs')
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo: trimmedUrl })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Analysis failed: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Analysis data received:', data)
      setAnalysisData(data)
      setCompletedSteps(['clone', 'analyze', 'docs'])
      setCurrentStep(null)
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err.message || 'Failed to analyze repository. Please try again.')
      setCompletedSteps([])
      setCurrentStep(null)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isAnalyzing) {
      analyzeRepo()
    }
  }

  const isStepCompleted = (stepId) => completedSteps.includes(stepId)
  const isStepCurrent = (stepId) => currentStep === stepId
  const progressPercent = (completedSteps.length / steps.length) * 100

  const tabsData = analysisData ? [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Repository Overview</h3>
              <p className="text-gray-400 font-mono text-sm mt-1">{repoUrl}</p>
            </div>
          </div>
          
          {analysisData.modules && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(analysisData.modules).slice(0, 6).map(([name, info], idx) => (
                <motion.div 
                  key={name} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group p-5 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 group-hover:animate-pulse" />
                    <p className="text-white font-semibold">{name}</p>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                    {typeof info === 'string' ? info : info.description || 'Core module'}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'docs',
      label: 'Architecture',
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">System Architecture</h3>
              <p className="text-gray-400 text-sm mt-1">Deep dive into codebase structure</p>
            </div>
          </div>
          
          {analysisData.architecture ? (
            <div className="prose prose-invert prose-lg max-w-none bg-gradient-to-br from-white/5 to-transparent rounded-2xl p-6 border border-white/10">
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {typeof analysisData.architecture === 'string' 
                  ? analysisData.architecture 
                  : JSON.stringify(analysisData.architecture, null, 2)}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-gray-400">
              No architecture information available.
            </div>
          )}
        </div>
      )
    },
    {
      id: 'debt',
      label: 'Tech Debt',
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Technical Debt</h3>
              <p className="text-gray-400 text-sm mt-1">Areas requiring attention</p>
            </div>
          </div>
          
          {analysisData.technical_debt ? (
            <div className="space-y-4">
              {typeof analysisData.technical_debt === 'string' ? (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20">
                  <div className="text-gray-300 whitespace-pre-wrap">
                    {analysisData.technical_debt}
                  </div>
                </div>
              ) : (
                Object.entries(analysisData.technical_debt).map(([key, value], idx) => (
                  <motion.div 
                    key={key} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-transparent to-transparent border border-orange-500/20 hover:border-orange-400/40 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-orange-400" />
                      <p className="text-orange-300 font-semibold capitalize">{key}</p>
                    </div>
                    <p className="text-gray-300 text-sm pl-5">{value}</p>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-400">No significant technical debt identified</p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'onboarding',
      label: 'Onboarding',
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Developer Onboarding</h3>
              <p className="text-gray-400 text-sm mt-1">Get productive in minutes, not days</p>
            </div>
          </div>
          
          {analysisData.onboarding_guide ? (
            <div className="prose prose-invert prose-lg max-w-none bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl p-6 border border-green-500/20">
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {typeof analysisData.onboarding_guide === 'string'
                  ? analysisData.onboarding_guide
                  : JSON.stringify(analysisData.onboarding_guide, null, 2)}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-12">No onboarding guide available</p>
          )}
        </div>
      )
    },
    {
      id: 'filetree',
      label: 'File Tree',
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">File Tree</h3>
              <p className="text-gray-400 text-sm mt-1">Interactive folder structure visualization</p>
            </div>
          </div>
          
          <FileTree data={analysisData.file_tree} />
        </div>
      )
    },
    {
      id: 'dependencies',
      label: 'Dependencies',
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Dependency Graph</h3>
              <p className="text-gray-400 text-sm mt-1">Module import relationships</p>
            </div>
          </div>
          
          <DependencyGraph data={analysisData.dependencies} />
        </div>
      )
    },
    {
      id: 'ai-detection',
      label: 'AI Detection',
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">AI Code Detection</h3>
              <p className="text-gray-400 text-sm mt-1">Analyze how much code is AI-generated</p>
            </div>
          </div>
          
          <AIDetection data={analysisData.ai_detection} />
        </div>
      )
    },
    {
      id: 'chat',
      label: 'Ask AI',
      content: <Chat repoUrl={repoUrl} />
    }
  ] : []

  return (
    <div className="min-h-screen bg-[#030014] text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none no-print">
        {/* Gradient orbs */}
        <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-600/30 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBoLTQweiIvPjxwYXRoIGQ9Ik00MCAwdjQwSDBWMGg0MHpNMSAxdjM4aDM4VjFIMXoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L2c+PC9zdmc+')] opacity-50" />
        
        {/* Mouse follow glow */}
        <div 
          className="absolute w-[500px] h-[500px] rounded-full pointer-events-none transition-all duration-300 ease-out"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
            left: mousePosition.x - 250,
            top: mousePosition.y - 250,
          }}
        />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/5 backdrop-blur-xl bg-black/20 no-print">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="relative"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 blur-lg opacity-50" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                  Code Archaeologist
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Ready
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-6xl mx-auto px-8 py-12 no-print">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Understand Any Codebase
            </span>
            <br />
            <span className="text-white">In Seconds</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Point Code Archaeologist at any GitHub repo. Our AI analyzes architecture, 
            generates documentation, identifies tech debt, and creates onboarding guides.
          </p>
        </motion.div>

        {/* Input Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 p-8 mb-10 backdrop-blur-xl overflow-hidden"
        >
          {/* Card glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl" />
          
          <div className="relative">
            <label className="block mb-6">
              <span className="text-gray-300 font-medium text-sm flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                GitHub Repository URL
              </span>
              <div className="flex gap-4">
                <div className="flex-1 relative group">
                  <input
                    type="text"
                    placeholder="https://github.com/username/repository.git"
                    value={repoUrl}
                    onChange={(e) => {
                      setRepoUrl(e.target.value)
                      if (error) setError(null)
                    }}
                    onKeyPress={handleKeyPress}
                    disabled={isAnalyzing}
                    className="w-full px-6 py-4 bg-black/40 border border-white/10 rounded-2xl 
                             text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 
                             focus:ring-2 focus:ring-purple-500/20 transition-all duration-300
                             disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-transparent to-cyan-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                </div>
                <motion.button
                  onClick={analyzeRepo}
                  disabled={isAnalyzing}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative px-8 py-4 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 
                           text-white font-semibold rounded-2xl transition-all disabled:opacity-50 
                           disabled:cursor-not-allowed overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    {isAnalyzing ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </span>
                </motion.button>
              </div>
            </label>
            
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-red-300 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Progress Section */}
        <AnimatePresence>
          {(isAnalyzing || completedSteps.length > 0) && !analysisData && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 p-8 mb-10 backdrop-blur-xl overflow-hidden"
            >
              {/* Progress bar background glow */}
              <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-fuchsia-500 transition-all duration-500" 
                   style={{ width: `${progressPercent}%` }} />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-white">Analysis Progress</h3>
                  <span className="text-purple-400 font-mono text-sm">{Math.round(progressPercent)}%</span>
                </div>
                
                <div className="space-y-6">
                  {steps.map((step, index) => {
                    const completed = isStepCompleted(step.id)
                    const current = isStepCurrent(step.id)
                    
                    return (
                      <motion.div 
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                          completed ? 'bg-green-500/10 border border-green-500/30' :
                          current ? 'bg-purple-500/10 border border-purple-500/30' :
                          'bg-white/5 border border-white/5'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                          completed ? 'bg-green-500/20' :
                          current ? 'bg-purple-500/20 animate-pulse' :
                          'bg-white/5'
                        }`}>
                          {completed ? (
                            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : current ? (
                            <svg className="w-6 h-6 text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <span className="text-gray-500 font-semibold">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold ${completed ? 'text-green-300' : current ? 'text-white' : 'text-gray-500'}`}>
                            {step.label}
                          </p>
                          <p className={`text-sm ${completed ? 'text-green-400/70' : current ? 'text-purple-300' : 'text-gray-600'}`}>
                            {step.description}
                          </p>
                        </div>
                        {completed && (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                            Complete
                          </span>
                        )}
                        {current && (
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-full animate-pulse">
                            Processing
                          </span>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {completedSteps.length === 3 && tabsData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Analysis Complete</h3>
                </div>
                
                {/* Export Report Button */}
                <motion.button
                  onClick={handlePrintReport}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 
                           text-white font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/25"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF Report
                </motion.button>
              </div>
              <Tabs tabs={tabsData} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Hidden Report for Printing */}
      <div className="print-only">
        <Report ref={reportRef} data={analysisData} repoUrl={repoUrl} />
      </div>

      {/* Report Preview Modal */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-auto no-print"
            onClick={() => setShowReport(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="min-h-screen py-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-4xl mx-auto">
                {/* Close and Print buttons */}
                <div className="flex justify-end gap-3 mb-4 px-4 print:hidden">
                  <button
                    onClick={() => setShowReport(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                  >
                    Close Preview
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print / Save as PDF
                  </button>
                </div>
                
                {/* Report Preview */}
                <div className="shadow-2xl rounded-lg overflow-hidden">
                  <Report data={analysisData} repoUrl={repoUrl} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
