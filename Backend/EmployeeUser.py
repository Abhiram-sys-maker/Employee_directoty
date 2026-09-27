import psycopg2
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

connection = psycopg2.connect(
    host="localhost",
    database="employee_directory",
    user="postgres",
    password=os.getenv("POSTGRES_PASSWORD"),
    port="5432"
)

cursor = connection.cursor()

email = "employee@company.com"
password = "employee123"
password_hash = pwd_context.hash(password)

cursor.execute("""
    INSERT INTO users
    (email, password_hash, role, employee_id)
    VALUES (%s, %s, %s, %s)
""", (
    email,
    password_hash,
    "employee",
    4
))

connection.commit()

cursor.close()
connection.close()

print("Employee user created successfully!")