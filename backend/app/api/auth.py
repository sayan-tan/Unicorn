"""
Auth API (Authentication)

Purpose:
    This API manages user accounts and login/logout for the platform.

How it works:
    1. You can create an account, log in, or log out using this API.
    2. It checks your credentials (like username and password) to make sure only authorized users can access the platform.
    3. It keeps your session secure while you use the platform.

Intention:
    The goal is to keep your account and data safe, making sure only you (or people you allow) can access your information and use the platform.
"""
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from datetime import timedelta
from ..core.security import create_access_token
from ..core.config import settings

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None

# Demo accounts (password must pass frontend rules: 8+ chars and a digit)
_DEMO_EMAILS = frozenset(
    {
        "demouser@example.com",
        "demo@example.com",
    }
)


@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    # Dummy authentication logic
    email = str(data.email).strip().lower()
    password = (data.password or "").strip()
    if email in _DEMO_EMAILS and password == "password123":
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": email}, expires_delta=access_token_expires
        )
        return {"success": True, "message": "Login successful!", "token": access_token}
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        ) 