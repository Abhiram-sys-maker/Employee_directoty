from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field

from auth.dependencies import get_current_user, require_admin
from controllers.employee_controller import employee_controller

router = APIRouter()


class EmployeeCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    department: str = Field(min_length=2, max_length=50)


@router.get("/employees")
def get_employees(
    search: str | None = None,
    page: int = 1,
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    return employee_controller.get_employees(current_user, search, page, limit)


@router.get("/employees/{employee_id}")
def get_employee(employee_id: int, current_user: dict = Depends(get_current_user)):
    return employee_controller.get_employee(current_user, employee_id)


@router.post("/employees")
def create_employee(employee: EmployeeCreate, current_user: dict = Depends(require_admin)):
    return employee_controller.create_employee(employee.name, employee.email, employee.department)


@router.put("/employees/{employee_id}")
def update_employee(
    employee_id: int,
    employee: EmployeeCreate,
    current_user: dict = Depends(get_current_user)
):
    return employee_controller.update_employee(
        current_user, employee_id, employee.name, employee.email, employee.department
    )


@router.delete("/employees/{employee_id}")
def delete_employee(employee_id: int, current_user: dict = Depends(require_admin)):
    return employee_controller.delete_employee(employee_id)
