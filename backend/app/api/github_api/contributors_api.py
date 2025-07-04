"""
GitHub Contributors API

Purpose:
    This API helps you see who has contributed to a GitHub repository.

How it works:
    1. You provide a link to a GitHub repository and a personal access token (PAT) for access.
    2. The API connects to GitHub and fetches a list of contributors for that repository.
    3. It returns details about each contributor, such as their username, number of contributions, and when they first contributed.

Intention:
    The goal is to help you track who is actively working on a project, making it easier to manage and engage with your community.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from urllib.parse import urlparse
import httpx
from datetime import datetime, timedelta
from ...core.config import settings

router = APIRouter()

class RepoRequest(BaseModel):
    repo_url: HttpUrl
    pat_token: str  # PAT is required for GraphQL

def extract_owner_repo(url: str):
    parsed = urlparse(str(url))
    parts = parsed.path.strip("/").split("/")
    if len(parts) < 2:
        raise ValueError("Invalid GitHub repo URL.")
    return parts[0], parts[1]

@router.post("/contributors")
async def get_contributors(data: RepoRequest):
    try:
        owner, repo = extract_owner_repo(data.repo_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not data.pat_token:
        raise HTTPException(status_code=400, detail="Personal Access Token is required for GraphQL API.")

    query = '''
    query($owner: String!, $repo: String!, $after: String) {
      repository(owner: $owner, name: $repo) {
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 100, after: $after) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                edges {
                  node {
                    author {
                      user {
                        login
                        avatarUrl
                      }
                      name
                    }
                  }
                }
              }
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
    contributions = {}
    async with httpx.AsyncClient() as client:
        while True:
            response = await client.post(
                settings.GITHUB_GRAPHQL_URL,
                json={"query": query, "variables": variables},
                headers=headers
            )
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            result = response.json()
            if "errors" in result:
                raise HTTPException(status_code=400, detail=str(result["errors"]))
            history = (
                result["data"]["repository"]["defaultBranchRef"]["target"]["history"]
                if result["data"]["repository"]["defaultBranchRef"] else {"edges": [], "pageInfo": {"hasNextPage": False}}
            )
            for edge in history["edges"]:
                author = edge["node"]["author"]
                user = author.get("user")
                login = user["login"] if user else (author.get("name") or "unknown")
                avatar_url = user["avatarUrl"] if user else None
                if login not in contributions:
                    contributions[login] = {"login": login, "avatar_url": avatar_url, "contributions": 0}
                contributions[login]["contributions"] += 1
            if not history["pageInfo"]["hasNextPage"]:
                break
            variables["after"] = history["pageInfo"]["endCursor"]
    sorted_contributors = sorted(contributions.values(), key=lambda c: c["contributions"], reverse=True)
    top_contributors = sorted_contributors[:10]
    return {
        "total_contributors": len(sorted_contributors),
        "top_contributors": top_contributors
    } 