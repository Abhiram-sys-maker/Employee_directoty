from fastapi import HTTPException

from employees.repository import employee_repository


def _row_to_dict(row):
    return {"id": row[0], "name": row[1], "email": row[2], "department": row[3]}


class EmployeeController:
    """Actual handler logic for employee endpoints. Routes just call
    these methods — no business logic lives in routes/employee_routes.py."""

    def get_employees(self, current_user: dict, search: str | None, page: int, limit: int):
        conditions = []
        params = []

        # Employee can see only themselves; admin sees everyone
        if current_user["role"] != "admin":
            conditions.append("id = %s")
            params.append(current_user["employee_id"])

        # Server-side search — combined with the role filter above using
        # AND, so a non-admin can never search their way into other rows
        if search:
            conditions.append("(name ILIKE %s OR email ILIKE %s OR department ILIKE %s)")
            like_term = f"%{search}%"
            params.extend([like_term, like_term, like_term])

        rows, total = employee_repository.get_all(conditions, params, page, limit)

        return {
            "employees": [_row_to_dict(row) for row in rows],
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit if limit else 1
        }

    def get_employee(self, current_user: dict, employee_id: int):
        if current_user["role"] == "employee":
            if current_user["employee_id"] != employee_id:
                raise HTTPException(
                    status_code=403,
                    detail="You can only view your own employee record"
                )

        row = employee_repository.get_by_id(employee_id)

        if row is None:
            raise HTTPException(status_code=404, detail="Employee not found")

        return _row_to_dict(row)

    def create_employee(self, name: str, email: str, department: str):
        row = employee_repository.create(name, email, department)
        return _row_to_dict(row)

    def update_employee(self, current_user: dict, employee_id: int, name: str, email: str, department: str):
        if current_user["role"] == "employee":
            if current_user["employee_id"] != employee_id:
                raise HTTPException(
                    status_code=403,
                    detail="You can only update your own employee record"
                )

        row = employee_repository.update(employee_id, name, email, department)

        if row is None:
            raise HTTPException(status_code=404, detail="Employee not found")

        return _row_to_dict(row)

    def delete_employee(self, employee_id: int):
        row = employee_repository.delete(employee_id)

        if row is None:
            raise HTTPException(status_code=404, detail="Employee not found")

        return {"message": "Employee deleted", "id": row[0]}


# one shared instance the routes module imports
employee_controller = EmployeeController()
