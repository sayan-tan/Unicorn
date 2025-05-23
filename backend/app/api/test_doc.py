from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
import tempfile, subprocess, shutil, os, openai

from pathlib import Path
import re, json
from fpdf import FPDF

app = FastAPI()
openai.api_key = os.getenv("OPENAI_API_KEY")
client = openai.OpenAI()

# ---------- Request Body Schema ----------
class RepoRequest(BaseModel):
    repoUrl: str
    patToken: str = None


# ---------- STEP 1: Clone GitHub Repo ----------
def clone_repo(repo_url: str, pat: str) -> str:
    temp_dir = tempfile.mkdtemp()
    if pat:
        repo_url = repo_url.replace("https://", f"https://{pat}@")

    clone_cmd = ["git", "clone", "--depth", "1", "--single-branch", repo_url, temp_dir]

    try:
        result = subprocess.run(clone_cmd, capture_output=True, text=True, timeout=120)
        if result.returncode != 0:
            raise HTTPException(status_code=400, detail=f"Git error: {result.stderr}")
        return temp_dir
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Clone failed: {str(e)}")


# ---------- STEP 2: Detailed Repo Analysis ----------
def analyze_readme(path):
    readme_path = next(Path(path).rglob("README.md"), None)
    metadata = {
        "project_name": Path(path).name,
        "description": "",
        "possible_keywords": [],
        "project_type": "Unknown",
        "usage": "",
        "authors": "",
    }
    if not readme_path:
        return metadata
    with open(readme_path, "r", encoding="utf-8") as f:
        content = f.read()
    title_match = re.search(r"# (.+)", content)
    if title_match:
        metadata["project_name"] = title_match.group(1).strip()
    paragraphs = content.split("\n\n")
    if len(paragraphs) > 1:
        metadata["description"] = paragraphs[1].strip()
    usage_match = re.search(r"(?i)##?\s*(usage|how to run).+?\n(.+?)(\n##|\Z)", content, re.DOTALL)
    if usage_match:
        metadata["usage"] = usage_match.group(2).strip()
    author_match = re.search(r"(?i)author[s]?:\s*(.+)", content)
    if author_match:
        metadata["authors"] = author_match.group(1).strip()
    content_lower = content.lower()
    if "fastapi" in content_lower:
        metadata["project_type"] = "Backend API"
    return metadata

def analyze_code_structure(path):
    structure = {"folders": {}, "entry_points": [], "notable_files": []}
    def describe_folder(folder_name):
        mapping = {
            "routes": "API endpoints",
            "controllers": "Request handlers",
            "models": "Schemas or ORM models",
            "services": "Business logic",
            "tests": "Testing logic",
            "config": "App settings",
        }
        for key, desc in mapping.items():
            if key in folder_name.lower():
                return desc
        return "Uncategorized"
    for root, dirs, files in os.walk(path):
        if len(Path(root).relative_to(path).parts) <= 2:
            rel = str(Path(root).relative_to(path))
            structure["folders"][rel] = {
                "description": describe_folder(rel),
                "file_count": len(files),
                "files": files[:5]
            }
        for file in files:
            if file in ["main.py", "index.ts", "app.ts", "server.ts"]:
                structure["entry_points"].append(os.path.join(root, file))
            if file.lower() in ["dockerfile", "package.json", "pyproject.toml"]:
                structure["notable_files"].append(file)
    return structure

def analyze_tests(path):
    tests = {"test_files": [], "test_types": set(), "frameworks": set(), "mocking": [], "fixtures_found": False}
    for root, _, files in os.walk(path):
        for file in files:
            if "test" in file or file.endswith((".spec.ts", ".spec.js")):
                tests["test_files"].append(os.path.join(root, file))
            fpath = os.path.join(root, file)
            if file.endswith(".py"):
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    c = f.read()
                    if "pytest" in c:
                        tests["frameworks"].add("pytest")
                    if "unittest" in c:
                        tests["frameworks"].add("unittest")
            if file.endswith((".ts", ".js")):
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    c = f.read()
                    if "jest" in c:
                        tests["frameworks"].add("jest")
                    if "mocha" in c:
                        tests["frameworks"].add("mocha")
            if "fixtures" in fpath:
                tests["fixtures_found"] = True
            if "unit" in root.lower():
                tests["test_types"].add("Unit")
            if "integration" in root.lower():
                tests["test_types"].add("Integration")
            if "e2e" in root.lower():
                tests["test_types"].add("E2E")
    return tests

def analyze_ci_cd(path):
    ci_cd = {"tools": [], "workflows": [], "build_files": []}
    for f in [".github/workflows", "Jenkinsfile", ".gitlab-ci.yml"]:
        if any(Path(path).rglob(f)):
            ci_cd["tools"].append(f.split("/")[0])
            ci_cd["workflows"].append(f)
    for f in ["Makefile", "build.sh", "docker-compose.yml"]:
        if any(Path(path).rglob(f)):
            ci_cd["build_files"].append(f)
    return ci_cd

def generate_summary(readme, structure, tests, ci_cd):
    lines = [f"# Repo Summary: {readme['project_name']}",
            f"**Type**: {readme['project_type']}",
            f"**Description**: {readme['description']}\n",
            "## Code Structure"]
    for folder, info in structure["folders"].items():
        lines.append(f"- `{folder}`: {info['description']} ({info['file_count']} files)")
    lines.append("## Entry Points\n" + "\n".join(structure["entry_points"]))
    lines.append("\n## Tests")
    lines.append(f"- Frameworks: {', '.join(tests['frameworks'])}")
    lines.append(f"- Types: {', '.join(tests['test_types'])}")
    lines.append(f"- Fixtures: {tests['fixtures_found']}")
    lines.append("\n## CI/CD & Build")
    lines.append(f"- CI Tools: {', '.join(ci_cd['tools'])}")
    lines.append(f"- Workflows: {len(ci_cd['workflows'])}")
    lines.append(f"- Build Tools: {', '.join(ci_cd['build_files'])}")
    return "\n".join(lines)


# ---------- STEP 3: Call GPT-4o ----------
def get_test_strategy_from_gpt(summary: str) -> str:
    prompt = f"""
You are a senior QA engineer.

Based on the following codebase summary, write a **complete test strategy document** in Markdown.

Include:
1. Project Overview
2. Testing Scope
3. Test Structure
4. Suggested Tools
5. Manual vs Automated
6. CI/CD Test Integration
7. Best Practices

--- SUMMARY START ---
{summary}
--- SUMMARY END ---
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=2000
    )

    return response['choices'][0]['message']['content']

def save_pdf_from_text(text: str, output_path: str):
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    pdf.set_font("Arial", size=12)
    lines = text.splitlines()
    for line in lines:
        if line.strip().startswith("#"):
            level = line.count("#")
            title = line.replace("#", "").strip()
            font_size = max(16 - level * 2, 10)
            pdf.set_font("Arial", 'B', size=font_size)
            pdf.cell(200, 10, txt=title, ln=True)
            pdf.set_font("Arial", size=12)
        else:
            pdf.multi_cell(0, 10, txt=line)
    pdf.output(output_path)


# ---------- FASTAPI Endpoint ----------
@app.post("/generate-test-doc/")
async def generate_test_doc(request: RepoRequest, format: str = Query("md", enum=["md", "pdf"])):
    temp_dir = clone_repo(request.repoUrl, request.patToken)
    try:
        readme = analyze_readme(temp_dir)
        structure = analyze_code_structure(temp_dir)
        tests = analyze_tests(temp_dir)
        ci_cd = analyze_ci_cd(temp_dir)
        summary = generate_summary(readme, structure, tests, ci_cd)

        test_doc = get_test_strategy_from_gpt(summary)

        if format == "pdf":
            output_path = os.path.join(temp_dir, "Test_Strategy.pdf")
            save_pdf_from_text(test_doc, output_path)
            return FileResponse(output_path, media_type="application/pdf", filename="Test_Strategy.pdf")
        else:
            output_path = os.path.join(temp_dir, "Test_Strategy.md")
            with open(output_path, "w") as f:
                f.write(test_doc)
            return FileResponse(output_path, media_type="text/markdown", filename="Test_Strategy.md")

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)