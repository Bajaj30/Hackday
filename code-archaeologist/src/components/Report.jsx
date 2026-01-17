import { forwardRef } from 'react'

const Report = forwardRef(({ data, repoUrl }, ref) => {
  if (!data) return null

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const repoName = repoUrl?.split('/').pop()?.replace('.git', '') || 'Repository'

  // Count files from file tree
  const countFiles = (node) => {
    if (!node) return { files: 0, folders: 0 }
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

  const fileStats = data.file_tree ? countFiles(data.file_tree) : { files: 0, folders: 0 }
  const depStats = data.dependencies?.nodes?.length || 0

  return (
    <div ref={ref} className="report-container bg-white text-black p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="report-header border-b-4 border-indigo-600 pb-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-indigo-600 mb-2">Code Archaeologist</h1>
            <p className="text-gray-500 text-lg">AI-Powered Codebase Analysis Report</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Generated on</p>
            <p className="text-lg font-semibold text-gray-700">{currentDate}</p>
          </div>
        </div>
      </div>

      {/* Repository Info */}
      <div className="report-section mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-indigo-700 mb-4">📁 Repository Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Repository Name</p>
            <p className="text-xl font-semibold text-gray-800">{repoName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Source URL</p>
            <p className="text-sm font-mono text-gray-600 break-all">{repoUrl}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Files</p>
            <p className="text-xl font-semibold text-gray-800">{fileStats.files}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Folders</p>
            <p className="text-xl font-semibold text-gray-800">{fileStats.folders}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Modules Analyzed</p>
            <p className="text-xl font-semibold text-gray-800">{depStats}</p>
          </div>
        </div>
      </div>

      {/* Modules Overview */}
      {data.modules && Object.keys(data.modules).length > 0 && (
        <div className="report-section mb-8 page-break-inside-avoid">
          <h2 className="text-2xl font-bold text-indigo-700 mb-4 border-b-2 border-indigo-200 pb-2">
            🧩 Modules Overview
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(data.modules).map(([name, info]) => (
              <div key={name} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-indigo-600 mb-1">{name}</h3>
                <p className="text-sm text-gray-600">
                  {typeof info === 'string' ? info : info.description || 'Core module'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Architecture */}
      {data.architecture && (
        <div className="report-section mb-8 page-break-before">
          <h2 className="text-2xl font-bold text-indigo-700 mb-4 border-b-2 border-indigo-200 pb-2">
            🏗️ System Architecture
          </h2>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
              {typeof data.architecture === 'string' 
                ? data.architecture 
                : JSON.stringify(data.architecture, null, 2)}
            </div>
          </div>
        </div>
      )}

      {/* Technical Debt */}
      {data.technical_debt && (
        <div className="report-section mb-8 page-break-before">
          <h2 className="text-2xl font-bold text-orange-600 mb-4 border-b-2 border-orange-200 pb-2">
            ⚠️ Technical Debt Analysis
          </h2>
          <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
            {typeof data.technical_debt === 'string' ? (
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                {data.technical_debt}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(data.technical_debt).map(([key, value]) => (
                  <div key={key} className="border-l-4 border-orange-400 pl-4">
                    <h3 className="font-semibold text-orange-700 capitalize mb-1">{key}</h3>
                    <p className="text-gray-600">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Onboarding Guide */}
      {data.onboarding_guide && (
        <div className="report-section mb-8 page-break-before">
          <h2 className="text-2xl font-bold text-green-600 mb-4 border-b-2 border-green-200 pb-2">
            🚀 Developer Onboarding Guide
          </h2>
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
              {typeof data.onboarding_guide === 'string'
                ? data.onboarding_guide
                : JSON.stringify(data.onboarding_guide, null, 2)}
            </div>
          </div>
        </div>
      )}

      {/* File Structure Summary */}
      {data.file_tree && data.file_tree.children && data.file_tree.children.length > 0 && (
        <div className="report-section mb-8 page-break-before">
          <h2 className="text-2xl font-bold text-indigo-700 mb-4 border-b-2 border-indigo-200 pb-2">
            📂 Project Structure
          </h2>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 font-mono text-sm">
            <FileTreePrint node={data.file_tree} depth={0} />
          </div>
        </div>
      )}

      {/* Dependencies Summary */}
      {data.dependencies?.nodes && data.dependencies.nodes.length > 0 && (
        <div className="report-section mb-8 page-break-before">
          <h2 className="text-2xl font-bold text-indigo-700 mb-4 border-b-2 border-indigo-200 pb-2">
            🔗 Module Dependencies
          </h2>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">
              <strong>{data.dependencies.nodes.length}</strong> modules with{' '}
              <strong>{data.dependencies.edges?.length || 0}</strong> internal dependencies
            </p>
            <div className="grid grid-cols-3 gap-2">
              {data.dependencies.nodes.slice(0, 30).map((node, idx) => (
                <div key={idx} className="text-sm text-gray-600 truncate">
                  • {node.path || node.name}
                </div>
              ))}
              {data.dependencies.nodes.length > 30 && (
                <div className="text-sm text-gray-400 italic">
                  ... and {data.dependencies.nodes.length - 30} more
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Detection Summary */}
      {data.ai_detection && (
        <div className="report-section mb-8 page-break-before">
          <h2 className="text-2xl font-bold text-purple-700 mb-4 border-b-2 border-purple-200 pb-2">
            🤖 AI Code Detection
          </h2>
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center gap-8 mb-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-700">
                  {data.ai_detection.ai_percentage || 0}%
                </div>
                <div className="text-sm text-purple-500">AI Generated</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-700">
                  {data.ai_detection.human_percentage || 100}%
                </div>
                <div className="text-sm text-cyan-500">Human Written</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-700 capitalize">
                  {data.ai_detection.confidence || 'N/A'}
                </div>
                <div className="text-sm text-gray-500">Confidence</div>
              </div>
            </div>
            {data.ai_detection.summary && (
              <p className="text-gray-600 mb-4">{data.ai_detection.summary}</p>
            )}
            {data.ai_detection.recommendation && (
              <div className="bg-white p-4 rounded-lg border border-purple-100">
                <strong className="text-purple-600">Recommendation:</strong>
                <p className="text-gray-600 mt-1">{data.ai_detection.recommendation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="report-footer mt-12 pt-6 border-t-2 border-gray-200 text-center text-gray-400">
        <p className="text-sm">
          Generated by <strong className="text-indigo-500">Code Archaeologist</strong> • 
          Powered by Google Gemini AI
        </p>
        <p className="text-xs mt-1">
          This report provides an AI-generated analysis of the codebase. 
          Review findings with appropriate technical judgment.
        </p>
      </div>
    </div>
  )
})

// Helper component for file tree printing
const FileTreePrint = ({ node, depth }) => {
  if (!node) return null
  
  const indent = '│   '.repeat(depth)
  const prefix = depth === 0 ? '' : (node.type === 'folder' ? '├── 📁 ' : '├── 📄 ')
  
  return (
    <div>
      {depth > 0 && (
        <div className="text-gray-600">
          {indent}{prefix}{node.name}
        </div>
      )}
      {node.children && node.children.slice(0, 50).map((child, idx) => (
        <FileTreePrint key={idx} node={child} depth={depth + (depth === 0 ? 0 : 1)} />
      ))}
      {node.children && node.children.length > 50 && (
        <div className="text-gray-400 italic">
          {indent}    ... and {node.children.length - 50} more items
        </div>
      )}
    </div>
  )
}

Report.displayName = 'Report'

export default Report
