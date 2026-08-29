// src/pages/ProductCart.tsx - Shopping Cart Management with Checkout API Integration
import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';

// API Configuration
const API_BASE_URL = '';
const API_URL = `${API_BASE_URL}/api`;

// Types
export interface CartItem {
    id: string;
    name: string;
    price: number;
    discountedPrice: number;
    discount: number;
    quantity: number;
    image: string;
    category: string;
}

interface CartContextType {
    cartItems: CartItem[];
    getCartItems: () => CartItem[];
    addToCart: (product: any, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
    getSubtotal: () => number;
    getDiscount: () => number;
    isInCart: (productId: string) => boolean;
    getItemQuantity: (productId: string) => number;
    checkout: (userData: any) => Promise<any>;
}

// Create Cart Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Custom hook to use cart
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

// Cart Provider Component
interface CartProviderProps {
    children: React.ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                const parsed = JSON.parse(savedCart);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setCartItems(parsed);
                    console.log('📦 Cart loaded from localStorage:', parsed.length, 'items');
                } else {
                    console.log('📦 Cart is empty in localStorage');
                    setCartItems([]);
                }
            } else {
                console.log('📦 No cart found in localStorage');
                setCartItems([]);
            }
        } catch (error) {
            console.error('❌ Error loading cart from localStorage:', error);
            setCartItems([]);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isInitialized) {
            try {
                localStorage.setItem('cart', JSON.stringify(cartItems));
                console.log('💾 Cart saved to localStorage:', cartItems.length, 'items');
            } catch (error) {
                console.error('❌ Error saving cart to localStorage:', error);
            }
        }
    }, [cartItems, isInitialized]);

    // Get cart items
    const getCartItems = () => {
        return cartItems;
    };

    // Get item quantity
    const getItemQuantity = (productId: string) => {
        const item = cartItems.find(item => item.id === productId);
        return item ? item.quantity : 0;
    };

    // Add to cart
    const addToCart = (product: any, quantity: number = 1) => {
        console.log('➕ Adding to cart:', product.name, 'quantity:', quantity);
        
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);
            
            // Get image URL
            const getImageUrl = (imagePath: string) => {
                if (!imagePath) return '';
                if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
                    return imagePath;
                }
                if (imagePath.startsWith('/uploads')) {
                    return `${API_BASE_URL}${imagePath}`;
                }
                if (imagePath.startsWith('uploads')) {
                    return `${API_BASE_URL}/${imagePath}`;
                }
                return `${API_BASE_URL}/uploads/products/${imagePath}`;
            };

            const cartItem: CartItem = {
                id: product.id,
                name: product.name,
                price: product.price,
                discountedPrice: product.discountedPrice || product.price,
                discount: product.discount || 0,
                quantity: quantity,
                image: product.images && product.images.length > 0 
                    ? getImageUrl(product.images[0]) 
                    : '',
                category: product.category
            };

            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity;
                const updatedItems = prevItems.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: newQuantity }
                        : item
                );
                console.log('📦 Updated existing item:', product.id, 'new quantity:', newQuantity);
                return updatedItems;
            } else {
                const newItems = [...prevItems, cartItem];
                console.log('📦 Added new item:', product.id);
                return newItems;
            }
        });
    };

    // Remove from cart
    const removeFromCart = (productId: string) => {
        console.log('🗑️ Removing from cart:', productId);
        setCartItems(prevItems => {
            const newItems = prevItems.filter(item => item.id !== productId);
            console.log('📦 Remaining items:', newItems.length);
            return newItems;
        });
    };

    // Update quantity
    const updateQuantity = (productId: string, quantity: number) => {
        console.log('🔄 Updating quantity:', productId, 'to:', quantity);
        
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        
        setCartItems(prevItems => {
            const updatedItems = prevItems.map(item =>
                item.id === productId
                    ? { ...item, quantity: quantity }
                    : item
            );
            console.log('📦 Quantity updated for:', productId);
            return updatedItems;
        });
    };

    // Clear cart
    const clearCart = () => {
        console.log('🧹 Clearing cart');
        setCartItems([]);
        localStorage.removeItem('cart');
    };

    // Get total items count
    const getTotalItems = () => {
        const total = cartItems.reduce((total, item) => total + item.quantity, 0);
        return total;
    };

    // Get total price
    const getTotalPrice = () => {
        const total = cartItems.reduce((total, item) => {
            const price = item.discountedPrice || item.price;
            return total + (price * item.quantity);
        }, 0);
        return total;
    };

    // Get subtotal (before discounts)
    const getSubtotal = () => {
        const total = cartItems.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
        return total;
    };

    // Get total discount
    const getDiscount = () => {
        const total = cartItems.reduce((total, item) => {
            const discount = item.price - item.discountedPrice;
            return total + (discount * item.quantity);
        }, 0);
        return total;
    };

    // Check if product is in cart
    const isInCart = (productId: string) => {
        return cartItems.some(item => item.id === productId);
    };

    // Checkout function - sends order to backend
    const checkout = async (userData: any) => {
        console.log('🛒 Starting checkout with cart items:', cartItems.length);
        console.log('🛒 Cart items:', cartItems);
        
        if (cartItems.length === 0) {
            throw new Error('Your cart is empty. Please add some products before checking out.');
        }

        try {
            // Prepare order data from cart
            const items = cartItems.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                productName: item.name,
                unitPrice: item.price,
                discountedUnitPrice: item.discountedPrice,
                discountPercentage: item.discount,
                totalPrice: (item.discountedPrice || item.price) * item.quantity,
                productCategory: item.category,
                productImage: item.image
            }));

            const orderData = {
                userId: '',
                deliveryName: userData.name,
                deliveryContact: userData.contact,
                deliveryPincode: userData.pincode,
                deliveryCityVillage: userData.cityVillage,
                deliveryAddress: userData.address,
                deliveryEmail: userData.email || undefined,
                items: items,
                subtotal: getSubtotal(),
                discountAmount: getDiscount(),
                shippingCharge: 0,
                taxAmount: 0,
                totalAmount: getTotalPrice()
            };

            const checkoutData = {
                user: userData,
                order: orderData
            };

            console.log('📤 Sending checkout data:', checkoutData);

            const response = await axios.post(`${API_URL}/orders/checkout`, checkoutData);
            console.log('✅ Checkout response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Checkout error:', error);
            const errorMessage = error.response?.data?.detail || 'Failed to place order. Please try again.';
            throw new Error(errorMessage);
        }
    };

    const value: CartContextType = {
        cartItems,
        getCartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        getSubtotal,
        getDiscount,
        isInCart,
        getItemQuantity,
        checkout
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

// Cart Button Component
interface CartButtonProps {
    onClick?: () => void;
    className?: string;
}

export const CartButton: React.FC<CartButtonProps> = ({ onClick, className = '' }) => {
    const { getTotalItems } = useCart();
    const itemCount = getTotalItems();

    return (
        <button
            onClick={onClick}
            className={`relative inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-800 transition-colors ${className}`}
        >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold-500 text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount > 99 ? '99+' : itemCount}
                </span>
            )}
        </button>
    );
};

// Cart Drawer/Mini Cart Component
interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onCheckout?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onCheckout }) => {
    const { cartItems, removeFromCart, updateQuantity, getTotalPrice, getSubtotal, getDiscount, clearCart } = useCart();
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
            setTimeout(() => setIsAnimating(false), 300);
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (!isOpen && !isAnimating) return null;

    const handleCheckout = () => {
        if (onCheckout) {
            onCheckout();
        } else {
            window.location.href = '/register';
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/70 z-50 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-gray-900 z-50 border-l border-gold-500/20 transition-transform duration-300 ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-800">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>Your Cart</span>
                            <span className="text-sm text-gray-400 font-normal">
                                ({cartItems.length} items)
                            </span>
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {cartItems.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="text-4xl mb-4">🛒</div>
                                <p className="text-gray-400 text-lg">Your cart is empty</p>
                                <p className="text-gray-500 text-sm mt-2">Start adding some products!</p>
                            </div>
                        ) : (
                            cartItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-4 bg-gray-800 rounded-xl p-3 border border-gray-700 hover:border-gold-500/30 transition-all"
                                >
                                    {/* Product Image */}
                                    <div className="flex-shrink-0 w-20 h-20 bg-gray-700 rounded-lg overflow-hidden">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80/gray?text=No+Image';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                                No Image
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-sm font-medium text-white truncate">
                                                    {item.name}
                                                </h3>
                                                <p className="text-xs text-gray-400">{item.category}</p>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full text-white text-sm transition-colors"
                                                >
                                                    -
                                                </button>
                                                <span className="text-white text-sm font-medium w-8 text-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full text-white text-sm transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-gold-400">
                                                    {formatCurrency((item.discountedPrice || item.price) * item.quantity)}
                                                </span>
                                                {item.discount > 0 && (
                                                    <span className="text-xs text-gray-500 line-through ml-2">
                                                        {formatCurrency(item.price * item.quantity)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {cartItems.length > 0 && (
                        <div className="border-t border-gray-800 p-4 space-y-3">
                            {/* Summary */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Subtotal</span>
                                    <span className="text-white">{formatCurrency(getSubtotal())}</span>
                                </div>
                                {getDiscount() > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Discount</span>
                                        <span className="text-green-400">-{formatCurrency(getDiscount())}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-700">
                                    <span className="text-white">Total</span>
                                    <span className="text-gold-400">{formatCurrency(getTotalPrice())}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={clearCart}
                                    className="flex-1 px-4 py-2.5 border border-red-500/50 text-red-400 rounded-xl hover:bg-red-500/10 transition-colors text-sm font-medium"
                                >
                                    Clear Cart
                                </button>
                                <button
                                    onClick={handleCheckout}
                                    className="flex-1 px-4 py-2.5 bg-white text-black font-semibold rounded-xl border border-black hover:bg-gray-100 transition-colors text-sm"
                                >
                                    Proceed to Checkout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

// ProductCard with Professional Quantity Controls
interface ProductCardWithCartProps {
    product: any;
    onView: (product: any) => void;
    formatCurrency: (amount: number) => string;
    getImageUrl: (path: string) => string;
    getCategoryColor: (category: string) => string;
}

export const ProductCardWithCart: React.FC<ProductCardWithCartProps> = ({
    product,
    onView,
    formatCurrency,
    getImageUrl,
    getCategoryColor,
}) => {
    const { addToCart, updateQuantity, getItemQuantity } = useCart();
    const [isAdding, setIsAdding] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);

    const quantity = getItemQuantity(product.id);
    const inCart = quantity > 0;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsAdding(true);
        addToCart(product);
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 1500);
        setTimeout(() => setIsAdding(false), 300);
    };

    const handleIncrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        updateQuantity(product.id, quantity + 1);
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (quantity > 0) {
            updateQuantity(product.id, quantity - 1);
        }
    };

    return (
        <div 
            className="group relative bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-gold-500/50 hover:-translate-y-1 transition-all duration-500 cursor-pointer"
            onClick={() => onView(product)}
        >
            {/* Product image */}
            <div className="relative h-52 w-full overflow-hidden bg-gray-800">
                {product.images && product.images.length > 0 ? (
                    <img
                        src={getImageUrl(product.images[0])}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400/gray?text=No+Image';
                        }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                        No Image
                    </div>
                )}
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                
                {/* Category badge */}
                <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border bg-black/60 backdrop-blur-sm ${getCategoryColor(product.category)}`}>
                        {product.category}
                    </span>
                </div>

                {/* Discount badge */}
                {product.discount > 0 && (
                    <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/90 text-white backdrop-blur-sm border border-red-400">
                            {product.discount}% OFF
                        </span>
                    </div>
                )}

                {/* In Cart indicator - quantity badge */}
                {inCart && (
                    <div className="absolute bottom-3 right-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-green-500/90 text-white backdrop-blur-sm border border-green-400">
                            {quantity} in cart
                        </span>
                    </div>
                )}
            </div>

            {/* Content - ALL CENTERED */}
            <div className="p-4">
                {/* Product Name - Centered */}
                <h3 className="text-base font-bold text-white tracking-wide mb-1 line-clamp-1 group-hover:text-gold-400 transition-colors text-center">
                    {product.name}
                </h3>
                
                {/* Price - Centered */}
                <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-lg font-bold text-gold-400">
                        {formatCurrency(product.discountedPrice || product.price)}
                    </span>
                    {product.discount > 0 && (
                        <span className="text-xs text-gray-500 line-through">
                            {formatCurrency(product.price)}
                        </span>
                    )}
                </div>

                {/* Professional Quantity Controls - CENTERED */}
                {inCart ? (
                    <div 
                        className="flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-1 bg-white rounded-lg overflow-hidden border border-gray-300">
                            <button
                                onClick={handleDecrement}
                                className="w-10 h-10 flex items-center justify-center text-black font-bold hover:bg-gray-100 transition-colors text-lg"
                                aria-label="Decrease quantity"
                            >
                                −
                            </button>
                            
                            <span className="w-8 text-center text-black font-medium text-sm">
                                {quantity}
                            </span>
                            
                            <button
                                onClick={handleIncrement}
                                className="w-10 h-10 flex items-center justify-center text-black font-bold hover:bg-gray-100 transition-colors text-lg"
                                aria-label="Increase quantity"
                            >
                                +
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center">
                        <button
                            onClick={handleAddToCart}
                            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 border border-gray-300 ${
                                isAdding ? 'opacity-70' : ''
                            }`}
                            disabled={isAdding}
                        >
                            {isAdding ? (
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span>Add to Cart</span>
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Feedback Toast */}
                {showFeedback && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white text-xs px-3 py-1.5 rounded-full animate-fade-in-up bg-green-500/90">
                        Added!
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartProvider;