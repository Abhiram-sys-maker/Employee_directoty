import os
import psycopg2


class Database:
    """Wraps Postgres connection details so nothing else in the
    codebase needs to know host/port/credentials directly."""

    def __init__(self):
        self.host = "localhost"
        self.database = "employee_directory"
        self.user = "postgres"
        self.password = os.getenv("POSTGRES_PASSWORD")
        self.port = "5432"

    def get_connection(self):
        return psycopg2.connect(
            host=self.host,
            database=self.database,
            user=self.user,
            password=self.password,
            port=self.port
        )


# one shared instance the rest of the app imports
db = Database()
