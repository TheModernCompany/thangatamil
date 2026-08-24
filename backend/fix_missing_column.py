# fix_missing_column.py
from sqlalchemy import text, inspect
from app import engine

def fix_products_table():
    with engine.connect() as conn:
        # Check if column exists
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('products')]
        
        if 'stock_quantity' not in columns:
            print("📦 Adding missing stock_quantity column...")
            conn.execute(text("ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 0"))
            conn.commit()
            print("✅ Column added successfully!")
        else:
            print("✅ stock_quantity column already exists.")
            
        # Verify
        result = conn.execute(text("SELECT COUNT(*) FROM products WHERE stock_quantity IS NULL"))
        count = result.scalar()
        if count > 0:
            conn.execute(text("UPDATE products SET stock_quantity = 0 WHERE stock_quantity IS NULL"))
            conn.commit()
            print(f"✅ Updated {count} rows with NULL stock_quantity")
        else:
            print("✅ All rows have stock_quantity values")

if __name__ == "__main__":
    fix_products_table()