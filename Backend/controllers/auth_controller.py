from fastapi import Response

from auth.service import auth_service


class AuthController:
    """The actual handler logic for auth endpoints. Nothing here
    knows about URLs or HTTP methods — routes/auth_routes.py binds
    these methods to specific paths."""

    def login(self, response: Response, username: str, password: str):
        user = auth_service.get_user_by_email(username)

        if user is None:
            return {"message": "Invalid email or password"}

        user_id = user[0]
        password_hash = user[2]
        role = user[3]
        employee_id = user[4]

        if not auth_service.verify_password(password, password_hash):
            return {"message": "Invalid email or password"}

        access_token = auth_service.create_access_token(
            data={
                "sub": str(user_id),
                "role": role,
                "employee_id": employee_id
            }
        )

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,       # set True in production (requires HTTPS)
            samesite="lax",
            max_age=auth_service.access_token_expire_minutes * 60,
            path="/",
        )

        return {
            "message": "logged in",
            "role": role
        }

    def logout(self, response: Response):
        response.delete_cookie("access_token", path="/")
        return {"message": "logged out"}


# one shared instance the routes module imports
auth_controller = AuthController()
