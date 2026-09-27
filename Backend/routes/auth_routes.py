from fastapi import APIRouter, Depends, Response
from fastapi.security import OAuth2PasswordRequestForm

from controllers.auth_controller import auth_controller

router = APIRouter()


@router.post("/login")
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends()):
    return auth_controller.login(response, form_data.username, form_data.password)


@router.post("/logout")
def logout(response: Response):
    return auth_controller.logout(response)
