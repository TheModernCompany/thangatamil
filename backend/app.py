# app.py
from fastapi import FastAPI, HTTPException, Depends, Query, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import os
import shutil
import uuid
import json
import random
from dotenv import load_dotenv

# Database imports
from sqlalchemy import create_engine, text, or_, and_, func
from sqlalchemy.orm import sessionmaker, Session, joinedload
from sqlalchemy.pool import QueuePool

# Pydantic schemas
from pydantic import BaseModel, Field, field_validator, EmailStr

# Import models
from models import (
    Base, Product, UserRegistration, Order, OrderItem, ContactSubmission,
    ProductCategory, OrderStatus, PaymentStatus, SubmissionStatus, EnquiryType,
    Bill, BillStatus, Brand,  # Added Brand import
    get_ist_now, IST
)

# Load environment variables
load_dotenv()

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:accord@localhost:5432/contact_db")
UPLOAD_DIR = "uploads/products"
IMAGE_URL_PREFIX = "/uploads/products/"

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ============ Database Setup ============

def ensure_database_exists():
    try:
        default_url = "postgresql://postgres:accord@localhost:5432/postgres"
        engine_default = create_engine(default_url)
        
        with engine_default.connect() as conn:
            conn = conn.execution_options(isolation_level="AUTOCOMMIT")
            result = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = 'contact_db'")
            )
            exists = result.fetchone() is not None
            
            if not exists:
                print("📦 Creating database 'contact_db'...")
                conn.execute(text("CREATE DATABASE contact_db"))
                print("✅ Database 'contact_db' created successfully!")
            else:
                print("✅ Database 'contact_db' already exists.")
        
        engine_default.dispose()
    except Exception as e:
        print(f"⚠️ Error ensuring database exists: {e}")
        raise

# Create database if it doesn't exist
ensure_database_exists()

# SQLAlchemy Setup with Connection Pooling
engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)
print("✅ Database tables created successfully!")

# ============ FastAPI App ============

app = FastAPI(
    title="Product & Contact Management System API",
    description="API for managing products, images, inventory, and contact submissions",
    version="2.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ============ Database Dependency ============

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============ Helper Functions ============

def calculate_discounted_price(price: float, discount: float) -> float:
    return round(price - (price * discount / 100), 2)

def save_uploaded_file(file: UploadFile) -> str:
    """Save uploaded file and return the file path"""
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return f"{IMAGE_URL_PREFIX}{unique_filename}"

def delete_image_file(image_url: str) -> bool:
    """Delete image file from filesystem"""
    try:
        filename = os.path.basename(image_url)
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"🗑️ Deleted file: {file_path}")
            return True
        print(f"⚠️ File not found: {file_path}")
        return False
    except Exception as e:
        print(f"❌ Error deleting file {image_url}: {str(e)}")
        return False

def delete_multiple_image_files(image_urls: List[str]) -> int:
    """Delete multiple image files from filesystem"""
    deleted_count = 0
    for url in image_urls:
        if delete_image_file(url):
            deleted_count += 1
    return deleted_count

def generate_order_number() -> str:
    """Generate unique order number using IST"""
    timestamp = get_ist_now().strftime('%Y%m%d')
    random_num = random.randint(1000, 9999)
    return f"ORD-{timestamp}-{random_num}"

def generate_invoice_number(db: Session) -> str:
    """
    Generate a professional invoice number in format: INV-YYYY-MM-XXX
    Where XXX is the sequential bill count for that month
    Using IST timezone
    """
    now = get_ist_now()
    year = now.strftime('%Y')
    month = now.strftime('%m')
    
    start_of_month = datetime(now.year, now.month, 1, 0, 0, 0, tzinfo=IST)
    
    count = db.query(Order).filter(
        Order.created_at >= start_of_month,
        Order.invoice_number.isnot(None)
    ).count()
    
    sequential = count + 1
    sequential_str = str(sequential).zfill(3)
    
    invoice_number = f"INV-{year}-{month}-{sequential_str}"
    
    return invoice_number

def generate_bill_number(db: Session, prefix: str = "BILL") -> str:
    """
    Generate bill number in format: PREFIX-YYYY-MM-XXX
    Where XXX is the sequential bill count for that month
    
    Args:
        db: Database session
        prefix: Bill prefix (default: "BILL")
    
    Returns:
        str: Generated bill number
    """
    now = get_ist_now()
    year = now.strftime('%Y')
    month = now.strftime('%m')
    
    start_of_month = datetime(now.year, now.month, 1, 0, 0, 0, tzinfo=IST)
    
    count = db.query(Bill).filter(
        Bill.created_at >= start_of_month
    ).count()
    
    sequential = count + 1
    sequential_str = str(sequential).zfill(3)
    
    return f"{prefix}-{year}-{month}-{sequential_str}"

def get_customer_from_db(customer_id: str, db: Session) -> UserRegistration:
    """Helper to fetch customer with validation"""
    try:
        customer_uuid = uuid.UUID(customer_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid customer ID format")
    
    customer = db.query(UserRegistration).filter(
        UserRegistration.id == customer_uuid,
        UserRegistration.is_active == True
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found or inactive")
    
    return customer

# ============ FIXED: Enhanced Status Helper Functions ============

def validate_status_transition(current_status: OrderStatus, new_status: OrderStatus) -> bool:
    """
    Enhanced status transition validation with support for restoration.
    Now allows restoring cancelled/refunded orders back to active status.
    """
    # Convert to string for comparison if needed
    current_str = current_status.value if hasattr(current_status, 'value') else str(current_status)
    new_str = new_status.value if hasattr(new_status, 'value') else str(new_status)
    
    # Define allowed transitions
    allowed_transitions = {
        'PENDING': ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED'],
        'CONFIRMED': ['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED'],
        'PROCESSING': ['PENDING', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED'],
        'SHIPPED': ['PENDING', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED'],
        'COMPLETED': ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'CANCELLED', 'REFUNDED'],
        'CANCELLED': ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'REFUNDED'],
        'REFUNDED': ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED']
    }
    
    # Check if the transition is allowed
    if new_str in allowed_transitions.get(current_str, []):
        return True
    
    # Additional check: If current is CANCELLED and new is a valid active status
    if current_str in ['CANCELLED', 'REFUNDED']:
        if new_str in ['PENDING', 'CONFIRMED', 'PROCESSING']:
            return True
    
    return False

def update_status_history(
    order, 
    new_status: OrderStatus, 
    note: Optional[str] = None,
    restoration_reason: Optional[str] = None
):
    """
    Enhanced status history update with restoration tracking.
    Uses IST timestamps.
    """
    if order.status_history is None:
        order.status_history = {}
    
    history = dict(order.status_history) if order.status_history else {}
    
    # Convert status to string
    new_status_str = new_status.value if hasattr(new_status, 'value') else str(new_status)
    current_status_str = order.order_status.value if hasattr(order.order_status, 'value') else str(order.order_status)
    
    # Create status entry with IST timestamp
    status_entry = {
        "timestamp": get_ist_now().isoformat(),
        "status": new_status_str
    }
    
    if note:
        status_entry["note"] = note
    
    # Check if this is a restoration
    if current_status_str in ['CANCELLED', 'REFUNDED'] and new_status_str not in ['CANCELLED', 'REFUNDED']:
        status_entry["is_restoration"] = True
        status_entry["restored_from"] = current_status_str
        status_entry["restoration_reason"] = restoration_reason or "Not specified"
    
    # Store in history with the status as key
    history[new_status_str] = status_entry
    
    # Also maintain backward compatibility with simple timestamps
    history[f"{new_status_str}_timestamp"] = get_ist_now().isoformat()
    if note:
        history[f"{new_status_str}_note"] = note
    
    order.status_history = history

def update_status_timestamp(order, new_status: OrderStatus):
    """
    Update the specific timestamp field based on status.
    Uses IST.
    """
    now = get_ist_now()
    
    new_status_str = new_status.value if hasattr(new_status, 'value') else str(new_status)
    
    status_timestamp_map = {
        'CONFIRMED': 'confirmed_at',
        'PROCESSING': 'processing_at',
        'SHIPPED': 'shipped_at',
        'COMPLETED': 'completed_at',
        'CANCELLED': 'cancelled_at',
    }
    
    if new_status_str in status_timestamp_map:
        setattr(order, status_timestamp_map[new_status_str], now)
    
    # If restoring from cancelled/refunded, clear the cancelled_at timestamp
    if new_status_str not in ['CANCELLED', 'REFUNDED']:
        order.cancelled_at = None


# ============ Pydantic Schemas ============

# Product Schemas
class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1)
    price: float = Field(..., gt=0)
    discount: float = Field(0, ge=0, le=100)
    description: Optional[str] = None
    isActive: bool = True
    images: List[str] = []

    @field_validator('discount')
    @classmethod
    def validate_discount(cls, v):
        if v < 0 or v > 100:
            raise ValueError('Discount must be between 0 and 100')
        return v

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, min_length=1)
    price: Optional[float] = Field(None, gt=0)
    discount: Optional[float] = Field(None, ge=0, le=100)
    description: Optional[str] = None
    isActive: Optional[bool] = None
    images: Optional[List[str]] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    category: str
    price: float
    discount: float
    discountedPrice: float
    description: Optional[str]
    isActive: bool
    images: List[str]
    createdAt: str
    updatedAt: Optional[str]
    deletedAt: Optional[str] = None

class BulkActionRequest(BaseModel):
    action: str
    ids: List[str]

# User Registration Schemas
class UserRegistrationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    contact: str = Field(..., min_length=10, max_length=10)
    pincode: str = Field(..., min_length=6, max_length=6)
    cityVillage: str = Field(..., min_length=2, max_length=255)
    address: str = Field(..., min_length=5)
    email: Optional[EmailStr] = None

    @field_validator('contact')
    @classmethod
    def validate_contact(cls, v):
        if not v or len(v) != 10:
            raise ValueError('Contact must be exactly 10 digits')
        if not v.isdigit():
            raise ValueError('Contact must contain only digits')
        if v[0] not in '6789':
            raise ValueError('Contact must start with 6, 7, 8, or 9')
        return v

    @field_validator('pincode')
    @classmethod
    def validate_pincode(cls, v):
        if not v or len(v) != 6:
            raise ValueError('Pincode must be exactly 6 digits')
        if not v.isdigit():
            raise ValueError('Pincode must contain only digits')
        if v[0] == '0':
            raise ValueError('Pincode cannot start with 0')
        return v

class UserRegistrationUpdate(BaseModel):
    """Schema for updating user - all fields optional"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    contact: Optional[str] = Field(None, min_length=10, max_length=10)
    pincode: Optional[str] = Field(None, min_length=6, max_length=6)
    cityVillage: Optional[str] = Field(None, min_length=2, max_length=255)
    address: Optional[str] = Field(None, min_length=5)
    email: Optional[EmailStr] = None

    @field_validator('contact')
    @classmethod
    def validate_contact(cls, v):
        if v is not None:
            if not v or len(v) != 10:
                raise ValueError('Contact must be exactly 10 digits')
            if not v.isdigit():
                raise ValueError('Contact must contain only digits')
            if v[0] not in '6789':
                raise ValueError('Contact must start with 6, 7, 8, or 9')
        return v

    @field_validator('pincode')
    @classmethod
    def validate_pincode(cls, v):
        if v is not None:
            if not v or len(v) != 6:
                raise ValueError('Pincode must be exactly 6 digits')
            if not v.isdigit():
                raise ValueError('Pincode must contain only digits')
            if v[0] == '0':
                raise ValueError('Pincode cannot start with 0')
        return v

class UserRegistrationResponse(BaseModel):
    id: str
    name: str
    contact: str
    pincode: str
    cityVillage: str
    address: str
    email: Optional[str]
    registrationDate: str
    isActive: bool
    additionalDiscount: float = 0
    updatedAt: Optional[str] = None

# Order Schemas
class OrderItemCreate(BaseModel):
    productId: str
    quantity: int = Field(..., ge=1, le=100)
    productName: str
    unitPrice: float
    discountedUnitPrice: float
    discountPercentage: float
    totalPrice: float
    productCategory: str
    productImage: Optional[str] = None

class OrderCreate(BaseModel):
    userId: Optional[str] = None
    items: List[OrderItemCreate]
    subtotal: float
    discountAmount: float
    shippingCharge: float = 0
    taxAmount: float = 0
    totalAmount: float
    paymentMethod: Optional[str] = "cash"
    referenceId: Optional[str] = ""

class CheckoutRequest(BaseModel):
    user: UserRegistrationCreate
    order: OrderCreate

class OrderStatusUpdate(BaseModel):
    orderStatus: str
    paymentStatus: Optional[str] = None
    staffNotes: Optional[str] = None
    customerNotes: Optional[str] = None
    restorationReason: Optional[str] = None

class OrderBulkStatusUpdate(BaseModel):
    orderIds: List[str]
    orderStatus: str
    staffNotes: Optional[str] = None

class OrderPaymentUpdateRequest(BaseModel):
    """Updated payment request schema with partial payment support"""
    paymentMethod: Optional[str] = None
    referenceId: Optional[str] = None
    isPaid: Optional[bool] = None
    paidAmount: Optional[float] = Field(None, ge=0, description="Amount paid in this transaction")
    remainingAmount: Optional[float] = Field(None, ge=0, description="Remaining amount due")
    paymentNote: Optional[str] = Field(None, description="Optional note for this payment")

# Contact Schemas
class ContactSubmissionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    contactNumber: str = Field(..., min_length=5, max_length=20)
    location: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    enquiryType: str = Field(..., min_length=1)
    message: Optional[str] = None

class ContactSubmissionUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    contactNumber: Optional[str] = Field(None, max_length=20)
    location: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    enquiryType: Optional[str] = None
    message: Optional[str] = None
    status: Optional[str] = None
    isStarred: Optional[bool] = None
    notes: Optional[str] = None

class BulkActionRequestContact(BaseModel):
    action: str
    ids: List[str]

# User Status Update Schema
class UserStatusUpdate(BaseModel):
    isActive: bool

# User Discount Update Schema
class UserDiscountUpdate(BaseModel):
    discount: float = Field(..., ge=0, le=100)


# ============ BILLING SCHEMAS ============

class BillItemCreate(BaseModel):
    productId: str
    productName: str
    quantity: int = Field(..., gt=0)
    mrp: float = Field(..., gt=0)
    total: float = Field(..., gt=0)

class BillCreate(BaseModel):
    customerId: str
    items: List[BillItemCreate]
    subtotal: float = Field(..., gt=0)
    discount: float = Field(0, ge=0)
    customerDiscount: float = Field(0, ge=0)
    total: float = Field(..., gt=0)
    paidAmount: float = Field(0, ge=0)
    remainingAmount: float = Field(0, ge=0)
    paymentMethod: str = Field("cash")
    paymentStatus: str = Field("pending")
    notes: Optional[str] = None

class BillPaymentUpdate(BaseModel):
    """Schema for partial/full payment update"""
    paidAmount: float = Field(..., gt=0)
    paymentMethod: Optional[str] = None
    note: Optional[str] = None


# ============ BRAND SCHEMAS ============

class BrandCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    imageUrl: str = Field(..., min_length=1)
    displayOrder: Optional[int] = 0
    isActive: Optional[bool] = True

class BrandUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    imageUrl: Optional[str] = None
    displayOrder: Optional[int] = None
    isActive: Optional[bool] = None

class BrandResponse(BaseModel):
    id: str
    name: str
    imageUrl: str
    displayOrder: int
    isActive: bool
    createdAt: str
    updatedAt: Optional[str]

class BrandBulkActionRequest(BaseModel):
    action: str
    ids: List[str]


# ============ Root Endpoint ============

@app.get("/")
async def root():
    return {
        "message": "Product & Contact Management System API",
        "version": "2.0.0",
        "timezone": "Asia/Kolkata (IST UTC+5:30)",
        "endpoints": {
            "products": "/api/products",
            "products_by_id": "/api/products/{product_id}",
            "upload": "/api/products/upload",
            "product_stats": "/api/products/stats",
            "product_bulk": "/api/products/bulk",
            "brands": "/api/brands",
            "brands_active": "/api/brands/active",
            "brands_by_id": "/api/brands/{brand_id}",
            "brands_bulk": "/api/brands/bulk",
            "submissions": "/api/submissions",
            "submission_stats": "/api/stats",
            "register": "/api/register",
            "users": "/api/users",
            "user_by_id": "/api/users/{user_id}",
            "user_update": "/api/users/{user_id}",
            "user_status": "/api/users/{user_id}/status",
            "user_discount": "/api/users/{user_id}/discount",
            "user_orders": "/api/users/{user_id}/orders",
            "orders": "/api/orders",
            "checkout": "/api/orders/checkout",
            "order_payment": "/api/orders/{order_id}/payment",
            "order_status": "/api/orders/{order_id}/status",
            "bulk_status": "/api/orders/bulk/status",
            "status_history": "/api/orders/{order_id}/status-history",
            "payment_history": "/api/orders/{order_id}/payment-history",
            "bills": "/api/bills",
            "bill_stats": "/api/bills/stats",
            "pending_bills": "/api/bills/pending"
        }
    }


# ============ Health Check ============

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": get_ist_now().isoformat(),
        "timezone": "Asia/Kolkata (IST UTC+5:30)"
    }


# ============ Product Routes ============

@app.get("/api/products", response_model=List[ProductResponse])
async def get_products(
    search: Optional[str] = Query(None, description="Search by name or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    include_deleted: Optional[bool] = Query(False, description="Include soft-deleted products"),
    sort_by: Optional[str] = Query("createdAt", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc/desc)"),
    limit: Optional[int] = Query(100, ge=1, le=1000, description="Results limit"),
    offset: Optional[int] = Query(0, ge=0, description="Results offset"),
    db: Session = Depends(get_db)
):
    """Get all products with filtering, sorting, and pagination"""
    query = db.query(Product)
    
    # Filter out soft-deleted products by default
    if not include_deleted:
        query = query.filter(Product.deleted_at.is_(None))
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_term)) |
            (Product.description.ilike(search_term))
        )
    
    if category and category != "all":
        query = query.filter(Product.category == category)
    
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)
    
    sort_field_map = {
        "name": Product.name,
        "category": Product.category,
        "price": Product.price,
        "discount": Product.discount,
        "createdAt": Product.created_at,
        "updatedAt": Product.updated_at
    }
    
    sort_field = sort_field_map.get(sort_by, Product.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(sort_field.asc())
    else:
        query = query.order_by(sort_field.desc())
    
    query = query.offset(offset).limit(limit)
    
    products = query.all()
    return [product.to_dict() for product in products]

@app.get("/api/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, db: Session = Depends(get_db)):
    """Get a single product by ID"""
    try:
        product_uuid = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid product ID format")
    
    product = db.query(Product).filter(Product.id == product_uuid).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product.to_dict()

@app.post("/api/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(product_data: ProductCreate, db: Session = Depends(get_db)):
    """Create a new product"""
    discounted_price = calculate_discounted_price(product_data.price, product_data.discount)
    images = product_data.images if product_data.images else []
    
    db_product = Product(
        name=product_data.name,
        category=product_data.category,
        price=product_data.price,
        discount=product_data.discount,
        discounted_price=discounted_price,
        description=product_data.description,
        is_active=product_data.isActive,
        images=images
    )
    
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    return db_product.to_dict()

@app.post("/api/products/upload")
async def upload_images(files: List[UploadFile] = File(...)):
    """Upload product images"""
    uploaded_urls = []
    
    for file in files:
        if not file.content_type.startswith('image/'):
            continue
        
        try:
            image_url = save_uploaded_file(file)
            uploaded_urls.append(image_url)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload {file.filename}: {str(e)}")
    
    if not uploaded_urls:
        raise HTTPException(status_code=400, detail="No valid images uploaded")
    
    return {
        "message": f"Successfully uploaded {len(uploaded_urls)} images",
        "urls": uploaded_urls
    }

@app.put("/api/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    db: Session = Depends(get_db)
):
    """Update a product - automatically deletes removed image files"""
    try:
        product_uuid = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid product ID format")
    
    db_product = db.query(Product).filter(Product.id == product_uuid).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    old_images = db_product.images or []
    if isinstance(old_images, str):
        try:
            old_images = json.loads(old_images)
        except:
            old_images = []
    if not isinstance(old_images, list):
        old_images = []
    
    update_data = product_update.model_dump(exclude_unset=True)
    field_map = {
        "name": "name",
        "category": "category",
        "price": "price",
        "discount": "discount",
        "description": "description",
        "isActive": "is_active",
        "images": "images"
    }
    
    for key, value in update_data.items():
        if key in field_map and value is not None:
            setattr(db_product, field_map[key], value)
    
    if "images" in update_data:
        new_images = update_data["images"] or []
        if isinstance(new_images, str):
            try:
                new_images = json.loads(new_images)
            except:
                new_images = []
        if not isinstance(new_images, list):
            new_images = []
        
        removed_images = set(old_images) - set(new_images)
        
        if removed_images:
            deleted_count = delete_multiple_image_files(list(removed_images))
            print(f"🗑️ Deleted {deleted_count} orphaned images from product update")
    
    if "price" in update_data or "discount" in update_data:
        price = update_data.get("price", db_product.price)
        discount = update_data.get("discount", db_product.discount)
        db_product.discounted_price = calculate_discounted_price(price, discount)
    
    db_product.updated_at = get_ist_now()
    db.commit()
    db.refresh(db_product)
    
    return db_product.to_dict()

@app.delete("/api/products/{product_id}/images")
async def delete_product_image(
    product_id: str,
    image_url: str = Query(..., description="URL of image to delete"),
    db: Session = Depends(get_db)
):
    """Delete a specific image from a product - also deletes the physical file"""
    try:
        product_uuid = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid product ID format")
    
    db_product = db.query(Product).filter(Product.id == product_uuid).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    current_images = db_product.images or []
    if isinstance(current_images, str):
        try:
            current_images = json.loads(current_images)
        except:
            current_images = []
    if not isinstance(current_images, list):
        current_images = []
    
    if image_url not in current_images:
        raise HTTPException(status_code=404, detail="Image not found in product")
    
    updated_images = [img for img in current_images if img != image_url]
    db_product.images = updated_images
    db_product.updated_at = get_ist_now()
    
    file_deleted = delete_image_file(image_url)
    
    db.commit()
    db.refresh(db_product)
    
    return {
        "message": "Image deleted successfully",
        "productId": str(db_product.id),
        "imageUrl": image_url,
        "fileDeleted": file_deleted,
        "remainingImages": len(updated_images)
    }

@app.delete("/api/products/{product_id}/images/bulk")
async def delete_multiple_product_images(
    product_id: str,
    image_urls: List[str] = Query(..., description="List of image URLs to delete"),
    db: Session = Depends(get_db)
):
    """Delete multiple images from a product - also deletes physical files"""
    try:
        product_uuid = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid product ID format")
    
    db_product = db.query(Product).filter(Product.id == product_uuid).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    current_images = db_product.images or []
    if isinstance(current_images, str):
        try:
            current_images = json.loads(current_images)
        except:
            current_images = []
    if not isinstance(current_images, list):
        current_images = []
    
    existing_images = [img for img in image_urls if img in current_images]
    if not existing_images:
        raise HTTPException(status_code=404, detail="No matching images found")
    
    updated_images = [img for img in current_images if img not in existing_images]
    db_product.images = updated_images
    db_product.updated_at = get_ist_now()
    
    deleted_count = delete_multiple_image_files(existing_images)
    
    db.commit()
    db.refresh(db_product)
    
    return {
        "message": f"Deleted {deleted_count} images",
        "productId": str(db_product.id),
        "deletedCount": deleted_count,
        "remainingImages": len(updated_images)
    }

@app.patch("/api/products/{product_id}/status")
async def update_product_status(
    product_id: str,
    is_active: bool,
    db: Session = Depends(get_db)
):
    """Update product active status"""
    try:
        product_uuid = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid product ID format")
    
    db_product = db.query(Product).filter(Product.id == product_uuid).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db_product.is_active = is_active
    db_product.updated_at = get_ist_now()
    db.commit()
    db.refresh(db_product)
    
    return {
        "message": f"Product {'activated' if is_active else 'deactivated'} successfully",
        "isActive": db_product.is_active
    }

@app.delete("/api/products/{product_id}")
async def delete_product(product_id: str, db: Session = Depends(get_db)):
    """Soft delete a product - preserves historical order data"""
    try:
        product_uuid = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid product ID format")
    
    db_product = db.query(Product).filter(Product.id == product_uuid).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if db_product.deleted_at is not None:
        raise HTTPException(status_code=400, detail="Product is already deleted")
    
    # Soft delete: mark as inactive and set deleted_at
    db_product.is_active = False
    db_product.deleted_at = get_ist_now()
    db_product.updated_at = get_ist_now()
    
    # Delete image files (optional - can keep for reference)
    if db_product.images:
        images = db_product.images
        if isinstance(images, str):
            try:
                images = json.loads(images)
            except:
                images = []
        if isinstance(images, list):
            delete_multiple_image_files(images)
    
    db.commit()
    db.refresh(db_product)
    
    return {
        "message": "Product soft deleted successfully",
        "product": db_product.to_dict(),
        "deletedAt": db_product.deleted_at.isoformat()
    }

@app.patch("/api/products/{product_id}/restore")
async def restore_product(product_id: str, db: Session = Depends(get_db)):
    """Restore a soft-deleted product"""
    try:
        product_uuid = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid product ID format")
    
    db_product = db.query(Product).filter(Product.id == product_uuid).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if db_product.deleted_at is None:
        raise HTTPException(status_code=400, detail="Product is not deleted")
    
    # Restore: set is_active and clear deleted_at
    db_product.is_active = True
    db_product.deleted_at = None
    db_product.updated_at = get_ist_now()
    
    db.commit()
    db.refresh(db_product)
    
    return {
        "message": "Product restored successfully",
        "product": db_product.to_dict()
    }

@app.post("/api/products/bulk")
async def bulk_action(
    bulk_request: BulkActionRequest,
    db: Session = Depends(get_db)
):
    """Perform bulk actions on multiple products"""
    if not bulk_request.ids:
        raise HTTPException(status_code=400, detail="No IDs provided")
    
    valid_ids = []
    for id_str in bulk_request.ids:
        try:
            valid_ids.append(uuid.UUID(id_str))
        except ValueError:
            pass
    
    if not valid_ids:
        raise HTTPException(status_code=400, detail="No valid UUIDs provided")
    
    products = db.query(Product).filter(Product.id.in_(valid_ids)).all()
    if not products:
        raise HTTPException(status_code=404, detail="No products found for the provided IDs")
    
    action = bulk_request.action.lower()
    affected_count = len(products)
    
    if action == "delete":
        for product in products:
            # Soft delete
            product.is_active = False
            product.deleted_at = get_ist_now()
            product.updated_at = get_ist_now()
            
            # Delete image files
            if product.images:
                images = product.images
                if isinstance(images, str):
                    try:
                        images = json.loads(images)
                    except:
                        images = []
                if isinstance(images, list):
                    delete_multiple_image_files(images)
        db.commit()
        message = f"Soft deleted {affected_count} products"
    
    elif action == "activate":
        for product in products:
            if product.deleted_at is None:  # Only activate if not soft-deleted
                product.is_active = True
                product.updated_at = get_ist_now()
        db.commit()
        message = f"Activated {affected_count} products"
    
    elif action == "deactivate":
        for product in products:
            if product.deleted_at is None:  # Only deactivate if not soft-deleted
                product.is_active = False
                product.updated_at = get_ist_now()
        db.commit()
        message = f"Deactivated {affected_count} products"
    
    elif action == "restore":
        for product in products:
            if product.deleted_at is not None:
                product.is_active = True
                product.deleted_at = None
                product.updated_at = get_ist_now()
        db.commit()
        message = f"Restored {affected_count} products"
    
    else:
        raise HTTPException(status_code=400, detail=f"Invalid action: {action}")
    
    return {
        "message": message,
        "affected_count": affected_count,
        "action": action
    }

@app.get("/api/products/stats")
async def get_product_stats(db: Session = Depends(get_db)):
    """Get product statistics"""
    total = db.query(Product).count()
    active = db.query(Product).filter(Product.is_active == True, Product.deleted_at.is_(None)).count()
    inactive = db.query(Product).filter(Product.is_active == False, Product.deleted_at.is_(None)).count()
    deleted = db.query(Product).filter(Product.deleted_at.isnot(None)).count()
    
    categories = db.query(Product.category, db.func.count()).filter(Product.deleted_at.is_(None)).group_by(Product.category).all()
    category_stats = {cat: count for cat, count in categories}
    
    return {
        "total": total,
        "active": active,
        "inactive": inactive,
        "deleted": deleted,
        "categories": category_stats
    }

@app.get("/api/products/categories")
async def get_categories():
    """Get all product categories"""
    return {
        "categories": [
            "FLOWERPOTS",
            "ROCKETS",
            "SPARKLERS",
            "GROUND",
            "ATOM BOMBSKID'S SPECIAL",
            "CHAKKARS"
        ]
    }


# ============ Brand Logo Routes ============

@app.get("/api/brands", response_model=List[BrandResponse])
async def get_brands(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    sort_by: Optional[str] = Query("displayOrder", description="Sort field"),
    sort_order: Optional[str] = Query("asc", description="Sort order (asc/desc)"),
    limit: Optional[int] = Query(100, ge=1, le=1000),
    offset: Optional[int] = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get all brands with filtering and sorting"""
    query = db.query(Brand)
    
    if is_active is not None:
        query = query.filter(Brand.is_active == is_active)
    
    sort_field_map = {
        "name": Brand.name,
        "displayOrder": Brand.display_order,
        "createdAt": Brand.created_at,
        "updatedAt": Brand.updated_at
    }
    
    sort_field = sort_field_map.get(sort_by, Brand.display_order)
    if sort_order.lower() == "asc":
        query = query.order_by(sort_field.asc())
    else:
        query = query.order_by(sort_field.desc())
    
    query = query.offset(offset).limit(limit)
    brands = query.all()
    
    return [brand.to_dict() for brand in brands]

@app.get("/api/brands/active")
async def get_active_brands(db: Session = Depends(get_db)):
    """Get all active brands for public display"""
    brands = db.query(Brand).filter(
        Brand.is_active == True
    ).order_by(Brand.display_order.asc()).all()
    
    return [brand.to_dict() for brand in brands]

@app.get("/api/brands/{brand_id}", response_model=BrandResponse)
async def get_brand(brand_id: str, db: Session = Depends(get_db)):
    """Get a single brand by ID"""
    try:
        brand_uuid = uuid.UUID(brand_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid brand ID format")
    
    brand = db.query(Brand).filter(Brand.id == brand_uuid).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    return brand.to_dict()

@app.post("/api/brands", status_code=status.HTTP_201_CREATED, response_model=BrandResponse)
async def create_brand(
    brand_data: BrandCreate,
    db: Session = Depends(get_db)
):
    """Create a new brand"""
    # Check if brand name already exists
    existing = db.query(Brand).filter(Brand.name == brand_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Brand name already exists")
    
    db_brand = Brand(
        name=brand_data.name,
        image_url=brand_data.imageUrl,
        display_order=brand_data.displayOrder or 0,
        is_active=brand_data.isActive if brand_data.isActive is not None else True
    )
    
    db.add(db_brand)
    db.commit()
    db.refresh(db_brand)
    
    return db_brand.to_dict()

@app.put("/api/brands/{brand_id}", response_model=BrandResponse)
async def update_brand(
    brand_id: str,
    brand_data: BrandUpdate,
    db: Session = Depends(get_db)
):
    """Update a brand"""
    try:
        brand_uuid = uuid.UUID(brand_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid brand ID format")
    
    db_brand = db.query(Brand).filter(Brand.id == brand_uuid).first()
    if not db_brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    update_data = brand_data.model_dump(exclude_unset=True)
    
    # Check name uniqueness if changing
    if "name" in update_data and update_data["name"] != db_brand.name:
        existing = db.query(Brand).filter(
            Brand.name == update_data["name"],
            Brand.id != brand_uuid
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Brand name already exists")
    
    field_map = {
        "name": "name",
        "imageUrl": "image_url",
        "displayOrder": "display_order",
        "isActive": "is_active"
    }
    
    for key, value in update_data.items():
        if key in field_map and value is not None:
            setattr(db_brand, field_map[key], value)
    
    db_brand.updated_at = get_ist_now()
    db.commit()
    db.refresh(db_brand)
    
    return db_brand.to_dict()

@app.delete("/api/brands/{brand_id}")
async def delete_brand(
    brand_id: str,
    db: Session = Depends(get_db)
):
    """Delete a brand"""
    try:
        brand_uuid = uuid.UUID(brand_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid brand ID format")
    
    db_brand = db.query(Brand).filter(Brand.id == brand_uuid).first()
    if not db_brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    # Delete the image file if it exists
    if db_brand.image_url:
        delete_image_file(db_brand.image_url)
    
    db.delete(db_brand)
    db.commit()
    
    return {"message": "Brand deleted successfully"}

@app.post("/api/brands/bulk")
async def bulk_action_brands(
    bulk_request: BrandBulkActionRequest,
    db: Session = Depends(get_db)
):
    """Perform bulk actions on brands"""
    if not bulk_request.ids:
        raise HTTPException(status_code=400, detail="No IDs provided")
    
    valid_ids = []
    for id_str in bulk_request.ids:
        try:
            valid_ids.append(uuid.UUID(id_str))
        except ValueError:
            pass
    
    if not valid_ids:
        raise HTTPException(status_code=400, detail="No valid UUIDs provided")
    
    brands = db.query(Brand).filter(Brand.id.in_(valid_ids)).all()
    if not brands:
        raise HTTPException(status_code=404, detail="No brands found")
    
    action = bulk_request.action.lower()
    affected_count = len(brands)
    
    if action == "delete":
        for brand in brands:
            if brand.image_url:
                delete_image_file(brand.image_url)
            db.delete(brand)
        db.commit()
        message = f"Deleted {affected_count} brands"
    
    elif action == "activate":
        for brand in brands:
            brand.is_active = True
            brand.updated_at = get_ist_now()
        db.commit()
        message = f"Activated {affected_count} brands"
    
    elif action == "deactivate":
        for brand in brands:
            brand.is_active = False
            brand.updated_at = get_ist_now()
        db.commit()
        message = f"Deactivated {affected_count} brands"
    
    else:
        raise HTTPException(status_code=400, detail=f"Invalid action: {action}")
    
    return {
        "message": message,
        "affected_count": affected_count,
        "action": action
    }


# ============ User Registration Routes ============

@app.post("/api/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserRegistrationCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user - ONLY creates user_registrations record.
    NO orders are created. This is for registration-only flow.
    """
    try:
        existing_user = db.query(UserRegistration).filter(
            UserRegistration.contact == user_data.contact
        ).first()
        
        if existing_user:
            if existing_user.is_active:
                return {
                    "message": "User already registered",
                    "user": existing_user.to_dict(),
                    "isExisting": True
                }
            else:
                # Reactivate inactive user
                existing_user.is_active = True
                existing_user.name = user_data.name
                existing_user.pincode = user_data.pincode
                existing_user.city_village = user_data.cityVillage
                existing_user.address = user_data.address
                if user_data.email:
                    existing_user.email = user_data.email
                existing_user.updated_at = get_ist_now()
                db.commit()
                db.refresh(existing_user)
                return {
                    "message": "User reactivated successfully",
                    "user": existing_user.to_dict(),
                    "isExisting": False
                }
        
        # Create new user
        db_user = UserRegistration(
            name=user_data.name,
            contact=user_data.contact,
            pincode=user_data.pincode,
            city_village=user_data.cityVillage,
            address=user_data.address,
            email=user_data.email
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return {
            "message": "User registered successfully",
            "user": db_user.to_dict(),
            "isExisting": False
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error registering user: {str(e)}")

@app.get("/api/users", response_model=List[UserRegistrationResponse])
async def get_users(
    search: Optional[str] = Query(None, description="Search by name or contact"),
    sort_by: Optional[str] = Query("registrationDate", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc/desc)"),
    limit: Optional[int] = Query(100, ge=1, le=1000),
    offset: Optional[int] = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get all registered users"""
    query = db.query(UserRegistration)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                UserRegistration.name.ilike(search_term),
                UserRegistration.contact.ilike(search_term)
            )
        )
    
    sort_field_map = {
        "name": UserRegistration.name,
        "contact": UserRegistration.contact,
        "registrationDate": UserRegistration.registration_date
    }
    
    sort_field = sort_field_map.get(sort_by, UserRegistration.registration_date)
    if sort_order.lower() == "asc":
        query = query.order_by(sort_field.asc())
    else:
        query = query.order_by(sort_field.desc())
    
    query = query.offset(offset).limit(limit)
    
    users = query.all()
    return [user.to_dict() for user in users]

@app.get("/api/users/{user_id}", response_model=UserRegistrationResponse)
async def get_user(user_id: str, db: Session = Depends(get_db)):
    """Get a single user by ID"""
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    user = db.query(UserRegistration).filter(
        UserRegistration.id == user_uuid
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user.to_dict()

@app.put("/api/users/{user_id}", response_model=UserRegistrationResponse)
async def update_user(
    user_id: str,
    user_data: UserRegistrationCreate,
    db: Session = Depends(get_db)
):
    """
    Full update for user registration including all fields.
    This updates name, contact, pincode, city, address, and email.
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    user = db.query(UserRegistration).filter(
        UserRegistration.id == user_uuid
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if contact is being changed and if it already exists for another user
    if user_data.contact != user.contact:
        existing_user = db.query(UserRegistration).filter(
            UserRegistration.contact == user_data.contact,
            UserRegistration.id != user_uuid
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=400, 
                detail="Contact number already registered to another user"
            )
    
    # Update all fields
    user.name = user_data.name
    user.contact = user_data.contact
    user.pincode = user_data.pincode
    user.city_village = user_data.cityVillage
    user.address = user_data.address
    user.email = user_data.email
    user.updated_at = get_ist_now()
    
    db.commit()
    db.refresh(user)
    
    return user.to_dict()

@app.patch("/api/users/{user_id}", response_model=UserRegistrationResponse)
async def partial_update_user(
    user_id: str,
    user_data: UserRegistrationUpdate,
    db: Session = Depends(get_db)
):
    """
    Partial update for user registration.
    Only updates fields that are provided.
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    user = db.query(UserRegistration).filter(
        UserRegistration.id == user_uuid
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_data.model_dump(exclude_unset=True)
    
    # Check contact uniqueness if being updated
    if "contact" in update_data and update_data["contact"] != user.contact:
        existing_user = db.query(UserRegistration).filter(
            UserRegistration.contact == update_data["contact"],
            UserRegistration.id != user_uuid
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=400, 
                detail="Contact number already registered to another user"
            )
    
    # Map fields to update
    field_map = {
        "name": "name",
        "contact": "contact",
        "pincode": "pincode",
        "cityVillage": "city_village",
        "address": "address",
        "email": "email"
    }
    
    for key, value in update_data.items():
        if key in field_map and value is not None:
            setattr(user, field_map[key], value)
    
    user.updated_at = get_ist_now()
    
    db.commit()
    db.refresh(user)
    
    return user.to_dict()

@app.patch("/api/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    status_data: UserStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Update user's active status (activate/deactivate)
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    user = db.query(UserRegistration).filter(
        UserRegistration.id == user_uuid
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = status_data.isActive
    user.updated_at = get_ist_now()
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": f"User {'activated' if status_data.isActive else 'deactivated'} successfully",
        "userId": str(user.id),
        "isActive": user.is_active
    }

@app.patch("/api/users/{user_id}/discount")
async def update_user_discount(
    user_id: str,
    discount_data: UserDiscountUpdate,
    db: Session = Depends(get_db)
):
    """
    Update user's additional discount.
    Also updates pending orders (PENDING and CONFIRMED status) with the new discount.
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    user = db.query(UserRegistration).filter(
        UserRegistration.id == user_uuid
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    discount = discount_data.discount
    
    if discount < 0 or discount > 100:
        raise HTTPException(status_code=400, detail="Discount must be between 0 and 100")
    
    old_discount = user.additional_discount or 0
    
    user.additional_discount = discount
    user.updated_at = get_ist_now()
    
    # Update pending orders with new discount
    pending_orders = db.query(Order).filter(
        Order.user_id == user_uuid,
        Order.order_status.in_([OrderStatus.PENDING, OrderStatus.CONFIRMED])
    ).all()
    
    updated_orders_count = 0
    
    for order in pending_orders:
        # Calculate new discount amounts
        discounted_subtotal = order.subtotal - order.discount_amount
        new_discount_amount = discounted_subtotal * (discount / 100)
        new_final_amount = discounted_subtotal - new_discount_amount
        
        order.additional_discount_percentage = discount
        order.additional_discount_amount = new_discount_amount
        order.final_amount = new_final_amount
        order.updated_at = get_ist_now()
        updated_orders_count += 1
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": f"Discount updated successfully and {updated_orders_count} pending orders updated",
        "userId": str(user.id),
        "additionalDiscount": user.additional_discount,
        "updatedOrders": updated_orders_count,
        "oldDiscount": old_discount
    }

@app.get("/api/users/{user_id}/orders")
async def get_user_orders(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all orders for a specific user with delivery info from user registration.
    Orders are returned with user details and order items.
    """
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    user = db.query(UserRegistration).filter(
        UserRegistration.id == user_uuid
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    orders = db.query(Order).filter(
        Order.user_id == user_uuid
    ).options(
        joinedload(Order.user),
        joinedload(Order.order_items)
    ).order_by(Order.created_at.desc()).all()
    
    return [order.to_dict() for order in orders]


# ============ Order Payment Update Endpoint ============

@app.patch("/api/orders/{order_id}/payment")
async def update_order_payment(
    order_id: str,
    payment_update: OrderPaymentUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Update order payment details including partial payments.
    Supports:
    - Full payment: isPaid=True, paidAmount=finalAmount
    - Partial payment: isPaid=True, paidAmount=partialAmount, remainingAmount=due
    - Payment method and reference ID updates
    
    All payment data is saved to the orders table.
    """
    try:
        order_uuid = uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order ID format")
    
    order = db.query(Order).filter(Order.id == order_uuid).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = payment_update.model_dump(exclude_unset=True)
    
    # Track changes for response
    changes = {}
    
    # Update payment method
    if "paymentMethod" in update_data and update_data["paymentMethod"] is not None:
        order.payment_method = update_data["paymentMethod"]
        changes["paymentMethod"] = update_data["paymentMethod"]
    
    # Update reference ID
    if "referenceId" in update_data and update_data["referenceId"] is not None:
        order.reference_id = update_data["referenceId"]
        changes["referenceId"] = update_data["referenceId"]
    
    # Handle payment amount updates
    if "paidAmount" in update_data and update_data["paidAmount"] is not None:
        paid_amount = update_data["paidAmount"]
        
        # Initialize payment history if None
        if order.payment_history is None:
            order.payment_history = []
        
        # Create payment record with IST timestamp
        payment_record = {
            "timestamp": get_ist_now().isoformat(),
            "amount": paid_amount,
            "method": order.payment_method or "cash",
            "reference": order.reference_id,
            "note": update_data.get("paymentNote"),
            "paymentType": "partial" if update_data.get("remainingAmount", 0) > 0 else "full"
        }
        
        # Append to payment history
        order.payment_history.append(payment_record)
        
        # Update paid amount (accumulate)
        order.paid_amount = (order.paid_amount or 0) + paid_amount
        
        # Update remaining amount
        if "remainingAmount" in update_data:
            order.remaining_amount = update_data["remainingAmount"]
        else:
            # Calculate remaining amount
            order.remaining_amount = max(0, order.final_amount - order.paid_amount)
        
        changes["paidAmount"] = order.paid_amount
        changes["remainingAmount"] = order.remaining_amount
        
        # Determine payment status
        if order.remaining_amount <= 0:
            # Fully paid
            order.is_paid = True
            order.payment_status = PaymentStatus.PAID
            changes["paymentStatus"] = "paid"
        elif order.paid_amount > 0:
            # Partially paid
            order.is_paid = True  # Mark as paid (partial)
            order.payment_status = PaymentStatus.PARTIAL
            changes["paymentStatus"] = "partial"
        else:
            order.is_paid = False
            order.payment_status = PaymentStatus.PENDING
            changes["paymentStatus"] = "pending"
    
    # Legacy support: if isPaid is provided without paidAmount
    elif "isPaid" in update_data and update_data["isPaid"] is not None:
        order.is_paid = update_data["isPaid"]
        if order.is_paid:
            # If marking as paid without amount, assume full payment
            if order.paid_amount <= 0 and order.remaining_amount <= 0:
                order.paid_amount = order.final_amount
                order.remaining_amount = 0
                order.payment_status = PaymentStatus.PAID
                changes["paymentStatus"] = "paid"
            elif order.paid_amount > 0:
                order.remaining_amount = max(0, order.final_amount - order.paid_amount)
                if order.remaining_amount <= 0:
                    order.payment_status = PaymentStatus.PAID
                else:
                    order.payment_status = PaymentStatus.PARTIAL
        else:
            order.payment_status = PaymentStatus.PENDING
            changes["paymentStatus"] = "pending"
        changes["isPaid"] = order.is_paid
    
    order.updated_at = get_ist_now()
    db.commit()
    db.refresh(order)
    
    # Return comprehensive response
    response_data = {
        "message": "Order payment details updated successfully",
        "orderId": str(order.id),
        "paymentMethod": order.payment_method,
        "referenceId": order.reference_id,
        "isPaid": order.is_paid,
        "paymentStatus": order.payment_status.value if order.payment_status else None,
        "paidAmount": float(order.paid_amount or 0),
        "remainingAmount": float(order.remaining_amount or 0),
        "finalAmount": float(order.final_amount),
        "paymentHistory": order.payment_history or [],
        "changes": changes,
        "table": "orders"
    }
    
    return response_data


# ============ Order Payment History Endpoint ============

@app.get("/api/orders/{order_id}/payment-history")
async def get_order_payment_history(
    order_id: str,
    db: Session = Depends(get_db)
):
    """
    Get full payment history for an order including all transactions.
    """
    try:
        order_uuid = uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order ID format")
    
    order = db.query(Order).filter(Order.id == order_uuid).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {
        "orderId": str(order.id),
        "orderNumber": order.order_number,
        "finalAmount": float(order.final_amount),
        "totalPaid": float(order.paid_amount or 0),
        "remainingAmount": float(order.remaining_amount or 0),
        "paymentStatus": order.payment_status.value if order.payment_status else None,
        "paymentHistory": order.payment_history or [],
        "paymentMethod": order.payment_method,
        "isFullyPaid": order.is_paid and (order.remaining_amount or 0) <= 0
    }


# ============ Order Routes ============

@app.post("/api/orders/checkout", status_code=status.HTTP_201_CREATED)
async def checkout(
    checkout_data: CheckoutRequest,
    db: Session = Depends(get_db)
):
    """Complete checkout - User data provides delivery information"""
    try:
        user_data = checkout_data.user
        
        existing_user = db.query(UserRegistration).filter(
            UserRegistration.contact == user_data.contact
        ).first()
        
        if existing_user:
            existing_user.name = user_data.name
            existing_user.pincode = user_data.pincode
            existing_user.city_village = user_data.cityVillage
            existing_user.address = user_data.address
            if user_data.email:
                existing_user.email = user_data.email
            existing_user.is_active = True
            existing_user.updated_at = get_ist_now()
            db.commit()
            db.refresh(existing_user)
            user = existing_user
        else:
            new_user = UserRegistration(
                name=user_data.name,
                contact=user_data.contact,
                pincode=user_data.pincode,
                city_village=user_data.cityVillage,
                address=user_data.address,
                email=user_data.email
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            user = new_user
        
        # Get User's Additional Discount
        user_discount_percentage = user.additional_discount or 0
        
        order_number = generate_order_number()
        invoice_number = generate_invoice_number(db)
        
        order_data = checkout_data.order
        
        # Check if there are items in the order
        if not order_data.items:
            # Return user registration only (no order created)
            return {
                "message": "User registered successfully. No items in cart.",
                "user": user.to_dict(),
                "isRegistrationOnly": True
            }
        
        product_ids = [uuid.UUID(item.productId) for item in order_data.items]
        products = db.query(Product).filter(Product.id.in_(product_ids)).all()
        
        if len(products) != len(product_ids):
            raise HTTPException(status_code=404, detail="One or more products not found")
        
        # Calculate all amounts WITH user discount applied
        subtotal = order_data.subtotal
        product_discount = order_data.discountAmount
        discounted_subtotal = subtotal - product_discount
        
        # Apply user's additional discount
        additional_discount_amount = discounted_subtotal * (user_discount_percentage / 100)
        final_amount = discounted_subtotal - additional_discount_amount
        
        # Create Order
        db_order = Order(
            user_id=user.id,
            order_number=order_number,
            total_amount=order_data.totalAmount,
            subtotal=subtotal,
            discount_amount=order_data.discountAmount,
            shipping_charge=order_data.shippingCharge,
            tax_amount=order_data.taxAmount,
            additional_discount_percentage=user_discount_percentage,
            additional_discount_amount=additional_discount_amount,
            final_amount=final_amount,
            payment_method=order_data.paymentMethod or "cash",
            reference_id=order_data.referenceId or "",
            is_paid=False,
            invoice_number=invoice_number,
            order_status=OrderStatus.PENDING,
            payment_status=PaymentStatus.PENDING,
            status_history={"PENDING": get_ist_now().isoformat()},
            # Initialize payment tracking fields
            paid_amount=0,
            remaining_amount=final_amount,  # Initially full amount is due
            payment_history=[]
        )
        
        db.add(db_order)
        db.flush()
        
        # Create order items
        for item in order_data.items:
            product = next(p for p in products if str(p.id) == item.productId)
            
            order_item = OrderItem(
                order_id=db_order.id,
                product_id=product.id,
                product_name=product.name,
                product_category=product.category,
                unit_price=item.unitPrice,
                discounted_unit_price=item.discountedUnitPrice,
                discount_percentage=item.discountPercentage,
                quantity=item.quantity,
                total_price=item.totalPrice,
                product_image=item.productImage
            )
            db.add(order_item)
        
        db.commit()
        db.refresh(db_order)
        
        db_order = db.query(Order).filter(Order.id == db_order.id).options(
            joinedload(Order.user),
            joinedload(Order.order_items)
        ).first()
        
        return {
            "message": "Order placed successfully!",
            "order": db_order.to_dict(),
            "user": user.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing checkout: {str(e)}")

@app.get("/api/orders", response_model=List[dict])
async def get_orders(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    order_status: Optional[str] = Query(None, description="Filter by order status"),
    payment_status: Optional[str] = Query(None, description="Filter by payment status"),
    search: Optional[str] = Query(None, description="Search by order number or user name"),
    sort_by: Optional[str] = Query("createdAt", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc/desc)"),
    limit: Optional[int] = Query(100, ge=1, le=1000),
    offset: Optional[int] = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get all orders with user and delivery data"""
    query = db.query(Order)
    
    query = query.options(
        joinedload(Order.user),
        joinedload(Order.order_items)
    )
    
    if user_id:
        try:
            user_uuid = uuid.UUID(user_id)
            query = query.filter(Order.user_id == user_uuid)
        except ValueError:
            pass
    
    if order_status and order_status != "all":
        try:
            status_enum = OrderStatus(order_status.upper())
            query = query.filter(Order.order_status == status_enum)
        except ValueError:
            pass
    
    if payment_status and payment_status != "all":
        try:
            status_enum = PaymentStatus(payment_status.lower())
            query = query.filter(Order.payment_status == status_enum)
        except ValueError:
            pass
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Order.order_number.ilike(search_term),
                Order.user.has(UserRegistration.name.ilike(search_term)),
                Order.user.has(UserRegistration.contact.ilike(search_term))
            )
        )
    
    sort_field_map = {
        "orderNumber": Order.order_number,
        "totalAmount": Order.total_amount,
        "finalAmount": Order.final_amount,
        "createdAt": Order.created_at,
        "orderStatus": Order.order_status,
        "updatedAt": Order.updated_at
    }
    
    sort_field = sort_field_map.get(sort_by, Order.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(sort_field.asc())
    else:
        query = query.order_by(sort_field.desc())
    
    query = query.offset(offset).limit(limit)
    orders = query.all()
    
    return [order.to_dict() for order in orders]

@app.get("/api/orders/{order_id}")
async def get_order(order_id: str, db: Session = Depends(get_db)):
    """Get a single order by ID with user and delivery data"""
    try:
        order_uuid = uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order ID format")
    
    order = db.query(Order).filter(
        Order.id == order_uuid
    ).options(
        joinedload(Order.user),
        joinedload(Order.order_items)
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order.to_dict()


# ============ FIXED: Enhanced Order Status Update Endpoint ============

@app.patch("/api/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Enhanced order status update with restoration support.
    Now allows restoring cancelled/refunded orders back to active status.
    Tracks restoration reason in status history.
    """
    try:
        order_uuid = uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order ID format")
    
    order = db.query(Order).filter(Order.id == order_uuid).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Log the current status for debugging
    current_status_str = order.order_status.value if hasattr(order.order_status, 'value') else str(order.order_status)
    print(f"🔍 Current status: {current_status_str}")
    print(f"🔍 Requested status: {status_update.orderStatus}")
    print(f"🔍 Restoration reason: {status_update.restorationReason}")
    
    try:
        new_order_status = OrderStatus(status_update.orderStatus.upper())
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid order status. Must be one of: {[s.value for s in OrderStatus]}"
        )
    
    new_status_str = new_order_status.value if hasattr(new_order_status, 'value') else str(new_order_status)
    
    # Validate transition
    current_status = order.order_status
    
    if current_status != new_order_status:
        is_valid = validate_status_transition(current_status, new_order_status)
        print(f"🔍 Is transition valid? {is_valid}")
        
        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status transition from {current_status_str} to {new_status_str}"
            )
    
    # Store the current status for restoration tracking
    old_status = current_status
    
    # Update status
    order.order_status = new_order_status
    
    # Enhanced status history update with restoration tracking
    # Check if this is a restoration
    old_status_str = old_status.value if hasattr(old_status, 'value') else str(old_status)
    
    if old_status_str in ['CANCELLED', 'REFUNDED'] and new_status_str not in ['CANCELLED', 'REFUNDED']:
        # This is a restoration
        restoration_reason = status_update.restorationReason or "Customer requested order restoration"
        
        # Add restoration note if not already provided
        if status_update.staffNotes:
            status_update.staffNotes = f"RESTORED from {old_status_str}: {status_update.staffNotes}"
        else:
            status_update.staffNotes = f"Order restored from {old_status_str}. Reason: {restoration_reason}"
        
        print(f"✅ Restoration detected: from {old_status_str} to {new_status_str}")
    
    # Update status history with enhanced tracking
    update_status_history(
        order, 
        new_order_status, 
        status_update.staffNotes,
        status_update.restorationReason
    )
    
    # Update timestamp
    update_status_timestamp(order, new_order_status)
    
    # Update payment status if provided
    if status_update.paymentStatus:
        try:
            order.payment_status = PaymentStatus(status_update.paymentStatus.lower())
        except ValueError:
            pass
    
    # Update notes
    if status_update.staffNotes is not None:
        order.staff_notes = status_update.staffNotes
    
    if status_update.customerNotes is not None:
        order.customer_notes = status_update.customerNotes
    
    order.updated_at = get_ist_now()
    
    db.commit()
    db.refresh(order)
    
    order = db.query(Order).filter(Order.id == order_uuid).options(
        joinedload(Order.user),
        joinedload(Order.order_items)
    ).first()
    
    # Prepare response with restoration info
    response_data = {
        "message": f"Order status updated to {new_status_str}",
        "order": order.to_dict()
    }
    
    # Add restoration info if applicable
    if old_status_str in ['CANCELLED', 'REFUNDED'] and new_status_str not in ['CANCELLED', 'REFUNDED']:
        response_data["restoration"] = {
            "restored_from": old_status_str,
            "restored_to": new_status_str,
            "reason": status_update.restorationReason or "Not specified"
        }
        print(f"✅ Restoration response: {response_data['restoration']}")
    
    return response_data

@app.patch("/api/orders/bulk/status")
async def bulk_update_order_status(
    bulk_update: OrderBulkStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Update status for multiple orders at once.
    Now supports restoration for cancelled/refunded orders.
    """
    if not bulk_update.orderIds:
        raise HTTPException(status_code=400, detail="No order IDs provided")
    
    valid_ids = []
    for id_str in bulk_update.orderIds:
        try:
            valid_ids.append(uuid.UUID(id_str))
        except ValueError:
            pass
    
    if not valid_ids:
        raise HTTPException(status_code=400, detail="No valid UUIDs provided")
    
    try:
        new_status = OrderStatus(bulk_update.orderStatus.upper())
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid order status. Must be one of: {[s.value for s in OrderStatus]}"
        )
    
    new_status_str = new_status.value if hasattr(new_status, 'value') else str(new_status)
    orders = db.query(Order).filter(Order.id.in_(valid_ids)).all()
    
    if not orders:
        raise HTTPException(status_code=404, detail="No orders found")
    
    updated_count = 0
    skipped_count = 0
    skipped_orders = []
    restored_orders = []
    
    for order in orders:
        # Check if transition is valid
        if not validate_status_transition(order.order_status, new_status):
            skipped_count += 1
            skipped_orders.append(order.order_number)
            continue
        
        old_status = order.order_status
        old_status_str = old_status.value if hasattr(old_status, 'value') else str(old_status)
        
        # Update status
        order.order_status = new_status
        
        # Check if this is a restoration
        if old_status_str in ['CANCELLED', 'REFUNDED'] and new_status_str not in ['CANCELLED', 'REFUNDED']:
            restoration_reason = "Bulk restoration from admin"
            restored_orders.append(order.order_number)
            
            if bulk_update.staffNotes:
                note = f"RESTORED from {old_status_str}: {bulk_update.staffNotes}"
            else:
                note = f"Order restored from {old_status_str}"
        else:
            note = bulk_update.staffNotes
        
        # Update status history
        update_status_history(order, new_status, note)
        update_status_timestamp(order, new_status)
        
        if bulk_update.staffNotes is not None:
            order.staff_notes = bulk_update.staffNotes
        
        order.updated_at = get_ist_now()
        updated_count += 1
    
    db.commit()
    
    response = {
        "message": f"Updated {updated_count} orders to {new_status_str}",
        "updatedCount": updated_count,
        "skippedCount": skipped_count,
        "skippedOrders": skipped_orders,
        "status": new_status_str
    }
    
    if restored_orders:
        response["restoredOrders"] = restored_orders
        response["restorationMessage"] = f"Restored {len(restored_orders)} orders from cancelled/refunded"
    
    return response

@app.get("/api/orders/{order_id}/status-history")
async def get_order_status_history(
    order_id: str,
    db: Session = Depends(get_db)
):
    """
    Get the full status history for an order including restoration events.
    """
    try:
        order_uuid = uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order ID format")
    
    order = db.query(Order).filter(Order.id == order_uuid).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    history = order.status_history or {}
    
    formatted_history = []
    status_order = [s.value for s in OrderStatus]
    
    for status in status_order:
        if status in history:
            entry = history[status]
            if isinstance(entry, dict):
                formatted_entry = {
                    "status": status,
                    "timestamp": entry.get("timestamp"),
                    "note": entry.get("note"),
                    "is_restoration": entry.get("is_restoration", False),
                    "restored_from": entry.get("restored_from"),
                    "restoration_reason": entry.get("restoration_reason")
                }
            else:
                # Backward compatibility for string timestamps
                formatted_entry = {
                    "status": status,
                    "timestamp": entry if isinstance(entry, str) else None,
                    "note": history.get(f"{status}_note"),
                    "is_restoration": False
                }
            formatted_history.append(formatted_entry)
    
    return {
        "orderId": str(order.id),
        "orderNumber": order.order_number,
        "currentStatus": order.order_status.value if order.order_status else None,
        "history": formatted_history,
        "hasRestorations": any(entry.get("is_restoration") for entry in formatted_history)
    }

@app.get("/api/orders/stats")
async def get_order_stats(db: Session = Depends(get_db)):
    """Get order statistics with detailed status breakdown"""
    try:
        total = db.query(Order).count()
        
        pending = db.query(Order).filter(Order.order_status == OrderStatus.PENDING).count()
        confirmed = db.query(Order).filter(Order.order_status == OrderStatus.CONFIRMED).count()
        processing = db.query(Order).filter(Order.order_status == OrderStatus.PROCESSING).count()
        shipped = db.query(Order).filter(Order.order_status == OrderStatus.SHIPPED).count()
        completed = db.query(Order).filter(Order.order_status == OrderStatus.COMPLETED).count()
        cancelled = db.query(Order).filter(Order.order_status == OrderStatus.CANCELLED).count()
        refunded = db.query(Order).filter(Order.order_status == OrderStatus.REFUNDED).count()
        
        # Payment status counts - handle potential enum issues
        try:
            paid = db.query(Order).filter(Order.payment_status == PaymentStatus.PAID).count()
        except Exception as e:
            print(f"⚠️ Error counting paid orders: {e}")
            paid = 0
            
        try:
            partial = db.query(Order).filter(Order.payment_status == PaymentStatus.PARTIAL).count()
        except Exception as e:
            print(f"⚠️ Error counting partial orders: {e}")
            partial = 0
            
        try:
            unpaid = db.query(Order).filter(Order.payment_status == PaymentStatus.PENDING).count()
        except Exception as e:
            print(f"⚠️ Error counting unpaid orders: {e}")
            unpaid = 0
            
        try:
            failed = db.query(Order).filter(Order.payment_status == PaymentStatus.FAILED).count()
        except Exception as e:
            print(f"⚠️ Error counting failed orders: {e}")
            failed = 0
        
        # Revenue calculations with error handling
        try:
            completed_revenue = db.query(db.func.sum(Order.final_amount)).filter(
                Order.order_status == OrderStatus.COMPLETED
            ).scalar() or 0
        except Exception as e:
            print(f"⚠️ Error calculating completed revenue: {e}")
            completed_revenue = 0
        
        try:
            shipped_revenue = db.query(db.func.sum(Order.final_amount)).filter(
                Order.order_status == OrderStatus.SHIPPED
            ).scalar() or 0
        except Exception as e:
            print(f"⚠️ Error calculating shipped revenue: {e}")
            shipped_revenue = 0
        
        try:
            processing_revenue = db.query(db.func.sum(Order.final_amount)).filter(
                Order.order_status == OrderStatus.PROCESSING
            ).scalar() or 0
        except Exception as e:
            print(f"⚠️ Error calculating processing revenue: {e}")
            processing_revenue = 0
        
        total_revenue = completed_revenue + shipped_revenue + processing_revenue
        
        try:
            total_discount = db.query(db.func.sum(Order.discount_amount)).filter(
                Order.order_status.in_([OrderStatus.COMPLETED, OrderStatus.SHIPPED, OrderStatus.PROCESSING])
            ).scalar() or 0
        except Exception as e:
            print(f"⚠️ Error calculating total discount: {e}")
            total_discount = 0
        
        try:
            total_additional_discount = db.query(db.func.sum(Order.additional_discount_amount)).filter(
                Order.order_status.in_([OrderStatus.COMPLETED, OrderStatus.SHIPPED, OrderStatus.PROCESSING])
            ).scalar() or 0
        except Exception as e:
            print(f"⚠️ Error calculating additional discount: {e}")
            total_additional_discount = 0
        
        return {
            "total": total,
            "status": {
                "pending": pending,
                "confirmed": confirmed,
                "processing": processing,
                "shipped": shipped,
                "completed": completed,
                "cancelled": cancelled,
                "refunded": refunded
            },
            "payment": {
                "paid": paid,
                "partial": partial,
                "unpaid": unpaid,
                "failed": failed
            },
            "revenue": {
                "total": round(float(total_revenue), 2),
                "completed": round(float(completed_revenue), 2),
                "shipped": round(float(shipped_revenue), 2),
                "processing": round(float(processing_revenue), 2)
            },
            "discounts": {
                "totalDiscount": round(float(total_discount), 2),
                "totalAdditionalDiscount": round(float(total_additional_discount), 2)
            }
        }
        
    except Exception as e:
        print(f"❌ Error in get_order_stats: {str(e)}")
        # Return a default response instead of failing
        return {
            "total": 0,
            "status": {
                "pending": 0,
                "confirmed": 0,
                "processing": 0,
                "shipped": 0,
                "completed": 0,
                "cancelled": 0,
                "refunded": 0
            },
            "payment": {
                "paid": 0,
                "partial": 0,
                "unpaid": 0,
                "failed": 0
            },
            "revenue": {
                "total": 0,
                "completed": 0,
                "shipped": 0,
                "processing": 0
            },
            "discounts": {
                "totalDiscount": 0,
                "totalAdditionalDiscount": 0
            }
        }


# ============ BILLING ROUTES ============

@app.post("/api/bills", status_code=status.HTTP_201_CREATED)
async def create_bill(
    bill_data: BillCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new bill with foreign key to user_registrations.
    Validates customer exists and is active.
    """
    try:
        # Get and validate customer
        customer = get_customer_from_db(bill_data.customerId, db)
        
        # Generate bill number with custom prefix
        bill_number = generate_bill_number(db, prefix="BILL")
        
        # Create new bill
        new_bill = Bill(
            bill_number=bill_number,
            customer_id=customer.id,
            customer_name=customer.name,
            customer_contact=customer.contact,
            customer_address=customer.address,
            items=[item.model_dump() for item in bill_data.items],
            subtotal=bill_data.subtotal,
            discount=bill_data.discount,
            customer_discount=bill_data.customerDiscount,
            total=bill_data.total,
            paid_amount=bill_data.paidAmount,
            remaining_amount=bill_data.remainingAmount,
            payment_method=bill_data.paymentMethod,
            payment_status=BillStatus(bill_data.paymentStatus),
            notes=bill_data.notes,
            date=get_ist_now()
        )
        
        # Add payment history if paid amount > 0
        if bill_data.paidAmount > 0:
            payment_record = {
                "timestamp": get_ist_now().isoformat(),
                "amount": bill_data.paidAmount,
                "method": bill_data.paymentMethod,
                "type": "full" if bill_data.remainingAmount <= 0 else "partial",
                "note": "Initial payment"
            }
            new_bill.payment_history = [payment_record]
        
        db.add(new_bill)
        db.commit()
        db.refresh(new_bill)
        
        return new_bill.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error creating bill: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create bill: {str(e)}")

@app.get("/api/bills")
async def get_bills(
    search: Optional[str] = Query(None, description="Search by bill number or customer name"),
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    payment_status: Optional[str] = Query(None, description="Filter by payment status"),
    customer_id: Optional[str] = Query(None, description="Filter by customer ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    sort_by: Optional[str] = Query("createdAt", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc/desc)"),
    limit: Optional[int] = Query(100, ge=1, le=1000),
    offset: Optional[int] = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Get all bills with filtering, sorting, and pagination.
    Includes customer data via foreign key relationship.
    """
    try:
        query = db.query(Bill)
        
        # Search filter
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Bill.bill_number.ilike(search_term),
                    Bill.customer_name.ilike(search_term)
                )
            )
        
        # Date filter
        if date:
            try:
                filter_date = datetime.strptime(date, "%Y-%m-%d").date()
                query = query.filter(
                    Bill.date.cast(String).like(f"{date}%")
                )
            except ValueError:
                pass
        
        # Date range filter
        if start_date:
            try:
                start = datetime.strptime(start_date, "%Y-%m-%d")
                query = query.filter(Bill.date >= start)
            except ValueError:
                pass
        
        if end_date:
            try:
                end = datetime.strptime(end_date, "%Y-%m-%d")
                end = end.replace(hour=23, minute=59, second=59)
                query = query.filter(Bill.date <= end)
            except ValueError:
                pass
        
        # Payment status filter
        if payment_status and payment_status != "all":
            try:
                status_enum = BillStatus(payment_status.lower())
                query = query.filter(Bill.payment_status == status_enum)
            except ValueError:
                pass
        
        # Customer filter
        if customer_id:
            try:
                customer_uuid = uuid.UUID(customer_id)
                query = query.filter(Bill.customer_id == customer_uuid)
            except ValueError:
                pass
        
        # Sorting
        sort_field_map = {
            "billNumber": Bill.bill_number,
            "customerName": Bill.customer_name,
            "total": Bill.total,
            "date": Bill.date,
            "createdAt": Bill.created_at,
            "paymentStatus": Bill.payment_status
        }
        
        sort_field = sort_field_map.get(sort_by, Bill.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(sort_field.asc())
        else:
            query = query.order_by(sort_field.desc())
        
        # Pagination
        query = query.offset(offset).limit(limit)
        
        bills = query.all()
        return [bill.to_dict() for bill in bills]
        
    except Exception as e:
        print(f"Error fetching bills: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch bills: {str(e)}")

@app.get("/api/bills/{bill_id}")
async def get_bill(
    bill_id: str,
    db: Session = Depends(get_db)
):
    """Get a single bill by ID with full details"""
    try:
        bill_uuid = uuid.UUID(bill_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid bill ID format")
    
    bill = db.query(Bill).filter(Bill.id == bill_uuid).first()
    
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    return bill.to_dict()

@app.get("/api/bills/by-number/{bill_number}")
async def get_bill_by_number(
    bill_number: str,
    db: Session = Depends(get_db)
):
    """Get a bill by its bill number"""
    bill = db.query(Bill).filter(Bill.bill_number == bill_number).first()
    
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    return bill.to_dict()

@app.patch("/api/bills/{bill_id}/payment")
async def update_bill_payment(
    bill_id: str,
    payment_update: BillPaymentUpdate,
    db: Session = Depends(get_db)
):
    """
    Update bill payment (partial or full payment).
    Handles payment history tracking.
    """
    try:
        bill_uuid = uuid.UUID(bill_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid bill ID format")
    
    bill = db.query(Bill).filter(Bill.id == bill_uuid).first()
    
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    # Calculate new amounts
    paid_amount = payment_update.paidAmount
    new_total_paid = (bill.paid_amount or 0) + paid_amount
    new_remaining = max(0, bill.total - new_total_paid)
    
    # Determine payment status
    if new_remaining <= 0:
        payment_status = BillStatus.PAID
    elif new_total_paid > 0:
        payment_status = BillStatus.PARTIAL
    else:
        payment_status = BillStatus.PENDING
    
    # Create payment record
    payment_record = {
        "timestamp": get_ist_now().isoformat(),
        "amount": paid_amount,
        "method": payment_update.paymentMethod or bill.payment_method,
        "type": "full" if new_remaining <= 0 else "partial",
        "note": payment_update.note or "Payment received"
    }
    
    # Update bill
    bill.paid_amount = new_total_paid
    bill.remaining_amount = new_remaining
    bill.payment_status = payment_status
    
    if payment_update.paymentMethod:
        bill.payment_method = payment_update.paymentMethod
    
    # Append to payment history
    if bill.payment_history is None:
        bill.payment_history = []
    bill.payment_history.append(payment_record)
    
    bill.updated_at = get_ist_now()
    
    db.commit()
    db.refresh(bill)
    
    return {
        "message": "Payment updated successfully",
        "bill": bill.to_dict(),
        "paymentRecord": payment_record
    }

@app.delete("/api/bills/{bill_id}")
async def delete_bill(
    bill_id: str,
    db: Session = Depends(get_db)
):
    """Delete a bill by ID"""
    try:
        bill_uuid = uuid.UUID(bill_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid bill ID format")
    
    bill = db.query(Bill).filter(Bill.id == bill_uuid).first()
    
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    db.delete(bill)
    db.commit()
    
    return {"message": "Bill deleted successfully"}

@app.get("/api/bills/customer/{customer_id}")
async def get_customer_bills(
    customer_id: str,
    limit: Optional[int] = Query(50, ge=1, le=100),
    offset: Optional[int] = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get all bills for a specific customer"""
    try:
        customer_uuid = uuid.UUID(customer_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid customer ID format")
    
    # Verify customer exists
    customer = db.query(UserRegistration).filter(
        UserRegistration.id == customer_uuid
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    bills = db.query(Bill).filter(
        Bill.customer_id == customer_uuid
    ).order_by(Bill.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "customer": customer.to_dict(),
        "bills": [bill.to_dict() for bill in bills],
        "count": len(bills)
    }

@app.get("/api/bills/stats")
async def get_bill_stats(
    db: Session = Depends(get_db)
):
    """Get billing statistics"""
    try:
        total_bills = db.query(Bill).count()
        
        # Revenue stats
        total_revenue = db.query(db.func.sum(Bill.total)).scalar() or 0
        total_paid = db.query(db.func.sum(Bill.paid_amount)).scalar() or 0
        total_remaining = db.query(db.func.sum(Bill.remaining_amount)).scalar() or 0
        
        # Status breakdown
        paid_count = db.query(Bill).filter(Bill.payment_status == BillStatus.PAID).count()
        partial_count = db.query(Bill).filter(Bill.payment_status == BillStatus.PARTIAL).count()
        pending_count = db.query(Bill).filter(Bill.payment_status == BillStatus.PENDING).count()
        overdue_count = db.query(Bill).filter(Bill.payment_status == BillStatus.OVERDUE).count()
        
        # Today's stats
        today = get_ist_now().date()
        today_start = datetime.combine(today, datetime.min.time(), tzinfo=IST)
        today_end = datetime.combine(today, datetime.max.time(), tzinfo=IST)
        
        today_bills = db.query(Bill).filter(
            Bill.created_at >= today_start,
            Bill.created_at <= today_end
        ).count()
        
        today_revenue = db.query(db.func.sum(Bill.total)).filter(
            Bill.created_at >= today_start,
            Bill.created_at <= today_end
        ).scalar() or 0
        
        # This month stats
        current_month = get_ist_now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_bills = db.query(Bill).filter(Bill.created_at >= current_month).count()
        month_revenue = db.query(db.func.sum(Bill.total)).filter(
            Bill.created_at >= current_month
        ).scalar() or 0
        
        return {
            "totalBills": total_bills,
            "totalRevenue": float(total_revenue),
            "totalPaid": float(total_paid),
            "totalRemaining": float(total_remaining),
            "statusBreakdown": {
                "paid": paid_count,
                "partial": partial_count,
                "pending": pending_count,
                "overdue": overdue_count
            },
            "today": {
                "bills": today_bills,
                "revenue": float(today_revenue)
            },
            "thisMonth": {
                "bills": month_bills,
                "revenue": float(month_revenue)
            }
        }
        
    except Exception as e:
        print(f"Error getting bill stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

@app.get("/api/bills/pending")
async def get_pending_bills(
    db: Session = Depends(get_db)
):
    """Get all pending and partial bills"""
    pending_bills = db.query(Bill).filter(
        Bill.payment_status.in_([BillStatus.PENDING, BillStatus.PARTIAL])
    ).order_by(Bill.created_at.desc()).all()
    
    return [bill.to_dict() for bill in pending_bills]


# ============ Contact Submission Routes ============

@app.get("/api/submissions", response_model=List[dict])
async def get_submissions(
    search: Optional[str] = Query(None, description="Search by name, contact, location, or category"),
    status: Optional[str] = Query(None, description="Filter by status"),
    enquiry_type: Optional[str] = Query(None, description="Filter by enquiry type"),
    sort_by: Optional[str] = Query("createdAt", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc/desc)"),
    limit: Optional[int] = Query(100, ge=1, le=1000, description="Results limit"),
    offset: Optional[int] = Query(0, ge=0, description="Results offset"),
    db: Session = Depends(get_db)
):
    """Get all contact submissions with filtering, sorting, and pagination"""
    query = db.query(ContactSubmission)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (ContactSubmission.name.ilike(search_term)) |
            (ContactSubmission.contact_number.ilike(search_term)) |
            (ContactSubmission.location.ilike(search_term)) |
            (ContactSubmission.category.ilike(search_term))
        )
    
    if status and status != "all":
        try:
            status_enum = SubmissionStatus(status.lower())
            query = query.filter(ContactSubmission.status == status_enum)
        except ValueError:
            pass
    
    if enquiry_type and enquiry_type != "all":
        try:
            enquiry_enum = EnquiryType(enquiry_type.lower())
            query = query.filter(ContactSubmission.enquiry_type == enquiry_enum)
        except ValueError:
            pass
    
    query = query.filter(ContactSubmission.status != SubmissionStatus.ARCHIVED)
    
    sort_field_map = {
        "name": ContactSubmission.name,
        "status": ContactSubmission.status,
        "createdAt": ContactSubmission.created_at,
        "contactNumber": ContactSubmission.contact_number
    }
    
    sort_field = sort_field_map.get(sort_by, ContactSubmission.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(sort_field.asc())
    else:
        query = query.order_by(sort_field.desc())
    
    query = query.offset(offset).limit(limit)
    
    submissions = query.all()
    return [submission.to_dict() for submission in submissions]

@app.get("/api/submissions/{submission_id}")
async def get_submission(submission_id: str, db: Session = Depends(get_db)):
    """Get a single contact submission by ID"""
    try:
        submission_uuid = uuid.UUID(submission_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid submission ID format")
    
    submission = db.query(ContactSubmission).filter(ContactSubmission.id == submission_uuid).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return submission.to_dict()

@app.post("/api/submissions", status_code=status.HTTP_201_CREATED)
async def create_submission(submission_data: ContactSubmissionCreate, db: Session = Depends(get_db)):
    """Create a new contact submission"""
    try:
        db_submission = ContactSubmission(
            name=submission_data.name,
            contact_number=submission_data.contactNumber,
            location=submission_data.location,
            category=submission_data.category,
            enquiry_type=EnquiryType(submission_data.enquiryType.lower()),
            message=submission_data.message,
            status=SubmissionStatus.PENDING,
            is_starred=False
        )
        
        db.add(db_submission)
        db.commit()
        db.refresh(db_submission)
        
        return db_submission.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid enquiry type: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating submission: {str(e)}")

@app.patch("/api/submissions/{submission_id}/status")
async def update_submission_status(
    submission_id: str,
    status: str,
    db: Session = Depends(get_db)
):
    """Update submission status"""
    try:
        submission_uuid = uuid.UUID(submission_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid submission ID format")
    
    submission = db.query(ContactSubmission).filter(ContactSubmission.id == submission_uuid).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    try:
        new_status = SubmissionStatus(status.lower())
        
        if submission.status == SubmissionStatus.ARCHIVED:
            raise HTTPException(status_code=400, detail="Cannot change status of archived submissions")
        
        submission.status = new_status
        submission.updated_at = get_ist_now()
        
        db.commit()
        db.refresh(submission)
        
        return {
            "id": str(submission.id),
            "status": submission.status.value,
            "updatedAt": submission.updated_at.isoformat()
        }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status value")

@app.patch("/api/submissions/{submission_id}/star")
async def toggle_submission_star(submission_id: str, db: Session = Depends(get_db)):
    """Toggle starred status"""
    try:
        submission_uuid = uuid.UUID(submission_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid submission ID format")
    
    submission = db.query(ContactSubmission).filter(ContactSubmission.id == submission_uuid).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    submission.is_starred = not submission.is_starred
    submission.updated_at = get_ist_now()
    
    db.commit()
    db.refresh(submission)
    
    return {
        "id": str(submission.id),
        "isStarred": submission.is_starred
    }

@app.delete("/api/submissions/{submission_id}")
async def delete_submission(submission_id: str, db: Session = Depends(get_db)):
    """Delete a submission"""
    try:
        submission_uuid = uuid.UUID(submission_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid submission ID format")
    
    submission = db.query(ContactSubmission).filter(ContactSubmission.id == submission_uuid).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    db.delete(submission)
    db.commit()
    
    return {"message": "Submission deleted successfully"}

@app.post("/api/submissions/bulk")
async def bulk_action_submissions(
    bulk_request: BulkActionRequestContact,
    db: Session = Depends(get_db)
):
    """Perform bulk actions on multiple submissions"""
    if not bulk_request.ids:
        raise HTTPException(status_code=400, detail="No IDs provided")
    
    valid_ids = []
    for id_str in bulk_request.ids:
        try:
            valid_ids.append(uuid.UUID(id_str))
        except ValueError:
            pass
    
    if not valid_ids:
        raise HTTPException(status_code=400, detail="No valid UUIDs provided")
    
    submissions = db.query(ContactSubmission).filter(ContactSubmission.id.in_(valid_ids)).all()
    if not submissions:
        raise HTTPException(status_code=404, detail="No submissions found for the provided IDs")
    
    actionable = [s for s in submissions if s.status != SubmissionStatus.ARCHIVED]
    skipped = len(submissions) - len(actionable)
    
    action = bulk_request.action.lower()
    affected_count = len(actionable)
    
    if action == "delete":
        for sub in actionable:
            db.delete(sub)
        db.commit()
        message = f"Deleted {affected_count} submissions"
    
    elif action == "archive":
        for sub in actionable:
            sub.status = SubmissionStatus.ARCHIVED
            sub.updated_at = get_ist_now()
        db.commit()
        message = f"Archived {affected_count} submissions"
    
    elif action == "mark-read":
        for sub in actionable:
            if sub.status == SubmissionStatus.PENDING:
                sub.status = SubmissionStatus.READ
                sub.updated_at = get_ist_now()
        db.commit()
        message = f"Marked {affected_count} submissions as read"
    
    else:
        raise HTTPException(status_code=400, detail=f"Invalid action: {action}")
    
    return {
        "message": message,
        "affected_count": affected_count,
        "action": action,
        "skipped": skipped
    }

@app.get("/api/stats")
async def get_submission_stats(db: Session = Depends(get_db)):
    """Get submission statistics"""
    total = db.query(ContactSubmission).count()
    pending = db.query(ContactSubmission).filter(ContactSubmission.status == SubmissionStatus.PENDING).count()
    read = db.query(ContactSubmission).filter(ContactSubmission.status == SubmissionStatus.READ).count()
    responded = db.query(ContactSubmission).filter(ContactSubmission.status == SubmissionStatus.RESPONDED).count()
    archived = db.query(ContactSubmission).filter(ContactSubmission.status == SubmissionStatus.ARCHIVED).count()
    
    return {
        "total": total,
        "pending": pending,
        "read": read,
        "responded": responded,
        "archived": archived
    }
# ============ Scrolling Ads Schemas ============

class ScrollingAdCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    speed: str = Field("normal", pattern="^(slow|normal|fast)$")
    displayOrder: Optional[int] = 0
    highlight: Optional[bool] = False
    isActive: Optional[bool] = True

class ScrollingAdUpdate(BaseModel):
    text: Optional[str] = Field(None, min_length=1, max_length=500)
    speed: Optional[str] = Field(None, pattern="^(slow|normal|fast)$")
    displayOrder: Optional[int] = None
    highlight: Optional[bool] = None
    isActive: Optional[bool] = None

class ScrollingAdResponse(BaseModel):
    id: str
    text: str
    speed: str
    isActive: bool
    displayOrder: int
    highlight: bool
    createdAt: str
    updatedAt: Optional[str]

class ScrollingAdBulkActionRequest(BaseModel):
    action: str
    ids: List[str]


# ============ Scrolling Ads Routes ============

@app.get("/api/scrolling-ads", response_model=List[ScrollingAdResponse])
async def get_scrolling_ads(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    sort_by: Optional[str] = Query("displayOrder", description="Sort field"),
    sort_order: Optional[str] = Query("asc", description="Sort order (asc/desc)"),
    limit: Optional[int] = Query(100, ge=1, le=1000),
    offset: Optional[int] = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get all scrolling ads with filtering and sorting"""
    from models import ScrollingAd
    
    query = db.query(ScrollingAd)
    
    if is_active is not None:
        query = query.filter(ScrollingAd.is_active == is_active)
    
    sort_field_map = {
        "text": ScrollingAd.text,
        "speed": ScrollingAd.speed,
        "displayOrder": ScrollingAd.display_order,
        "createdAt": ScrollingAd.created_at,
        "updatedAt": ScrollingAd.updated_at
    }
    
    sort_field = sort_field_map.get(sort_by, ScrollingAd.display_order)
    if sort_order.lower() == "asc":
        query = query.order_by(sort_field.asc())
    else:
        query = query.order_by(sort_field.desc())
    
    query = query.offset(offset).limit(limit)
    ads = query.all()
    
    return [ad.to_dict() for ad in ads]


@app.get("/api/scrolling-ads/active")
async def get_active_scrolling_ads(db: Session = Depends(get_db)):
    """Get all active scrolling ads for public display"""
    from models import ScrollingAd
    
    ads = db.query(ScrollingAd).filter(
        ScrollingAd.is_active == True
    ).order_by(ScrollingAd.display_order.asc()).all()
    
    return [ad.to_dict() for ad in ads]


@app.get("/api/scrolling-ads/{ad_id}", response_model=ScrollingAdResponse)
async def get_scrolling_ad(ad_id: str, db: Session = Depends(get_db)):
    """Get a single scrolling ad by ID"""
    from models import ScrollingAd
    
    try:
        ad_uuid = uuid.UUID(ad_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ad ID format")
    
    ad = db.query(ScrollingAd).filter(ScrollingAd.id == ad_uuid).first()
    if not ad:
        raise HTTPException(status_code=404, detail="Scrolling ad not found")
    
    return ad.to_dict()


@app.post("/api/scrolling-ads", status_code=status.HTTP_201_CREATED, response_model=ScrollingAdResponse)
async def create_scrolling_ad(
    ad_data: ScrollingAdCreate,
    db: Session = Depends(get_db)
):
    """Create a new scrolling ad"""
    from models import ScrollingAd
    
    db_ad = ScrollingAd(
        text=ad_data.text,
        speed=ad_data.speed,
        display_order=ad_data.displayOrder or 0,
        highlight=ad_data.highlight or False,
        is_active=ad_data.isActive if ad_data.isActive is not None else True
    )
    
    db.add(db_ad)
    db.commit()
    db.refresh(db_ad)
    
    return db_ad.to_dict()


@app.put("/api/scrolling-ads/{ad_id}", response_model=ScrollingAdResponse)
async def update_scrolling_ad(
    ad_id: str,
    ad_data: ScrollingAdUpdate,
    db: Session = Depends(get_db)
):
    """Update a scrolling ad"""
    from models import ScrollingAd
    
    try:
        ad_uuid = uuid.UUID(ad_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ad ID format")
    
    db_ad = db.query(ScrollingAd).filter(ScrollingAd.id == ad_uuid).first()
    if not db_ad:
        raise HTTPException(status_code=404, detail="Scrolling ad not found")
    
    update_data = ad_data.model_dump(exclude_unset=True)
    
    field_map = {
        "text": "text",
        "speed": "speed",
        "displayOrder": "display_order",
        "highlight": "highlight",
        "isActive": "is_active"
    }
    
    for key, value in update_data.items():
        if key in field_map and value is not None:
            setattr(db_ad, field_map[key], value)
    
    db_ad.updated_at = get_ist_now()
    db.commit()
    db.refresh(db_ad)
    
    return db_ad.to_dict()


@app.patch("/api/scrolling-ads/{ad_id}/toggle")
async def toggle_scrolling_ad(
    ad_id: str,
    db: Session = Depends(get_db)
):
    """Toggle ad active status"""
    from models import ScrollingAd
    
    try:
        ad_uuid = uuid.UUID(ad_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ad ID format")
    
    db_ad = db.query(ScrollingAd).filter(ScrollingAd.id == ad_uuid).first()
    if not db_ad:
        raise HTTPException(status_code=404, detail="Scrolling ad not found")
    
    db_ad.is_active = not db_ad.is_active
    db_ad.updated_at = get_ist_now()
    db.commit()
    db.refresh(db_ad)
    
    return {
        "message": f"Ad {'activated' if db_ad.is_active else 'deactivated'} successfully",
        "id": str(db_ad.id),
        "isActive": db_ad.is_active
    }


@app.delete("/api/scrolling-ads/{ad_id}")
async def delete_scrolling_ad(
    ad_id: str,
    db: Session = Depends(get_db)
):
    """Delete a scrolling ad"""
    from models import ScrollingAd
    
    try:
        ad_uuid = uuid.UUID(ad_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ad ID format")
    
    db_ad = db.query(ScrollingAd).filter(ScrollingAd.id == ad_uuid).first()
    if not db_ad:
        raise HTTPException(status_code=404, detail="Scrolling ad not found")
    
    db.delete(db_ad)
    db.commit()
    
    return {"message": "Scrolling ad deleted successfully"}


@app.post("/api/scrolling-ads/bulk")
async def bulk_action_scrolling_ads(
    bulk_request: ScrollingAdBulkActionRequest,
    db: Session = Depends(get_db)
):
    """Perform bulk actions on scrolling ads"""
    from models import ScrollingAd
    
    if not bulk_request.ids:
        raise HTTPException(status_code=400, detail="No IDs provided")
    
    valid_ids = []
    for id_str in bulk_request.ids:
        try:
            valid_ids.append(uuid.UUID(id_str))
        except ValueError:
            pass
    
    if not valid_ids:
        raise HTTPException(status_code=400, detail="No valid UUIDs provided")
    
    ads = db.query(ScrollingAd).filter(ScrollingAd.id.in_(valid_ids)).all()
    if not ads:
        raise HTTPException(status_code=404, detail="No scrolling ads found")
    
    action = bulk_request.action.lower()
    affected_count = len(ads)
    
    if action == "delete":
        for ad in ads:
            db.delete(ad)
        db.commit()
        message = f"Deleted {affected_count} scrolling ads"
    
    elif action == "activate":
        for ad in ads:
            ad.is_active = True
            ad.updated_at = get_ist_now()
        db.commit()
        message = f"Activated {affected_count} scrolling ads"
    
    elif action == "deactivate":
        for ad in ads:
            ad.is_active = False
            ad.updated_at = get_ist_now()
        db.commit()
        message = f"Deactivated {affected_count} scrolling ads"
    
    else:
        raise HTTPException(status_code=400, detail=f"Invalid action: {action}")
    
    return {
        "message": message,
        "affected_count": affected_count,
        "action": action
    }

# ============ Run with: uvicorn app:app --reload ============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)