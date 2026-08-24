# fix_order_status_force.py
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:accord@localhost:5432/contact_db")

def force_fix_enum():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("🔍 Checking current enum state...")
        
        # Check enum values
        result = db.execute(text("""
            SELECT unnest(enum_range(NULL::orderstatus))::text;
        """))
        enum_values = [row[0] for row in result]
        print(f"Current enum values: {enum_values}")
        
        # If enum has uppercase values but data has lowercase, update data first
        if any(v.isupper() for v in enum_values):
            print("🔄 Enum has uppercase values, updating data to match...")
            
            # Update data to uppercase
            db.execute(text("""
                UPDATE orders 
                SET order_status = 'PENDING'::orderstatus 
                WHERE order_status::text = 'pending';
            """))
            db.execute(text("""
                UPDATE orders 
                SET order_status = 'CONFIRMED'::orderstatus 
                WHERE order_status::text = 'confirmed';
            """))
            db.execute(text("""
                UPDATE orders 
                SET order_status = 'PROCESSING'::orderstatus 
                WHERE order_status::text = 'processing';
            """))
            db.execute(text("""
                UPDATE orders 
                SET order_status = 'SHIPPED'::orderstatus 
                WHERE order_status::text = 'shipped';
            """))
            db.execute(text("""
                UPDATE orders 
                SET order_status = 'COMPLETED'::orderstatus 
                WHERE order_status::text = 'completed';
            """))
            db.execute(text("""
                UPDATE orders 
                SET order_status = 'CANCELLED'::orderstatus 
                WHERE order_status::text = 'cancelled';
            """))
            db.execute(text("""
                UPDATE orders 
                SET order_status = 'REFUNDED'::orderstatus 
                WHERE order_status::text = 'refunded';
            """))
            
            db.commit()
            print("✅ Data updated successfully")
            
        # Verify
        result = db.execute(text("""
            SELECT DISTINCT order_status::text, COUNT(*) 
            FROM orders 
            GROUP BY order_status::text;
        """))
        
        print("\n📊 Updated values in orders table:")
        for row in result.fetchall():
            print(f"  {row[0]}: {row[1]} records")
            
    except Exception as e:
        db.rollback()
        print(f"❌ Fix failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    force_fix_enum()