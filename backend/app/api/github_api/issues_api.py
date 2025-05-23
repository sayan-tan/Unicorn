"""
GitHub Issues API

Purpose:
    This API helps you see the open and closed issues (problems, bugs, or feature requests) in a GitHub project.

How it works:
    1. You provide a link to a GitHub repository and a personal access token (PAT) for access.
    2. The API connects to GitHub and fetches a list of issues for that repository.
    3. It returns details about each issue, such as its title, status, and who created it.

Intention:
    The goal is to help you track what needs to be fixed or improved in a project, making it easier to manage and prioritize work.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from urllib.parse import urlparse
import httpx
from datetime import datetime, timedelta

router = APIRouter()
GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"

class RepoRequest(BaseModel):
    repo_url: HttpUrl
    pat_token: str  # PAT is required for GraphQL

def extract_owner_repo(url: str):
    parsed = urlparse(str(url))
    parts = parsed.path.strip("/").split("/")
    if len(parts) < 2:
        raise ValueError("Invalid GitHub repo URL.")
    return parts[0], parts[1]

@router.post("/issues")
async def get_issues(data: RepoRequest):
    try:
        owner, repo = extract_owner_repo(data.repo_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not data.pat_token:
        raise HTTPException(status_code=400, detail="Personal Access Token is required for GraphQL API.")

    since = (datetime.utcnow() - timedelta(days=365)).strftime("%Y-%m-%dT%H:%M:%SZ")
    query = '''
    query($owner: String!, $repo: String!, $since: DateTime!, $after: String) {
      repository(owner: $owner, name: $repo) {
        issues(first: 100, after: $after, orderBy: {field: CREATED_AT, direction: DESC}, filterBy: {since: $since}, states: [OPEN, CLOSED]) {
          totalCount
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            number
            title
            state
            createdAt
            closedAt
            author { login }
          }
        }
      }
    }
    '''
    variables = {"owner": owner, "repo": repo, "since": since, "after": None}
    headers = {
        "Authorization": f"Bearer {data.pat_token}",
        "Content-Type": "application/json"
    }
    all_issues = []
    async with httpx.AsyncClient() as client:
        while True:
            response = await client.post(
                GITHUB_GRAPHQL_URL,
                json={"query": query, "variables": variables},
                headers=headers
            )
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            result = response.json()
            if "errors" in result:
                raise HTTPException(status_code=400, detail=str(result["errors"]))
            issues_data = result["data"]["repository"]["issues"]
            all_issues.extend(issues_data["nodes"])
            if not issues_data["pageInfo"]["hasNextPage"]:
                break
            variables["after"] = issues_data["pageInfo"]["endCursor"]
    one_year_ago = datetime.utcnow() - timedelta(days=365)
    opened_last_year = []
    closed_last_year = []
    for issue in all_issues:
        created_at = datetime.strptime(issue["createdAt"], "%Y-%m-%dT%H:%M:%SZ")
        closed_at = None
        if issue.get("closedAt"):
            closed_at = datetime.strptime(issue["closedAt"], "%Y-%m-%dT%H:%M:%SZ")
        if created_at >= one_year_ago:
            opened_last_year.append({
                "number": issue["number"],
                "title": issue["title"],
                "state": issue["state"],
                "created_at": issue["createdAt"],
                "closed_at": issue["closedAt"],
                "user": issue["author"]["login"] if issue["author"] else "unknown"
            })
        elif closed_at and closed_at >= one_year_ago:
            closed_last_year.append({
                "number": issue["number"],
                "title": issue["title"],
                "state": issue["state"],
                "created_at": issue["createdAt"],
                "closed_at": issue["closedAt"],
                "user": issue["author"]["login"] if issue["author"] else "unknown"
            })
    return {
        "total_issues": len(all_issues),
        "opened_last_year": opened_last_year,
        "closed_last_year": closed_last_year
    } 