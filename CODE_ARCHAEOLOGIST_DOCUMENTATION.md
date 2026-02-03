# Code Archaeologist - Technical Documentation

## 🏛️ Project Overview

**Code Archaeologist** is an AI-powered codebase analysis tool that helps developers understand any GitHub repository in seconds. It uses Google's Gemini AI to analyze code structure, detect patterns, identify technical debt, and generate comprehensive documentation.

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite | Build tool & dev server |
| Tailwind CSS v4 | Styling |
| Framer Motion | Animations |

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | Python web framework |
| Uvicorn | ASGI server |
| GitPython | Repository cloning |
| Google Generative AI SDK | Gemini API integration |

### AI Model
- **Model**: `gemini-3-pro-preview`
- **Provider**: Google AI (Gemini)

---

## 📁 Project Structure

```
gemhackday/
├── backend/                    # Python FastAPI backend
│   ├── main.py                # API endpoints
│   ├── gemini_client.py       # Gemini AI integration
│   ├── utils.py               # Utility functions
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # API keys (not in git)
│
├── code-archaeologist/         # React frontend
│   ├── src/
│   │   ├── App.jsx            # Main application
│   │   ├── App.css            # Custom styles
│   │   ├── index.css          # Global styles
│   │   └── components/
│   │       ├── Tabs.jsx       # Tab navigation
│   │       ├── Chat.jsx       # AI chat interface
│   │       ├── FileTree.jsx   # File structure viewer
│   │       ├── DependencyGraph.jsx  # Dependencies visualization
│   │       ├── AIDetection.jsx      # AI code detection
│   │       └── Report.jsx     # PDF report generator
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── .venv/                      # Python virtual environment
```

---

## 🔌 API Endpoints

### `GET /`
Health check endpoint.
```json
{ "status": "healthy", "service": "Code Archaeologist API" }
```

### `POST /analyze`
Analyzes a GitHub repository.

**Request:**
```json
{
  "repo": "https://github.com/username/repo.git"
}
```

**Response:**
```json
{
  "modules": { "module_name": "description" },
  "architecture": "Architecture analysis...",
  "technical_debt": "Technical debt findings...",
  "onboarding_guide": "Getting started guide...",
  "file_tree": { "name": "root", "children": [...] },
  "dependencies": { "nodes": [...], "edges": [...] },
  "ai_detection": { "ai_percentage": 25, "human_percentage": 75, ... }
}
```

### `POST /chat`
Chat about an analyzed repository.

**Request:**
```json
{
  "repo": "https://github.com/username/repo.git",
  "question": "How does the authentication work?",
  "history": []
}
```

---

## ✨ Features

### 1. Repository Overview
**File:** `App.jsx` - Overview tab

Displays a high-level summary of the repository including:
- Repository name and URL
- Module breakdown with descriptions
- Key components identified

**Implementation:**
- Gemini analyzes code and returns structured JSON
- Frontend renders module cards with animations

---

### 2. System Architecture Analysis
**File:** `App.jsx` - Architecture tab

Deep analysis of codebase structure:
- Design patterns identified
- Component relationships
- Data flow analysis

**Implementation:**
```python
# gemini_client.py - build_prompt()
prompt = f"""Analyze this codebase and provide:
1. modules - key modules with descriptions
2. architecture - system architecture overview
3. technical_debt - issues and improvements
4. onboarding_guide - getting started guide
"""
```

---

### 3. Technical Debt Detection
**File:** `App.jsx` - Tech Debt tab

Identifies code quality issues:
- Code smells
- Deprecated patterns
- Missing documentation
- Potential bugs

**Visual Design:**
- Orange/red gradient theme
- Severity indicators
- Actionable recommendations

---

### 4. Developer Onboarding Guide
**File:** `App.jsx` - Onboarding tab

Auto-generated getting started guide:
- Setup instructions
- Key files to understand first
- Architecture overview for newcomers

---

### 5. Interactive File Tree
**File:** `components/FileTree.jsx`

Hierarchical visualization of repository structure:
- Expandable/collapsible folders
- File type icons with colors
- File size display on hover
- File/folder count statistics

**Implementation:**
```python
# utils.py - get_file_tree()
def get_file_tree(repo_path: str) -> dict:
    """Generate hierarchical file tree structure."""
    def build_tree(path, base_path):
        return {
            "name": path.name,
            "type": "folder" if path.is_dir() else "file",
            "children": [...],
            "size": path.stat().st_size
        }
```

**Supported Extensions:**
`.py`, `.js`, `.jsx`, `.ts`, `.tsx`, `.java`, `.go`, `.rs`, `.rb`, `.php`, `.cs`, `.cpp`, `.c`, `.h`, `.hpp`, `.swift`, `.kt`, `.html`, `.css`, `.scss`, `.json`, `.yaml`, `.yml`, `.md`, `.ipynb`, `.r`, `.R`, `.jl`

---

### 6. Dependency Graph
**File:** `components/DependencyGraph.jsx`

Visualizes import relationships between files:
- Interactive node cards for each file
- Connection count badges
- Filter by file type
- Click to see imports and "imported by"

**Implementation:**
```python
# utils.py - extract_dependencies()
def extract_dependencies(repo_path: str) -> dict:
    """Extract import relationships from code files."""
    # Returns: { "nodes": [...], "edges": [...] }
    
# extract_imports_from_content()
# - Python: import X, from X import Y
# - JS/TS: import X from 'Y', require('Y')
```

---

### 7. AI Code Detection 🤖
**File:** `components/AIDetection.jsx`

Analyzes code to detect AI-generated patterns:

**Detection Indicators:**
1. Overly verbose comments
2. Generic variable naming
3. Boilerplate patterns
4. Consistent formatting
5. Defensive programming
6. Tutorial-style code
7. Placeholder text
8. Repetitive structures
9. Common AI phrases
10. Missing project-specific context

**Display Components:**
- Animated circular gauge (AI vs Human %)
- Confidence indicator (low/medium/high)
- Color-coded status labels
- Detection breakdown scores
- Specific indicators found with examples
- Recommendations

**Implementation:**
```python
# gemini_client.py - detect_ai_generated_code()
def detect_ai_generated_code(repo_content: str) -> dict:
    prompt = """Analyze code for AI-generated patterns...
    Return: {
        "ai_percentage": 0-100,
        "confidence": "low|medium|high",
        "indicators_found": [...],
        "details": {...},
        "recommendation": "..."
    }
    """
```

---

### 8. AI Chat Interface
**File:** `components/Chat.jsx`

Interactive Q&A about the analyzed repository:
- Ask questions about the codebase
- Context-aware responses
- Chat history maintained
- Code-specific answers

**Implementation:**
```python
# gemini_client.py - chat_about_repo()
def chat_about_repo(repo_content, repo_url, question, history):
    prompt = f"""You are an expert code assistant...
    Repository Content: {repo_content}
    Previous conversation: {history}
    User's question: {question}
    """
```

---

### 9. PDF Report Export
**File:** `components/Report.jsx`

Comprehensive printable documentation:

**Report Sections:**
1. 📁 Repository Information
2. 🧩 Modules Overview
3. 🏗️ System Architecture
4. ⚠️ Technical Debt Analysis
5. 🚀 Developer Onboarding Guide
6. 📂 Project Structure
7. 🔗 Module Dependencies
8. 🤖 AI Code Detection

**Implementation:**
- Hidden `<Report>` component rendered for print
- Custom print CSS hides app UI
- `window.print()` triggers browser print dialog
- User can "Save as PDF" from print dialog

**Print Styles:**
```css
@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  .report-container { background: white !important; }
}
```

---

## 🎨 UI/UX Design

### Visual Theme
- **Background:** Dark (`#030014`)
- **Accent Colors:** Purple, Cyan, Pink gradients
- **Style:** Glassmorphism with backdrop blur

### Animations
- Gradient orb backgrounds (pulsing)
- Mouse-follow glow effect
- Tab transitions with Framer Motion
- Progress indicators during analysis
- Animated gauges and charts

### Components
```jsx
// Animated background orbs
<div className="bg-purple-600/30 rounded-full blur-[128px] animate-pulse" />

// Glassmorphism cards
<div className="bg-white/[0.08] border border-white/10 backdrop-blur-xl" />

// Gradient buttons
<button className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600" />
```

---

## 🔧 Configuration

### Environment Variables
```env
# backend/.env
GEMINI_API_KEY=AIzaSy...your-api-key
```

### Supported File Types
```python
CODE_EXTENSIONS = {
    '.py', '.js', '.jsx', '.ts', '.tsx',  # Main languages
    '.java', '.go', '.rs', '.rb', '.php',  # Backend
    '.cpp', '.c', '.h', '.hpp',            # Systems
    '.html', '.css', '.scss',              # Web
    '.json', '.yaml', '.yml', '.md',       # Config/docs
    '.ipynb', '.r', '.R', '.jl'            # Data science
}
```

### Excluded Directories
```python
EXCLUDE_DIRS = {
    'node_modules', '.git', '__pycache__',
    'venv', 'env', '.venv', 'dist', 'build',
    'target', '.idea', '.vscode', 'coverage'
}
```

---

## 🚀 Running the Application

### Backend
```bash
cd backend
..\.venv\Scripts\Activate.ps1  # Windows
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd code-archaeologist
npm run dev
```

### Access
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 📊 Data Flow

```
┌─────────────────┐
│   User enters   │
│   GitHub URL    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  POST /analyze  │
│   (FastAPI)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Clone repo     │
│  (GitPython)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Read & parse   │
│  code files     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ Gemini │ │ Local  │
│Analysis│ │ Utils  │
└───┬────┘ └───┬────┘
    │          │
    ▼          ▼
┌────────┐ ┌────────┐
│modules │ │file_tree│
│arch    │ │deps    │
│debt    │ │ai_detect│
│guide   │ │        │
└───┬────┘ └───┬────┘
    │          │
    └────┬─────┘
         │
         ▼
┌─────────────────┐
│  JSON Response  │
│  to Frontend    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  React renders  │
│  tabbed UI      │
└─────────────────┘
```

---

## 🔒 Error Handling

### Backend Exceptions
```python
class InvalidRepoError(Exception):
    """Invalid repository URL"""

class CloneFailedError(Exception):
    """Git clone failed"""

class GeminiAPIError(Exception):
    """Gemini API call failed"""

class GeminiTimeoutError(GeminiAPIError):
    """Request timed out"""
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Invalid URL or empty repo |
| 502 | Gemini API error |
| 503 | Connection error |
| 504 | Timeout |

---

## 🏆 Unique Selling Points

1. **AI-Powered Analysis** - Uses Gemini to understand code semantics, not just syntax
2. **AI Code Detection** - Unique feature to detect AI-generated code percentages
3. **Interactive Visualizations** - File tree and dependency graphs
4. **One-Click Documentation** - Export comprehensive PDF reports
5. **Real-Time Chat** - Ask questions about any codebase
6. **Beautiful UI** - Modern glassmorphism design with animations
7. **Multi-Language Support** - Python, JS/TS, Java, Go, Rust, R, Julia, Jupyter notebooks

---

## 📝 License

This project was created for the Google Gemini Hackathon.


