# fix_enum_final.py
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:accord@localhost:5432/contact_db")

def fix_enum_final():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("🔍 Starting final enum fix...")
        
        # Step 1: Check current state
        print("\n📋 Step 1: Checking current state...")
        
        # Check if enum exists
        result = db.execute(text("""
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'orderstatus'
            );
        """))
        enum_exists = result.scalar()
        print(f"  orderstatus enum exists: {enum_exists}")
        
        if enum_exists:
            # Get enum values
            result = db.execute(text("""
                SELECT unnest(enum_range(NULL::orderstatus))::text;
            """))
            enum_values = [row[0] for row in result]
            print(f"  Current enum values: {enum_values}")
        
        # Check data
        result = db.execute(text("""
            SELECT COUNT(*) FROM orders;
        """))
        order_count = result.scalar()
        print(f"  Orders in table: {order_count}")
        
        if order_count > 0:
            result = db.execute(text("""
                SELECT DISTINCT order_status::text, COUNT(*) 
                FROM orders 
                GROUP BY order_status::text;
            """))
            data = result.fetchall()
            print("  Current data values:")
            for val, count in data:
                print(f"    {val}: {count} records")
        
        # Step 2: Drop existing enum and recreate with proper values
        print("\n📋 Step 2: Recreating enum with proper values...")
        
        # Drop the column dependency first by changing column type to text temporarily
        db.execute(text("""
            ALTER TABLE orders 
            ALTER COLUMN order_status TYPE text;
        """))
        db.commit()
        print("  ✅ Column changed to text temporarily")
        
        # Drop the enum
        db.execute(text("DROP TYPE IF EXISTS orderstatus CASCADE;"))
        print("  ✅ Dropped old enum")
        
        # Create new enum with proper values
        db.execute(text("""
            CREATE TYPE orderstatus AS ENUM (
                'PENDING', 'CONFIRMED', 'PROCESSING', 
                'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED'
            );
        """))
        print("  ✅ Created new enum with uppercase values")
        
        # Convert data back to uppercase
        db.execute(text("""
            UPDATE orders 
            SET order_status = UPPER(order_status);
        """))
        db.commit()
        print("  ✅ Data converted to uppercase")
        
        # Change column back to enum type
        db.execute(text("""
            ALTER TABLE orders 
            ALTER COLUMN order_status TYPE orderstatus 
            USING order_status::orderstatus;
        """))
        db.commit()
        print("  ✅ Column changed back to enum type")
        
        # Step 3: Verify
        print("\n📋 Step 3: Verifying fix...")
        
        result = db.execute(text("""
            SELECT unnest(enum_range(NULL::orderstatus))::text;
        """))
        new_enum_values = [row[0] for row in result]
        print(f"  New enum values: {new_enum_values}")
        
        if order_count > 0:
            result = db.execute(text("""
                SELECT DISTINCT order_status::text, COUNT(*) 
                FROM orders 
                GROUP BY order_status::text;
            """))
            final_data = result.fetchall()
            print("  Data after fix:")
            for val, count in final_data:
                print(f"    {val}: {count} records")
        
        # Test query
        print("\n📋 Step 4: Testing query...")
        result = db.execute(text("""
            SELECT order_number, order_status::text 
            FROM orders 
            LIMIT 3;
        """))
        sample = result.fetchall()
        if sample:
            print("  Sample orders:")
            for order_num, status in sample:
                print(f"    {order_num}: {status}")
        
        print("\n✅ Fix completed successfully!")
        print("🚀 Restart your FastAPI server now.")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Fix failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    fix_enum_final()