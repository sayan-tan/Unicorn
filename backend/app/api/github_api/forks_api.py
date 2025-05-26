"""
GitHub Forks API

Purpose:
    This API helps you see all the copies (forks) of a GitHub repository. Forks are versions of a project that other people have copied to make their own changes.

How it works:
    1. You provide a link to a GitHub repository and a personal access token (PAT) for access.
    2. The API connects to GitHub and fetches a list of all the forks of that repository.
    3. It returns information about each fork, such as who owns it and when it was created.

Intention:
    The goal is to help you understand how popular a project is and who is working on their own versions of it.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
from urllib.parse import urlparse
import httpx
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

@router.post("/forks")
async def get_forks(data: RepoRequest):
    try:
        owner, repo = extract_owner_repo(data.repo_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not data.pat_token:
        raise HTTPException(status_code=400, detail="Personal Access Token is required for GraphQL API.")

    query = '''
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        forks(first: 10, orderBy: {field: CREATED_AT, direction: DESC}) {
          totalCount
          nodes {
            owner {
              login
              avatarUrl
            }
            nameWithOwner
          }
        }
      }
    }
    '''
    variables = {"owner": owner, "repo": repo}
    headers = {
        "Authorization": f"Bearer {data.pat_token}",
        "Content-Type": "application/json"
    }
    async with httpx.AsyncClient() as client:
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
        forks_data = result["data"]["repository"]["forks"]

    formatted_forks = [
        {
            "fork_owner_avatar": fork["owner"]["avatarUrl"],
            "fork_owner_name": fork["owner"]["login"],
            "forked_repo_name": fork["nameWithOwner"]
        }
        for fork in forks_data["nodes"]
    ]

    return {
        "total_forks": forks_data["totalCount"],
        "forks": formatted_forks
    }