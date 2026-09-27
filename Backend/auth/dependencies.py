from fastapi import Depends, HTTPException, Cookie

from auth.service import auth_service


# NOTE: FastAPI's Depends() system expects plain callables for route
# dependencies, so these two stay as functions rather than class
# methods — but all the actual logic (decoding, hashing) lives in
# AuthService above. These are just the "adapter" between FastAPI
# and the service class.

def get_current_user(access_token: str | None = Cookie(default=None)) -> dict:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
    )

    if access_token is None:
        raise credentials_exception

    payload = auth_service.decode_access_token(access_token)

    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    role = payload.get("role")
    employee_id = payload.get("employee_id")

    if user_id is None or role is None:
        raise credentials_exception

    return {
        "user_id": int(user_id),
        "role": role,
        "employee_id": employee_id
    }


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return current_user
