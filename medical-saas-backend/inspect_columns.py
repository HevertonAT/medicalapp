from sqlalchemy import inspect
from app.db.base import engine

inspector = inspect(engine)
columns = inspector.get_columns("agendamentos")
for col in columns:
    print(f"Column: {col['name']}, Type: {col['type']}")
