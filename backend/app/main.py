from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api import chatbot, auth, code_quality, sast_api
from .api.github_api import forks_api, contributors_api, issues_api, pull_requests

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(chatbot.router, prefix=f"{settings.API_V1_STR}/chatbot", tags=["chatbot"])
app.include_router(code_quality.router, prefix=f"{settings.API_V1_STR}", tags=["scan"])
app.include_router(forks_api.router, prefix="/api/v1/github", tags=["github"])
app.include_router(contributors_api.router, prefix="/api/v1/github", tags=["github"])
app.include_router(issues_api.router, prefix="/api/v1/github", tags=["github"])
app.include_router(pull_requests.router, prefix="/api/v1/github", tags=["github"])
app.include_router(sast_api.router, prefix="/api/v1/sast", tags=["sast"])

@app.get("/")
async def root():
    return {"message": "Welcome to CodeCoach API"} 