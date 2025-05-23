"""
SAST API (Static Application Security Testing)

Purpose:
    This API helps you automatically check the code of a software project for security risks, secrets (like passwords or keys), and other issues that could make the software less safe or reliable. It is designed to help both developers and non-technical users understand the health and safety of their code.

How it works:
    1. You provide a link to a code repository (like a GitHub project) and a personal access token (PAT) for access.
    2. The API downloads the code and automatically detects what programming language is used (Python or JavaScript).
    3. It runs several tools:
        - Semgrep: Looks for security vulnerabilities and risky code patterns.
        - Gitleaks: Searches for secrets (like passwords or API keys) accidentally left in the code.
        - Dependency Audit: Checks if any libraries used in the project have known security problems (CVEs).
    4. The API collects all the results, counts the number of issues, and calculates easy-to-understand scores:
        - Vulnerability Score: Shows how many problems were found (higher is better).
        - Remediation Score: Shows how well the project is doing in fixing known issues (higher is better).
    5. The results are returned in a simple format, showing the types and numbers of issues, the most risky files, and the scores.

Intention:
    The goal is to make it easy for anyone, even without technical knowledge, to get a quick health and safety check of their code. This helps teams fix problems early and keep their software secure.
"""
import tempfile, shutil, subprocess, os, json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from pathlib import Path
from enum import Enum
from typing import Dict, List, Any
import asyncio
import aiofiles
import aiohttp
from functools import lru_cache
import hashlib
from datetime import datetime, timedelta
import time

router = APIRouter()

# Cache duration for dependency audits (24 hours)
CACHE_DURATION = timedelta(hours=24)

class CacheEntry:
    def __init__(self, data: Any, timestamp: datetime):
        self.data = data
        self.timestamp = timestamp

    def is_valid(self) -> bool:
        return datetime.now() - self.timestamp < CACHE_DURATION

# In-memory cache for dependency audit results
dependency_cache: Dict[str, CacheEntry] = {}

class SeverityLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"

# Map severity strings to standardized levels
SEVERITY_MAP = {
    "CRITICAL": SeverityLevel.CRITICAL,
    "critical": SeverityLevel.CRITICAL,
    "HIGH": SeverityLevel.HIGH,
    "high": SeverityLevel.HIGH,
    "MEDIUM": SeverityLevel.MEDIUM,
    "medium": SeverityLevel.MEDIUM,
    "LOW": SeverityLevel.LOW,
    "low": SeverityLevel.LOW,
    "INFO": SeverityLevel.INFO,
    "info": SeverityLevel.INFO,
    "WARNING": SeverityLevel.LOW,
    "warning": SeverityLevel.LOW,
}

class ScanRequest(BaseModel):
    repo_url: HttpUrl
    pat_token: str

def run_cmd(cmd, cwd=None):
    try:
        result = subprocess.run(cmd, shell=True, text=True, capture_output=True, cwd=cwd)
        return result.stdout, result.stderr
    except Exception as e:
        return "", str(e)

def detect_language(repo_path: Path):
    if any(repo_path.rglob("*.py")):
        return "python"
    elif any(repo_path.rglob("package.json")):
        return "javascript"
    return "unknown"

def run_semgrep(repo_path, lang):
    config = "p/default"
    cmd = f"semgrep --quiet --json --config={config} {repo_path}"
    out, _ = run_cmd(cmd)
    try:
        return json.loads(out)
    except:
        return {}

def run_gitleaks(repo_path):
    cmd = f"gitleaks detect --no-banner --source={repo_path} --report-format=json"
    out, _ = run_cmd(cmd)
    try:
        return json.loads(out)
    except:
        return []

def run_dep_audit(repo_path, lang):
    if lang == "python":
        out, _ = run_cmd("pip-audit -f json", cwd=repo_path)
    elif lang == "javascript":
        run_cmd("npm install --omit=dev", cwd=repo_path)
        out, _ = run_cmd("npm audit --json", cwd=repo_path)
    else:
        return []
    try:
        return json.loads(out)
    except:
        return []

def normalize_severity(severity: str) -> SeverityLevel:
    return SEVERITY_MAP.get(severity.upper(), SeverityLevel.INFO)

async def run_cmd_async(cmd: str, cwd: str = None) -> tuple[str, str]:
    try:
        proc = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=cwd
        )
        stdout, stderr = await proc.communicate()
        return stdout.decode(), stderr.decode()
    except Exception as e:
        return "", str(e)

def get_cache_key(repo_path: str, lang: str) -> str:
    """Generate a cache key for dependency audit results"""
    # Use requirements.txt or package.json hash as cache key
    if lang == "python":
        req_file = os.path.join(repo_path, "requirements.txt")
    else:
        req_file = os.path.join(repo_path, "package.json")
    
    if os.path.exists(req_file):
        with open(req_file, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
    return ""

async def run_semgrep_async(repo_path: str, lang: str) -> tuple[dict, float]:
    start_time = time.time()
    config = "p/default"
    cmd = f"semgrep --quiet --json --config={config} {repo_path}"
    out, _ = await run_cmd_async(cmd)
    try:
        result = json.loads(out)
    except:
        result = {}
    execution_time = time.time() - start_time
    return result, execution_time

async def run_gitleaks_async(repo_path: str) -> tuple[list, float]:
    start_time = time.time()
    cmd = f"gitleaks detect --no-banner --source={repo_path} --report-format=json"
    out, _ = await run_cmd_async(cmd)
    try:
        result = json.loads(out)
    except:
        result = []
    execution_time = time.time() - start_time
    return result, execution_time

async def run_dep_audit_async(repo_path: str, lang: str) -> tuple[list, float]:
    start_time = time.time()
    cache_key = get_cache_key(repo_path, lang)
    if cache_key and cache_key in dependency_cache:
        cache_entry = dependency_cache[cache_key]
        if cache_entry.is_valid():
            return cache_entry.data, 0.0  # Cache hit, no execution time

    if lang == "python":
        out, _ = await run_cmd_async("pip-audit -f json", cwd=repo_path)
    elif lang == "javascript":
        await run_cmd_async("npm install --omit=dev", cwd=repo_path)
        out, _ = await run_cmd_async("npm audit --json", cwd=repo_path)
    else:
        return [], 0.0

    try:
        result = json.loads(out)
        if cache_key:
            dependency_cache[cache_key] = CacheEntry(result, datetime.now())
        execution_time = time.time() - start_time
        return result, execution_time
    except:
        return [], time.time() - start_time

async def clone_repo_async(repo_url: str, temp_dir: str) -> tuple[bool, float]:
    start_time = time.time()
    try:
        clone_cmd = f"git clone --depth=1 --filter=blob:none --sparse {repo_url} {temp_dir}"
        await run_cmd_async(clone_cmd)
        
        sparse_cmd = "git sparse-checkout set '*.py' '*.js' '*.json' 'requirements.txt' 'package.json'"
        await run_cmd_async(sparse_cmd, cwd=temp_dir)
        execution_time = time.time() - start_time
        return True, execution_time
    except Exception as e:
        print(f"Clone error: {str(e)}")
        return False, time.time() - start_time

@router.post("/scan")
async def scan_repo(data: ScanRequest):
    total_start_time = time.time()
    temp_dir = tempfile.mkdtemp()
    timing_info = {
        "total_time": 0.0,
        "git_clone_time": 0.0,
        "semgrep_time": 0.0,
        "gitleaks_time": 0.0,
        "dependency_audit_time": 0.0,
        "aggregation_time": 0.0
    }
    
    try:
        repo_url = str(data.repo_url)
        token_prefix = f"https://{data.pat_token}@" if data.pat_token else ""
        repo_url = repo_url.replace("https://", token_prefix)
        
        # Clone repo asynchronously
        clone_success, clone_time = await clone_repo_async(repo_url, temp_dir)
        timing_info["git_clone_time"] = clone_time
        if not clone_success:
            raise HTTPException(status_code=400, detail="Failed to clone repository")

        lang = detect_language(Path(temp_dir))
        if lang not in ["python", "javascript"]:
            raise HTTPException(status_code=400, detail="Unsupported repo language.")

        # Run all security tools in parallel
        semgrep_task = run_semgrep_async(temp_dir, lang)
        gitleaks_task = run_gitleaks_async(temp_dir)
        dep_audit_task = run_dep_audit_async(temp_dir, lang)

        # Wait for all tools to complete
        semgrep_result, semgrep_time = await semgrep_task
        gitleaks_result, gitleaks_time = await gitleaks_task
        dep_result, dep_time = await dep_audit_task

        timing_info["semgrep_time"] = semgrep_time
        timing_info["gitleaks_time"] = gitleaks_time
        timing_info["dependency_audit_time"] = dep_time

        # Start timing aggregation
        agg_start_time = time.time()

        # --- Aggregation ---
        vuln_total = 0
        vuln_by_file = {}
        static_total = 0
        static_by_file = {}
        secret_total = 0
        secret_by_file = {}
        dep_cves = {}
        top_risky_counter = {}
        
        # New severity-based grouping
        severity_groups = {
            level: {"count": 0, "files": {}} for level in SeverityLevel
        }

        for r in semgrep_result.get("results", []):
            f = r.get("path", "unknown")
            line = r.get("start", {}).get("line", 0)
            severity = normalize_severity(r.get("severity", "INFO"))
            message = r.get("extra", {}).get("message", "Unknown issue")
            issue = {
                "severity": severity,
                "line": line,
                "message": message
            }
            
            # Update severity groups
            severity_groups[severity]["count"] += 1
            severity_groups[severity]["files"].setdefault(f, {"count": 0, "issues": []})
            severity_groups[severity]["files"][f]["issues"].append(issue)
            severity_groups[severity]["files"][f]["count"] += 1

            # Existing aggregation
            vuln_by_file.setdefault(f, {"count": 0, "issues": []})
            vuln_by_file[f]["issues"].append(issue)
            vuln_by_file[f]["count"] += 1
            static_by_file.setdefault(f, {"count": 0, "warnings": []})
            static_by_file[f]["warnings"].append(issue)
            static_by_file[f]["count"] += 1
            top_risky_counter[f] = top_risky_counter.get(f, 0) + 1
            vuln_total += 1
            static_total += 1

        for s in gitleaks_result:
            f = s.get("file", "unknown")
            line = s.get("line", 0)
            desc = s.get("rule", "Secret")
            severity = normalize_severity(s.get("severity", "HIGH"))  # Secrets are typically high severity
            
            # Update severity groups
            severity_groups[severity]["count"] += 1
            severity_groups[severity]["files"].setdefault(f, {"count": 0, "issues": []})
            severity_groups[severity]["files"][f]["issues"].append({
                "type": s.get("rule", "Generic Secret"),
                "line": line,
                "description": s.get("description", "Potential secret")
            })
            severity_groups[severity]["files"][f]["count"] += 1

            # Existing aggregation
            secret_by_file.setdefault(f, {"count": 0, "leaks": []})
            secret_by_file[f]["leaks"].append({
                "type": s.get("rule", "Generic Secret"),
                "line": line,
                "description": s.get("description", "Potential secret")
            })
            secret_by_file[f]["count"] += 1
            top_risky_counter[f] = top_risky_counter.get(f, 0) + 1
            secret_total += 1

        if lang == "python" and isinstance(dep_result, list):
            for v in dep_result:
                for loc in v.get("location", []):
                    file = loc.get("file", "requirements.txt")
                    severity = normalize_severity(v.get("severity", "MEDIUM"))
                    
                    # Update severity groups
                    severity_groups[severity]["count"] += 1
                    severity_groups[severity]["files"].setdefault(file, {"count": 0, "issues": []})
                    severity_groups[severity]["files"][file]["issues"].append({
                        "package": v.get("dependency", {}).get("name", "unknown"),
                        "version": v.get("dependency", {}).get("version", "unknown"),
                        "cve": v.get("id", "unknown"),
                        "severity": severity
                    })
                    severity_groups[severity]["files"][file]["count"] += 1

                    # Existing aggregation
                    dep_cves.setdefault(file, [])
                    dep_cves[file].append({
                        "package": v.get("dependency", {}).get("name", "unknown"),
                        "version": v.get("dependency", {}).get("version", "unknown"),
                        "cve": v.get("id", "unknown"),
                        "severity": severity
                    })
                    top_risky_counter[file] = top_risky_counter.get(file, 0) + 1
        elif lang == "javascript" and isinstance(dep_result, dict):
            file = "package.json"
            for vuln in dep_result.get("vulnerabilities", {}).values():
                severity = normalize_severity(vuln.get("severity", "MEDIUM"))
                
                # Update severity groups
                severity_groups[severity]["count"] += 1
                severity_groups[severity]["files"].setdefault(file, {"count": 0, "issues": []})
                severity_groups[severity]["files"][file]["issues"].append({
                    "package": vuln.get("name", "unknown"),
                    "version": vuln.get("version", "unknown"),
                    "cve": vuln.get("via", [{}])[0].get("source", "unknown"),
                    "severity": severity
                })
                severity_groups[severity]["files"][file]["count"] += 1

                # Existing aggregation
                dep_cves.setdefault(file, [])
                dep_cves[file].append({
                    "package": vuln.get("name", "unknown"),
                    "version": vuln.get("version", "unknown"),
                    "cve": vuln.get("via", [{}])[0].get("source", "unknown"),
                    "severity": severity
                })
                top_risky_counter[file] = top_risky_counter.get(file, 0) + 1

        top_risky = sorted(top_risky_counter.items(), key=lambda x: x[1], reverse=True)
        top_risky = [{"file": k, "issue_count": v} for k, v in top_risky[:5]]

        total_cves = sum(len(v) for v in dep_cves.values())

        # --- Scoring ---
        vulnerability_score = max(0, 100 - (vuln_total + secret_total + total_cves) * 5)
        remediation_score = 100 if total_cves == 0 else max(0, 100 - total_cves * 10)

        timing_info["aggregation_time"] = time.time() - agg_start_time
        timing_info["total_time"] = time.time() - total_start_time

        return {
            "language": lang,
            "severity_summary": {
                level.value: {
                    "count": data["count"],
                    "files": data["files"]
                } for level, data in severity_groups.items()
            },
            "vulnerabilities": {
                "total": vuln_total,
                "files": vuln_by_file
            },
            "secrets": {
                "total": secret_total,
                "files": secret_by_file
            },
            "static_warnings": {
                "total": static_total,
                "files": static_by_file
            },
            "top_risky_files": top_risky,
            "dependency_cves": {
                "total": total_cves,
                "files": dep_cves
            },
            "vulnerability_score": vulnerability_score,
            "remediation_score": remediation_score,
            "timing": {
                "total_seconds": round(timing_info["total_time"], 2),
                "breakdown": {
                    "git_clone_seconds": round(timing_info["git_clone_time"], 2),
                    "semgrep_seconds": round(timing_info["semgrep_time"], 2),
                    "gitleaks_seconds": round(timing_info["gitleaks_time"], 2),
                    "dependency_audit_seconds": round(timing_info["dependency_audit_time"], 2),
                    "aggregation_seconds": round(timing_info["aggregation_time"], 2)
                }
            }
        }

    finally:
        # Cleanup in background
        asyncio.create_task(asyncio.to_thread(shutil.rmtree, temp_dir, ignore_errors=True))