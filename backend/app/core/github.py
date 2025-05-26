"""GitHub related core functionality."""
import os

def get_github_token() -> str:
    """Get mandatory GitHub PAT from environment variable GITHUB_TOKEN.
    Raises RuntimeError if GITHUB_TOKEN is not set."""
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        raise RuntimeError("GitHub token (GITHUB_TOKEN) not found")
    return token 