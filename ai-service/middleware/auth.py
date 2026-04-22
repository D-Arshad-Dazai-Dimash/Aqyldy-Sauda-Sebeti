"""
JWT authentication dependency for FastAPI routes.

Validates the Bearer token issued by Spring Boot using the same
HS256 secret configured via JWT_SECRET env variable (app.jwt.secret).
"""

import logging

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import settings

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=True)


def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    """
    FastAPI dependency: verifies the JWT issued by Spring Boot.
    Returns the decoded claims dict on success.
    Raises HTTP 401 on missing/invalid/expired token.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        logger.debug("JWT verified: sub=%s role=%s", payload.get("sub"), payload.get("role"))
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as exc:
        logger.warning("Invalid JWT: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
