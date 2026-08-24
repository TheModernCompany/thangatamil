// AdminPhotos.tsx - Mobile Optimized Version
import React, { useState, useEffect } from 'react';
import {
  FiUpload,
  FiTrash2,
  FiImage,
  FiSearch,
  FiX,
  FiCheck,
  FiRefreshCw,
  FiGrid,
  FiList,
  FiZoomIn,
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
  FiPlus
} from 'react-icons/fi';
import axios from 'axios';

// Types
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  discount: number;
  discountedPrice: number;
  description: string | null;
  isActive: boolean;
  images: string[];
  createdAt: string;
  updatedAt: string | null;
}

interface GalleryImage {
  id: string;
  url: string;
  productId: string;
  productName: string;
  isMain: boolean;
}

// Base URL for API
const API_BASE_URL = 'http://localhost:8000';

// Helper to get full image URL
const getFullImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/uploads')) {
    return `${API_BASE_URL}${url}`;
  }
  return `${API_BASE_URL}/uploads/products/${url}`;
};

const AdminPhotos: React.FC = () => {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [selectedImageForDelete, setSelectedImageForDelete] = useState<GalleryImage | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [selectedImageForView, setSelectedImageForView] = useState<GalleryImage | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Update gallery when product is selected
  useEffect(() => {
    if (selectedProduct) {
      updateGalleryImages(selectedProduct);
      // Close sidebar on mobile when product is selected
      setIsSidebarOpen(false);
    }
  }, [selectedProduct]);

  // Fetch all products
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/products`, {
        params: { limit: 1000 }
      });
      
      const productsWithImages = response.data.filter((p: Product) => 
        p.images && p.images.length > 0
      );
      setProducts(productsWithImages);
      
      if (productsWithImages.length > 0 && !selectedProduct) {
        setSelectedProduct(productsWithImages[0]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showNotification('error', 'Failed to fetch products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update gallery images from selected product
  const updateGalleryImages = (product: Product) => {
    const images = getProductImages(product);
    const galleryImgs: GalleryImage[] = images.map((url, index) => ({
      id: `${product.id}-${index}`,
      url: url,
      productId: product.id,
      productName: product.name,
      isMain: index === 0
    }));
    setGalleryImages(galleryImgs);
  };

  // Get product images array safely
  const getProductImages = (product: Product): string[] => {
    if (!product.images) return [];
    if (Array.isArray(product.images)) return product.images;
    if (typeof product.images === 'string') {
      try {
        return JSON.parse(product.images);
      } catch {
        return [];
      }
    }
    return [];
  };

  // Get product image count
  const getProductImageCount = (product: Product): number => {
    return getProductImages(product).length;
  };

  // Show notification
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle image selection for upload
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedImages(prev => [...prev, ...files]);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  // Remove image from upload list
  const removeImageFromUpload = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Upload images
  const uploadImages = async () => {
    if (!selectedProduct) {
      showNotification('error', 'Please select a product first.');
      return;
    }

    if (selectedImages.length === 0) {
      showNotification('info', 'No images selected.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      selectedImages.forEach(file => {
        formData.append('files', file);
      });

      const uploadResponse = await axios.post(`${API_BASE_URL}/api/products/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      const uploadedUrls: string[] = uploadResponse.data.urls;
      
      if (!uploadedUrls || uploadedUrls.length === 0) {
        showNotification('error', 'No images were uploaded successfully.');
        setIsUploading(false);
        return;
      }

      const currentProductResponse = await axios.get(`${API_BASE_URL}/api/products/${selectedProduct.id}`);
      const currentProduct = currentProductResponse.data;
      
      const existingImages = getProductImages(currentProduct);
      const updatedImages = [...existingImages, ...uploadedUrls];

      await axios.put(
        `${API_BASE_URL}/api/products/${selectedProduct.id}`,
        { 
          ...currentProduct,
          images: updatedImages 
        }
      );

      setSelectedImages([]);
      setImagePreviews([]);
      setShowUploadModal(false);
      
      await fetchProducts();
      
      const refreshedProduct = await axios.get(`${API_BASE_URL}/api/products/${selectedProduct.id}`);
      setSelectedProduct(refreshedProduct.data);

      showNotification('success', `Successfully uploaded ${uploadedUrls.length} image(s)`);

    } catch (error: any) {
      console.error('Error uploading images:', error);
      showNotification('error', `Failed to upload images: ${error.response?.data?.detail || 'Please try again.'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete image
  const deleteImage = async (image: GalleryImage) => {
    if (!image) return;
    
    setIsDeleting(true);
    
    try {
      await axios.delete(
        `${API_BASE_URL}/api/products/${image.productId}/images`,
        {
          params: { image_url: image.url }
        }
      );

      await fetchProducts();
      
      if (selectedProduct) {
        const refreshedProduct = await axios.get(`${API_BASE_URL}/api/products/${selectedProduct.id}`);
        setSelectedProduct(refreshedProduct.data);
      }

      setSelectedImageForDelete(null);
      showNotification('success', 'Image deleted successfully');

    } catch (error: any) {
      console.error('Error deleting image:', error);
      showNotification('error', `Failed to delete image: ${error.response?.data?.detail || 'Please try again.'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle image error
  const handleImageError = (url: string) => {
    setImageErrors(prev => new Set(prev).add(url));
  };

  // Get filename from URL
  const getFileName = (url: string): string => {
    const parts = url.split('/');
    return parts[parts.length - 1] || 'image';
  };

  // Filter products by search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render notification
  const renderNotification = () => {
    if (!notification) return null;
    
    const bgColors = {
      success: 'bg-green-900/80 border-green-500/50',
      error: 'bg-red-900/80 border-red-500/50',
      info: 'bg-blue-900/80 border-blue-500/50'
    };

    return (
      <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 p-4 rounded-xl border ${bgColors[notification.type]} backdrop-blur-sm shadow-xl max-w-md animate-slide-in`}>
        <div className="flex items-start gap-3">
          {notification.type === 'success' && <FiCheck className="mt-1 text-green-400 flex-shrink-0" />}
          {notification.type === 'error' && <FiX className="mt-1 text-red-400 flex-shrink-0" />}
          {notification.type === 'info' && <FiImage className="mt-1 text-blue-400 flex-shrink-0" />}
          <span className="text-white text-sm flex-1">{notification.message}</span>
          <button 
            onClick={() => setNotification(null)}
            className="ml-auto text-gray-400 hover:text-white flex-shrink-0 p-1"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Render upload modal - MOBILE OPTIMIZED
  const renderUploadModal = () => {
    if (!showUploadModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-6 border-b border-gray-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <FiUpload className="text-gold-400 flex-shrink-0" />
                <span>Upload Photos</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 line-clamp-1">
                {selectedProduct ? `Adding to: ${selectedProduct.name}` : 'Select a product first'}
              </p>
            </div>
            <button
              onClick={() => {
                setShowUploadModal(false);
                setSelectedImages([]);
                setImagePreviews([]);
              }}
              className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Upload Area */}
          <div className="p-4 sm:p-6">
            <div className="border-2 border-dashed border-gray-700 rounded-2xl p-4 sm:p-8 text-center hover:border-gold-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer block"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gold-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <FiUpload className="w-8 h-8 sm:w-10 sm:h-10 text-gold-400" />
                </div>
                <p className="text-white text-base sm:text-lg font-medium mb-2">Click to browse or drag & drop</p>
                <p className="text-gray-400 text-xs sm:text-sm">Supported formats: JPG, PNG, WEBP (Max 10MB each)</p>
              </label>
            </div>

            {/* Image Previews - MOBILE OPTIMIZED */}
            {imagePreviews.length > 0 && (
              <div className="mt-4 sm:mt-6">
                <h3 className="text-xs sm:text-sm font-medium text-gray-400 mb-3">
                  {imagePreviews.length} image(s) selected
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-xl border border-gray-700"
                      />
                      <button
                        onClick={() => removeImageFromUpload(index)}
                        className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 right-1 bg-black/60 backdrop-blur-sm rounded-lg px-1 py-0.5 sm:px-2 sm:py-1">
                        <p className="text-[10px] sm:text-xs text-white truncate">
                          {selectedImages[index]?.name || `Image ${index + 1}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer - MOBILE OPTIMIZED */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:p-6 border-t border-gray-800">
            <p className="text-xs sm:text-sm text-gray-400 order-2 sm:order-1">
              {selectedImages.length > 0 ? `${selectedImages.length} images ready to upload` : 'No images selected'}
            </p>
            <div className="flex gap-3 w-full sm:w-auto order-1 sm:order-2">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedImages([]);
                  setImagePreviews([]);
                }}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={uploadImages}
                disabled={isUploading || selectedImages.length === 0 || !selectedProduct}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-xl transition-all text-sm ${
                  isUploading || selectedImages.length === 0 || !selectedProduct
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gold-500 text-black hover:bg-gold-400 hover:scale-105'
                }`}
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⟳</span>
                    <span className="hidden sm:inline">Uploading...</span>
                    <span className="sm:hidden">Uploading</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1">
                    <FiUpload className="w-4 h-4 sm:hidden" />
                    <span className="hidden sm:inline">Upload Photos</span>
                    <span className="sm:hidden">Upload</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render delete confirmation - MOBILE OPTIMIZED
  const renderDeleteConfirmation = () => {
    if (!selectedImageForDelete) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 max-w-md w-full p-4 sm:p-6 mx-4">
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FiTrash2 className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Delete Image?</h3>
            <p className="text-gray-400 text-xs sm:text-sm mb-2">
              This image will be permanently removed from
            </p>
            <p className="text-white font-medium text-sm sm:text-base mb-4 sm:mb-6">"{selectedImageForDelete.productName}"</p>
            
            {selectedImageForDelete.isMain && (
              <p className="text-yellow-400 text-xs sm:text-sm bg-yellow-400/10 rounded-lg p-2 mb-4">
                ⚠️ This is the main image. Deleting it will remove the main image from the product.
              </p>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setSelectedImageForDelete(null)}
                disabled={isDeleting}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteImage(selectedImageForDelete)}
                disabled={isDeleting}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm`}
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    <span className="hidden sm:inline">Deleting...</span>
                    <span className="sm:hidden">Deleting</span>
                  </>
                ) : (
                  <>
                    <FiTrash2 className="w-4 h-4 sm:hidden" />
                    <span className="hidden sm:inline">Delete Image</span>
                    <span className="sm:hidden">Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render image detail view - MOBILE OPTIMIZED
  const renderImageView = () => {
    if (!selectedImageForView) return null;

    const fullUrl = getFullImageUrl(selectedImageForView.url);
    const hasError = imageErrors.has(fullUrl);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
        <div className="relative max-w-5xl w-full h-[95vh] sm:h-auto">
          <button
            onClick={() => setSelectedImageForView(null)}
            className="absolute -top-10 sm:-top-12 right-0 p-2 text-gray-400 hover:text-white transition-colors z-10"
          >
            <FiX className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden h-full flex flex-col">
            <div className="flex-1 min-h-0">
              {hasError ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                  <FiImage className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mb-3 sm:mb-4" />
                  <p className="text-gray-400 text-sm sm:text-base">Image unavailable</p>
                </div>
              ) : (
                <img
                  src={fullUrl}
                  alt={selectedImageForView.productName}
                  className="w-full h-full object-contain"
                  onError={() => handleImageError(fullUrl)}
                />
              )}
            </div>
            
            <div className="p-3 sm:p-4 border-t border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="w-full sm:w-auto">
                <p className="text-white font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
                  {selectedImageForView.productName}
                </p>
                <p className="text-xs sm:text-sm text-gray-400">
                  {selectedImageForView.isMain ? '⭐ Main Image' : `Image ${galleryImages.indexOf(selectedImageForView) + 1}`}
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    const imageToDelete = selectedImageForView;
                    setSelectedImageForView(null);
                    setSelectedImageForDelete(imageToDelete);
                  }}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-colors text-sm flex items-center justify-center gap-1"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
                <button
                  onClick={() => setSelectedImageForView(null)}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors text-sm flex items-center justify-center"
                >
                  <span className="hidden sm:inline">Close</span>
                  <span className="sm:hidden">✕</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render product sidebar - MOBILE OPTIMIZED (Drawer style)
  const renderProductSidebar = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold-400"></div>
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="text-center py-8 sm:py-12">
          <FiImage className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
          <p className="text-gray-400 text-sm sm:text-base">No products with images</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">Upload products first</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {filteredProducts.map(product => {
          const imageCount = getProductImageCount(product);
          const isSelected = selectedProduct?.id === product.id;
          const images = getProductImages(product);
          const firstImage = images.length > 0 ? getFullImageUrl(images[0]) : '';

          return (
            <button
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                isSelected
                  ? 'bg-gold-500/20 border-2 border-gold-500/50'
                  : 'hover:bg-gray-800/50 border-2 border-transparent'
              }`}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {firstImage ? (
                  <img
                    src={firstImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(firstImage)}
                  />
                ) : (
                  <FiImage className="text-gray-500 w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs sm:text-sm font-medium text-white truncate">{product.name}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 truncate">{product.category}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full ${
                  imageCount > 0 ? 'bg-gold-500/20 text-gold-400' : 'bg-gray-700 text-gray-400'
                }`}>
                  {imageCount}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  // Render gallery grid - MOBILE OPTIMIZED
  const renderGalleryGrid = () => {
    if (!selectedProduct) {
      return (
        <div className="flex flex-col items-center justify-center h-48 sm:h-64">
          <FiImage className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mb-3 sm:mb-4" />
          <p className="text-gray-400 text-sm sm:text-base">Select a product to view photos</p>
        </div>
      );
    }

    if (galleryImages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 sm:h-64 bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-700 p-4">
          <FiImage className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mb-3 sm:mb-4" />
          <p className="text-gray-400 text-sm sm:text-base mb-2 text-center">No photos uploaded yet</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-gold-500/20 text-gold-400 border border-gold-500/30 rounded-xl hover:bg-gold-500/30 transition-colors text-sm"
          >
            Upload Photos
          </button>
        </div>
      );
    }

    // Mobile: 2 columns, Tablet: 3 columns, Desktop: 4-5 columns
    return (
      <div className={`grid gap-3 sm:gap-4 ${
        viewMode === 'grid' 
          ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
          : 'grid-cols-1'
      }`}>
        {galleryImages.map((image, index) => {
          const fullUrl = getFullImageUrl(image.url);
          const hasError = imageErrors.has(fullUrl);

          return (
            <div
              key={image.id}
              className={`group relative bg-gray-800/50 rounded-2xl overflow-hidden border border-gray-700 hover:border-gold-500/50 transition-all cursor-pointer ${
                viewMode === 'list' ? 'aspect-[16/9]' : 'aspect-square'
              }`}
              onClick={() => setSelectedImageForView(image)}
            >
              <div className="w-full h-full">
                {hasError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                    <FiImage className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
                  </div>
                ) : (
                  <img
                    src={fullUrl}
                    alt={`${selectedProduct.name} - ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={() => handleImageError(fullUrl)}
                  />
                )}
              </div>
              
              {/* Overlay with delete button - Mobile optimized touch targets */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute top-2 right-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageForDelete(image);
                    }}
                    className="p-2.5 sm:p-2 bg-red-500/90 rounded-xl text-white hover:bg-red-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    disabled={isDeleting}
                  >
                    <FiTrash2 className="w-4 h-4 sm:w-4 sm:h-4" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1.5 sm:px-3 sm:py-2">
                    <p className="text-[10px] sm:text-xs text-white truncate">{getFileName(image.url)}</p>
                    {image.isMain && (
                      <span className="text-[10px] sm:text-xs text-gold-400">⭐ Main</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Main badge */}
              {image.isMain && (
                <div className="absolute top-2 left-2 px-2 py-0.5 sm:px-2 sm:py-1 bg-gold-500/90 text-black text-[10px] sm:text-xs font-medium rounded-lg">
                  Main
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-gray-900/80 rounded-2xl border border-gray-800 p-3 sm:p-4 md:p-6 text-white min-h-[600px]">
      {/* Notification */}
      {renderNotification()}

      {/* Delete Confirmation */}
      {renderDeleteConfirmation()}

      {/* Image View */}
      {renderImageView()}

      {/* Upload Modal */}
      {renderUploadModal()}

      {/* Header - MOBILE OPTIMIZED */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Mobile hamburger menu */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <FiMenu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gold-400 flex items-center gap-2 sm:gap-3">
              <FiImage className="w-5 h-5 sm:w-7 sm:h-7 flex-shrink-0" />
              <span className="hidden xs:inline">Photo Gallery</span>
              <span className="xs:hidden">Gallery</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5 hidden sm:block">Manage your product images</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {/* Search - Hide on very small screens, show as expandable */}
          <div className="relative flex-1 sm:w-48 min-w-[100px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs sm:text-sm text-white placeholder-gray-400 focus:outline-none focus:border-gold-500/50 transition-colors"
            />
          </div>

          {/* Action Buttons - Mobile optimized */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* View toggle - hidden on mobile */}
            <div className="hidden sm:flex rounded-xl overflow-hidden border border-gray-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid' ? 'bg-gold-500/20 text-gold-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <FiGrid className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list' ? 'bg-gold-500/20 text-gold-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <FiList className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Upload button */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gold-500 text-black rounded-xl hover:bg-gold-400 hover:scale-105 transition-all flex-shrink-0 text-xs sm:text-sm min-h-[36px] sm:min-h-[44px]"
            >
              <FiUpload className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-medium hidden xs:inline">Upload</span>
              <span className="xs:hidden">+</span>
            </button>

            {/* Refresh */}
            <button
              onClick={fetchProducts}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors flex-shrink-0 min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center"
            >
              <FiRefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Left Sidebar - MOBILE: Overlay Drawer */}
        <div className={`
          lg:w-80 xl:w-96 flex-shrink-0
          fixed lg:relative inset-0 lg:inset-auto z-40 lg:z-auto
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Backdrop */}
          <div 
            className={`lg:hidden fixed inset-0 bg-black/50 transition-opacity duration-300 ${
              isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsSidebarOpen(false)}
          />
          
          {/* Sidebar Content */}
          <div className="relative z-10 w-[280px] sm:w-[320px] h-full lg:h-auto bg-gray-900 lg:bg-transparent border-r lg:border-r-0 border-gray-800 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <h3 className="text-sm font-medium text-gray-400">Products</h3>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="hidden lg:flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400">Products</h3>
              <span className="text-xs text-gray-500">{products.length} products</span>
            </div>
            <div className="max-h-[calc(100vh-200px)] lg:max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {renderProductSidebar()}
            </div>
          </div>
        </div>

        {/* Right Content - Gallery */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-800/30 rounded-2xl border border-gray-700 p-3 sm:p-4">
            {/* Product Info - Mobile optimized */}
            {selectedProduct && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-700">
                <div className="w-full sm:w-auto">
                  <h3 className="text-base sm:text-lg font-semibold text-white truncate max-w-[200px] sm:max-w-none">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {selectedProduct.category} • {galleryImages.length} photos
                  </p>
                </div>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gold-500/20 text-gold-400 border border-gold-500/30 rounded-xl hover:bg-gold-500/30 transition-colors w-full sm:w-auto justify-center text-xs sm:text-sm min-h-[36px] sm:min-h-[44px]"
                >
                  <FiUpload className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Add Photos</span>
                  <span className="xs:hidden">Add</span>
                </button>
              </div>
            )}

            {/* Gallery */}
            <div className="min-h-[200px] sm:min-h-[300px]">
              {renderGalleryGrid()}
            </div>

            {/* Mobile view toggle - shown on small screens */}
            <div className="flex sm:hidden justify-center mt-4 gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-xl text-sm ${
                  viewMode === 'grid' 
                    ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' 
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-xl text-sm ${
                  viewMode === 'list' 
                    ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' 
                    : 'bg-gray-800 text-gray-400'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 215, 0, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 215, 0, 0.5);
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        /* Utility for extra small screens */
        @media (min-width: 480px) {
          .xs\\:inline {
            display: inline;
          }
          .xs\\:hidden {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPhotos;