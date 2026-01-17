# Code Archaeologist - Backend

FastAPI backend for Code Archaeologist. Analyzes GitHub repositories using Gemini AI.

## Setup

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # or: source venv/bin/activate  # Mac/Linux
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set GEMINI_API_KEY environment variable:**
   
   Get your API key from [Google AI Studio](https://aistudio.google.com/apikey), then:
   
   **Option A: Create a `.env` file (recommended)**
   ```bash
   echo GEMINI_API_KEY=your_api_key_here > .env
   ```
   
   **Option B: Set environment variable directly**
   ```bash
   # Windows PowerShell
   $env:GEMINI_API_KEY="your_api_key_here"
   
   # Windows CMD
   set GEMINI_API_KEY=your_api_key_here
   
   # Mac/Linux
   export GEMINI_API_KEY=your_api_key_here
   ```
   
   ⚠️ **Important:** The backend will not start without a valid `GEMINI_API_KEY`.

4. **Run the server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

## API Endpoints

### POST /analyze
Analyze a GitHub repository.

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
  "architecture": "Markdown description of architecture",
  "technical_debt": "Markdown list of tech debt items",
  "onboarding_guide": "Markdown onboarding guide"
}
```

### POST /chat
Chat about an analyzed repository.

**Request:**
```json
{
  "repo": "https://github.com/username/repo.git",
  "question": "How does the authentication work?",
  "history": []
}
```

**Response:**
```json
{
  "response": "The authentication system uses..."
}
```

## Project Structure

```
backend/
├── main.py           # FastAPI app with endpoints
├── gemini_client.py  # Gemini AI integration
├── utils.py          # Git cloning & file parsing
├── requirements.txt  # Python dependencies
├── .env.example      # Environment template
└── README.md         # This file
```
