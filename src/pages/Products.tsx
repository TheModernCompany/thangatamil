// src/components/ProductSection.tsx - Fully Mobile Responsive with Background Image
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart, CartDrawer, ProductCardWithCart } from '../pages/ProductCart';
import { useNavigate } from 'react-router-dom';

// Import background image
import backgroundImage from '../assets/Logo.png'; // Adjust path as needed

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
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-12 sm:py-16">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-gold-500"></div>
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

// ============ UPDATED CATEGORY COLORS ============
const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
        'One Sound': 'border-blue-400 text-blue-400',
        'Paper Bomb': 'border-red-400 text-red-400',
        'Bijili': 'border-yellow-400 text-yellow-400',
        'Bombs': 'border-orange-400 text-orange-400',
        'Pencil': 'border-purple-400 text-purple-400',
        'Twinkle Star': 'border-pink-400 text-pink-400',
        'Rockets': 'border-green-400 text-green-400',
        'Match Box': 'border-amber-400 text-amber-400',
        'Flower Pot': 'border-rose-400 text-rose-400',
        'Ground Chakkar': 'border-indigo-400 text-indigo-400',
        'Peacock': 'border-teal-400 text-teal-400',
        'Kids Special': 'border-cyan-400 text-cyan-400',
        '2026 Special': 'border-gold-400 text-gold-400',
        'Fancy Pipes': 'border-lime-400 text-lime-400',
        'Multicolour Shot': 'border-violet-400 text-violet-400',
        'Sparkles': 'border-amber-300 text-amber-300',
        'Wala': 'border-gray-400 text-gray-400',
        'Gift Boxes': 'border-emerald-400 text-emerald-400'
    };
    return colors[category] || 'border-gray-400 text-gray-400';
};

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
    const [isMobile, setIsMobile] = useState<boolean>(false);
    
    const { getTotalItems } = useCart();

    const categories = ['all', ...new Set(products.map(p => p.category))];

    // Check if mobile on mount and window resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
        navigate('/register');
    };

    // Handle touch swipe for mobile
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;
        
        if (isLeftSwipe) {
            nextImage();
        } else if (isRightSwipe) {
            previousImage();
        }
        setTouchStart(null);
        setTouchEnd(null);
    };

    return (
        <section 
            className="relative w-full py-10 sm:py-12 md:py-16 px-3 sm:px-4 md:px-8 bg-cover bg-center bg-no-repeat min-h-screen" 
            id="products"
            style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backgroundBlendMode: 'overlay',
                backgroundAttachment: isMobile ? 'scroll' : 'fixed'
            }}
        >
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 z-0 bg-black/60 sm:bg-black/50" />

            {/* Background decoration elements - Responsive */}
            <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                <div className="absolute top-0 left-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-gold-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 bg-gold-500/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 md:w-[600px] md:h-[600px] bg-gold-500/5 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Header - Mobile Optimized */}
                <div className="text-center mb-8 sm:mb-10 md:mb-12">
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-gold-500/20 backdrop-blur-sm border border-gold-500/30 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 mb-3 sm:mb-4">
                        <span className="text-[10px] sm:text-xs font-medium text-amber-300 tracking-wider uppercase">
                            Premium Collection
                        </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-wider drop-shadow-lg">
                        Our <span className="text-gold-400">Products</span>
                    </h2>
                    <div className="mt-2 sm:mt-3 flex justify-center">
                        <div className="w-12 sm:w-16 md:w-20 h-0.5 sm:h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent rounded-full" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-300 mt-3 sm:mt-4 max-w-2xl mx-auto px-2 drop-shadow-md leading-relaxed">
                        Discover our premium range of fireworks and celebration essentials. 
                        Each product is crafted to make your celebrations unforgettable.
                    </p>
                </div>

                {/* Category Filters - Mobile Optimized with horizontal scroll */}
                <div className="relative mb-8 sm:mb-10">
                    <div className="flex flex-nowrap sm:flex-wrap justify-start sm:justify-center gap-1.5 sm:gap-2 md:gap-3 overflow-x-auto pb-3 sm:pb-0 px-1 sm:px-0 scrollbar-hide [-webkit-overflow-scrolling:touch]">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`flex-shrink-0 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-sm font-medium transition-all duration-300 border backdrop-blur-sm whitespace-nowrap ${
                                    selectedCategory === cat
                                        ? 'bg-gold-500 text-black border-gold-500 shadow-lg shadow-gold-500/30 scale-[1.02] sm:scale-100'
                                        : 'bg-black/40 text-gray-300 border-gray-600 hover:border-gold-400 hover:text-gold-400 hover:bg-black/60'
                                }`}
                            >
                                {cat === 'all' ? 'All' : cat.replace(/'/g, '').length > 12 ? cat.replace(/'/g, '').slice(0, 12) + '..' : cat.replace(/'/g, '')}
                            </button>
                        ))}
                    </div>
                    {/* Gradient fade indicators for mobile scroll */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 sm:hidden bg-gradient-to-l from-black/60 to-transparent pointer-events-none" />
                    <div className="absolute left-0 top-0 bottom-0 w-8 sm:hidden bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
                </div>

                {/* Error Message - Mobile Optimized */}
                {error && (
                    <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-red-900/50 backdrop-blur-sm border border-red-500 text-red-300 rounded-lg text-center max-w-lg mx-auto">
                        <p className="text-sm sm:text-base">{error}</p>
                        <button
                            onClick={fetchProducts}
                            className="mt-2 text-xs sm:text-sm text-gold-400 underline hover:text-gold-300"
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
                        {/* Products Grid - Mobile Responsive */}
                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-12 sm:py-16 bg-black/30 backdrop-blur-sm rounded-2xl border border-gray-700 px-4">
                                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎆</div>
                                <p className="text-gray-300 text-sm sm:text-lg">No products found in this category.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
                    </>
                )}
            </div>

            {/* FIXED CART BUTTON - Mobile Optimized Bottom Right */}
            <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
                <button
                    onClick={() => setShowCart(true)}
                    className="relative group flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 hover:from-gold-300 hover:to-gold-500 shadow-2xl shadow-gold-500/40 hover:shadow-gold-500/60 transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-gold-300/30"
                    aria-label="Open Cart"
                >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>

                    <span className="absolute inset-0 rounded-full border-2 border-[#FFD700]/50 animate-ping-slow" />

                    {getTotalItems() > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[22px] sm:min-w-[26px] h-[22px] sm:h-[26px] px-1.5 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full shadow-lg shadow-red-500/50 border-2 border-white">
                            {getTotalItems() > 99 ? '99+' : getTotalItems()}
                        </span>
                    )}

                    {/* Tooltip - Hidden on mobile */}
                    <span className="hidden sm:block absolute -top-10 right-0 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap border border-gray-700 shadow-xl">
                        {getTotalItems() > 0 ? `${getTotalItems()} items in cart` : 'Cart is empty'}
                    </span>
                </button>

                <div className="text-center mt-1.5 sm:mt-2">
                    <span className="text-[8px] sm:text-[10px] font-medium text-gray-400 tracking-wider uppercase bg-black/60 backdrop-blur-sm px-2 sm:px-3 py-0.5 rounded-full border border-gray-700">
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

            {/* Product Detail Modal - Mobile Optimized */}
            {showProductModal && viewingProduct && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 sm:p-4"
                    onClick={handleModalOverlayClick}
                >
                    <div className="bg-gray-900 rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gold-500/20 shadow-2xl shadow-gold-500/10">
                        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
                            {/* Modal Header - Mobile Optimized */}
                            <div className="flex justify-between items-start mb-4 sm:mb-6">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white truncate">
                                            {viewingProduct.name}
                                        </h3>
                                        <span className={`text-[10px] sm:text-xs font-medium border rounded-full px-2 sm:px-3 py-0.5 sm:py-1 flex-shrink-0 ${getCategoryColor(viewingProduct.category)}`}>
                                            {viewingProduct.category}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-white transition-colors p-1.5 sm:p-2 hover:bg-gray-800 rounded-full flex-shrink-0 ml-2"
                                >
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                                {/* Image Gallery - Mobile Optimized */}
                                <div>
                                    <div 
                                        className="relative bg-gray-800 rounded-lg sm:rounded-xl overflow-hidden touch-none"
                                        style={{ height: isMobile ? '250px' : '300px' }}
                                        onTouchStart={handleTouchStart}
                                        onTouchMove={handleTouchMove}
                                        onTouchEnd={handleTouchEnd}
                                    >
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
                                                <span className="text-4xl sm:text-6xl">🎆</span>
                                            </div>
                                        )}
                                        
                                        {viewingProduct.images && viewingProduct.images.length > 1 && (
                                            <>
                                                <button
                                                    onClick={previousImage}
                                                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 p-1.5 sm:p-2 rounded-full transition-colors text-white"
                                                >
                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={nextImage}
                                                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 p-1.5 sm:p-2 rounded-full transition-colors text-white"
                                                >
                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                                <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-1.5">
                                                    {viewingProduct.images.map((_, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setSelectedImageIndex(idx)}
                                                            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                                                                selectedImageIndex === idx
                                                                    ? 'bg-gold-400 w-4 sm:w-6'
                                                                    : 'bg-gray-500 hover:bg-gray-300'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                {/* Swipe indicator for mobile */}
                                                {isMobile && viewingProduct.images.length > 1 && (
                                                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-[8px] text-gray-300">
                                                        {selectedImageIndex + 1}/{viewingProduct.images.length}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Thumbnails - Mobile Optimized */}
                                    {viewingProduct.images && viewingProduct.images.length > 1 && (
                                        <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3 overflow-x-auto pb-2 scrollbar-hide [-webkit-overflow-scrolling:touch]">
                                            {viewingProduct.images.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedImageIndex(idx)}
                                                    className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all ${
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

                                {/* Product Details - Mobile Optimized */}
                                <div className="space-y-3 sm:space-y-4 md:space-y-5">
                                    {/* Description */}
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">Description</h4>
                                        <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                                            {viewingProduct.description || 'No description available for this product.'}
                                        </p>
                                    </div>

                                    {/* Price */}
                                    <div className="bg-gray-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
                                        <div className="flex flex-col items-center">
                                            <p className="text-xs sm:text-sm text-gray-400 mb-0.5 sm:mb-1">Price</p>
                                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
                                                <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                                                    {formatCurrency(viewingProduct.discountedPrice || viewingProduct.price)}
                                                </span>
                                                {viewingProduct.discount > 0 && (
                                                    <>
                                                        <span className="text-xs sm:text-sm text-gray-500 line-through">
                                                            {formatCurrency(viewingProduct.price)}
                                                        </span>
                                                        <span className="text-[10px] sm:text-xs font-bold text-green-400 bg-green-400/10 px-1.5 sm:px-2 py-0.5 rounded-full border border-green-400/20">
                                                            {viewingProduct.discount}% OFF
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Add to Cart / Quantity Selector - Mobile Optimized */}
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
                                                    <div className="flex items-center gap-2 sm:gap-3 bg-gray-800 rounded-lg sm:rounded-xl border border-gold-500/30 p-1.5 sm:p-2 w-full max-w-[200px] sm:max-w-[240px]">
                                                        <button
                                                            onClick={() => {
                                                                if (currentQuantity === 1) {
                                                                    updateQuantity(viewingProduct.id, 0);
                                                                } else {
                                                                    updateQuantity(viewingProduct.id, currentQuantity - 1);
                                                                }
                                                            }}
                                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition-all duration-200 flex items-center justify-center text-lg sm:text-xl hover:scale-105 active:scale-95 flex-shrink-0"
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
                                                            className="w-14 sm:w-20 h-10 sm:h-12 bg-transparent text-center text-white font-medium text-base sm:text-xl border-0 focus:outline-none focus:ring-1 focus:ring-gold-500 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                        
                                                        <button
                                                            onClick={() => {
                                                                updateQuantity(viewingProduct.id, currentQuantity + 1);
                                                            }}
                                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition-all duration-200 flex items-center justify-center text-lg sm:text-xl hover:scale-105 active:scale-95 flex-shrink-0"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <button 
                                                        className="w-full bg-gold-500 text-white font-semibold py-3 sm:py-3.5 rounded-lg sm:rounded-xl hover:bg-gold-600 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20 hover:scale-[1.02] active:scale-95 text-sm sm:text-base"
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

                                    {/* Product Features - Mobile Responsive */}
                                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3 pt-2 sm:pt-3">
                                        <div className="flex items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-400">
                                            <span className="text-gold-400 text-xs sm:text-sm">✓</span>
                                            <span className="hidden xs:inline">Premium Quality</span>
                                            <span className="inline xs:hidden">Quality</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-400">
                                            <span className="text-gold-400 text-xs sm:text-sm">✓</span>
                                            <span className="hidden xs:inline">Safe & Certified</span>
                                            <span className="inline xs:hidden">Safe</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-400">
                                            <span className="text-gold-400 text-xs sm:text-sm">✓</span>
                                            <span className="hidden xs:inline">Fast Delivery</span>
                                            <span className="inline xs:hidden">Delivery</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-400">
                                            <span className="text-gold-400 text-xs sm:text-sm">✓</span>
                                            <span className="hidden xs:inline">Best Price Guarantee</span>
                                            <span className="inline xs:hidden">Best Price</span>
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