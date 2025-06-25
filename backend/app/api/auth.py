# backend/app/api/auth.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..auth_utils import (
    get_current_user,
    create_token,
)

import os

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str

@router.post("/login", response_model=LoginResponse)
def login(login_request: LoginRequest):
    correct_user = os.getenv("ADMIN_USERNAME", "admin")
    correct_pass = os.getenv("ADMIN_PASSWORD", "secret")
    if login_request.username != correct_user or login_request.password != correct_pass:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_token(login_request.username)
    return {"token": token}

@router.post("/verify")
def verify_token(current_user: dict = Depends(get_current_user)):
    return {"user": current_user["user"], "status": "valid"}

