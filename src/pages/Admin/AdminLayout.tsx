// AdminLayout.tsx - Enhanced Brand Management with proper image handling
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiHome, 
  FiPackage, 
  FiShoppingBag,
  FiPhone, 
  FiCreditCard, 
  FiBell,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiImage,
  FiClipboard,
  FiUsers,
  FiGrid,
  FiSliders,
  FiCheckCircle,
  FiXCircle,
  FiUpload,
  FiTrash2,
  FiEdit2,
  FiRefreshCw,
  FiPlus,
  FiEye,
  FiEyeOff,
  FiSave,
  FiX,
  FiArrowUp,
  FiArrowDown,
  FiStar,
  FiToggleLeft,
  FiToggleRight
} from 'react-icons/fi';
import AdminDashboard from './AdminDashboard';
import AdminProducts from './AdminProducts';
import AdminOrders from './AdminUsers';
import AdminContact from './AdminContact';
import AdminBilling from './AdminBilling';
import AdminPhotos from './AdminPhotos';
import AdminRegister from './AdminRegister';
import AdminRecords from './AdminRecords';

// API Base URL
const API_BASE_URL = '';

// Brand Interface
interface Brand {
  id: string;
  name: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

// Scrolling Ad Interface
interface ScrollingAd {
  id: string;
  text: string;
  speed: string;
  isActive: boolean;
  displayOrder: number;
  highlight: boolean;
  createdAt: string;
  updatedAt: string | null;
}

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  // Brand Management States
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandFormData, setBrandFormData] = useState({ name: '', imageUrl: '', displayOrder: 0 });
  const [brandImageFile, setBrandImageFile] = useState<File | null>(null);
  const [brandImagePreview, setBrandImagePreview] = useState<string>('');
  const [uploadingBrandImage, setUploadingBrandImage] = useState(false);
  const [selectedBrandsForBulk, setSelectedBrandsForBulk] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingBrandId, setDeletingBrandId] = useState<string | null>(null);

  // Scrolling Ads States
  const [ads, setAds] = useState<ScrollingAd[]>([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [newAdText, setNewAdText] = useState('');
  const [newAdSpeed, setNewAdSpeed] = useState('normal');
  const [newAdHighlight, setNewAdHighlight] = useState(false);
  const [isScrolling, setIsScrolling] = useState(true);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [editingAd, setEditingAd] = useState<ScrollingAd | null>(null);
  const [showAdEditModal, setShowAdEditModal] = useState(false);
  const [selectedAdsForBulk, setSelectedAdsForBulk] = useState<string[]>([]);
  const [deletingAdId, setDeletingAdId] = useState<string | null>(null);

  const navItems = [
    { id: 'dashboard', icon: FiHome, label: 'Dashboard' },
    { id: 'products', icon: FiPackage, label: 'Products' },
    { id: 'orders', icon: FiShoppingBag, label: 'Orders' },
    { id: 'register', icon: FiUsers, label: 'Register' },
    { id: 'brandlogo', icon: FiGrid, label: 'Brand Logo' },
    { id: 'scrollingads', icon: FiSliders, label: 'Scrolling Ads' },
    { id: 'contact', icon: FiPhone, label: 'Contact' },
    { id: 'billing', icon: FiCreditCard, label: 'Billing' },
    { id: 'photos', icon: FiImage, label: 'Photos' },
    { id: 'records', icon: FiClipboard, label: 'Registers' },
  ];

  // ============ Brand Management Functions ============

  // Fetch brands
  const fetchBrands = async () => {
    setBrandsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/brands`);
      setBrands(response.data);
    } catch (error) {
      console.error('Error fetching brands:', error);
      showNotification('error', 'Failed to fetch brands');
    } finally {
      setBrandsLoading(false);
    }
  };

  // Load brands on mount
  useEffect(() => {
    fetchBrands();
  }, []);

  // Get full image URL
  const getFullBrandImageUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/uploads')) {
      return `${API_BASE_URL}${url}`;
    }
    return `${API_BASE_URL}/uploads/products/${url}`;
  };

  // Handle brand image selection
  const handleBrandImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        showNotification('error', 'Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'Image size must be less than 5MB');
        return;
      }
      
      setBrandImageFile(file);
      setBrandImagePreview(URL.createObjectURL(file));
      showNotification('info', `Selected: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
    }
  };

  // Upload brand image with progress
  const uploadBrandImage = async (file: File): Promise<string> => {
    setUploadingBrandImage(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('files', file);
      
      const response = await axios.post(`${API_BASE_URL}/api/products/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });
      
      if (response.data.urls && response.data.urls.length > 0) {
        setUploadProgress(100);
        return response.data.urls[0];
      }
      throw new Error('No image URL returned');
    } catch (error) {
      console.error('Error uploading brand image:', error);
      throw error;
    } finally {
      setUploadingBrandImage(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  // Create brand
  const handleCreateBrand = async () => {
    if (!brandFormData.name.trim()) {
      showNotification('error', 'Brand name is required');
      return;
    }

    try {
      let imageUrl = brandFormData.imageUrl;
      
      if (brandImageFile) {
        imageUrl = await uploadBrandImage(brandImageFile);
      }
      
      if (!imageUrl) {
        showNotification('error', 'Please select an image for the brand');
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/api/brands`, {
        name: brandFormData.name.trim(),
        imageUrl: imageUrl,
        displayOrder: brandFormData.displayOrder || 0,
        isActive: true
      });

      await fetchBrands();
      setShowBrandModal(false);
      resetBrandForm();
      showNotification('success', `Brand "${brandFormData.name}" created successfully! It will appear on the website.`);
    } catch (error: any) {
      console.error('Error creating brand:', error);
      showNotification('error', error.response?.data?.detail || 'Failed to create brand');
    }
  };

  // Update brand
  const handleUpdateBrand = async () => {
    if (!editingBrand) return;
    
    if (!brandFormData.name.trim()) {
      showNotification('error', 'Brand name is required');
      return;
    }

    try {
      let imageUrl = brandFormData.imageUrl;
      
      if (brandImageFile) {
        if (editingBrand.imageUrl) {
          try {
            await axios.delete(`${API_BASE_URL}/api/brands/${editingBrand.id}/image`);
          } catch (e) {
            console.warn('Could not delete old image, continuing...');
          }
        }
        imageUrl = await uploadBrandImage(brandImageFile);
      }

      await axios.put(`${API_BASE_URL}/api/brands/${editingBrand.id}`, {
        name: brandFormData.name.trim(),
        imageUrl: imageUrl || editingBrand.imageUrl,
        displayOrder: brandFormData.displayOrder,
        isActive: editingBrand.isActive
      });

      await fetchBrands();
      setShowBrandModal(false);
      resetBrandForm();
      showNotification('success', `Brand "${brandFormData.name}" updated successfully!`);
    } catch (error: any) {
      console.error('Error updating brand:', error);
      showNotification('error', error.response?.data?.detail || 'Failed to update brand');
    }
  };

  // Delete brand with image cleanup
  const handleDeleteBrand = async (brandId: string) => {
    const brandToDelete = brands.find(b => b.id === brandId);
    if (!brandToDelete) return;

    if (!confirm(`Are you sure you want to delete brand "${brandToDelete.name}"? This will also delete the associated image.`)) return;

    setDeletingBrandId(brandId);
    try {
      await axios.delete(`${API_BASE_URL}/api/brands/${brandId}`);
      
      if (brandToDelete.imageUrl) {
        try {
          const filename = brandToDelete.imageUrl.split('/').pop();
          if (filename) {
            // Backend handles image cleanup
          }
        } catch (e) {
          console.warn('Could not delete image file directly, but brand is deleted');
        }
      }
      
      await fetchBrands();
      showNotification('success', `Brand "${brandToDelete.name}" deleted successfully!`);
    } catch (error: any) {
      console.error('Error deleting brand:', error);
      showNotification('error', error.response?.data?.detail || 'Failed to delete brand');
    } finally {
      setDeletingBrandId(null);
    }
  };

  // Delete brand image only
  const handleDeleteBrandImage = async (brand: Brand) => {
    if (!brand.imageUrl) {
      showNotification('info', 'No image to delete');
      return;
    }

    if (!confirm(`Remove the image from "${brand.name}"? The brand will remain but without an image.`)) return;

    try {
      await axios.put(`${API_BASE_URL}/api/brands/${brand.id}`, {
        ...brand,
        imageUrl: ''
      });
      
      try {
        const filename = brand.imageUrl.split('/').pop();
        if (filename) {
          // Optional: call an endpoint to delete the file
        }
      } catch (e) {
        console.warn('Could not delete image file');
      }
      
      await fetchBrands();
      showNotification('success', `Image removed from "${brand.name}"`);
    } catch (error: any) {
      console.error('Error deleting brand image:', error);
      showNotification('error', error.response?.data?.detail || 'Failed to delete image');
    }
  };

  // Toggle brand active status
  const handleToggleBrandStatus = async (brand: Brand) => {
    try {
      await axios.put(`${API_BASE_URL}/api/brands/${brand.id}`, {
        ...brand,
        isActive: !brand.isActive
      });
      await fetchBrands();
      showNotification('success', `Brand ${brand.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error: any) {
      console.error('Error toggling brand status:', error);
      showNotification('error', 'Failed to update brand status');
    }
  };

  // Reset brand form
  const resetBrandForm = () => {
    setBrandFormData({ name: '', imageUrl: '', displayOrder: 0 });
    if (brandImagePreview && !brandImagePreview.startsWith('http')) {
      URL.revokeObjectURL(brandImagePreview);
    }
    setBrandImageFile(null);
    setBrandImagePreview('');
    setEditingBrand(null);
    setUploadProgress(0);
  };

  // Open create modal
  const openCreateBrandModal = () => {
    resetBrandForm();
    setEditingBrand(null);
    setShowBrandModal(true);
  };

  // Open edit modal
  const openEditBrandModal = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandFormData({
      name: brand.name,
      imageUrl: brand.imageUrl,
      displayOrder: brand.displayOrder
    });
    if (brand.imageUrl) {
      setBrandImagePreview(getFullBrandImageUrl(brand.imageUrl));
    } else {
      setBrandImagePreview('');
    }
    setShowBrandModal(true);
  };

  // Bulk brand actions
  const handleBulkBrandAction = async (action: string) => {
    if (selectedBrandsForBulk.length === 0) {
      showNotification('info', 'No brands selected');
      return;
    }

    const selectedBrands = brands.filter(b => selectedBrandsForBulk.includes(b.id));
    const actionLabels: Record<string, string> = {
      'delete': 'delete permanently',
      'activate': 'activate',
      'deactivate': 'deactivate'
    };

    if (!confirm(`Are you sure you want to ${actionLabels[action] || action} ${selectedBrandsForBulk.length} brand(s)?`)) return;

    try {
      await axios.post(`${API_BASE_URL}/api/brands/bulk`, {
        action: action,
        ids: selectedBrandsForBulk
      });
      
      if (action === 'delete') {
        for (const brand of selectedBrands) {
          if (brand.imageUrl) {
            try {
              const filename = brand.imageUrl.split('/').pop();
            } catch (e) {
              console.warn('Could not delete image file');
            }
          }
        }
      }
      
      await fetchBrands();
      setSelectedBrandsForBulk([]);
      showNotification('success', `Successfully ${action}d ${selectedBrandsForBulk.length} brand(s)`);
    } catch (error: any) {
      console.error('Error in bulk action:', error);
      showNotification('error', error.response?.data?.detail || 'Failed to perform bulk action');
    }
  };

  // ============ Scrolling Ads Functions ============

  // Fetch scrolling ads from database
  const fetchScrollingAds = async () => {
    setAdsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/scrolling-ads`);
      setAds(response.data);
    } catch (error) {
      console.error('Error fetching scrolling ads:', error);
      showNotification('error', 'Failed to fetch scrolling ads');
    } finally {
      setAdsLoading(false);
    }
  };

  // Load ads on mount
  useEffect(() => {
    fetchScrollingAds();
  }, []);

  // Create scrolling ad
  const handleCreateScrollingAd = async () => {
    if (!newAdText.trim()) {
      showNotification('error', 'Please enter ad text');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/scrolling-ads`, {
        text: newAdText.trim(),
        speed: newAdSpeed,
        highlight: newAdHighlight,
        displayOrder: ads.length,
        isActive: true
      });

      await fetchScrollingAds();
      setNewAdText('');
      setNewAdSpeed('normal');
      setNewAdHighlight(false);
      showNotification('success', 'Ad added successfully!');
    } catch (error: any) {
      console.error('Error creating ad:', error);
      showNotification('error', error.response?.data?.detail || 'Failed to create ad');
    }
  };

  // Update scrolling ad
  const handleUpdateScrollingAd = async () => {
    if (!editingAd) return;
    
    if (!editingAd.text.trim()) {
      showNotification('error', 'Ad text is required');
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/api/scrolling-ads/${editingAd.id}`, {
        text: editingAd.text.trim(),
        speed: editingAd.speed,
        highlight: editingAd.highlight || false,
        displayOrder: editingAd.displayOrder || 0,
        isActive: editingAd.isActive
      });

      await fetchScrollingAds();
      setShowAdEditModal(false);
      setEditingAd(null);
      showNotification('success', 'Ad updated successfully!');
    } catch (error: any) {
      console.error('Error updating ad:', error);
      showNotification('error', error.response?.data?.detail || 'Failed to update ad');
    }
  };

  // Delete scrolling ad
  const handleDeleteScrollingAd = async (adId: string) => {
    const adToDelete = ads.find(a => a.id === adId);
    if (!adToDelete) return;

    if (!confirm(`Are you sure you want to delete "${adToDelete.text}"?`)) return;

    setDeletingAdId(adId);
    try {
      await axios.delete(`${API_BASE_URL}/api/scrolling-ads/${adId}`);
      await fetchScrollingAds();
      showNotification('success', 'Ad deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting ad:', error);
      showNotification('error', error.response?.data?.detail || 'Failed to delete ad');
    } finally {
      setDeletingAdId(null);
    }
  };

  // Toggle ad active status
  const handleToggleScrollingAd = async (ad: ScrollingAd) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/scrolling-ads/${ad.id}/toggle`);
      await fetchScrollingAds();
      showNotification('success', `Ad ${ad.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error: any) {
      console.error('Error toggling ad:', error);
      showNotification('error', error.response?.data?.detail || 'Failed to toggle ad');
    }
  };

  // Bulk action for scrolling ads
  const handleBulkScrollingAdAction = async (action: string) => {
    if (selectedAdsForBulk.length === 0) {
      showNotification('info', 'No ads selected');
      return;
    }

    const actionLabels: Record<string, string> = {
      'delete': 'delete permanently',
      'activate': 'activate',
      'deactivate': 'deactivate'
    };

    if (!confirm(`Are you sure you want to ${actionLabels[action] || action} ${selectedAdsForBulk.length} ad(s)?`)) return;

    try {
      await axios.post(`${API_BASE_URL}/api/scrolling-ads/bulk`, {
        action: action,
        ids: selectedAdsForBulk
      });
      
      await fetchScrollingAds();
      setSelectedAdsForBulk([]);
      showNotification('success', `Successfully ${action}d ${selectedAdsForBulk.length} ad(s)`);
    } catch (error: any) {
      console.error('Error in bulk action:', error);
      showNotification('error', error.response?.data?.detail || 'Failed to perform bulk action');
    }
  };

  // ============ Notification ============

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // ============ Page Renderers ============

  const handlePageChange = (pageId: string) => {
    setActivePage(pageId);
  };

  // Render Brand Logo Page
  const renderBrandLogoPage = () => (
    <div className="bg-gray-900/80 rounded-2xl border border-gray-800 p-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gold-400 flex items-center gap-3">
            <FiGrid className="w-6 h-6" />
            Brand Logo Management
          </h2>
          <p className="text-sm text-gray-400 mt-1">Manage brands displayed on the website homepage</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bulk Actions */}
          {selectedBrandsForBulk.length > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs text-gray-400">{selectedBrandsForBulk.length} selected</span>
              <button
                onClick={() => handleBulkBrandAction('activate')}
                className="px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 text-sm"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkBrandAction('deactivate')}
                className="px-3 py-1.5 bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/30 text-sm"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkBrandAction('delete')}
                className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 text-sm"
              >
                Delete
              </button>
            </div>
          )}
          <button
            onClick={fetchBrands}
            className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <FiRefreshCw className={`w-5 h-5 ${brandsLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateBrandModal}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl hover:bg-gold-400 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Add Brand
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400">Total Brands</p>
          <p className="text-xl font-bold text-white">{brands.length}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400">Active</p>
          <p className="text-xl font-bold text-green-400">{brands.filter(b => b.isActive).length}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400">Inactive</p>
          <p className="text-xl font-bold text-gray-400">{brands.filter(b => !b.isActive).length}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400">Last Updated</p>
          <p className="text-sm font-medium text-white">
            {brands.length > 0 && brands[0].updatedAt 
              ? new Date(brands[0].updatedAt).toLocaleDateString() 
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <FiStar className="text-gold-400 mt-1 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-300">
              <span className="text-gold-400 font-medium">How brands appear:</span> Active brands with images will automatically appear in the "Our Brands" section on the website homepage. 
              Brands are displayed in a scrolling carousel based on their display order.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              💡 Tip: Upload a brand image, set it as active, and it will show on the website immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Brands Grid */}
      {brandsLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold-400"></div>
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-700">
          <FiGrid className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No brands added yet</p>
          <p className="text-gray-500 text-sm mt-1">Click "Add Brand" to get started</p>
          <p className="text-gray-500 text-xs mt-2">Brands will appear on the website homepage</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {brands.map((brand) => {
            const imageUrl = getFullBrandImageUrl(brand.imageUrl);
            const isSelected = selectedBrandsForBulk.includes(brand.id);
            const isDeleting = deletingBrandId === brand.id;

            return (
              <div
                key={brand.id}
                className={`bg-gray-800/50 rounded-xl border transition-all ${isDeleting ? 'opacity-50' : ''} ${
                  isSelected ? 'border-gold-500/50 bg-gold-500/10' : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="p-4">
                  {/* Select Checkbox */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setSelectedBrandsForBulk(prev => prev.filter(id => id !== brand.id));
                          } else {
                            setSelectedBrandsForBulk(prev => [...prev, brand.id]);
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-gold-500 focus:ring-gold-500"
                      />
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        brand.isActive 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {brand.isActive ? 'Active ✅' : 'Inactive ❌'}
                      </span>
                      <span className="text-xs text-gray-500">#{brand.displayOrder}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleBrandStatus(brand)}
                        className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        title={brand.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {brand.isActive ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEditBrandModal(brand)}
                        className="p-1.5 rounded-lg hover:bg-gray-700 text-blue-400 hover:text-blue-300 transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBrand(brand.id)}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg hover:bg-gray-700 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                        title="Delete Brand"
                      >
                        {isDeleting ? (
                          <span className="animate-spin">⟳</span>
                        ) : (
                          <FiTrash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Brand Image */}
                  <div className="aspect-[2/1] bg-gray-700/50 rounded-lg overflow-hidden mb-3 relative group">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={brand.name}
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x100/333/666?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <FiImage className="w-8 h-8" />
                      </div>
                    )}
                    {imageUrl && (
                      <button
                        onClick={() => handleDeleteBrandImage(brand)}
                        className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="Remove image"
                      >
                        <FiX className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </div>

                  {/* Brand Name */}
                  <div className="text-center">
                    <h3 className="font-semibold text-white text-lg">{brand.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Added: {new Date(brand.createdAt).toLocaleDateString()}
                    </p>
                    {brand.isActive && imageUrl && (
                      <span className="text-xs text-green-400 mt-1 block">🟢 Visible on website</span>
                    )}
                    {brand.isActive && !imageUrl && (
                      <span className="text-xs text-yellow-400 mt-1 block">⚠️ No image - won't show</span>
                    )}
                    {!brand.isActive && (
                      <span className="text-xs text-gray-400 mt-1 block">⚪ Hidden from website</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Brand Modal - Create/Edit */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </h3>
              <button
                onClick={() => {
                  setShowBrandModal(false);
                  resetBrandForm();
                }}
                className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Brand Name *</label>
                <input
                  type="text"
                  value={brandFormData.name}
                  onChange={(e) => setBrandFormData({ ...brandFormData, name: e.target.value })}
                  placeholder="Enter brand name (e.g., COCK, PEACOCK)"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">This name will appear below the brand image on the website</p>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Display Order</label>
                <input
                  type="number"
                  value={brandFormData.displayOrder}
                  onChange={(e) => setBrandFormData({ ...brandFormData, displayOrder: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in the scrolling carousel</p>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Brand Image {!editingBrand && '*'}</label>
                <div className="border-2 border-dashed border-gray-700 rounded-xl p-4 text-center hover:border-gold-400 transition-colors relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBrandImageSelect}
                    className="hidden"
                    id="brand-image-upload"
                  />
                  <label htmlFor="brand-image-upload" className="cursor-pointer block">
                    {brandImagePreview ? (
                      <div className="relative">
                        <img
                          src={brandImagePreview}
                          alt="Brand preview"
                          className="max-h-32 mx-auto rounded-lg object-contain"
                        />
                        <p className="text-xs text-gray-400 mt-2">Click to change image</p>
                        {uploadingBrandImage && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gold-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{uploadProgress}% uploaded</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8">
                        <FiUpload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Click to upload brand image</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP (Max 5MB)</p>
                        <p className="text-xs text-gold-400 mt-2">✨ Image will appear on the website homepage</p>
                      </div>
                    )}
                  </label>
                </div>
                {editingBrand && !brandImageFile && brandFormData.imageUrl && (
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">Current image will be kept if no new image is selected</p>
                    <button
                      onClick={() => {
                        if (editingBrand && confirm('Remove the current image?')) {
                          handleDeleteBrandImage(editingBrand);
                          setShowBrandModal(false);
                        }
                      }}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remove image
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg p-3">
                <p className="text-xs text-gray-300 flex items-center gap-2">
                  <FiStar className="text-gold-400" />
                  <span>After saving, this brand will appear on the <span className="text-gold-400 font-medium">Our Brands</span> section of the website if active.</span>
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBrandModal(false);
                  resetBrandForm();
                }}
                className="flex-1 px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingBrand ? handleUpdateBrand : handleCreateBrand}
                disabled={uploadingBrandImage || !brandFormData.name.trim() || (!brandImagePreview && !editingBrand)}
                className={`flex-1 px-4 py-2 rounded-xl transition-all ${
                  uploadingBrandImage || !brandFormData.name.trim() || (!brandImagePreview && !editingBrand)
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gold-500 text-white hover:bg-gold-400 hover:scale-105'
                }`}
              >
                {uploadingBrandImage ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⟳</span>
                    Uploading... {uploadProgress}%
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FiSave className="w-4 h-4" />
                    {editingBrand ? 'Update Brand' : 'Create Brand'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );

  // Render Scrolling Ads Page
  const renderScrollingAdsPage = () => (
    <div className="bg-gray-900/80 rounded-2xl border border-gray-800 p-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gold-400 flex items-center gap-3">
            <FiSliders className="w-6 h-6" />
            Scrolling Ads Management
          </h2>
          <p className="text-sm text-gray-400 mt-1">Create and manage scrolling advertisements</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bulk Actions */}
          {selectedAdsForBulk.length > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs text-gray-400">{selectedAdsForBulk.length} selected</span>
              <button
                onClick={() => handleBulkScrollingAdAction('activate')}
                className="px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 text-sm"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkScrollingAdAction('deactivate')}
                className="px-3 py-1.5 bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/30 text-sm"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkScrollingAdAction('delete')}
                className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 text-sm"
              >
                Delete
              </button>
            </div>
          )}
          <button
            onClick={fetchScrollingAds}
            className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <FiRefreshCw className={`w-5 h-5 ${adsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400">Total Ads</p>
          <p className="text-xl font-bold text-white">{ads.length}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400">Active</p>
          <p className="text-xl font-bold text-green-400">{ads.filter(a => a.isActive).length}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400">Inactive</p>
          <p className="text-xl font-bold text-gray-400">{ads.filter(a => !a.isActive).length}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700">
          <p className="text-xs text-gray-400">Highlighted</p>
          <p className="text-xl font-bold text-gold-400">{ads.filter(a => a.highlight).length}</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <FiStar className="text-gold-400 mt-1 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-300">
              <span className="text-gold-400 font-medium">How ads appear:</span> Active ads will automatically scroll across the website header. 
              Highlighted ads will appear with a special gradient color.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              💡 Tip: Create multiple ads and set different speeds for variety. Highlight important promotions.
            </p>
          </div>
        </div>
      </div>

      {/* Add Ad Form */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">➕ Add New Ad</h3>
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            value={newAdText}
            onChange={(e) => setNewAdText(e.target.value)}
            placeholder="Enter ad text..."
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gold-500 min-w-[200px]"
          />
          <select
            value={newAdSpeed}
            onChange={(e) => setNewAdSpeed(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-gold-500"
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={newAdHighlight}
              onChange={(e) => setNewAdHighlight(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-gold-500 focus:ring-gold-500"
            />
            Highlight
          </label>
          <button
            onClick={handleCreateScrollingAd}
            className="px-6 py-2 bg-gold-500 text-black rounded-lg hover:bg-gold-400 transition-colors"
          >
            Add Ad
          </button>
        </div>
      </div>

      {/* Ads List */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">
          📋 Ads ({ads.filter(a => a.isActive).length} active)
        </h3>
        
        {adsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold-400"></div>
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No ads created yet</p>
            <p className="text-sm mt-1">Add your first ad above!</p>
          </div>
        ) : (
          ads.map((ad) => {
            const isSelected = selectedAdsForBulk.includes(ad.id);
            const isDeleting = deletingAdId === ad.id;

            return (
              <div
                key={ad.id}
                className={`p-4 rounded-lg border mb-3 transition-all ${
                  ad.isActive 
                    ? 'border-gold-500/30 bg-gray-700/30' 
                    : 'border-gray-600 bg-gray-800/30 opacity-60'
                } ${isSelected ? 'border-gold-500/50 bg-gold-500/10' : ''}`}
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-[150px]">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setSelectedAdsForBulk(prev => prev.filter(id => id !== ad.id));
                        } else {
                          setSelectedAdsForBulk(prev => [...prev, ad.id]);
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-gold-500 focus:ring-gold-500"
                    />
                    <div className={`w-3 h-3 rounded-full ${ad.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <span className={`text-white ${!ad.isActive ? 'line-through' : ''}`}>
                      {ad.text}
                    </span>
                    {ad.highlight && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gold-500/20 text-gold-400">
                        ⭐ Highlighted
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-1 text-xs rounded ${
                      ad.speed === 'slow' ? 'bg-blue-500/20 text-blue-400' :
                      ad.speed === 'fast' ? 'bg-red-500/20 text-red-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {ad.speed.charAt(0).toUpperCase() + ad.speed.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">#{ad.displayOrder}</span>
                    <button
                      onClick={() => handleToggleScrollingAd(ad)}
                      className={`p-2 rounded-lg transition-colors ${
                        ad.isActive 
                          ? 'hover:bg-green-500/20 text-green-400' 
                          : 'hover:bg-gray-500/20 text-gray-400'
                      }`}
                      title="Toggle Status"
                    >
                      {ad.isActive ? <FiCheckCircle className="w-4 h-4" /> : <FiXCircle className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingAd({ ...ad });
                        setShowAdEditModal(true);
                      }}
                      className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteScrollingAd(ad.id)}
                      disabled={isDeleting}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {isDeleting ? (
                        <span className="animate-spin">⟳</span>
                      ) : (
                        <FiTrash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Created: {new Date(ad.createdAt).toLocaleDateString()}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Live Preview */}
      <div className="mt-6 bg-gray-800/50 rounded-lg border border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">👁️ Live Preview</h3>
        <div className="bg-gray-900 rounded-lg p-4 overflow-hidden border border-gray-700">
          <div className="flex gap-8 whitespace-nowrap text-gold-400 text-lg font-medium" 
               style={{ 
                 animation: isScrolling ? `scroll-${scrollSpeed}x 15s linear infinite` : 'none',
               }}>
            {ads.filter(a => a.isActive).map((ad, index) => (
              <span key={ad.id} className={ad.highlight ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-red-600' : ''}>
                {ad.text} {index < ads.filter(a => a.isActive).length - 1 ? '•' : ''}
              </span>
            ))}
            {ads.filter(a => a.isActive).length === 0 && (
              <span className="text-gray-500">No active ads to display</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-500">
            {isScrolling ? '▶️ Scrolling active' : '⏸️ Scrolling paused'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setIsScrolling(!isScrolling)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                isScrolling 
                  ? 'bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30' 
                  : 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30'
              }`}
            >
              {isScrolling ? '⏸️ Pause' : '▶️ Resume'}
            </button>
            <button
              onClick={() => {
                const speeds = [0.5, 1, 1.5, 2, 3];
                const currentIndex = speeds.indexOf(scrollSpeed);
                const nextIndex = (currentIndex + 1) % speeds.length;
                setScrollSpeed(speeds[nextIndex]);
                showNotification('success', `Speed changed to ${speeds[nextIndex]}x`);
              }}
              className="px-3 py-1 text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors"
            >
              ⚡ {scrollSpeed}x
            </button>
          </div>
        </div>
      </div>

      {/* Edit Ad Modal */}
      {showAdEditModal && editingAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Edit Ad</h3>
              <button
                onClick={() => {
                  setShowAdEditModal(false);
                  setEditingAd(null);
                }}
                className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Ad Text *</label>
                <input
                  type="text"
                  value={editingAd.text}
                  onChange={(e) => setEditingAd({ ...editingAd, text: e.target.value })}
                  placeholder="Enter ad text..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Speed</label>
                <select
                  value={editingAd.speed}
                  onChange={(e) => setEditingAd({ ...editingAd, speed: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors"
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Display Order</label>
                <input
                  type="number"
                  value={editingAd.displayOrder || 0}
                  onChange={(e) => setEditingAd({ ...editingAd, displayOrder: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in the scrolling carousel</p>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={editingAd.highlight || false}
                    onChange={(e) => setEditingAd({ ...editingAd, highlight: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-gold-500 focus:ring-gold-500"
                  />
                  Highlight this ad
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={editingAd.isActive !== undefined ? editingAd.isActive : true}
                    onChange={(e) => setEditingAd({ ...editingAd, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-gold-500 focus:ring-gold-500"
                  />
                  Active
                </label>
              </div>

              <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg p-3">
                <p className="text-xs text-gray-300 flex items-center gap-2">
                  <FiStar className="text-gold-400" />
                  <span>This ad will appear in the scrolling banner on the website when active.</span>
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAdEditModal(false);
                  setEditingAd(null);
                }}
                className="flex-1 px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateScrollingAd}
                className="flex-1 px-4 py-2 bg-gold-500 text-black rounded-xl hover:bg-gold-400 hover:scale-105 transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  <FiSave className="w-4 h-4" />
                  Update Ad
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes scroll-0.5x {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes scroll-1x {
          0% { transform: translateX(80%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes scroll-1.5x {
          0% { transform: translateX(60%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes scroll-2x {
          0% { transform: translateX(40%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes scroll-3x {
          0% { transform: translateX(20%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );

  const renderPageContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'products':
        return <AdminProducts />;
      case 'orders':
        return <AdminOrders />;
      case 'register':
        return <AdminRegister />;
      case 'brandlogo':
        return renderBrandLogoPage();
      case 'scrollingads':
        return renderScrollingAdsPage();
      case 'contact':
        return <AdminContact />;
      case 'billing':
        return <AdminBilling />;
      case 'photos':
        return <AdminPhotos />;
      case 'records':
        return <AdminRecords />;
      default:
        return <AdminDashboard />;
    }
  };

  // ============ Main Layout ============

  return (
    <div className="flex h-screen bg-black">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-b from-black via-gray-900/30 to-black" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <aside
        className={`bg-gray-900/90 border-r border-gray-800 text-white transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col shadow-xl relative z-10`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center text-black font-bold">
              A
            </div>
            {sidebarOpen && (
              <span className="text-xl font-semibold tracking-tight text-white">Admin</span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
          >
            {sidebarOpen ? (
              <FiChevronLeft className="w-6 h-6" />
            ) : (
              <FiChevronRight className="w-6 h-6" />
            )}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  activePage === item.id
                    ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className={`text-xl ${activePage === item.id ? 'text-gold-400' : ''}`} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-400 font-semibold border border-gold-500/30">
              JD
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">John Doe</p>
                <p className="text-xs text-gray-400 truncate">admin@example.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="bg-gray-900/80 border-b border-gray-800 px-6 py-4 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white capitalize">
              {activePage === 'register' ? 'User Register' : 
               activePage === 'brandlogo' ? 'Brand Logo' :
               activePage === 'scrollingads' ? 'Scrolling Ads' :
               activePage === 'orders' ? 'Orders' : activePage}
            </h1>
            <span className="text-sm text-gold-400 bg-gold-500/10 border border-gold-500/20 px-3 py-1 rounded-full">
              Admin Panel
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white">
              <FiBell className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white">
              <FiUser className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-black">
          {renderPageContent()}
        </main>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-500 ${
          notification.type === 'success' 
            ? 'bg-green-600/90 border border-green-500' 
            : notification.type === 'error'
            ? 'bg-red-600/90 border border-red-500'
            : 'bg-blue-600/90 border border-blue-500'
        } text-white max-w-md`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <FiCheckCircle className="w-5 h-5 text-green-300" />
            ) : notification.type === 'error' ? (
              <FiXCircle className="w-5 h-5 text-red-300" />
            ) : (
              <FiBell className="w-5 h-5 text-blue-300" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;