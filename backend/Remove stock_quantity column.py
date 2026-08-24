# remove_stock_column.py
from sqlalchemy import text, inspect
from app import engine

def remove_stock_column():
    with engine.connect() as conn:
        # Check if column exists
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('products')]
        
        if 'stock_quantity' in columns:
            print("📦 Removing stock_quantity column from products table...")
            conn.execute(text("ALTER TABLE products DROP COLUMN stock_quantity"))
            conn.commit()
            print("✅ Column removed successfully!")
        else:
            print("✅ stock_quantity column doesn't exist. Nothing to remove.")

if __name__ == "__main__":
    remove_stock_column()