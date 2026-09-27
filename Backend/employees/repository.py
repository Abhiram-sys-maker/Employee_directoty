from database.connection import db


class EmployeeRepository:
    """All direct SQL for the `employees` table lives here.
    Nothing about HTTP, roles, or FastAPI — routes.py decides WHO
    is allowed to call these methods and WITH what filters; this
    class just knows how to run the queries."""

    def get_all(self, conditions: list[str], params: list, page: int, limit: int):
        connection = db.get_connection()
        cursor = connection.cursor()

        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)

        offset = (page - 1) * limit

        cursor.execute(f"SELECT COUNT(*) FROM employees {where_clause}", tuple(params))
        total = cursor.fetchone()[0]

        cursor.execute(f"""
            SELECT id, name, email, department
            FROM employees
            {where_clause}
            ORDER BY id
            LIMIT %s OFFSET %s
        """, tuple(params) + (limit, offset))

        rows = cursor.fetchall()

        cursor.close()
        connection.close()

        return rows, total

    def get_by_id(self, employee_id: int):
        connection = db.get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT id, name, email, department
            FROM employees
            WHERE id = %s
        """, (employee_id,))

        row = cursor.fetchone()

        cursor.close()
        connection.close()

        return row

    def create(self, name: str, email: str, department: str):
        connection = db.get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            INSERT INTO employees (name, email, department)
            VALUES (%s, %s, %s)
            RETURNING id, name, email, department
        """, (name, email, department))

        row = cursor.fetchone()
        connection.commit()

        cursor.close()
        connection.close()

        return row

    def update(self, employee_id: int, name: str, email: str, department: str):
        connection = db.get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE employees
            SET name = %s, email = %s, department = %s
            WHERE id = %s
            RETURNING id, name, email, department
        """, (name, email, department, employee_id))

        row = cursor.fetchone()
        connection.commit()

        cursor.close()
        connection.close()

        return row

    def delete(self, employee_id: int):
        connection = db.get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            DELETE FROM employees
            WHERE id = %s
            RETURNING id
        """, (employee_id,))

        row = cursor.fetchone()
        connection.commit()

        cursor.close()
        connection.close()

        return row


# one shared instance the rest of the app imports
employee_repository = EmployeeRepository()
