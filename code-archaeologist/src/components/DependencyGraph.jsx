import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const getNodeColor = (extension) => {
  const colorMap = {
    '.py': 'from-blue-500 to-blue-600',
    '.js': 'from-yellow-500 to-yellow-600',
    '.jsx': 'from-cyan-500 to-cyan-600',
    '.ts': 'from-blue-400 to-blue-500',
    '.tsx': 'from-cyan-400 to-cyan-500',
    '.java': 'from-red-500 to-red-600',
    '.go': 'from-teal-500 to-teal-600',
    '.rb': 'from-red-400 to-red-500',
    '.rs': 'from-orange-500 to-orange-600',
  }
  return colorMap[extension] || 'from-gray-500 to-gray-600'
}

const getFileExtension = (path) => {
  const match = path.match(/\.[^.]+$/)
  return match ? match[0] : ''
}

const DependencyNode = ({ file, imports, isSelected, onSelect, position, connectionCount }) => {
  const extension = getFileExtension(file)
  const fileName = file.split('/').pop()
  const gradient = getNodeColor(extension)
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: position * 0.05, type: 'spring', stiffness: 200 }}
      className={`
        relative p-4 rounded-xl cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-400/20' 
          : 'hover:ring-2 hover:ring-white/30'}
      `}
      onClick={() => onSelect(file)}
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Connection count badge */}
      {connectionCount > 0 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
          {connectionCount}
        </div>
      )}
      
      {/* File type indicator */}
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold mb-2 shadow-lg`}>
        {extension.replace('.', '').toUpperCase().slice(0, 2) || '?'}
      </div>
      
      {/* File name */}
      <div className="text-sm font-medium text-white truncate max-w-[120px]" title={fileName}>
        {fileName}
      </div>
      
      {/* Import count */}
      <div className="text-xs text-gray-400 mt-1">
        {imports.length} import{imports.length !== 1 ? 's' : ''}
      </div>
    </motion.div>
  )
}

const DependencyGraph = ({ data }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [filter, setFilter] = useState('all')
  
  // Process dependencies data - handle both formats
  const processedData = useMemo(() => {
    if (!data || typeof data !== 'object') return { nodes: [], edges: [], stats: {}, byType: {}, connectionCounts: {} }
    
    let nodes = []
    let edges = []
    const connectionCounts = {}
    
    // Check if data is in nodes/edges format from backend
    if (data.nodes && Array.isArray(data.nodes)) {
      // Backend format: { nodes: [...], edges: [...] }
      nodes = data.nodes.map(node => ({
        file: node.path || node.name,
        imports: [],
        id: node.id,
        type: node.type || getFileExtension(node.path || node.name).replace('.', '')
      }))
      
      // Create a map for quick lookup
      const nodeMap = {}
      data.nodes.forEach(node => {
        nodeMap[node.id] = node.path || node.name
      })
      
      // Process edges to populate imports
      if (data.edges && Array.isArray(data.edges)) {
        data.edges.forEach(edge => {
          const sourceFile = nodeMap[edge.source]
          const targetFile = nodeMap[edge.target]
          
          // Find the node and add import
          const sourceNode = nodes.find(n => n.file === sourceFile)
          if (sourceNode && targetFile) {
            sourceNode.imports.push(targetFile)
          }
          
          // Track connection counts
          connectionCounts[sourceFile] = (connectionCounts[sourceFile] || 0) + 1
          connectionCounts[targetFile] = (connectionCounts[targetFile] || 0) + 1
          
          edges.push({ from: sourceFile, to: targetFile })
        })
      }
    } else {
      // Legacy format: { file: [imports], ... }
      Object.entries(data).forEach(([file, imports]) => {
        if (!Array.isArray(imports)) return
        
        nodes.push({ file, imports })
        connectionCounts[file] = (connectionCounts[file] || 0) + imports.length
        
        imports.forEach(imp => {
          edges.push({ from: file, to: imp })
          connectionCounts[imp] = (connectionCounts[imp] || 0) + 1
        })
      })
    }
    
    // Count by file type
    const byType = {}
    nodes.forEach(({ file }) => {
      const ext = getFileExtension(file) || '.other'
      byType[ext] = (byType[ext] || 0) + 1
    })
    
    return { nodes, edges, connectionCounts, byType }
  }, [data])
  
  const filteredNodes = useMemo(() => {
    if (filter === 'all') return processedData.nodes
    return processedData.nodes.filter(({ file }) => getFileExtension(file) === filter)
  }, [processedData.nodes, filter])
  
  const selectedImports = useMemo(() => {
    if (!selectedFile || !processedData.nodes) return []
    const node = processedData.nodes.find(n => n.file === selectedFile)
    return node ? node.imports : []
  }, [selectedFile, processedData.nodes])
  
  const selectedImportedBy = useMemo(() => {
    if (!selectedFile || !processedData.nodes) return []
    return processedData.nodes
      .filter(n => n.imports && n.imports.includes(selectedFile))
      .map(n => n.file)
  }, [selectedFile, processedData.nodes])
  
  if (!data || (data.nodes && data.nodes.length === 0) || (!data.nodes && Object.keys(data).length === 0)) {
    return (
      <div className="text-center py-12 text-gray-400">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <p>No dependency data available</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Stats and filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
            <span className="text-white font-medium">{processedData.nodes.length}</span>
            <span className="text-gray-400">modules</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500" />
            <span className="text-white font-medium">{processedData.edges.length}</span>
            <span className="text-gray-400">connections</span>
          </div>
        </div>
        
        {/* Filter by type */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Filter:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'all' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            {Object.entries(processedData.byType).map(([ext, count]) => (
              <button
                key={ext}
                onClick={() => setFilter(ext)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  filter === ext ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {ext.replace('.', '')} ({count})
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex gap-6">
        {/* Nodes grid */}
        <div className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar p-2">
            {filteredNodes.map(({ file, imports }, idx) => (
              <DependencyNode
                key={file}
                file={file}
                imports={imports}
                isSelected={selectedFile === file}
                onSelect={setSelectedFile}
                position={idx}
                connectionCount={processedData.connectionCounts[file] || 0}
              />
            ))}
          </div>
        </div>
        
        {/* Details panel */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 280 }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              className="bg-black/40 rounded-xl border border-white/10 p-4 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium truncate">{selectedFile.split('/').pop()}</h3>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="text-xs text-gray-500 mb-4 truncate" title={selectedFile}>
                {selectedFile}
              </div>
              
              {/* Imports */}
              <div className="mb-4">
                <h4 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Imports ({selectedImports.length})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                  {selectedImports.length > 0 ? (
                    selectedImports.map((imp, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="text-xs text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded truncate"
                        title={imp}
                      >
                        {imp}
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 italic">No imports</div>
                  )}
                </div>
              </div>
              
              {/* Imported by */}
              <div>
                <h4 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  Imported by ({selectedImportedBy.length})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                  {selectedImportedBy.length > 0 ? (
                    selectedImportedBy.map((file, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded truncate cursor-pointer hover:bg-purple-400/20 transition-colors"
                        title={file}
                        onClick={() => setSelectedFile(file)}
                      >
                        {file.split('/').pop()}
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 italic">Not imported by any file</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default DependencyGraph
