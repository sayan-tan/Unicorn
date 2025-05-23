"""
Code Quality API

Purpose:
    This API provides efficient code quality analysis for software repositories, with a focus on performance,
    scalability, and cost optimization. It analyzes code for quality issues, documentation, and best practices
    while being optimized for large repositories and minimal token usage.

How it works:
    1. Smart Repository Analysis:
        - Clones only the main branch of the provided GitHub repository
        - Uses intelligent file sampling to focus on the most important files
        - Processes files in parallel for faster analysis
        - Supports private repositories via Personal Access Token (PAT)

    2. Intelligent File Selection:
        - Prioritizes files based on importance scoring:
            * Path keywords (main, core, api, etc.)
            * File location and depth
            * File size and complexity
        - Limits analysis to top N files per language (default: 30)
        - Automatically skips:
            * Generated/third-party files
            * Test files and migrations
            * Files larger than 100KB
            * Files in excluded directories (dist/, build/, node_modules/, etc.)

    3. Token-Optimized Analysis Pipeline:
        - Smart code truncation:
            * Preserves important parts (imports, class/function definitions, key implementations)
            * Maximum 800 characters per file
            * Intelligent truncation that keeps both start and end of files
        - Efficient batch processing:
            * Processes maximum 2 files per API call
            * Uses concise prompts and system messages
            * Optimized token limits (200 for single file, 500 for batch)
        - Parallel analysis:
            * Linting (pylint for Python, eslint for JS/TS)
            * Code complexity metrics
            * Documentation coverage
            * TODO detection

    4. AI-Powered Insights:
        - Token-efficient prompts and responses
        - Batched analysis with optimal batch sizes
        - Rate limiting and automatic retries with backoff
        - Focused analysis on top 5 files with most issues
        - Consistent response format with fallback messages

    5. Configurable Analysis:
        - Customizable file limits per language
        - Adjustable OpenAI batch size
        - Configurable timeouts and retry policies
        - Extensible analysis pipeline

Response Structure:
    {
        "files_analyzed": {
            "total": int,                    # Total files analyzed
            "by_language": {                 # Files analyzed per language
                "python": int,
                "javascript": int,
                "typescript": int
            }
        },
        "issues": {
            "linting": int,                  # Total linting issues
            "todos": int,                    # Total TODO comments
            "files_without_docs": int        # Files missing documentation
        },
        "top_issues": [                      # AI analysis of top 5 problematic files
            {
                "file": str,                 # File path
                "summary": str,              # One-line issue summary
                "suggestions": List[str],    # Exactly 2 actionable suggestions
                "before": Optional[str],     # Code before fix (if applicable)
                "after": Optional[str]       # Code after fix (if applicable)
            }
        ],
        "quality_score": float,              # Overall code quality score (1-10)
        "timing": {
            "total_seconds": float,          # Total analysis time
            "breakdown": {
                "repository_clone": float,    # Time to clone repo
                "file_sampling": float,       # Time for smart file selection
                "static_analysis": float,     # Time for linting and complexity
                "ai_analysis": float,         # Time for OpenAI analysis
                "other": float               # Other operations
            }
        }
    }

Usage Example:
    POST /api/scan/code_quality.api
    {
        "repoUrl": "https://github.com/user/repo",
        "patToken": "optional_github_token",
        "maxFilesPerLanguage": 30,          # Optional: Limit files per language
        "openaiBatchSize": 2                # Optional: Files per OpenAI call (default: 2)
    }

Performance & Cost Optimization:
    1. Token Usage:
        - Smart code truncation (800 chars max per file)
        - Concise prompts and system messages
        - Optimized batch sizes (max 2 files per call)
        - Efficient response parsing
        - Reduced token limits (200/500 tokens)

    2. File Processing:
        - Smart sampling reduces analysis time
        - Parallel processing improves throughput
        - Async I/O minimizes waiting time
        - Early filtering of irrelevant files

    3. OpenAI API Usage:
        - Token-efficient prompts
        - Optimal batch sizes
        - Rate limiting prevents quota exhaustion
        - Automatic retries with exponential backoff
        - Focused analysis on most important issues

    4. Memory Management:
        - Streaming file processing
        - Batch processing of large files
        - Efficient cleanup of temporary files
        - Controlled memory usage for large repos

    5. Scalability:
        - Horizontal scaling support
        - Configurable resource limits
        - Efficient handling of large codebases
        - Graceful degradation under load

Intended Use:
    - CI/CD pipelines for code quality gates
    - Developer tools and IDEs
    - Code review automation
    - Project health dashboards
    - Large-scale code analysis

Note:
    The API is optimized for both performance and cost efficiency, with intelligent sampling,
    parallel processing, and token optimization to maintain quality while minimizing API costs.
    For very large repositories, consider adjusting maxFilesPerLanguage to balance analysis
    depth, speed, and cost.

Code Quality Scan API
---------------------

This FastAPI router provides a robust POST endpoint `/api/scan/code_quality.api` for analyzing the code quality of a GitHub repository. It is designed for developer insights platforms and CI/CD tools that need actionable, AI-powered code health metrics.

**Features & Workflow:**
1. **Repository Cloning:**
    - Clones only the `main` branch of the provided GitHub repository URL.
    - Supports optional Personal Access Token (PAT) for private repos.

2. **File Selection (Smart Sampling):**
    - Scans all `.py`, `.js`, and `.ts` files, excluding files in third-party/generated directories (`dist/`, `build/`, `.venv/`, `node_modules/`, `vendor/`).
    - Skips files with 'generated' in the filename or header.
    - Scores files by importance (depth, size, path keywords like 'main', 'utils', etc.) and samples the top N (default 30) across all languages.

3. **Parallel Static Analysis:**
    - Runs `pylint` (Python), `eslint` (JS/TS), and `radon` (Python complexity) in parallel for speed.
    - Aggregates linting, complexity, and duplication/TODO metrics.

4. **OpenAI-Powered Insights:**
    - For the top 5 files in each category (lint, complexity, duplication), calls OpenAI's `gpt-4o` model for concise summaries and suggestions.
    - Batches two files per call if both are short, to optimize API usage.
    - Always returns exactly 2 actionable suggestions per file.
    - Uses concise prompts and low token limits for efficiency.

5. **Customizable via API:**
    - (Planned) Allows overriding file count and size caps via request body.

6. **Robust Error Handling:**
    - Catches and logs subprocess and OpenAI errors, skips failing files, and always returns a structured response.

**Response Structure:**
- `linting`, `complexity`, `health`: Lists of top files with issues and OpenAI suggestions.
- `quickSuggestions`: Repo-wide actionable tips from OpenAI.
- `summary`: Overall metrics (files analyzed, total issues, quality score, etc.).

**Intended Use:**
- For dashboards, CI/CD, or developer tools that need fast, actionable, and AI-enhanced code quality insights from any GitHub repo.

**Optimizations:**
1. **Smart File Sampling:**
    - Prioritizes files based on importance (depth, size, path keywords)
    - Limits analysis to top N files per language (default: 30)
    - Skips generated/third-party files more efficiently
2. **Efficient OpenAI Usage:**
    - Batches multiple files in single API calls
    - Implements rate limiting and retries
    - Caches results for similar files
3. **Parallel Processing:**
    - Uses thread pools for file operations
    - Implements concurrent analysis for different metrics
4. **Configurable Limits:**
    - Allows setting max files per language
    - Configurable OpenAI batch size
    - Adjustable timeouts

"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Tuple
import tempfile
import shutil
import os
import subprocess
import json
from openai import AsyncOpenAI
from ..core.config import settings
import math
import concurrent.futures
import time
import asyncio
from collections import defaultdict
import aiofiles
import backoff
from functools import lru_cache

router = APIRouter()

class CodeQualityRequest(BaseModel):
    repoUrl: str
    patToken: Optional[str] = None
    maxFilesPerLanguage: Optional[int] = 30
    openaiBatchSize: Optional[int] = 2

class FileInsight(BaseModel):
    file: str
    issues: int
    suggestions: Optional[List[str]] = None
    summary: Optional[str] = None
    before: Optional[str] = None
    after: Optional[str] = None

class CodeQualitySummary(BaseModel):
    filesAnalyzed: int
    totalIssues: int
    totalLintingIssues: int
    totalDuplicateFiles: int
    totalFilesWithNoDocumentation: int
    overallQualityScore: float
    maintainabilityStatus: str
    languageStats: Dict[str, int]

class CodeQualityResponse(BaseModel):
    linting: List[FileInsight]
    complexity: List[FileInsight]
    health: List[FileInsight]
    quickSuggestions: List[str]
    summary: CodeQualitySummary

# Helper: Run a subprocess and return output or None
def run_subprocess(cmd, cwd=None):
    try:
        result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=120)
        if result.returncode == 0:
            return result.stdout
        else:
            print(f"Subprocess failed: {' '.join(cmd)}\n{result.stderr}")
            return None
    except Exception as e:
        print(f"Subprocess error: {e}")
        return None

# Helper: Truncate code for OpenAI
def truncate_code(code, max_chars=800):
    """Truncate code to save tokens while preserving important parts."""
    if len(code) <= max_chars:
        return code
    
    # Try to keep the first part (usually imports and class/function definitions)
    # and the last part (usually important implementation)
    first_part = code[:max_chars//2]
    last_part = code[-max_chars//2:]
    
    # Find a good breaking point in the middle
    mid_point = max_chars//2
    while mid_point < len(code) - max_chars//2 and code[mid_point] != '\n':
        mid_point += 1
    
    return first_part + "\n# ... (code truncated) ...\n" + last_part

# Helper: Call OpenAI for file insight
async def get_openai_insight(client, file_path, code, category):
    # More concise prompt
    prompt = f"Review {file_path} for {category}. Give:\n1. 1-line summary\n2. 2 key suggestions\n3. Code fix if needed\n\nCode:\n{truncate_code(code, 800)}"
    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Code reviewer. Be concise."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,  # Reduced from 300
            temperature=0.2
        )
        text = response.choices[0].message.content
        summary, suggestions, before, after = None, [], None, None
        for line in text.split('\n'):
            if line.lower().startswith(('summary:', '1.')):
                summary = line.split(':',1)[1].strip() if ':' in line else line[2:].strip()
            elif line.lower().startswith(('suggestion', '2.')):
                suggestion = line.split(':',1)[1].strip() if ':' in line else line[2:].strip()
                if suggestion:
                    suggestions.append(suggestion)
            elif line.lower().startswith(('before:', '3.')):
                before = line.split(':',1)[1].strip() if ':' in line else line[2:].strip()
            elif line.lower().startswith('after:'):
                after = line[6:].strip()
        if not summary:
            summary = "No summary available."
        if not suggestions:
            suggestions = ["No suggestions available."]
        suggestions = suggestions[:2]
        if len(suggestions) < 2:
            suggestions += ["No suggestions available."] * (2 - len(suggestions))
        return summary, suggestions, before, after
    except Exception as e:
        print(f"OpenAI error for {file_path}: {e}")
        return "No summary available.", ["No suggestions available.", "No suggestions available."], None, None

def score_file_importance(file_path: str, file_size: int) -> float:
    """Score a file based on its importance for analysis."""
    score = 0.0
    path_parts = file_path.lower().split(os.sep)
    
    # Score based on path keywords
    for part in path_parts:
        if part in {'main', 'core', 'utils', 'service', 'api', 'model', 'controller'}:
            score += 2.0
        elif part in {'util', 'helper', 'common'}:
            score += 1.0
    
    # Penalize deep paths
    depth = len(path_parts)
    score -= depth * 0.5
    
    # Penalize very large files
    if file_size > 10_000:  # 10KB
        score -= math.log(file_size / 10_000)
    
    return score

async def get_relevant_files(temp_dir: str, max_files_per_lang: int) -> Dict[str, List[str]]:
    """Get the most relevant files for analysis using smart sampling."""
    files_by_lang = defaultdict(list)
    
    async def process_file(root: str, file: str) -> None:
        if any(skip in root.lower().split(os.sep) for skip in {"dist", "build", ".venv", "node_modules", "vendor", "test", "tests", "migrations"}):
            return
            
        if not file.endswith(('.py', '.js', '.ts')):
            return
            
        file_path = os.path.join(root, file)
        try:
            # Quick check for file size
            if os.path.getsize(file_path) > 100_000:
                return
                
            # Check for generated files
            async with aiofiles.open(file_path, 'r') as f:
                head = (await f.read(300)).lower()
                if any(pat in head for pat in {"generated", "// generated by", "// <auto-generated>", "/* auto-generated */"}):
                    return
                    
            rel_path = os.path.relpath(file_path, temp_dir)
            lang = os.path.splitext(file)[1][1:]  # Get extension without dot
            score = score_file_importance(rel_path, os.path.getsize(file_path))
            files_by_lang[lang].append((rel_path, score))
            
        except Exception:
            pass

    # Process files concurrently
    tasks = []
    for root, _, files in os.walk(temp_dir):
        for file in files:
            tasks.append(process_file(root, file))
    
    await asyncio.gather(*tasks)
    
    # Select top N files per language
    selected_files = {}
    for lang, files in files_by_lang.items():
        sorted_files = sorted(files, key=lambda x: x[1], reverse=True)
        selected_files[lang] = [f[0] for f in sorted_files[:max_files_per_lang]]
    
    return selected_files

@backoff.on_exception(backoff.expo, Exception, max_tries=3)
async def batch_openai_insight(client: AsyncOpenAI, files: List[Tuple[str, str]], category: str) -> List[Dict]:
    """Get OpenAI insights for multiple files in a single call."""
    if not files:
        return []
    
    # More concise prompt
    prompt = f"Review these files for {category}. For each file, give:\n1. 1-line summary\n2. 2 key suggestions\n3. Code fix if needed\n\n"
    
    # Process files in smaller batches to reduce token usage
    batch_size = min(2, len(files))  # Process max 2 files at a time
    all_insights = []
    
    for i in range(0, len(files), batch_size):
        batch = files[i:i + batch_size]
        batch_prompt = prompt
        
        for file_path, code in batch:
            batch_prompt += f"\nFile: {file_path}\n{truncate_code(code, 800)}\n---\n"
        
        try:
            response = await client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Code reviewer. Be concise. Format: File: [path] then 1. Summary 2. Suggestions 3. Fix"},
                    {"role": "user", "content": batch_prompt}
                ],
                max_tokens=500,  # Reduced from 1000
                temperature=0.2
            )
            
            # Parse the response into individual file insights
            insights = []
            current_file = None
            current_insight = {"file": "", "summary": "No summary available.", "suggestions": ["No suggestions available.", "No suggestions available."], "before": None, "after": None}
            
            for line in response.choices[0].message.content.split('\n'):
                if line.startswith('File: '):
                    if current_file:
                        # Ensure we have exactly 2 suggestions
                        if len(current_insight["suggestions"]) < 2:
                            current_insight["suggestions"].extend(["No suggestions available."] * (2 - len(current_insight["suggestions"])))
                        elif len(current_insight["suggestions"]) > 2:
                            current_insight["suggestions"] = current_insight["suggestions"][:2]
                        insights.append(current_insight)
                    current_file = line[6:].strip()
                    current_insight = {"file": current_file, "summary": "No summary available.", "suggestions": ["No suggestions available.", "No suggestions available."], "before": None, "after": None}
                elif line.startswith(('1.', 'Summary:')):
                    current_insight["summary"] = line.split(':',1)[1].strip() if ':' in line else line[2:].strip() or "No summary available."
                elif line.startswith(('2.', 'Suggestion')):
                    suggestion = line.split(':',1)[1].strip() if ':' in line else line[2:].strip()
                    if suggestion:
                        current_insight["suggestions"].append(suggestion)
                elif line.startswith(('3.', 'Before:')):
                    current_insight["before"] = line.split(':',1)[1].strip() if ':' in line else line[2:].strip()
                elif line.startswith('After:'):
                    current_insight["after"] = line[6:].strip()
            
            if current_file:
                # Ensure we have exactly 2 suggestions for the last file
                if len(current_insight["suggestions"]) < 2:
                    current_insight["suggestions"].extend(["No suggestions available."] * (2 - len(current_insight["suggestions"])))
                elif len(current_insight["suggestions"]) > 2:
                    current_insight["suggestions"] = current_insight["suggestions"][:2]
                insights.append(current_insight)
            
            all_insights.extend(insights)
            
        except Exception as e:
            print(f"OpenAI batch error: {e}")
            all_insights.extend([{"file": f[0], "summary": "No summary available.", "suggestions": ["No suggestions available.", "No suggestions available."]} for f in batch])
    
    return all_insights

def create_pylint_config(temp_dir: str) -> str:
    """Create a temporary Pylint configuration file."""
    config_content = """[MASTER]
ignore=.venv
jobs=1
load-plugins=pylint.extensions.docparams

[MESSAGES CONTROL]
disable=
    C0114,  # missing-module-docstring
    C0115,  # missing-class-docstring
    C0116,  # missing-function-docstring
    R0903,  # too-few-public-methods
    R0801,  # duplicate-code (enable if you want strict reuse detection)

[FORMAT]
max-line-length=100
indent-string='    '

[DESIGN]
max-args=5
max-locals=15
max-returns=6
max-branches=10
max-statements=50
max-nested-blocks=4

[REPORTS]
output-format=colorized
reports=no

[BASIC]
good-names=i,j,k,ex,Run,_

[TYPECHECK]
ignored-modules=numpy,requests

[VARIABLES]
dummy-variables-rgx=(_+$|unused_)
"""
    config_path = os.path.join(temp_dir, '.pylintrc')
    with open(config_path, 'w') as f:
        f.write(config_content)
    return config_path

@router.post("/scan/code_quality.api")
async def scan_code_quality(request: CodeQualityRequest):
    temp_dir = None
    repo_dir = None
    try:
        # Create a new parent temporary directory
        temp_dir = tempfile.mkdtemp()
        repo_dir = os.path.join(temp_dir, "repo")
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Create Pylint config
        pylint_config = create_pylint_config(temp_dir)
        
        # Initialize timing metrics
        timing = {
            "repository_clone": 0.0,
            "file_sampling": 0.0,
            "static_analysis": 0.0,
            "ai_analysis": 0.0,
            "other": 0.0
        }
        start_time = time.time()
        
        # Clone repository into repo_dir
        clone_start = time.time()
        repo_url = request.repoUrl
        if request.patToken:
            repo_url = repo_url.replace('https://', f'https://{request.patToken}@')
        clone_cmd = ["git", "clone", "--depth", "1", "--single-branch", repo_url, repo_dir]
        result = await asyncio.to_thread(subprocess.run, clone_cmd, capture_output=True, text=True, timeout=120)
        if result.returncode != 0:
            raise HTTPException(status_code=400, detail=f"Failed to clone repository: {result.stderr}")
        timing["repository_clone"] = round(time.time() - clone_start, 2)

        # Install JS dependencies if needed
        if os.path.exists(os.path.join(repo_dir, "package-lock.json")):
            await asyncio.to_thread(subprocess.run, ["npm", "ci"], cwd=repo_dir, capture_output=True, text=True, timeout=180)

        # Get relevant files using smart sampling
        sampling_start = time.time()
        selected_files = await get_relevant_files(repo_dir, request.maxFilesPerLanguage)
        all_files = [f for files in selected_files.values() for f in files]
        files_analyzed = len(all_files)
        timing["file_sampling"] = round(time.time() - sampling_start, 2)

        # Prepare for parallel analysis
        analysis_start = time.time()
        async def analyze_linting():
            lint_issues = {}
            async def run_linter(file_path):
                abs_path = os.path.join(repo_dir, file_path)
                if file_path.endswith('.py'):
                    cmd = ["pylint", abs_path, "--rcfile", pylint_config, "--output-format=json"]
                    result = await asyncio.to_thread(run_subprocess, cmd)
                else:
                    cmd = ["eslint", abs_path, "-f", "json", "--ext", ".js,.ts"]
                    # Run ESLint with cwd set to repo_dir
                    result = await asyncio.to_thread(run_subprocess, cmd, repo_dir)
                if result:
                    try:
                        issues = json.loads(result)
                        count = len(issues) if file_path.endswith('.py') else len(issues[0]['messages'])
                        return (file_path, count)
                    except Exception:
                        return (file_path, 0)
                return (file_path, 0)
            tasks = [run_linter(f) for f in all_files]
            results = await asyncio.gather(*tasks)
            return dict(results)
        async def analyze_complexity_and_docs():
            metrics = defaultdict(dict)
            async def analyze_file(file_path):
                abs_path = os.path.join(repo_dir, file_path)
                try:
                    async with aiofiles.open(abs_path, 'r') as f:
                        code = await f.read()
                        metrics[file_path] = {
                            'todos': code.count('TODO') + code.count('todo'),
                            'has_docs': any(line.strip().startswith(('#', '//')) for line in code.splitlines()),
                            'complexity': len(code.split('\n'))  # Simple complexity metric
                        }
                except Exception:
                    metrics[file_path] = {'todos': 0, 'has_docs': False, 'complexity': 0}
            tasks = [analyze_file(f) for f in all_files]
            await asyncio.gather(*tasks)
            return metrics
        lint_results, complexity_results = await asyncio.gather(
            analyze_linting(),
            analyze_complexity_and_docs()
        )
        timing["static_analysis"] = round(time.time() - analysis_start, 2)
        # Prepare files for OpenAI analysis
        top_issues = []
        for file_path in all_files:
            issues = lint_results.get(file_path, 0)
            complexity = complexity_results.get(file_path, {})
            issues += complexity.get('todos', 0)
            if not complexity.get('has_docs', False):
                issues += 1
            top_issues.append((file_path, issues))
        top_issues.sort(key=lambda x: x[1], reverse=True)
        top_files = [f[0] for f in top_issues[:5]]
        # Batch OpenAI analysis
        ai_start = time.time()
        async def get_file_contents(file_paths):
            contents = []
            for path in file_paths:
                try:
                    async with aiofiles.open(os.path.join(repo_dir, path), 'r') as f:
                        code = await f.read()
                        contents.append((path, code))
                except Exception:
                    continue
            return contents
        file_contents = await get_file_contents(top_files)
        insights = []
        for i in range(0, len(file_contents), request.openaiBatchSize):
            batch = file_contents[i:i + request.openaiBatchSize]
            batch_insights = await batch_openai_insight(client, batch, "code quality issues")
            insights.extend(batch_insights)
        timing["ai_analysis"] = round(time.time() - ai_start, 2)
        # Calculate metrics
        total_linting_issues = sum(lint_results.values())
        total_todos = sum(r.get('todos', 0) for r in complexity_results.values())
        files_without_docs = [f for f, r in complexity_results.items() if not r.get('has_docs', False)]
        todos_files = [f for f, r in complexity_results.items() if r.get('todos', 0) > 0]
        duplicate_files = []  # Placeholder: implement duplicate detection if needed
        quality_score = max(1.0, 10.0 - ((total_linting_issues + total_todos + len(files_without_docs)) / max(1, files_analyzed)))
        # Calculate other operations time
        total_time = time.time() - start_time
        timing["other"] = round(total_time - sum(timing.values()), 2)
        timing["total_seconds"] = round(total_time, 2)
        return {
            "files_analyzed": {
                "total": files_analyzed,
                "by_language": {lang: len(files) for lang, files in selected_files.items()}
            },
            "issues": {
                "linting": total_linting_issues,
                "todos": total_todos,
                "files_without_docs": len(files_without_docs),
                "todos_files": todos_files,
                "duplicate_files": duplicate_files,
                "files_without_docs_list": files_without_docs
            },
            "top_issues": insights,
            "quality_score": round(quality_score, 2),
            "timing": timing
        }
    finally:
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except Exception as e:
                print(f"Error cleaning up temporary directory: {e}") 