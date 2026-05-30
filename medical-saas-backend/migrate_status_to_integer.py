from sqlalchemy import text
from app.db.base import SessionLocal

db = SessionLocal()
try:
    # 1. Update existing string values to numeric strings
    print("Converting string status values to numeric strings...")
    
    # We will use lower() to be case-insensitive
    db.execute(text("""
        UPDATE agendamentos 
        SET status = CASE 
            WHEN lower(status) = 'agendado' THEN '1'
            WHEN lower(status) = 'em_andamento' THEN '2'
            WHEN lower(status) = 'em andamento' THEN '2'
            WHEN lower(status) = 'realizado' THEN '3'
            WHEN lower(status) = 'cancelado' THEN '4'
            WHEN lower(status) = 'reagendado' THEN '5'
            ELSE '1' -- Fallback to Agendado if null or unrecognized
        END
        WHERE status IS NULL OR status NOT IN ('1', '2', '3', '4', '5');
    """))
    db.commit()
    print("Status values converted successfully.")

    # 2. Alter column type in PostgreSQL to INTEGER by dropping/re-adding default
    print("Altering column type to INTEGER in PostgreSQL (managing default constraint)...")
    db.execute(text("""
        -- 1. Drop existing default
        ALTER TABLE agendamentos ALTER COLUMN status DROP DEFAULT;
        
        -- 2. Convert column type
        ALTER TABLE agendamentos ALTER COLUMN status TYPE INTEGER USING status::integer;
        
        -- 3. Set new integer default
        ALTER TABLE agendamentos ALTER COLUMN status SET DEFAULT 1;
    """))
    db.commit()
    print("Column type successfully altered to INTEGER!")

except Exception as e:
    db.rollback()
    print(f"Error during migration: {e}")
finally:
    db.close()
