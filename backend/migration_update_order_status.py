# migration_update_order_status.py

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:accord@localhost:5432/contact_db")

def migrate():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Add new columns to orders table
        db.execute(text("""
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS additional_discount_percentage FLOAT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS additional_discount_amount FLOAT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS final_amount FLOAT,
            ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '{}'::jsonb,
            ADD COLUMN IF NOT EXISTS staff_notes TEXT,
            ADD COLUMN IF NOT EXISTS customer_notes TEXT,
            ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS processing_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
        """))
        
        # Set final_amount = total_amount for existing orders
        db.execute(text("""
            UPDATE orders 
            SET final_amount = total_amount 
            WHERE final_amount IS NULL;
        """))
        
        # Initialize status_history for existing orders
        db.execute(text("""
            UPDATE orders 
            SET status_history = jsonb_build_object(
                'pending', to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
            )
            WHERE status_history = '{}'::jsonb OR status_history IS NULL;
        """))
        
        db.commit()
        print("✅ Migration completed successfully!")
        print("Added columns:")
        print("  - additional_discount_percentage, additional_discount_amount, final_amount")
        print("  - status_history, staff_notes, customer_notes")
        print("  - confirmed_at, processing_at, shipped_at, cancelled_at")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()