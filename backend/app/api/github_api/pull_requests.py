"""
GitHub Pull Requests API

Purpose:
    This API helps you see the pull requests for a GitHub project. Pull requests are suggestions for changes to the code, made by contributors, that can be reviewed and merged into the main project.

How it works:
    1. You provide a link to a GitHub repository and a personal access token (PAT) for access.
    2. The API connects to GitHub and fetches a list of pull requests for that repository.
    3. It returns details about each pull request, such as its title, status (open or merged), and who created it.

Intention:
    The goal is to help you track new features, bug fixes, and improvements being proposed for a project, making it easier to manage collaboration and code review.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from urllib.parse import urlparse
import httpx
from datetime import datetime, timedelta
from typing import List, Optional

router = APIRouter()
GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"

class RepoRequest(BaseModel):
    repo_url: HttpUrl
    pat_token: str  # PAT is required for GraphQL

class PullRequest(BaseModel):
    number: int
    title: str
    state: str
    created_at: str
    merged_at: Optional[str]
    author: Optional[dict]  # Will contain login and avatarUrl
    url: str

class PullRequestResponse(BaseModel):
    total_pull_requests: int
    open_pull_requests: int
    merged_pull_requests: int
    pull_requests: List[PullRequest]

def extract_owner_repo(url: str) -> tuple[str, str]:
    """Extract owner and repository name from GitHub URL."""
    parsed = urlparse(str(url))
    parts = parsed.path.strip("/").split("/")
    if len(parts) < 2:
        raise ValueError("Invalid GitHub repo URL.")
    return parts[0], parts[1]

@router.post("/pull-requests", response_model=PullRequestResponse)
async def get_pull_requests(data: RepoRequest):
    """
    Fetch pull requests from the last month for a given repository.
    Returns total PRs, open PRs, merged PRs, and detailed PR data.
    """
    try:
        owner, repo = extract_owner_repo(data.repo_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not data.pat_token:
        raise HTTPException(status_code=400, detail="Personal Access Token is required for GraphQL API.")

    # Calculate date 1 month ago
    one_month_ago = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%dT%H:%M:%SZ")

    # GraphQL query to fetch pull requests
    query = '''
    query($owner: String!, $repo: String!, $after: String) {
    repository(owner: $owner, name: $repo) {
        pullRequests(first: 100, after: $after, orderBy: {field: CREATED_AT, direction: DESC}) {
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
            mergedAt
            url
            author {
                login
                avatarUrl
            }
        }
    }
    }
}
'''

    variables = {"owner": owner, "repo": repo, "after": None}
    headers = {
        "Authorization": f"Bearer {data.pat_token}",
        "Content-Type": "application/json"
    }

    all_prs = []
    MAX_PRS = 300
    async with httpx.AsyncClient() as client:
        while True:
            try:
                response = await client.post(
                    GITHUB_GRAPHQL_URL,
                    json={"query": query, "variables": variables},
                    headers=headers
                )
                response.raise_for_status()
                result = response.json()

                if "errors" in result:
                    raise HTTPException(status_code=400, detail=str(result["errors"]))

                prs_data = result["data"]["repository"]["pullRequests"]
                
                # Filter PRs created in the last month
                one_month_ago_dt = datetime.strptime(one_month_ago, "%Y-%m-%dT%H:%M:%SZ")
                recent_prs = [
                    pr for pr in prs_data["nodes"]
                    if datetime.strptime(pr["createdAt"], "%Y-%m-%dT%H:%M:%SZ") >= one_month_ago_dt
                ]
                all_prs.extend(recent_prs)

                # Stop if we've reached the max limit
                if len(all_prs) >= MAX_PRS:
                    all_prs = all_prs[:MAX_PRS]
                    break

                if not prs_data["pageInfo"]["hasNextPage"]:
                    break
                variables["after"] = prs_data["pageInfo"]["endCursor"]

            except httpx.HTTPError as e:
                raise HTTPException(status_code=e.response.status_code if hasattr(e, 'response') else 500,
                                 detail=str(e))

    # Process and count PRs
    open_prs = 0
    merged_prs = 0
    formatted_prs = []

    for pr in all_prs:
        # Count PRs by state
        if pr["state"] == "OPEN":
            open_prs += 1
        elif pr["mergedAt"] is not None:
            merged_prs += 1

        # Format PR data
        formatted_pr = {
            "number": pr["number"],
            "title": pr["title"],
            "state": pr["state"],
            "created_at": pr["createdAt"],
            "merged_at": pr["mergedAt"],
            "author": {
                "login": pr["author"]["login"] if pr["author"] else "unknown",
                "avatarUrl": pr["author"]["avatarUrl"] if pr["author"] else None
            },
            "url": pr["url"]
        }
        formatted_prs.append(formatted_pr)

    return PullRequestResponse(
        total_pull_requests=len(all_prs),
        open_pull_requests=open_prs,
        merged_pull_requests=merged_prs,
        pull_requests=formatted_prs
    ) 