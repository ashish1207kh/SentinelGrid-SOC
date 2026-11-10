import datetime
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from typing import Optional

from app.database.connection import get_db
from app.database.models import User
from app.config import settings
from app.services.audit_service import record_audit

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        # Return default active demo analyst if no token provided in demo environment
        user = db.query(User).filter(User.role == "SOC Analyst").first()
        if user:
            return user
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/login", response_model=TokenResponse)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials. Verify username/email.")
    
    try:
        is_valid = bcrypt.checkpw(creds.password.encode("utf-8"), user.hashed_password.encode("utf-8"))
    except Exception:
        is_valid = False

    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid password.")

    user.last_login = datetime.datetime.utcnow()
    db.commit()

    # Record audit log
    record_audit(
        db=db,
        user_email=user.email,
        action="USER_LOGIN",
        entity="AUTH_SERVICE",
        event_details=f"Successful authentication for {user.full_name} ({user.role})"
    )

    token = create_access_token({"sub": user.email, "role": user.role, "name": user.full_name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "department": user.department,
            "badge_id": user.badge_id
        }
    }

@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "department": current_user.department,
        "badge_id": current_user.badge_id,
        "last_login": current_user.last_login.strftime("%Y-%m-%d %H:%M:%S")
    }
