# schemas.py
from pydantic import BaseModel, Field, field_validator, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid

# ============ User Registration Schemas ============

class UserRegistrationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    contact: str = Field(..., pattern=r'^[6-9]\d{9}$', description="10-digit mobile number starting with 6-9")
    pincode: str = Field(..., pattern=r'^[1-9][0-9]{5}$', description="6-digit pincode")
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

# ============ Order Schemas ============

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
    userId: str
    deliveryName: str
    deliveryContact: str
    deliveryPincode: str
    deliveryCityVillage: str
    deliveryAddress: str
    deliveryEmail: Optional[str] = None
    items: List[OrderItemCreate]
    subtotal: float
    discountAmount: float
    shippingCharge: float = 0
    taxAmount: float = 0
    totalAmount: float

class OrderResponse(BaseModel):
    id: str
    orderNumber: str
    userId: str
    totalAmount: float
    subtotal: float
    discountAmount: float
    shippingCharge: float
    taxAmount: float
    orderStatus: str
    paymentStatus: str
    delivery: dict
    items: List[dict]
    createdAt: str
    updatedAt: str
    completedAt: Optional[str]

class OrderStatusUpdate(BaseModel):
    orderStatus: str
    paymentStatus: Optional[str] = None

# ============ Combined Checkout Schema ============

class CheckoutRequest(BaseModel):
    """Combined request for user registration and order creation"""
    user: UserRegistrationCreate
    order: OrderCreate

class CheckoutResponse(BaseModel):
    user: UserRegistrationResponse
    order: OrderResponse
    message: str