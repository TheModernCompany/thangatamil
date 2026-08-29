// src/pages/Admin/AdminProducts.tsx
import React, { useState, useRef, useEffect } from 'react';

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

// Icon components (enhanced with premium styling)
const EditIcon = () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const DeleteIcon = () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const ActiveIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const InactiveIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ViewIcon = () => (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const CloseIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
    </div>
);

// Category options
const CATEGORIES = [
    'FLOWERPOTS',
    'ROCKETS',
    'SPARKLERS',
    'GROUND',
    'ATOM BOMBSKID\'S SPECIAL',
    'CHAKKARS'
];

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

interface ProductFormData {
    name: string;
    category: string;
    price: number;
    discount: number;
    discountedPrice: number;
    images: string[];
    description: string;
    isActive: boolean;
}

const AdminProducts: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        category: '',
        price: 0,
        discount: 0,
        discountedPrice: 0,
        images: [],
        description: '',
        isActive: true
    });
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [uploadingImages, setUploadingImages] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch products on component mount
    useEffect(() => {
        fetchProducts();
    }, []);

    // Fetch products from API
    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/products`);
            if (!response.ok) {
                throw new Error(`Failed to fetch products: ${response.status}`);
            }
            const data = await response.json();
            setProducts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch products');
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch products with filters
    const fetchProductsWithFilters = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (selectedCategory) params.append('category', selectedCategory);

            const response = await fetch(`${API_URL}/products?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch products: ${response.status}`);
            }
            const data = await response.json();
            setProducts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch products');
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    // Upload images to server
    const uploadImagesToServer = async (files: FileList): Promise<string[]> => {
        setUploadingImages(true);
        try {
            const formData = new FormData();
            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    formData.append('files', file);
                }
            });

            const response = await fetch(`${API_URL}/products/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Failed to upload images: ${response.status}`);
            }

            const data = await response.json();
            return data.urls || [];
        } catch (err) {
            console.error('Error uploading images:', err);
            throw err;
        } finally {
            setUploadingImages(false);
        }
    };

    // Create product
    const createProduct = async (productData: Omit<Product, 'id'>) => {
        try {
            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Failed to create product: ${response.status}`);
            }

            const newProduct = await response.json();
            setProducts(prev => [newProduct, ...prev]);
            return newProduct;
        } catch (err) {
            console.error('Error creating product:', err);
            throw err;
        }
    };

    // Update product
    const updateProduct = async (id: string, productData: Partial<Product>) => {
        try {
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
            });

            if (!response.ok) {
                throw new Error(`Failed to update product: ${response.status}`);
            }

            const updatedProduct = await response.json();
            setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
            return updatedProduct;
        } catch (err) {
            console.error('Error updating product:', err);
            throw err;
        }
    };

    // Delete product
    const deleteProduct = async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`Failed to delete product: ${response.status}`);
            }

            setProducts(prev => prev.filter(p => p.id !== id));
            return true;
        } catch (err) {
            console.error('Error deleting product:', err);
            throw err;
        }
    };

    // Toggle product active status
    const toggleProductStatus = async (id: string, isActive: boolean) => {
        try {
            const response = await fetch(`${API_URL}/products/${id}/status?is_active=${isActive}`, {
                method: 'PATCH',
            });

            if (!response.ok) {
                throw new Error(`Failed to update product status: ${response.status}`);
            }

            const result = await response.json();
            setProducts(prev => prev.map(p =>
                p.id === id ? { ...p, isActive: result.isActive } : p
            ));
            return result;
        } catch (err) {
            console.error('Error updating product status:', err);
            throw err;
        }
    };

    const calculateDiscountedPrice = (price: number, discount: number) => {
        return price - (price * discount / 100);
    };

    // FIXED: Properly handle input changes with type safety
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        // Handle checkbox separately
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
            return;
        }

        // Parse number values
        let parsedValue: string | number = value;
        if (type === 'number') {
            parsedValue = value === '' ? 0 : parseFloat(value);
        }

        setFormData(prev => {
            const updated = { ...prev, [name]: parsedValue };

            // FIXED: Recalculate discounted price when price or discount changes
            if (name === 'price' || name === 'discount') {
                const price = name === 'price' ? (parsedValue as number) : prev.price;
                const discount = name === 'discount' ? (parsedValue as number) : prev.discount;
                updated.discountedPrice = calculateDiscountedPrice(price, discount);
            }

            return updated;
        });
    };

    const handleImageUpload = async (files: FileList) => {
        if (!files || files.length === 0) return;

        try {
            const uploadedUrls = await uploadImagesToServer(files);

            // Update preview and form data
            setPreviewImages(prev => [...prev, ...uploadedUrls]);
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...uploadedUrls]
            }));
        } catch (err) {
            alert('Failed to upload images. Please try again.');
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files) {
            handleImageUpload(e.dataTransfer.files);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleImageUpload(e.target.files);
        }
    };

    const removeImage = (index: number) => {
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.images.length === 0) {
            alert('Please upload at least one product image');
            return;
        }

        try {
            const productData = {
                name: formData.name,
                category: formData.category,
                price: formData.price,
                discount: formData.discount,
                description: formData.description,
                isActive: formData.isActive,
                images: formData.images,
            };

            if (editingProduct) {
                await updateProduct(editingProduct.id, productData);
            } else {
                await createProduct(productData);
            }

            resetForm();
            setShowModal(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to save product');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            category: '',
            price: 0,
            discount: 0,
            discountedPrice: 0,
            images: [],
            description: '',
            isActive: true
        });
        setPreviewImages([]);
        setEditingProduct(null);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            category: product.category,
            price: product.price,
            discount: product.discount,
            discountedPrice: product.discountedPrice,
            images: product.images,
            description: product.description,
            isActive: product.isActive
        });
        setPreviewImages(product.images);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteProduct(id);
            } catch (err) {
                alert('Failed to delete product');
            }
        }
    };

    const toggleActive = async (id: string) => {
        const product = products.find(p => p.id === id);
        if (product) {
            try {
                await toggleProductStatus(id, !product.isActive);
            } catch (err) {
                alert('Failed to update product status');
            }
        }
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const handleView = (product: Product) => {
        setViewingProduct(product);
        setSelectedImageIndex(0);
        setShowViewModal(true);
    };

    const nextImage = () => {
        if (viewingProduct) {
            setSelectedImageIndex((prev) => (prev + 1) % viewingProduct.images.length);
        }
    };

    const previousImage = () => {
        if (viewingProduct) {
            setSelectedImageIndex((prev) => (prev - 1 + viewingProduct.images.length) % viewingProduct.images.length);
        }
    };

    // Handle search with debounce
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (searchTerm || selectedCategory) {
                fetchProductsWithFilters();
            } else {
                fetchProducts();
            }
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm, selectedCategory]);

    // Format currency in INR
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Get category color (premium theme)
    const getCategoryColor = (category: string) => {
        const colors: { [key: string]: string } = {
            'FLOWERPOTS': 'bg-green-500/20 text-green-400 border-green-500/30',
            'ROCKETS': 'bg-red-500/20 text-red-400 border-red-500/30',
            'SPARKLERS': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'GROUND': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            'ATOM BOMBSKID\'S SPECIAL': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            'CHAKKARS': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
        };
        return colors[category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    // Product Card Component for Mobile View
    const ProductCard = ({ product }: { product: Product }) => (
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 space-y-3 hover:border-gold-500/30 transition-all">
            {/* Product Images */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images && product.images.slice(0, 4).map((img, idx) => (
                    <img
                        key={idx}
                        src={getImageUrl(img)}
                        alt={`${product.name} ${idx + 1}`}
                        className="w-16 h-16 rounded-lg object-cover border border-gray-700 flex-shrink-0"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64/gray?text=No+Image';
                        }}
                    />
                ))}
                {product.images && product.images.length > 4 && (
                    <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                        +{product.images.length - 4}
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div>
                <h4 className="text-white font-medium text-base">{product.name}</h4>
                <p className="text-gray-400 text-xs line-clamp-2">{product.description}</p>
            </div>

            {/* Category & Status */}
            <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-0.5 text-xs rounded-full border ${getCategoryColor(product.category)}`}>
                    {product.category}
                </span>
                <button
                    onClick={() => toggleActive(product.id)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 border ${
                        product.isActive
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}
                >
                    {product.isActive ? <ActiveIcon /> : <InactiveIcon />}
                    {product.isActive ? 'Active' : 'Inactive'}
                </button>
            </div>

            {/* Price Section */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-800">
                <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="text-white font-bold">{formatCurrency(product.price)}</p>
                </div>
                {product.discount > 0 && (
                    <>
                        <div>
                            <p className="text-xs text-gray-500">Discount</p>
                            <p className="text-green-400 font-medium">{product.discount}%</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Disc. Price</p>
                            <p className="text-amber-400 font-bold">{formatCurrency(product.discountedPrice)}</p>
                        </div>
                    </>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                    onClick={() => handleView(product)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    title="View Details"
                >
                    <ViewIcon />
                </button>
                <button
                    onClick={() => handleEdit(product)}
                    className="p-2 text-amber-400 hover:text-gold-300 hover:bg-gold-500/20 rounded-lg transition-colors"
                    title="Edit"
                >
                    <EditIcon />
                </button>
                <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Delete"
                >
                    <DeleteIcon />
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black py-6 px-3 sm:py-8 sm:px-4 md:px-8 relative">
            {/* Premium Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-gradient-to-b from-black via-gray-900/30 to-black" />
                <div className="absolute top-0 left-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Header with Add Button */}
                <div className="text-center mb-6 sm:mb-10">
                    <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 mb-3 sm:mb-4">
                        <span className="text-[10px] sm:text-xs font-medium text-gold-400 uppercase tracking-wider">Admin Panel</span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                                <span className="text-gold-400">Products</span> Management
                            </h1>
                            <div className="mt-2 sm:mt-3 flex justify-center sm:justify-start">
                                <div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent rounded-full" />
                            </div>
                            <p className="text-gray-400 mt-2 sm:mt-4 max-w-2xl text-xs sm:text-sm">
                                Manage your product catalog. Add, edit, and organize products with ease.
                            </p>
                        </div>
                        {/* ADD PRODUCT BUTTON - Responsive */}
                        <button
                            onClick={openAddModal}
                            className="bg-amber-400 text-black px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-xl hover:bg-gold-400 transition-all duration-300 flex items-center gap-2 sm:gap-3 font-bold text-sm sm:text-base hover:scale-105 active:scale-95 shadow-lg shadow-gold-500/20 flex-shrink-0 w-full sm:w-auto justify-center"
                        >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add New Product
                        </button>
                    </div>
                </div>

                {/* Stats - Responsive Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-8">
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-2 sm:p-3 text-center">
                        <p className="text-lg sm:text-xl font-bold text-white">{products.length}</p>
                        <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase tracking-wider">Total Products</p>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-2 sm:p-3 text-center">
                        <p className="text-lg sm:text-xl font-bold text-green-400">
                            {products.filter(p => p.isActive).length}
                        </p>
                        <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase tracking-wider">Active</p>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-2 sm:p-3 text-center">
                        <p className="text-lg sm:text-xl font-bold text-red-400">
                            {products.filter(p => !p.isActive).length}
                        </p>
                        <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase tracking-wider">Inactive</p>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-2 sm:p-3 text-center">
                        <p className="text-lg sm:text-xl font-bold text-white">
                            {new Set(products.map(p => p.category)).size}
                        </p>
                        <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase tracking-wider">Categories</p>
                    </div>
                </div>

                {/* Search and Filter Section - Responsive */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all text-sm sm:text-base"
                        />
                    </div>
                    <div className="sm:w-48">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all text-sm sm:text-base"
                        >
                            <option value="">All Categories</option>
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={fetchProducts}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-900/30 border border-red-500 text-red-300 rounded-xl text-center max-w-lg mx-auto">
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
                        {/* Desktop Table View - Hidden on mobile */}
                        <div className="hidden lg:block bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px]">
                                    <thead className="bg-gray-800/80 border-b border-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Product</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Discount</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Disc. Price</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Images</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {products.map((product) => (
                                            <tr key={product.id} className="hover:bg-gray-800/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <div className="text-sm font-medium text-white">{product.name}</div>
                                                        <div className="text-xs text-gray-500 truncate max-w-[150px]">{product.description}</div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2.5 py-1 text-xs rounded-full border ${getCategoryColor(product.category)}`}>
                                                        {product.category}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-300">{formatCurrency(product.price)}</td>
                                                <td className="px-4 py-3 text-sm text-white">{product.discount}%</td>
                                                <td className="px-4 py-3 text-sm font-bold text-white">
                                                    {formatCurrency(product.discountedPrice)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1 flex-wrap">
                                                        {product.images && product.images.slice(0, 3).map((img, idx) => (
                                                            <img
                                                                key={idx}
                                                                src={getImageUrl(img)}
                                                                alt={`${product.name} ${idx + 1}`}
                                                                className="w-8 h-8 rounded object-cover border border-gray-700"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40/gray?text=No+Image';
                                                                }}
                                                            />
                                                        ))}
                                                        {product.images && product.images.length > 3 && (
                                                            <span className="text-xs text-gray-500 flex items-center">
                                                                +{product.images.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => toggleActive(product.id)}
                                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 border ${
                                                            product.isActive
                                                                ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
                                                                : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                                                        }`}
                                                    >
                                                        {product.isActive ? <ActiveIcon /> : <InactiveIcon />}
                                                        {product.isActive ? 'Active' : 'Inactive'}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleView(product)}
                                                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <ViewIcon />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(product)}
                                                            className="p-2 text-amber-400 hover:text-gold-300 hover:bg-gold-500/20 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <EditIcon />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <DeleteIcon />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile/Tablet Card View - Hidden on desktop */}
                        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {/* Empty State */}
                        {products.length === 0 && !loading && (
                            <div className="text-center py-12 sm:py-16">
                                <div className="text-5xl sm:text-6xl mb-4">📦</div>
                                <p className="text-gray-400 text-base sm:text-lg">No products found</p>
                                <p className="text-gray-500 text-xs sm:text-sm mt-2">Try adjusting your search or filters</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* View Product Modal - Responsive */}
            {showViewModal && viewingProduct && (
                <>
                    <div
                        className="fixed inset-0 bg-black/80 z-50 transition-opacity duration-300"
                        onClick={() => setShowViewModal(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
                        <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gold-500/20 shadow-2xl shadow-gold-500/10">
                            <div className="p-4 sm:p-6 md:p-8">
                                <div className="flex justify-between items-start mb-4 sm:mb-6">
                                    <div>
                                        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{viewingProduct.name}</h3>
                                        <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
                                            <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs rounded-full border ${getCategoryColor(viewingProduct.category)}`}>
                                                {viewingProduct.category}
                                            </span>
                                            <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs rounded-full border ${
                                                viewingProduct.isActive
                                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                                            }`}>
                                                {viewingProduct.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowViewModal(false)}
                                        className="text-gray-400 hover:text-white p-1.5 sm:p-2 hover:bg-gray-800 rounded-full transition-colors"
                                    >
                                        <CloseIcon />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4">
                                    {/* Image Gallery */}
                                    <div>
                                        <div className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ height: '250px' }}>
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
                                                    No Image Available
                                                </div>
                                            )}
                                            {viewingProduct.images && viewingProduct.images.length > 1 && (
                                                <>
                                                    <button
                                                        onClick={previousImage}
                                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 p-1.5 sm:p-2 rounded-full shadow-md transition-colors text-white"
                                                    >
                                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={nextImage}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 p-1.5 sm:p-2 rounded-full shadow-md transition-colors text-white"
                                                    >
                                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Thumbnail Navigation */}
                                        {viewingProduct.images && viewingProduct.images.length > 1 && (
                                            <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3 overflow-x-auto pb-2">
                                                {viewingProduct.images.map((img, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedImageIndex(idx)}
                                                        className={`flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                                                            selectedImageIndex === idx
                                                                ? 'border-gold-500'
                                                                : 'border-transparent hover:border-gold-500/50'
                                                        }`}
                                                    >
                                                        <img
                                                            src={getImageUrl(img)}
                                                            alt={`Thumbnail ${idx + 1}`}
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
                                    <div className="space-y-3 sm:space-y-4">
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Description</h4>
                                            <p className="text-sm text-gray-300 whitespace-pre-line">{viewingProduct.description}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                            <div>
                                                <h4 className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Price</h4>
                                                <p className="text-base sm:text-lg font-bold text-white">{formatCurrency(viewingProduct.price)}</p>
                                            </div>
                                            {viewingProduct.discount > 0 && (
                                                <>
                                                    <div>
                                                        <h4 className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Discount</h4>
                                                        <p className="text-sm text-green-400 font-medium">{viewingProduct.discount}% OFF</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <h4 className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">Discounted Price</h4>
                                                        <p className="text-lg sm:text-xl font-bold text-amber-400">{formatCurrency(viewingProduct.discountedPrice)}</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-800">
                                            <button
                                                onClick={() => {
                                                    setShowViewModal(false);
                                                    handleEdit(viewingProduct);
                                                }}
                                                className="flex-1 px-4 py-2.5 bg-white text-black rounded-xl hover:bg-gold-400 transition-all duration-300 font-medium text-sm hover:scale-105 active:scale-95"
                                            >
                                                Edit Product
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowViewModal(false);
                                                    handleDelete(viewingProduct.id);
                                                }}
                                                className="flex-1 px-4 py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all duration-300 font-medium text-sm"
                                            >
                                                Delete Product
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Add/Edit Product Modal - Responsive */}
            {showModal && (
                <>
                    <div
                        className="fixed inset-0 bg-black/80 z-50 transition-opacity duration-300"
                        onClick={() => {
                            resetForm();
                            setShowModal(false);
                        }}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
                        <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border border-gold-500/20 shadow-2xl shadow-gold-500/10">
                            <div className="p-4 sm:p-6 md:p-8">
                                <div className="flex justify-between items-center mb-4 sm:mb-6">
                                    <h3 className="text-xl sm:text-2xl font-bold text-white">
                                        {editingProduct ? 'Edit Product' : 'Add New Product'}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            resetForm();
                                            setShowModal(false);
                                        }}
                                        className="text-gray-400 hover:text-white p-1.5 sm:p-2 hover:bg-gray-800 rounded-full transition-colors"
                                    >
                                        <CloseIcon />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider mb-1 sm:mb-1.5">
                                                Product Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all text-sm sm:text-base"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider mb-1 sm:mb-1.5">
                                                Category *
                                            </label>
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all text-sm sm:text-base"
                                            >
                                                <option value="">Select Category</option>
                                                {CATEGORIES.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider mb-1 sm:mb-1.5">
                                                Price (₹) *
                                            </label>
                                            <input
                                                type="text"
                                                name="price"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                required
                                                min="0"
                                                step="0.01"
                                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all text-sm sm:text-base"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider mb-1 sm:mb-1.5">
                                                Discount (%)
                                            </label>
                                            <input
                                                type="text"
                                                name="discount"
                                                value={formData.discount}
                                                onChange={handleInputChange}
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all text-sm sm:text-base"
                                            />
                                            {formData.discount > 0 && (
                                                <p className="text-xs text-green-400 mt-1">
                                                    Discounted Price: {formatCurrency(formData.discountedPrice)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Image Upload Section */}
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider mb-1.5 sm:mb-2">
                                            Product Images *
                                        </label>

                                        {/* Drag & Drop Area */}
                                        <div
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-colors ${
                                                isDragging
                                                    ? 'border-gold-500 bg-gold-500/10'
                                                    : 'border-gray-700 hover:border-gold-500/50 bg-gray-800/50'
                                            }`}
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileSelect}
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                            />

                                            <div className="space-y-1.5 sm:space-y-2">
                                                <svg
                                                    className="mx-auto h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gold-400/50"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    />
                                                </svg>
                                                <div className="text-xs sm:text-sm text-gray-400">
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="text-gold-400 hover:text-gold-300 font-medium"
                                                    >
                                                        Click to upload
                                                    </button>
                                                    {' or drag and drop'}
                                                </div>
                                                <p className="text-[10px] sm:text-xs text-gray-500">
                                                    PNG, JPG, GIF up to 10MB each (Multiple files supported)
                                                </p>
                                            </div>
                                        </div>

                                        {/* Uploading Indicator */}
                                        {uploadingImages && (
                                            <div className="mt-2 text-xs sm:text-sm text-gold-400 flex items-center">
                                                <span className="animate-spin mr-2">⟳</span>
                                                Uploading images...
                                            </div>
                                        )}

                                        {/* Image Previews */}
                                        {previewImages.length > 0 && (
                                            <div className="mt-2 sm:mt-3">
                                                <p className="text-xs sm:text-sm text-gray-400 mb-1.5 sm:mb-2">
                                                    {previewImages.length} image(s) selected
                                                </p>
                                                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                                                    {previewImages.map((img, index) => (
                                                        <div key={index} className="relative group">
                                                            <img
                                                                src={getImageUrl(img)}
                                                                alt={`Preview ${index + 1}`}
                                                                className="w-full h-16 sm:h-20 object-cover rounded-lg border border-gray-700"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80/gray?text=No+Image';
                                                                }}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeImage(index)}
                                                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider mb-1 sm:mb-1.5">
                                            Product Description
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all text-sm sm:text-base"
                                            placeholder="Enter product description..."
                                        />
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 text-gold-500 border-gray-700 rounded focus:ring-gold-500/20 bg-gray-800"
                                        />
                                        <label className="ml-2 text-xs sm:text-sm text-gray-400">
                                            Active (visible to customers)
                                        </label>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-800">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                resetForm();
                                                setShowModal(false);
                                            }}
                                            className="px-4 sm:px-6 py-2 sm:py-2.5 text-gray-400 hover:text-white font-medium order-2 sm:order-1 text-sm sm:text-base"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={uploadingImages}
                                            className={`px-6 sm:px-8 py-2 sm:py-2.5 bg-amber-400 text-black rounded-xl hover:bg-gold-400 transition-all duration-300 font-medium order-1 sm:order-2 hover:scale-105 active:scale-95 text-sm sm:text-base ${
                                                uploadingImages ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        >
                                            {editingProduct ? 'Update Product' : 'Add Product'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminProducts;