// src/components/ProductSection.tsx - Updated with proper navigation
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart, CartDrawer, ProductCardWithCart } from '../pages/ProductCart';
import { useNavigate } from 'react-router-dom';

// API Configuration
const API_BASE_URL = '';
const API_URL = `${API_BASE_URL}/api`;

// Helper function to get full image URL
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

// Icons
const CartIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
    </div>
);

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    discount: number;
    discountedPrice: number;
    images: string[];
    description: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

const ProductSection: React.FC = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
    const [showProductModal, setShowProductModal] = useState<boolean>(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
    const [showCart, setShowCart] = useState<boolean>(false);
    
    const { getTotalItems } = useCart();

    const categories = ['all', ...new Set(products.map(p => p.category))];

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (selectedCategory === 'all') {
            setFilteredProducts(products);
        } else {
            setFilteredProducts(products.filter(p => p.category === selectedCategory));
        }
    }, [selectedCategory, products]);

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/products`, {
                params: { is_active: true }
            });
            setProducts(response.data);
            setFilteredProducts(response.data);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.detail || err.message || 'Failed to fetch products');
            } else {
                setError('Failed to fetch products');
            }
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getCategoryColor = (category: string) => {
        const colors: { [key: string]: string } = {
            'FLOWERPOTS': 'border-gold-400 text-gold-400',
            'ROCKETS': 'border-blue-400 text-blue-400',
            'SPARKLERS': 'border-yellow-400 text-yellow-400',
            'GROUND': 'border-orange-400 text-orange-400',
            'ATOM BOMBSKID\'S SPECIAL': 'border-purple-400 text-purple-400',
            'CHAKKARS': 'border-indigo-400 text-indigo-400'
        };
        return colors[category] || 'border-gray-400 text-gray-400';
    };

    const handleViewProduct = (product: Product) => {
        setViewingProduct(product);
        setSelectedImageIndex(0);
        setShowProductModal(true);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setShowProductModal(false);
        setViewingProduct(null);
        document.body.style.overflow = 'auto';
    };

    const nextImage = () => {
        if (viewingProduct && viewingProduct.images.length > 0) {
            setSelectedImageIndex((prev) => (prev + 1) % viewingProduct.images.length);
        }
    };

    const previousImage = () => {
        if (viewingProduct && viewingProduct.images.length > 0) {
            setSelectedImageIndex((prev) => (prev - 1 + viewingProduct.images.length) % viewingProduct.images.length);
        }
    };

    const handleModalOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    };

    const handleCheckout = () => {
        setShowCart(false);
        // Use react-router navigation
        navigate('/register');
    };

    return (
        <section className="relative w-full py-16 px-4 md:px-8 bg-black" id="products">
            {/* Background decoration */}
            <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-gradient-to-b from-black via-gray-900/50 to-black" />
                <div className="absolute top-0 left-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-4 py-1.5 mb-4">
                        <span className="text-xs font-medium text-gold-400 bg-amber-400 tracking-wider uppercase">Premium Collection</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white tracking-wider">
                        Our <span className="text-gold-400">Products</span>
                    </h2>
                    <div className="mt-3 flex justify-center">
                        <div className="w-20 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent rounded-full" />
                    </div>
                    <p className="text-gray-400 mt-4 max-w-2xl mx-auto text-sm">
                        Discover our premium range of fireworks and celebration essentials. 
                        Each product is crafted to make your celebrations unforgettable.
                    </p>
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                                selectedCategory === cat
                                    ? 'bg-gold-500 text-black border-gold-500 shadow-lg shadow-gold-500/20'
                                    : 'bg-transparent text-gray-400 border-gray-700 hover:border-gold-400 hover:text-gold-400'
                            }`}
                        >
                            {cat === 'all' ? 'All Products' : cat.replace(/'/g, '')}
                        </button>
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-8 p-4 bg-red-900/30 border border-red-500 text-red-300 rounded-lg text-center max-w-lg mx-auto">
                        <p>{error}</p>
                        <button
                            onClick={fetchProducts}
                            className="mt-2 text-sm text-gold-400 underline hover:text-gold-300"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <>
                        {/* Products Grid */}
                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="text-6xl mb-4">🎆</div>
                                <p className="text-gray-400 text-lg">No products found in this category.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredProducts.map((product) => (
                                    <ProductCardWithCart
                                        key={product.id}
                                        product={product}
                                        onView={handleViewProduct}
                                        formatCurrency={formatCurrency}
                                        getImageUrl={getImageUrl}
                                        getCategoryColor={getCategoryColor}
                                    />
                                ))}
                            </div>
                        )}

                        {/* View More Button */}
                        {filteredProducts.length > 0 && (
                            <div className="text-center mt-12">
                                <button className="group inline-flex items-center gap-2 px-8 py-3 border border-gold-500/50 text-gold-400 rounded-full hover:bg-gold-500 hover:text-black transition-all duration-300">
                                    <span>View All Products</span>
                                    <ArrowRightIcon />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* FIXED CART BUTTON - Bottom Right Corner */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setShowCart(true)}
                    className="relative group flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500 shadow-2xl shadow-gold-500/40 hover:shadow-gold-500/60 transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-gold-300/30"
                    aria-label="Open Cart"
                >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>

                    <span className="absolute inset-0 rounded-full border-2 border-[#FFD700]/50 animate-ping-slow" />

                    {getTotalItems() > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[26px] h-[26px] px-1.5 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg shadow-red-500/50 border-2 border-white">
                            {getTotalItems() > 99 ? '99+' : getTotalItems()}
                        </span>
                    )}

                    <span className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap border border-gray-700 shadow-xl">
                        {getTotalItems() > 0 ? `${getTotalItems()} items in cart` : 'Cart is empty'}
                    </span>
                </button>

                <div className="text-center mt-2">
                    <span className="text-[10px] font-medium text-gray-500 tracking-wider uppercase bg-black/60 backdrop-blur-sm px-3 py-0.5 rounded-full border border-gray-800">
                        Cart
                    </span>
                </div>
            </div>

            {/* Cart Drawer */}
            <CartDrawer 
                isOpen={showCart} 
                onClose={() => setShowCart(false)} 
                onCheckout={handleCheckout}
            />

            {/* Product Detail Modal */}
            {showProductModal && viewingProduct && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={handleModalOverlayClick}
                >
                    <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gold-500/20 shadow-2xl shadow-gold-500/10">
                        <div className="p-6 md:p-8">
                            {/* Modal Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="text-2xl md:text-3xl font-bold text-white">
                                            {viewingProduct.name}
                                        </h3>
                                        <span className={`text-xs font-medium border rounded-full px-3 py-1 ${getCategoryColor(viewingProduct.category)}`}>
                                            {viewingProduct.category}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Image Gallery */}
                                <div>
                                    <div className="relative bg-gray-800 rounded-xl overflow-hidden" style={{ height: '350px' }}>
                                        {viewingProduct.images && viewingProduct.images.length > 0 ? (
                                            <img
                                                src={getImageUrl(viewingProduct.images[selectedImageIndex])}
                                                alt={viewingProduct.name}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400/gray?text=No+Image';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                <span className="text-6xl">🎆</span>
                                            </div>
                                        )}
                                        
                                        {viewingProduct.images && viewingProduct.images.length > 1 && (
                                            <>
                                                <button
                                                    onClick={previousImage}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 p-2 rounded-full transition-colors text-white"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={nextImage}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 p-2 rounded-full transition-colors text-white"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                                    {viewingProduct.images.map((_, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setSelectedImageIndex(idx)}
                                                            className={`w-2 h-2 rounded-full transition-all ${
                                                                selectedImageIndex === idx
                                                                    ? 'bg-gold-400 w-6'
                                                                    : 'bg-gray-500 hover:bg-gray-300'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Thumbnails */}
                                    {viewingProduct.images && viewingProduct.images.length > 1 && (
                                        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                                            {viewingProduct.images.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedImageIndex(idx)}
                                                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                                        selectedImageIndex === idx
                                                            ? 'border-gold-500'
                                                            : 'border-transparent hover:border-gold-400/50'
                                                    }`}
                                                >
                                                    <img
                                                        src={getImageUrl(img)}
                                                        alt={`${viewingProduct.name} ${idx + 1}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64/gray?text=No+Image';
                                                        }}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Product Details */}
                                <div className="space-y-5">
                                    {/* Description */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
                                        <p className="text-gray-300 leading-relaxed">
                                            {viewingProduct.description || 'No description available for this product.'}
                                        </p>
                                    </div>

                                    {/* Price */}
                                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                        <div className="flex flex-col items-center">
                                            <p className="text-sm text-gray-400 mb-1">Price</p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-bold text-white">
                                                    {formatCurrency(viewingProduct.discountedPrice || viewingProduct.price)}
                                                </span>
                                                {viewingProduct.discount > 0 && (
                                                    <>
                                                        <span className="text-sm text-gray-500 line-through">
                                                            {formatCurrency(viewingProduct.price)}
                                                        </span>
                                                        <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
                                                            {viewingProduct.discount}% OFF
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Add to Cart / Quantity Selector */}
                                    <div className="flex justify-center">
                                        {(() => {
                                            const { getCartItems, updateQuantity, addToCart } = useCart();
                                            const cartItems = getCartItems();
                                            const existingItem = cartItems.find(
                                                item => item.id === viewingProduct.id
                                            );
                                            const currentQuantity = existingItem ? existingItem.quantity : 0;

                                            if (currentQuantity > 0) {
                                                return (
                                                    <div className="flex items-center gap-3 bg-gray-800 rounded-xl border border-gold-500/30 p-2">
                                                        <button
                                                            onClick={() => {
                                                                if (currentQuantity === 1) {
                                                                    updateQuantity(viewingProduct.id, 0);
                                                                } else {
                                                                    updateQuantity(viewingProduct.id, currentQuantity - 1);
                                                                }
                                                            }}
                                                            className="w-12 h-12 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition-all duration-200 flex items-center justify-center text-xl hover:scale-105 active:scale-95"
                                                        >
                                                            −
                                                        </button>
                                                        
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={currentQuantity}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                if (!isNaN(val) && val >= 0) {
                                                                    updateQuantity(viewingProduct.id, val);
                                                                }
                                                            }}
                                                            className="w-20 h-12 bg-transparent text-center text-white font-medium text-xl border-0 focus:outline-none focus:ring-1 focus:ring-gold-500 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                        
                                                        <button
                                                            onClick={() => {
                                                                updateQuantity(viewingProduct.id, currentQuantity + 1);
                                                            }}
                                                            className="w-12 h-12 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition-all duration-200 flex items-center justify-center text-xl hover:scale-105 active:scale-95"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <button 
                                                        className="w-full bg-gold-500 text-white font-semibold py-3.5 rounded-xl hover:bg-gold-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20 hover:scale-[1.02] active:scale-95"
                                                        onClick={() => {
                                                            addToCart(viewingProduct);
                                                            const btn = document.activeElement as HTMLElement;
                                                            if (btn) {
                                                                btn.style.transform = 'scale(0.95)';
                                                                setTimeout(() => {
                                                                    btn.style.transform = 'scale(1)';
                                                                }, 150);
                                                            }
                                                        }}
                                                    >
                                                        <CartIcon />
                                                        Add to Cart
                                                    </button>
                                                );
                                            }
                                        })()}
                                    </div>

                                    {/* Product Features */}
                                    <div className="grid grid-cols-2 gap-3 pt-3">
                                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                            <span className="text-gold-400">✓</span>
                                            Premium Quality
                                        </div>
                                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                            <span className="text-gold-400">✓</span>
                                            Safe & Certified
                                        </div>
                                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                            <span className="text-gold-400">✓</span>
                                            Fast Delivery
                                        </div>
                                        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                            <span className="text-gold-400">✓</span>
                                            Best Price Guarantee
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default ProductSection;