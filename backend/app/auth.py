"""
Authentication utilities - Fixed version
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import bcrypt

# ==================== CONFIGURATION ====================

JWT_SECRET = os.getenv("JWT_SECRET", "dev_secret_change_in_production_12345678")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 24 * 60

security = HTTPBearer()

SECRET_KEY = JWT_SECRET
ALGORITHM = JWT_ALGORITHM


# ==================== PASSWORD HASHING ====================

def hash_pw(password: str) -> str:
    """
    Hash password using bcrypt directly (fixed version)
    """
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')


def verify_pw(password: str, hashed_password: str) -> bool:
    """
    Verify password against hash
    """
    try:
        pwd_bytes = password.encode('utf-8')
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


# ==================== JWT TOKEN MANAGEMENT ====================

def create_token(username: str, role: str) -> str:
    """
    Create JWT access token
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": username,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify JWT token
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


# ==================== DEPENDENCIES ====================

def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, str]:
    """
    Dependency to require authentication
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            credentials.credentials, 
            JWT_SECRET, 
            algorithms=[JWT_ALGORITHM]
        )
        
        username: str = payload.get("sub")
        role: str = payload.get("role")
        
        if username is None or role is None:
            raise credentials_exception
            
        return {"username": username, "role": role}
        
    except jwt.PyJWTError:
        raise credentials_exception


def require_role(required_role: str):
    """
    Factory function to create role-based dependency
    """
    def _inner(user: Dict[str, str] = Depends(require_auth)):
        if user["role"] != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires {required_role} role"
            )
        return user
    return _inner


# ==================== TEST ====================

if __name__ == "__main__":
    print("Testing auth module...")
    
    pwd = "123456"
    hashed = hash_pw(pwd)
    print(f"Password: {pwd}")
    print(f"Hashed: {hashed}")
    print(f"Verify: {verify_pw(pwd, hashed)}")
    
    token = create_token("test_user", "student")
    print(f"\nToken: {token}")
    
    decoded = decode_token(token)
    print(f"Decoded: {decoded}")
    
    print("\n✓ All tests passed!")
