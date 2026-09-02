# models.py
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, Float, JSON, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime, timezone, timedelta
import uuid
import enum
import json

Base = declarative_base()

# ============ IST Timezone Configuration ============
IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now():
    """Get current time in IST (Indian Standard Time UTC+5:30), as a naive datetime"""
    return datetime.now(IST).replace(tzinfo=None)

# ============ Enums ============

class ProductCategory(str, enum.Enum):
    ONE_SOUND = "One Sound"
    PAPER_BOMB = "Paper Bomb"
    BIJILI = "Bijili"
    BOMBS = "Bombs"
    PENCIL = "Pencil"
    TWINKLE_STAR = "Twinkle Star"
    ROCKETS = "Rockets"
    MATCH_BOX = "Match Box"
    FLOWER_POT = "Flower Pot"
    GROUND_CHAKKAR = "Ground Chakkar"
    PEACOCK = "Peacock"
    KIDS_SPECIAL = "Kids Special"
    YEAR_2026_SPECIAL = "2026 Special"
    FANCY_PIPES = "Fancy Pipes"
    MULTICOLOUR_SHOT = "Multicolour Shot"
    SPARKLES = "Sparkles"
    WALA = "Wala"
    GIFT_BOXES = "Gift Boxes"

class OrderStatus(str, enum.Enum):
    """Order status enum - values must match database enum exactly"""
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    PROCESSING = "PROCESSING"
    SHIPPED = "SHIPPED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"
    RESTORED = "RESTORED"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    PARTIAL = "partial"
    FAILED = "failed"
    REFUNDED = "refunded"

class SubmissionStatus(str, enum.Enum):
    PENDING = "pending"
    READ = "read"
    RESPONDED = "responded"
    ARCHIVED = "archived"

class EnquiryType(str, enum.Enum):
    RETAIL = "retail"
    WHOLESALE = "wholesale"
    MANUFACTURING = "manufacturing"

class BillStatus(str, enum.Enum):
    """Bill payment status enum"""
    PAID = "paid"
    PARTIAL = "partial"
    PENDING = "pending"
    OVERDUE = "overdue"


# ============ Product Model ============

class Product(Base):
    __tablename__ = "products"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)
    price = Column(Float, nullable=False)
    discount = Column(Float, default=0)
    discounted_price = Column(Float, nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    images = Column(JSON, default=list)
    created_at = Column(DateTime, default=get_ist_now)
    updated_at = Column(DateTime, default=get_ist_now, onupdate=get_ist_now)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete timestamp

    # Relationships
    order_items = relationship("OrderItem", back_populates="product")

    def to_dict(self):
        images = self.images or []
        if isinstance(images, str):
            try:
                images = json.loads(images)
            except:
                images = []
        elif not isinstance(images, list):
            images = []
            
        return {
            "id": str(self.id),
            "name": self.name,
            "category": self.category,
            "price": self.price,
            "discount": self.discount,
            "discountedPrice": self.discounted_price,
            "description": self.description,
            "isActive": self.is_active,
            "images": images,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "deletedAt": self.deleted_at.isoformat() if self.deleted_at else None
        }


# ============ User Registration Model ============

class UserRegistration(Base):
    __tablename__ = "user_registrations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    contact = Column(String(20), nullable=False, unique=True)
    pincode = Column(String(10), nullable=False)
    city_village = Column(String(255), nullable=False)
    address = Column(Text, nullable=False)
    email = Column(String(255))
    additional_discount = Column(Float, default=0)  # ← This stores the user's discount
    registration_date = Column(DateTime, default=get_ist_now)
    updated_at = Column(DateTime, default=get_ist_now, onupdate=get_ist_now)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="customer", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "contact": self.contact,
            "pincode": self.pincode,
            "cityVillage": self.city_village,
            "address": self.address,
            "email": self.email,
            "registrationDate": self.registration_date.isoformat() if self.registration_date else None,
            "isActive": self.is_active,
            "additionalDiscount": float(self.additional_discount or 0),  # ← Returns the discount
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }


# ============ Order Model ============

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_registrations.id"), nullable=False)
    order_number = Column(String(50), unique=True, nullable=False)
    
    # Order financial details
    total_amount = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0)
    shipping_charge = Column(Float, default=0)
    tax_amount = Column(Float, default=0)
    
    # Discount Snapshot Fields
    additional_discount_percentage = Column(Float, default=0)
    additional_discount_amount = Column(Float, default=0)
    final_amount = Column(Float, nullable=False)
    
    # Order payment details
    payment_method = Column(String(50), default="cash")
    reference_id = Column(String(100), nullable=True)
    is_paid = Column(Boolean, default=False)
    invoice_number = Column(String(50), nullable=True, unique=True)
    
    # Payment tracking fields for partial payments
    paid_amount = Column(Float, default=0)           # ← Total paid amount
    remaining_amount = Column(Float, default=0)      # ← Remaining balance
    payment_history = Column(JSON, default=list)     # ← Payment history
    
    # Status Fields - using uppercase enum
    order_status = Column(SQLEnum(OrderStatus, name='orderstatus', create_type=False), default=OrderStatus.PENDING)
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Status History (JSON)
    status_history = Column(JSON, default=dict)
    
    # Staff and Customer Notes
    staff_notes = Column(Text, nullable=True)
    customer_notes = Column(Text, nullable=True)
    
    # Timestamps - Using IST
    created_at = Column(DateTime, default=get_ist_now)
    updated_at = Column(DateTime, default=get_ist_now, onupdate=get_ist_now)
    confirmed_at = Column(DateTime, nullable=True)
    processing_at = Column(DateTime, nullable=True)
    shipped_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("UserRegistration", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    def to_dict(self):
        # Get delivery information from user registration
        delivery_data = {}
        if self.user:
            delivery_data = {
                "name": self.user.name,
                "contact": self.user.contact,
                "pincode": self.user.pincode,
                "cityVillage": self.user.city_village,
                "address": self.user.address,
                "email": self.user.email
            }
        
        return {
            "id": str(self.id),
            "orderNumber": self.order_number,
            "userId": str(self.user_id),
            
            # Financials
            "totalAmount": self.total_amount,
            "subtotal": self.subtotal,
            "discountAmount": self.discount_amount,
            "shippingCharge": self.shipping_charge,
            "taxAmount": self.tax_amount,
            
            # Discount Snapshot
            "additionalDiscountPercentage": float(self.additional_discount_percentage or 0),
            "additionalDiscountAmount": float(self.additional_discount_amount or 0),
            "finalAmount": float(self.final_amount),
            
            # Payment
            "paymentMethod": self.payment_method or "cash",
            "referenceId": self.reference_id or "",
            "isPaid": bool(self.is_paid or False),
            "invoiceNumber": self.invoice_number or "",
            
            # Payment tracking
            "paidAmount": float(self.paid_amount or 0),           # ← Total paid
            "remainingAmount": float(self.remaining_amount or 0),  # ← Remaining balance
            "paymentHistory": self.payment_history or [],          # ← Payment history
            
            # Status
            "orderStatus": self.order_status.value if self.order_status else None,
            "paymentStatus": self.payment_status.value if self.payment_status else None,
            "statusHistory": self.status_history or {},
            
            # Notes
            "staffNotes": self.staff_notes,
            "customerNotes": self.customer_notes,
            
            # Delivery (from user)
            "delivery": delivery_data,
            "items": [item.to_dict() for item in self.order_items],
            
            # Timestamps - ISO format with timezone info
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "confirmedAt": self.confirmed_at.isoformat() if self.confirmed_at else None,
            "processingAt": self.processing_at.isoformat() if self.processing_at else None,
            "shippedAt": self.shipped_at.isoformat() if self.shipped_at else None,
            "completedAt": self.completed_at.isoformat() if self.completed_at else None,
            "cancelledAt": self.cancelled_at.isoformat() if self.cancelled_at else None
        }


# ============ Order Items Model ============

class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    
    # Snapshot of product details at time of order
    product_name = Column(String(255), nullable=False)
    product_category = Column(String(50), nullable=False)
    unit_price = Column(Float, nullable=False)
    discounted_unit_price = Column(Float, nullable=False)
    discount_percentage = Column(Float, default=0)
    quantity = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)
    
    # Product image snapshot (store URL)
    product_image = Column(String(500))
    
    # Relationships
    order = relationship("Order", back_populates="order_items")
    product = relationship("Product", back_populates="order_items")

    def to_dict(self):
        return {
            "id": str(self.id),
            "productId": str(self.product_id),
            "productName": self.product_name,
            "category": self.product_category,
            "unitPrice": self.unit_price,
            "discountedUnitPrice": self.discounted_unit_price,
            "discountPercentage": self.discount_percentage,
            "quantity": self.quantity,
            "totalPrice": self.total_price,
            "productImage": self.product_image
        }


# ============ Bill Model ============

class Bill(Base):
    """Billing table with foreign key to user_registrations"""
    __tablename__ = "bills"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bill_number = Column(String(50), unique=True, nullable=False)
    
    # Foreign key to user_registrations
    customer_id = Column(UUID(as_uuid=True), ForeignKey("user_registrations.id"), nullable=False)
    
    # Customer snapshot (denormalized for quick access)
    customer_name = Column(String(255), nullable=False)
    customer_contact = Column(String(20), nullable=False)
    customer_address = Column(Text, nullable=False)
    
    # Bill items stored as JSON
    items = Column(JSON, nullable=False, default=list)
    
    # Financial details
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0)
    customer_discount = Column(Float, default=0)  # Additional discount from user
    total = Column(Float, nullable=False)
    
    # Payment details
    paid_amount = Column(Float, default=0)
    remaining_amount = Column(Float, default=0)
    payment_method = Column(String(50), default="cash")
    payment_status = Column(SQLEnum(BillStatus), default=BillStatus.PENDING)
    
    # Payment history
    payment_history = Column(JSON, default=list)
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # Timestamps - Using IST
    date = Column(DateTime, default=get_ist_now)
    created_at = Column(DateTime, default=get_ist_now)
    updated_at = Column(DateTime, default=get_ist_now, onupdate=get_ist_now)
    
    # Relationship
    customer = relationship("UserRegistration", back_populates="bills")
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "billNumber": self.bill_number,
            "customerId": str(self.customer_id),
            "customerName": self.customer_name,
            "customerContact": self.customer_contact,
            "customerAddress": self.customer_address,
            "items": self.items or [],
            "subtotal": self.subtotal,
            "discount": self.discount,
            "customerDiscount": self.customer_discount,
            "total": self.total,
            "paidAmount": self.paid_amount,
            "remainingAmount": self.remaining_amount,
            "paymentMethod": self.payment_method,
            "paymentStatus": self.payment_status.value if self.payment_status else None,
            "date": self.date.isoformat() if self.date else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "notes": self.notes,
            "paymentHistory": self.payment_history or []
        }


# ============ Brand Logo Model ============

class Brand(Base):
    """Brand logo model for storing brand images"""
    __tablename__ = "brands"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    image_url = Column(String(500), nullable=False)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_ist_now)
    updated_at = Column(DateTime, default=get_ist_now, onupdate=get_ist_now)

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "imageUrl": self.image_url,
            "displayOrder": self.display_order,
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }


# ============ Contact Submission Model ============

class ContactSubmission(Base):
    __tablename__ = "contact_submissions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    contact_number = Column(String(20), nullable=False)
    location = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    enquiry_type = Column(SQLEnum(EnquiryType), nullable=False)
    message = Column(Text)
    status = Column(SQLEnum(SubmissionStatus), default=SubmissionStatus.PENDING)
    is_starred = Column(Boolean, default=False)
    notes = Column(Text)
    created_at = Column(DateTime, default=get_ist_now)
    updated_at = Column(DateTime, default=get_ist_now, onupdate=get_ist_now)

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "contactNumber": self.contact_number,
            "location": self.location,
            "category": self.category,
            "enquiryType": self.enquiry_type.value if self.enquiry_type else None,
            "message": self.message,
            "status": self.status.value if self.status else None,
            "isStarred": self.is_starred,
            "notes": self.notes,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }

# ============ Scrolling Ads Model ============

class ScrollingAd(Base):
    """Scrolling Ads model for storing advertisement data"""
    __tablename__ = "scrolling_ads"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    text = Column(String(500), nullable=False)
    speed = Column(String(20), default="normal")  # slow, normal, fast
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)  # For ordering multiple ads
    highlight = Column(Boolean, default=False)  # For special highlighting
    created_at = Column(DateTime, default=get_ist_now)
    updated_at = Column(DateTime, default=get_ist_now, onupdate=get_ist_now)

    def to_dict(self):
        return {
            "id": str(self.id),
            "text": self.text,
            "speed": self.speed,
            "isActive": self.is_active,
            "displayOrder": self.display_order,
            "highlight": self.highlight,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }