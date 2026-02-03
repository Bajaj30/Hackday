from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import asyncio
import json

from gemini_client import call_gemini, build_prompt, chat_about_repo, detect_ai_generated_code, GeminiAPIError, GeminiTimeoutError, GeminiConnectionError
from utils import clone_repo, read_code_files, cleanup_repository, validate_github_url, InvalidRepoError, CloneFailedError, EmptyRepoError, get_file_tree, extract_dependencies

# Initialize FastAPI app
app = FastAPI(
    title="Code Archaeologist API",
    description="AI-powered codebase analysis using Gemini",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Database imports
from db import SessionLocal, RepoAnalysis, Base, engine
from sqlalchemy.orm import Session

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables if not exist (run once at startup)
Base.metadata.create_all(bind=engine)


# Request/Response Models
class AnalyzeRequest(BaseModel):
    repo: str = Field(..., description="GitHub repository URL (e.g., https://github.com/username/repo.git)")


class AnalyzeResponse(BaseModel):
    modules: dict
    architecture: str
    technical_debt: str
    technical_debt_suggestions: str
    onboarding_guide: str


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    repo: str = Field(..., description="GitHub repository URL")
    question: str = Field(..., description="User's question about the repository")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Chat history")


class ChatResponse(BaseModel):
    response: str


# Health check endpoint
@app.get("/")
async def root():
    return {"status": "healthy", "service": "Code Archaeologist API"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}


# Main analyze endpoint
from fastapi import Depends

@app.post("/analyze")
async def analyze_repo(request: AnalyzeRequest, db: Session = Depends(get_db)):
    """
    Analyze a GitHub repository using Gemini AI.
    
    1. Receive repo URL
    2. Clone repo
    3. Read code files
    4. Build Gemini prompt
    5. Call Gemini hub API
    6. Return Gemini response as JSON
    """
    repo_url = request.repo.strip()
    
    # Validate URL
    if not validate_github_url(repo_url):
        raise HTTPException(
            status_code=400, 
            detail="Invalid GitHub URL. Use format: https://github.com/username/repo.git"
        )
    
    # Check if analysis exists in DB
    existing = db.query(RepoAnalysis).filter(RepoAnalysis.repo_url == repo_url).first()
    if existing:
        return {
            "modules": json.loads(existing.modules),
            "architecture": existing.architecture,
            "technical_debt": existing.technical_debt,
            "technical_debt_suggestions": getattr(existing, "technical_debt_suggestions", ""),
            "onboarding_guide": existing.onboarding_guide,
            # Optionally add file_tree, dependencies, ai_detection if you store them
        }

    repo_path = None
    try:
        # 1. Clone repository
        print(f"Step 1: Cloning repository: {repo_url}")
        try:
            repo_path = await asyncio.to_thread(clone_repo, repo_url)
        except InvalidRepoError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except CloneFailedError as e:
            raise HTTPException(status_code=502, detail=str(e))
        
        # 2. Read code files
        print("Step 2: Reading code files...")
        try:
            code_text = await asyncio.to_thread(read_code_files, repo_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read repository files: {str(e)}")
        
        if not code_text:
            raise HTTPException(
                status_code=400, 
                detail="Repository appears to be empty or has no supported code files. "
                       "Supported extensions: .py, .js, .ts, .java, .cpp, .c, .html, .css"
            )
        
        # Extract repo name from URL
        repo_name = repo_url.rstrip('/').rstrip('.git').split('/')[-1]
        
        # 3. Build Gemini prompt
        print("Step 3: Building prompt...")
        prompt = build_prompt(code_text, repo_name)
        

        # Save code_text for chat endpoint (optional: you can store in DB if needed)
        chat_content = code_text
        
        # 3.5 Extract file tree and dependencies
        print("Step 3.5: Extracting file tree and dependencies...")
        try:
            file_tree = await asyncio.to_thread(get_file_tree, repo_path)
            dependencies = await asyncio.to_thread(extract_dependencies, repo_path)
        except Exception as e:
            print(f"Warning: Failed to extract file tree/dependencies: {e}")
            file_tree = {"name": "root", "type": "folder", "children": []}
            dependencies = {"nodes": [], "edges": []}
        
        # 3.6 Detect AI-generated code
        print("Step 3.6: Detecting AI-generated code...")
        try:
            ai_detection = await asyncio.to_thread(detect_ai_generated_code, code_text)
        except Exception as e:
            print(f"Warning: Failed to detect AI code: {e}")
            ai_detection = {
                "ai_percentage": 0,
                "human_percentage": 100,
                "confidence": "low",
                "indicators_found": [],
                "summary": "Detection unavailable",
                "details": {},
                "recommendation": ""
            }
        
        # 4. Call Gemini hub API
        print("Step 4: Calling Gemini API...")
        try:
            gemini_response = await asyncio.to_thread(call_gemini, prompt)
        except GeminiTimeoutError as e:
            raise HTTPException(status_code=504, detail=str(e))
        except GeminiConnectionError as e:
            raise HTTPException(status_code=503, detail=str(e))
        except GeminiAPIError as e:
            raise HTTPException(status_code=502, detail=str(e))
        
        # 5. Parse and return JSON response
        print("Step 5: Parsing response...")
        try:
            # Try to parse as JSON
            result = json.loads(gemini_response)
        except json.JSONDecodeError:
            # If not valid JSON, wrap the response
            result = {
                "architecture": gemini_response,
                "modules": {},
                "technical_debt": "",
                "onboarding_guide": ""
            }
        
        # Add file tree and dependencies to result
        result["file_tree"] = file_tree
        result["dependencies"] = dependencies
        result["ai_detection"] = ai_detection
        
        # Save analysis to DB
        analysis = RepoAnalysis(
            repo_url=repo_url,
            modules=json.dumps(result.get("modules", {})),
            architecture=result.get("architecture", ""),
            technical_debt=result.get("technical_debt", ""),
            onboarding_guide=result.get("onboarding_guide", ""),
            technical_debt_suggestions=result.get("technical_debt_suggestions", "")
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    
    finally:
        # Cleanup cloned repo
        if repo_path:
            await asyncio.to_thread(cleanup_repository, repo_path)



# Chat endpoint
@app.post("/chat", response_model=ChatResponse)
async def chat_with_repo(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Chat about an analyzed repository using Gemini AI.
    """
    repo_url = request.repo.strip()

    # Check if repo was analyzed
    analysis = db.query(RepoAnalysis).filter(RepoAnalysis.repo_url == repo_url).first()
    if not analysis:
        raise HTTPException(
            status_code=400,
            detail="Repository not found. Please analyze it first using /analyze endpoint."
        )

    # You may want to store code_text in DB for chat, or re-run code extraction if needed
    # For now, just return a placeholder or error if not available
    repo_content = ""  # TODO: Store/retrieve code_text for chat if needed
    history = [{"role": msg.role, "content": msg.content} for msg in request.history]

    try:
        response = await asyncio.to_thread(
            chat_about_repo,
            repo_content,
            repo_url,
            request.question,
            history
        )
        return ChatResponse(response=response)

    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


# Run with: uvicorn main:app --reload --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
