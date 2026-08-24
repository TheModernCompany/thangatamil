# fix_enum_complete.py
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:accord@localhost:5432/contact_db")

def fix_enum_complete():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("🔍 Checking current enum state...")
        
        # Check current enum values
        result = db.execute(text("""
            SELECT unnest(enum_range(NULL::orderstatus))::text;
        """))
        current_values = [row[0] for row in result]
        print(f"Current enum values: {current_values}")
        
        # Check what values are actually in the table
        result = db.execute(text("""
            SELECT DISTINCT order_status::text FROM orders;
        """))
        db_values = [row[0] for row in result]
        print(f"Distinct values in database: {db_values}")
        
        # Check if we need to fix anything
        if not current_values or not db_values:
            print("ℹ️ No data to fix.")
            return
        
        # Check if there's a mismatch
        if current_values and db_values:
            # If database values are uppercase but enum expects lowercase
            if any(v.isupper() for v in db_values) and any(v.islower() for v in current_values):
                print("⚠️ Mismatch found! Database has uppercase values but enum expects lowercase.")
                print("🔄 Running complete fix...")
                
                # Create a new enum with all possible values (both cases)
                db.execute(text("""
                    CREATE TYPE orderstatus_new AS ENUM (
                        'PENDING', 'CONFIRMED', 'PROCESSING', 
                        'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED'
                    );
                """))
                
                # Update the column to use the new enum, preserving existing data
                db.execute(text("""
                    ALTER TABLE orders 
                    ALTER COLUMN order_status 
                    TYPE orderstatus_new 
                    USING order_status::text::orderstatus_new;
                """))
                
                # Drop old enum
                db.execute(text("DROP TYPE orderstatus CASCADE;"))
                
                # Rename new enum
                db.execute(text("ALTER TYPE orderstatus_new RENAME TO orderstatus;"))
                
                print("✅ Enum values fixed to UPPERCASE!")
                
            # If database values are lowercase but enum expects uppercase
            elif any(v.islower() for v in db_values) and any(v.isupper() for v in current_values):
                print("⚠️ Mismatch found! Database has lowercase values but enum expects uppercase.")
                print("🔄 Running complete fix...")
                
                # Create a new enum with lowercase values
                db.execute(text("""
                    CREATE TYPE orderstatus_new AS ENUM (
                        'pending', 'confirmed', 'processing', 
                        'shipped', 'completed', 'cancelled', 'refunded'
                    );
                """))
                
                # Update the column to use the new enum
                db.execute(text("""
                    ALTER TABLE orders 
                    ALTER COLUMN order_status 
                    TYPE orderstatus_new 
                    USING order_status::text::orderstatus_new;
                """))
                
                # Drop old enum
                db.execute(text("DROP TYPE orderstatus CASCADE;"))
                
                # Rename new enum
                db.execute(text("ALTER TYPE orderstatus_new RENAME TO orderstatus;"))
                
                print("✅ Enum values fixed to lowercase!")
            
            else:
                print("✅ No mismatch found. Enum values are consistent.")
        
        db.commit()
        
        # Verify the fix
        result = db.execute(text("""
            SELECT unnest(enum_range(NULL::orderstatus))::text;
        """))
        new_values = [row[0] for row in result]
        print(f"✅ New enum values: {new_values}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    fix_enum_complete()