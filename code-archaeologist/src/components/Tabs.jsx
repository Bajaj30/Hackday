import { useState } from 'react'
import { motion } from 'framer-motion'


function Tabs({ tabs }) {
  const [activeTab, setActiveTab] = useState(tabs[0].id)
  const activeTabData = tabs.find(tab => tab.id === activeTab)

  // If the content is a function, call it with setActiveTab
  const content = typeof activeTabData?.content === 'function'
    ? activeTabData.content({ setActiveTab })
    : activeTabData?.content

  return (
    <div className="relative rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 overflow-hidden backdrop-blur-xl">
      {/* Decorative glow */}
      <div className="absolute -top-20 right-1/4 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-1/4 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Tab Navigation */}
      <div className="relative flex border-b border-white/10 bg-black/30 overflow-x-auto">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative py-5 px-8 font-medium transition-all whitespace-nowrap text-sm group ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {/* Active indicator */}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-b from-purple-500/20 to-transparent"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabBorder"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-fuchsia-500"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="relative p-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {content}
        </motion.div>
      </div>
    </div>
  )
}

export default Tabs
