# migration.py
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

def remove_delivery_columns():
    """Remove delivery columns from orders table"""
    
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:accord@localhost:5432/contact_db")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        conn = conn.execution_options(isolation_level="AUTOCOMMIT")
        
        # Check existing columns
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name LIKE 'delivery_%'
        """))
        
        columns = [row[0] for row in result]
        
        if columns:
            print(f"Found delivery columns: {columns}")
            
            # Drop each column
            for col in columns:
                try:
                    conn.execute(text(f"ALTER TABLE orders DROP COLUMN IF EXISTS {col}"))
                    print(f"✅ Dropped column: {col}")
                except Exception as e:
                    print(f"❌ Error dropping {col}: {e}")
        else:
            print("✅ No delivery columns found to drop")
        
        print("✅ Migration completed!")

if __name__ == "__main__":
    remove_delivery_columns()