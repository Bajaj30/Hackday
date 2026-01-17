import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Custom Exceptions
class GeminiAPIError(Exception):
    """Raised when the Gemini API call fails."""
    pass


class GeminiTimeoutError(GeminiAPIError):
    """Raised when the Gemini API request times out."""
    pass


class GeminiConnectionError(GeminiAPIError):
    """Raised when unable to connect to Gemini API."""
    pass


class GeminiAPIKeyMissingError(GeminiAPIError):
    """Raised when GEMINI_API_KEY environment variable is missing."""
    pass


# Check for API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise GeminiAPIKeyMissingError(
        "GEMINI_API_KEY environment variable is required. "
        "Set it in your .env file or export it as an environment variable."
    )

# Configure Gemini API with API key
genai.configure(api_key=GEMINI_API_KEY)

# Initialize the Gemini model
model = genai.GenerativeModel("gemini-3-pro-preview")


def call_gemini(prompt_text: str) -> str:
    """
    Call Gemini API using the Google Generative AI SDK.
    
    Args:
        prompt_text: The prompt to send to Gemini
    
    Returns:
        Response text from Gemini
    """
    if not prompt_text or not isinstance(prompt_text, str):
        raise GeminiAPIError("Prompt cannot be empty")
    
    try:
        print(f"Calling Gemini with prompt length: {len(prompt_text)} chars")
        response = model.generate_content(prompt_text)
        print(f"Gemini response received")
        
        if not response.text:
            raise GeminiAPIError("Gemini API returned an empty response")
        
        return response.text
    
    except Exception as e:
        print(f"GEMINI ERROR: {type(e).__name__}: {str(e)}")
        error_msg = str(e).lower()
        
        if "timeout" in error_msg:
            raise GeminiTimeoutError(
                "Gemini API request timed out. "
                "The repository may be too large. Try a smaller repository."
            )
        elif "quota" in error_msg or "rate" in error_msg:
            raise GeminiAPIError(
                "Gemini API rate limit exceeded. Please wait a moment and try again."
            )
        elif "invalid" in error_msg and "key" in error_msg:
            raise GeminiAPIError(
                "Invalid Gemini API key. Please check your GEMINI_API_KEY environment variable."
            )
        elif "connection" in error_msg or "network" in error_msg:
            raise GeminiConnectionError(
                "Unable to connect to Gemini API. "
                "Please check your internet connection and try again."
            )
        else:
            raise GeminiAPIError(f"Gemini API request failed: {str(e)}")


def build_prompt(code_text: str, repo_name: str) -> str:
    """
    Build a prompt for Gemini to analyze a repository.
    
    Args:
        code_text: Concatenated code from the repository
        repo_name: Name of the repository
    
    Returns:
        Formatted prompt string
    """
    return f"""You are a senior software architect analyzing the repository "{repo_name}".

Analyze the code and return ONLY a valid JSON object (no markdown, no code blocks, no extra text) with this exact structure:

{{
    "modules": {{
        "module_name": "Brief description of what this module/folder does"
    }},
    "architecture": "A detailed markdown description of the system architecture including: overall structure, design patterns, how components interact, and technology stack used.",
    "technical_debt": "A markdown list of technical debt items: code quality issues, missing tests, security concerns, performance issues. If none found, explain why the code is well-maintained.",
    "onboarding_guide": "A markdown guide for new developers: how to set up the environment, key files to understand, how to run the project, and how to contribute."
}}

Return ONLY the JSON object, nothing else.

Code to analyze:
{code_text}"""


def analyze_repository(repo_content: str, repo_url: str) -> dict:
    """
    Analyze a repository using Gemini AI.
    Returns structured analysis with modules, architecture, tech debt, and onboarding guide.
    """
    
    prompt = f"""You are an expert code analyst. Analyze the following GitHub repository and provide a comprehensive analysis.

Repository URL: {repo_url}

Repository Content:
{repo_content}

Provide your analysis in the following JSON format (return ONLY valid JSON, no markdown):
{{
    "modules": {{
        "module_name_1": "Description of what this module does",
        "module_name_2": "Description of what this module does"
    }},
    "architecture": "A detailed markdown description of the system architecture, including:\\n- Overall structure\\n- Key design patterns used\\n- How components interact\\n- Technology stack",
    "technical_debt": "A markdown list of technical debt items found, including:\\n- Code quality issues\\n- Missing tests\\n- Outdated dependencies\\n- Security concerns\\n- Performance issues",
    "onboarding_guide": "A markdown guide for new developers including:\\n- How to set up the development environment\\n- Key files and folders to understand first\\n- How to run the project\\n- How to contribute"
}}

Be thorough and specific in your analysis. Reference actual file names and code patterns you observe.
"""

    try:
        response_text = call_gemini(prompt)
        
        # Clean up response - remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        import json
        return json.loads(response_text.strip())
    
    except Exception as e:
        print(f"Gemini analysis error: {e}")
        return {
            "modules": {"error": "Failed to analyze modules"},
            "architecture": f"Analysis failed: {str(e)}",
            "technical_debt": "Unable to analyze technical debt",
            "onboarding_guide": "Unable to generate onboarding guide"
        }


def chat_about_repo(repo_content: str, repo_url: str, question: str, history: list) -> str:
    """
    Answer questions about the repository using Gemini AI.
    """
    
    # Build conversation history
    history_text = ""
    for msg in history[-10:]:  # Keep last 10 messages for context
        role = "User" if msg.get("role") == "user" else "Assistant"
        history_text += f"{role}: {msg.get('content', '')}\n"
    
    prompt = f"""You are an expert code assistant helping a developer understand a codebase.

Repository URL: {repo_url}

Repository Content:
{repo_content}

Previous conversation:
{history_text}

User's question: {question}

Provide a helpful, specific answer based on the actual code in the repository. Reference specific files, functions, or patterns when relevant. Keep your response concise but informative.
"""

    try:
        return call_gemini(prompt)
    except Exception as e:
        print(f"Gemini chat error: {e}")
        return f"Sorry, I encountered an error: {str(e)}"


def detect_ai_generated_code(repo_content: str) -> dict:
    """
    Analyze code to detect patterns typical of AI-generated code.
    Returns percentage estimates and indicators.
    """
    
    prompt = f"""You are an expert code analyst specializing in detecting AI-generated code.

Analyze the following codebase and estimate what percentage of the code appears to be AI-generated.

Look for these AI-generated code indicators:
1. **Overly verbose comments** - AI tends to over-explain simple operations
2. **Generic variable naming** - names like 'data', 'result', 'item', 'temp'
3. **Boilerplate patterns** - standard templates without customization
4. **Consistent formatting** - unnaturally perfect indentation and spacing
5. **Defensive programming** - excessive error handling for simple cases
6. **Tutorial-style code** - explanatory comments that read like documentation
7. **Placeholder text** - comments like "TODO: implement this" or "Add your logic here"
8. **Repetitive structures** - similar code blocks with minor variations
9. **Common AI phrases** - "This function does X", "Here we handle", "Below we"
10. **Missing project-specific context** - code that feels generic

Repository Code:
{repo_content[:80000]}

Respond ONLY with valid JSON in this exact format:
{{
    "ai_percentage": <number 0-100>,
    "confidence": "<low|medium|high>",
    "human_percentage": <number 0-100>,
    "indicators_found": [
        {{
            "indicator": "<indicator name>",
            "severity": "<low|medium|high>",
            "examples": ["<specific example from code>"],
            "file_pattern": "<where this was found>"
        }}
    ],
    "summary": "<2-3 sentence summary of findings>",
    "details": {{
        "comment_style_score": <0-100>,
        "naming_convention_score": <0-100>,
        "code_structure_score": <0-100>,
        "documentation_pattern_score": <0-100>
    }},
    "recommendation": "<advice for the developer>"
}}
"""

    try:
        response_text = call_gemini(prompt)
        
        # Clean up response
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        import json
        result = json.loads(response_text.strip())
        
        # Ensure human_percentage is correct
        if "ai_percentage" in result:
            result["human_percentage"] = 100 - result["ai_percentage"]
        
        return result
    
    except Exception as e:
        print(f"AI detection error: {e}")
        return {
            "ai_percentage": 0,
            "human_percentage": 100,
            "confidence": "low",
            "indicators_found": [],
            "summary": f"Unable to analyze: {str(e)}",
            "details": {
                "comment_style_score": 50,
                "naming_convention_score": 50,
                "code_structure_score": 50,
                "documentation_pattern_score": 50
            },
            "recommendation": "Analysis could not be completed."
        }
