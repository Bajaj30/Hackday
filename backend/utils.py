import os
import shutil
import tempfile
from pathlib import Path
from git import Repo, GitCommandError, InvalidGitRepositoryError
import re


# Custom Exceptions
class InvalidRepoError(Exception):
    """Raised when the repository URL is invalid or malformed."""
    pass


class CloneFailedError(Exception):
    """Raised when repository cloning fails."""
    pass


class EmptyRepoError(Exception):
    """Raised when repository has no code files."""
    pass


def clone_repo(repo_url: str) -> str:
    """
    Clone a GitHub repository into a temporary folder using gitpython.
    
    Args:
        repo_url: GitHub repository URL (e.g., https://github.com/username/repo.git)
    
    Returns:
        Local path to the cloned repository
    """
    # Validate URL format first
    if not repo_url or not isinstance(repo_url, str):
        raise InvalidRepoError("Repository URL cannot be empty")
    
    # Check for valid GitHub URL pattern
    github_pattern = r'^https?://github\.com/[\w.-]+/[\w.-]+(\.git)?/?$'
    if not re.match(github_pattern, repo_url):
        raise InvalidRepoError(
            f"Invalid GitHub URL format: '{repo_url}'. "
            "Expected format: https://github.com/username/repository"
        )
    
    # Create a temporary directory
    temp_dir = tempfile.mkdtemp(prefix="code_archaeologist_")
    
    try:
        # Ensure URL ends with .git
        if not repo_url.endswith('.git'):
            repo_url = repo_url + '.git'
        
        # Clone the repository (shallow clone for speed)
        Repo.clone_from(repo_url, temp_dir, depth=1)
        return temp_dir
    
    except GitCommandError as e:
        # Clean up on failure
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        
        error_msg = str(e).lower()
        if "not found" in error_msg or "does not exist" in error_msg:
            raise InvalidRepoError(
                f"Repository not found: '{repo_url}'. "
                "Please check the URL and ensure the repository exists and is public."
            )
        elif "authentication" in error_msg or "permission" in error_msg:
            raise CloneFailedError(
                "Access denied. This repository may be private. "
                "Only public repositories are supported."
            )
        else:
            raise CloneFailedError(f"Git clone failed: {str(e)}")
    
    except InvalidGitRepositoryError:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        raise InvalidRepoError(
            f"'{repo_url}' is not a valid Git repository."
        )
    
    except Exception as e:
        # Clean up on any other failure
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        raise CloneFailedError(f"Failed to clone repository: {str(e)}")


def read_code_files(repo_path: str) -> str:
    """
    Read all code files from a repository and concatenate their contents.
    
    Args:
        repo_path: Local path to the cloned repository
    
    Returns:
        Single string containing all code file contents
    """
    # File extensions to include
    CODE_EXTENSIONS = {'.py', '.js', '.ts', '.java', '.cpp', '.c', '.html', '.css', '.ipynb', '.jsx', '.tsx'}
    
    # Directories to exclude
    EXCLUDE_DIRS = {
        'node_modules', '.git', '__pycache__', 'venv', 'env', '.venv',
        'dist', 'build', 'target', '.idea', '.vscode', 'coverage',
        '.next', '.nuxt', 'vendor', '.cache'
    }
    
    content_parts = []
    repo_path = Path(repo_path)
    
    # Walk through the repository
    for root, dirs, files in os.walk(repo_path):
        # Filter out excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            file_path = Path(root) / file
            suffix = file_path.suffix.lower()
            
            # Only include specified code file extensions
            if suffix not in CODE_EXTENSIONS:
                continue
            
            try:
                relative_path = file_path.relative_to(repo_path)
                content = file_path.read_text(encoding='utf-8', errors='ignore')
                
                # Add file header and content
                content_parts.append(f"\n{'='*60}\nFile: {relative_path}\n{'='*60}\n{content}")
            except Exception:
                pass
    
    return "\n".join(content_parts)


# Alias for backward compatibility
clone_repository = clone_repo


def get_repository_content(repo_path: str, max_files: int = 50, max_file_size: int = 50000) -> str:
    """
    Read and concatenate repository files into a single string for analysis.
    Excludes binary files, node_modules, and other non-essential files.
    """
    
    # File extensions to include
    INCLUDE_EXTENSIONS = {
        '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.go', '.rs', '.rb',
        '.php', '.cs', '.cpp', '.c', '.h', '.hpp', '.swift', '.kt', '.scala',
        '.md', '.txt', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg',
        '.html', '.css', '.scss', '.less', '.sql', '.sh', '.bash', '.zsh',
        '.dockerfile', '.gitignore', '.env.example', 'Makefile', 'Dockerfile',
        '.ipynb', '.r', '.R', '.jl', '.m', '.mat'
    }
    
    # Directories to exclude
    EXCLUDE_DIRS = {
        'node_modules', '.git', '__pycache__', 'venv', 'env', '.venv',
        'dist', 'build', 'target', '.idea', '.vscode', 'coverage',
        '.next', '.nuxt', 'vendor', 'packages', '.cache'
    }
    
    content_parts = []
    files_processed = 0
    
    repo_path = Path(repo_path)
    
    # First, include important root files
    important_files = ['README.md', 'package.json', 'pyproject.toml', 'Cargo.toml', 
                       'go.mod', 'pom.xml', 'build.gradle', 'requirements.txt']
    
    for filename in important_files:
        file_path = repo_path / filename
        if file_path.exists() and file_path.is_file():
            try:
                content = file_path.read_text(encoding='utf-8', errors='ignore')
                content_parts.append(f"\n{'='*60}\nFile: {filename}\n{'='*60}\n{content[:max_file_size]}")
                files_processed += 1
            except Exception:
                pass
    
    # Then walk through the repository
    for root, dirs, files in os.walk(repo_path):
        # Filter out excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        if files_processed >= max_files:
            break
        
        for file in files:
            if files_processed >= max_files:
                break
            
            file_path = Path(root) / file
            relative_path = file_path.relative_to(repo_path)
            
            # Skip if already processed or doesn't match extensions
            if str(relative_path) in important_files:
                continue
            
            # Check extension
            suffix = file_path.suffix.lower()
            if suffix not in INCLUDE_EXTENSIONS and file not in INCLUDE_EXTENSIONS:
                continue
            
            try:
                content = file_path.read_text(encoding='utf-8', errors='ignore')
                if len(content) > max_file_size:
                    content = content[:max_file_size] + "\n... [truncated]"
                
                content_parts.append(f"\n{'='*60}\nFile: {relative_path}\n{'='*60}\n{content}")
                files_processed += 1
            except Exception:
                pass
    
    return "\n".join(content_parts)


def cleanup_repository(repo_path: str):
    """
    Clean up a cloned repository directory.
    """
    try:
        if repo_path and os.path.exists(repo_path):
            shutil.rmtree(repo_path)
    except Exception as e:
        print(f"Warning: Failed to cleanup {repo_path}: {e}")


def validate_github_url(url: str) -> bool:
    """
    Validate that a URL is a valid GitHub repository URL.
    """
    import re
    pattern = r'^https?://github\.com/[a-zA-Z0-9_-]+/[a-zA-Z0-9_.-]+(\.git)?$'
    return bool(re.match(pattern, url.strip()))


def get_file_tree(repo_path: str) -> dict:
    """
    Generate a hierarchical file tree structure from a repository.
    
    Returns:
        Dictionary representing the folder structure with file info
    """
    EXCLUDE_DIRS = {
        'node_modules', '.git', '__pycache__', 'venv', 'env', '.venv',
        'dist', 'build', 'target', '.idea', '.vscode', 'coverage',
        '.next', '.nuxt', 'vendor', '.cache'
    }
    
    CODE_EXTENSIONS = {
        '.py', '.js', '.jsx', '.ts', '.tsx', '.java', '.go', '.rs', '.rb',
        '.php', '.cs', '.cpp', '.c', '.h', '.hpp', '.swift', '.kt',
        '.html', '.css', '.scss', '.json', '.yaml', '.yml', '.md',
        '.ipynb', '.r', '.R', '.jl'
    }
    
    def build_tree(path: Path, base_path: Path) -> dict:
        result = {
            "name": path.name,
            "type": "folder" if path.is_dir() else "file",
            "path": str(path.relative_to(base_path))
        }
        
        if path.is_dir():
            children = []
            try:
                for child in sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower())):
                    if child.name in EXCLUDE_DIRS:
                        continue
                    if child.is_file() and child.suffix.lower() not in CODE_EXTENSIONS:
                        # Include common config files
                        if child.name not in ['package.json', 'README.md', 'requirements.txt', 
                                              'Dockerfile', 'docker-compose.yml', '.gitignore']:
                            continue
                    child_tree = build_tree(child, base_path)
                    if child_tree:
                        children.append(child_tree)
            except PermissionError:
                pass
            result["children"] = children
        else:
            # Add file size
            try:
                result["size"] = path.stat().st_size
                result["extension"] = path.suffix.lower()
            except:
                result["size"] = 0
                result["extension"] = ""
        
        return result
    
    repo_path = Path(repo_path)
    return build_tree(repo_path, repo_path)


def extract_dependencies(repo_path: str) -> dict:
    """
    Extract import/dependency relationships from code files.
    
    Returns:
        Dictionary with nodes (files) and edges (import relationships)
    """
    EXCLUDE_DIRS = {
        'node_modules', '.git', '__pycache__', 'venv', 'env', '.venv',
        'dist', 'build', 'target', '.idea', '.vscode', 'coverage'
    }
    
    nodes = []
    edges = []
    file_map = {}  # Map file paths to node IDs
    
    repo_path = Path(repo_path)
    
    # First pass: collect all files
    node_id = 0
    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            file_path = Path(root) / file
            suffix = file_path.suffix.lower()
            
            if suffix in {'.py', '.js', '.jsx', '.ts', '.tsx'}:
                rel_path = str(file_path.relative_to(repo_path))
                nodes.append({
                    "id": node_id,
                    "name": file,
                    "path": rel_path,
                    "type": suffix[1:],  # Remove the dot
                    "group": str(file_path.parent.relative_to(repo_path))
                })
                file_map[rel_path] = node_id
                node_id += 1
    
    # Second pass: extract imports
    for node in nodes:
        file_path = repo_path / node["path"]
        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
            imports = extract_imports_from_content(content, node["type"], node["path"])
            
            for imp in imports:
                # Try to resolve import to a file in the repo
                target_id = resolve_import(imp, node["path"], file_map, repo_path)
                if target_id is not None and target_id != node["id"]:
                    edges.append({
                        "source": node["id"],
                        "target": target_id,
                        "import": imp
                    })
        except Exception:
            pass
    
    return {
        "nodes": nodes,
        "edges": edges
    }


def extract_imports_from_content(content: str, file_type: str, file_path: str) -> list:
    """Extract import statements from file content."""
    imports = []
    
    if file_type == 'py':
        # Python imports
        import_pattern = r'^(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))'
        for match in re.finditer(import_pattern, content, re.MULTILINE):
            imp = match.group(1) or match.group(2)
            if imp and not imp.startswith(('os', 'sys', 'json', 're', 'typing', 'pathlib', 
                                           'collections', 'datetime', 'asyncio', 'functools')):
                imports.append(imp)
    
    elif file_type in {'js', 'jsx', 'ts', 'tsx'}:
        # JavaScript/TypeScript imports
        import_pattern = r'(?:import\s+.*?\s+from\s+[\'"](.+?)[\'"]|require\s*\(\s*[\'"](.+?)[\'"]\s*\))'
        for match in re.finditer(import_pattern, content):
            imp = match.group(1) or match.group(2)
            if imp and imp.startswith(('./', '../')):
                imports.append(imp)
    
    return imports


def resolve_import(import_path: str, source_file: str, file_map: dict, repo_path: Path) -> int:
    """Try to resolve an import path to a file ID."""
    source_dir = str(Path(source_file).parent)
    
    # Handle relative imports for JS/TS
    if import_path.startswith('./') or import_path.startswith('../'):
        # Resolve relative path
        if source_dir == '.':
            resolved = import_path
        else:
            resolved = str(Path(source_dir) / import_path)
        
        # Normalize path
        resolved = str(Path(resolved))
        
        # Try with different extensions
        for ext in ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.ts']:
            full_path = resolved + ext
            full_path = full_path.replace('\\', '/')
            if full_path in file_map:
                return file_map[full_path]
    
    # Handle Python imports (dot notation)
    else:
        # Convert dot notation to path
        resolved = import_path.replace('.', '/')
        for ext in ['.py', '/__init__.py']:
            full_path = resolved + ext
            if full_path in file_map:
                return file_map[full_path]
    
    return None


async def fetch_github_readme(repo_url: str) -> str:
    """
    Fetch README directly from GitHub API (faster than cloning for quick analysis).
    """
    # Extract owner/repo from URL
    import re
    match = re.match(r'https?://github\.com/([^/]+)/([^/]+?)(?:\.git)?$', repo_url)
    if not match:
        return ""
    
    owner, repo = match.groups()
    api_url = f"https://api.github.com/repos/{owner}/{repo}/readme"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(api_url, headers={"Accept": "application/vnd.github.raw"})
            if response.status_code == 200:
                return response.text
    except Exception:
        pass
    
    return ""
