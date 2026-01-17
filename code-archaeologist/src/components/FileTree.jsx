import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// File type icons and colors
const getFileIcon = (extension, type) => {
  if (type === 'folder') {
    return (
      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      </svg>
    )
  }
  
  const iconMap = {
    '.py': { color: 'text-blue-400', icon: '🐍' },
    '.js': { color: 'text-yellow-400', icon: '📜' },
    '.jsx': { color: 'text-cyan-400', icon: '⚛️' },
    '.ts': { color: 'text-blue-500', icon: '📘' },
    '.tsx': { color: 'text-blue-400', icon: '⚛️' },
    '.html': { color: 'text-orange-400', icon: '🌐' },
    '.css': { color: 'text-purple-400', icon: '🎨' },
    '.json': { color: 'text-yellow-300', icon: '📋' },
    '.md': { color: 'text-gray-400', icon: '📝' },
    '.java': { color: 'text-red-400', icon: '☕' },
    '.go': { color: 'text-cyan-400', icon: '🔷' },
  }
  
  const config = iconMap[extension] || { color: 'text-gray-400', icon: '📄' }
  return <span className={`text-sm ${config.color}`}>{config.icon}</span>
}

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const TreeNode = ({ node, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(depth < 2)
  const hasChildren = node.children && node.children.length > 0
  
  return (
    <div className="select-none">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: depth * 0.02 }}
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
      >
        {/* Expand/collapse arrow for folders */}
        {node.type === 'folder' && (
          <motion.svg
            animate={{ rotate: isOpen ? 90 : 0 }}
            className="w-3 h-3 text-gray-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </motion.svg>
        )}
        {node.type !== 'folder' && <div className="w-3" />}
        
        {/* Icon */}
        {getFileIcon(node.extension, node.type)}
        
        {/* Name */}
        <span className={`text-sm ${node.type === 'folder' ? 'text-white font-medium' : 'text-gray-300'}`}>
          {node.name}
        </span>
        
        {/* File size */}
        {node.type === 'file' && node.size && (
          <span className="text-xs text-gray-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            {formatSize(node.size)}
          </span>
        )}
        
        {/* Child count for folders */}
        {node.type === 'folder' && hasChildren && (
          <span className="text-xs text-gray-600 ml-auto">
            {node.children.length}
          </span>
        )}
      </motion.div>
      
      {/* Children */}
      <AnimatePresence>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {node.children.map((child, idx) => (
              <TreeNode key={child.path || idx} node={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const FileTree = ({ data }) => {
  if (!data || !data.children || data.children.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <p>No file structure available</p>
      </div>
    )
  }
  
  // Count stats
  const countFiles = (node) => {
    if (node.type === 'file') return { files: 1, folders: 0 }
    let stats = { files: 0, folders: 1 }
    if (node.children) {
      node.children.forEach(child => {
        const childStats = countFiles(child)
        stats.files += childStats.files
        stats.folders += childStats.folders
      })
    }
    return stats
  }
  const stats = countFiles(data)
  
  return (
    <div className="space-y-4">
      {/* Stats header */}
      <div className="flex items-center gap-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          <span className="text-white font-medium">{stats.folders}</span>
          <span className="text-gray-400">folders</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-white font-medium">{stats.files}</span>
          <span className="text-gray-400">files</span>
        </div>
      </div>
      
      {/* Tree */}
      <div className="bg-black/30 rounded-xl border border-white/10 p-4 max-h-[500px] overflow-y-auto custom-scrollbar">
        {data.children.map((child, idx) => (
          <TreeNode key={child.path || idx} node={child} depth={0} />
        ))}
      </div>
    </div>
  )
}

export default FileTree
