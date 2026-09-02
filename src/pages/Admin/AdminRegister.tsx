// AdminRegister.tsx
import React, { useState, useEffect } from 'react';
import {
  FiSearch,
  FiUser,
  FiPhone,
  FiMapPin,
  FiMail,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiRefreshCw,
  FiExternalLink,
  FiPackage,
  FiEye,
  FiEdit2,
  FiX,
  FiSave,
  FiUserCheck,
  FiUserX,
  FiAlertCircle,
  FiMoreVertical
} from 'react-icons/fi';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  contact: string;
  pincode: string;
  cityVillage: string;
  address: string;
  email: string | null;
  registrationDate: string;
  isActive: boolean;
  additionalDiscount: number;
  updatedAt: string | null;
}

interface OrderSummary {
  id: string;
  orderNumber: string;
  totalAmount: number;
  orderStatus: string;
  createdAt: string;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
}

interface EditUserFormData {
  id: string;
  name: string;
  contact: string;
  pincode: string;
  cityVillage: string;
  address: string;
  email: string;
  additionalDiscount: number;
  isActive: boolean;
}

const AdminRegister: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('registrationDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userOrders, setUserOrders] = useState<OrderSummary[]>([]);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({ total: 0, active: 0, inactive: 0 });
  const [editingUser, setEditingUser] = useState<EditUserFormData>({
    id: '',
    name: '',
    contact: '',
    pincode: '',
    cityVillage: '',
    address: '',
    email: '',
    additionalDiscount: 0,
    isActive: true
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || '';

  // Validation functions
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!editingUser.name.trim() || editingUser.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!editingUser.contact.trim() || editingUser.contact.length !== 10) {
      errors.contact = 'Contact must be exactly 10 digits';
    } else if (!/^[6-9]\d{9}$/.test(editingUser.contact)) {
      errors.contact = 'Contact must start with 6, 7, 8, or 9';
    }
    
    if (!editingUser.pincode.trim() || editingUser.pincode.length !== 6) {
      errors.pincode = 'Pincode must be exactly 6 digits';
    } else if (!/^\d{6}$/.test(editingUser.pincode)) {
      errors.pincode = 'Pincode must contain only digits';
    }
    
    if (!editingUser.cityVillage.trim() || editingUser.cityVillage.length < 2) {
      errors.cityVillage = 'City/Village must be at least 2 characters';
    }
    
    if (!editingUser.address.trim() || editingUser.address.length < 5) {
      errors.address = 'Address must be at least 5 characters';
    }
    
    if (editingUser.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingUser.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (editingUser.additionalDiscount < 0 || editingUser.additionalDiscount > 100) {
      errors.additionalDiscount = 'Discount must be between 0 and 100';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/users`, {
        params: {
          search: search || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        },
      });
      const userData = response.data || [];
      setUsers(userData);
      
      const active = userData.filter((u: User) => u.isActive).length;
      const inactive = userData.filter((u: User) => !u.isActive).length;
      setUserStats({
        total: userData.length,
        active,
        inactive
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setUserStats({ total: 0, active: 0, inactive: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Fetch user orders
  const fetchUserOrders = async (userId: string) => {
    try {
      const response = await axios.get(`${API_BASE}/api/users/${userId}/orders`);
      setUserOrders(response.data || []);
      setShowOrdersModal(true);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      setUserOrders([]);
    }
  };

  // Fetch single user details
  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await axios.get(`${API_BASE}/api/users/${userId}`);
      setSelectedUser(response.data);
      setShowUserModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  // Full user update
  const updateFullUser = async (userData: EditUserFormData) => {
    if (!validateForm()) return;
    
    setIsUpdating(true);
    setUpdateMessage(null);
    
    try {
      const payload = {
        name: userData.name,
        contact: userData.contact,
        pincode: userData.pincode,
        cityVillage: userData.cityVillage,
        address: userData.address,
        email: userData.email || undefined,
      };
      
      // First update user details
      await axios.put(`${API_BASE}/api/users/${userData.id}`, payload);
      
      // Then update discount if changed
      const originalUser = users.find(u => u.id === userData.id);
      if (originalUser && originalUser.additionalDiscount !== userData.additionalDiscount) {
        await axios.patch(`${API_BASE}/api/users/${userData.id}/discount`, {
          discount: userData.additionalDiscount
        });
      }
      
      // Update status if changed
      if (originalUser && originalUser.isActive !== userData.isActive) {
        await axios.patch(`${API_BASE}/api/users/${userData.id}/status`, {
          isActive: userData.isActive
        });
      }
      
      setUpdateMessage({ type: 'success', text: 'User updated successfully!' });
      
      // Refresh data
      await fetchUsers();
      
      // Update selected user if modal is open
      if (selectedUser && selectedUser.id === userData.id) {
        const updatedUser = await axios.get(`${API_BASE}/api/users/${userData.id}`);
        setSelectedUser(updatedUser.data);
      }
      
      setTimeout(() => {
        setShowEditModal(false);
        setUpdateMessage(null);
        setFormErrors({});
      }, 1500);
      
    } catch (error: any) {
      console.error('Error updating user:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to update user';
      setUpdateMessage({ type: 'error', text: errorMsg });
      
      if (error.response?.data?.detail?.includes('Contact')) {
        setFormErrors(prev => ({ ...prev, contact: error.response.data.detail }));
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Update only discount (for quick edit)
  const updateUserDiscount = async (userId: string, discount: number) => {
    setIsUpdating(true);
    setUpdateMessage(null);
    try {
      const response = await axios.patch(
        `${API_BASE}/api/users/${userId}/discount`,
        { discount }
      );
      
      setUpdateMessage({ type: 'success', text: response.data.message || 'Discount updated successfully!' });
      await fetchUsers();
      
      if (selectedUser && selectedUser.id === userId) {
        const updatedUser = await axios.get(`${API_BASE}/api/users/${userId}`);
        setSelectedUser(updatedUser.data);
      }
      
      setTimeout(() => {
        setShowEditModal(false);
        setUpdateMessage(null);
      }, 1500);
      
    } catch (error: any) {
      console.error('Error updating discount:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to update discount';
      setUpdateMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsUpdating(false);
    }
  };

  // Update user status
  const updateUserStatus = async (userId: string, isActive: boolean) => {
    setIsUpdating(true);
    try {
      await axios.patch(
        `${API_BASE}/api/users/${userId}/status`,
        { isActive }
      );
      
      await fetchUsers();
      
      if (selectedUser && selectedUser.id === userId) {
        const updatedUser = await axios.get(`${API_BASE}/api/users/${userId}`);
        setSelectedUser(updatedUser.data);
      }
      
    } catch (error: any) {
      console.error('Error updating user status:', error);
      alert(error.response?.data?.detail || 'Failed to update user status');
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
        <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
        <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1.5"></span>
        Inactive
      </span>
    );
  };

  const getOrderStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      CONFIRMED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      PROCESSING: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      SHIPPED: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
      CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
      REFUNDED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const openEditModal = (user: User) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      contact: user.contact,
      pincode: user.pincode,
      cityVillage: user.cityVillage,
      address: user.address,
      email: user.email || '',
      additionalDiscount: user.additionalDiscount || 0,
      isActive: user.isActive
    });
    setFormErrors({});
    setUpdateMessage(null);
    setShowEditModal(true);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    setEditingUser(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSaveEdit = () => {
    updateFullUser(editingUser);
  };

  // User Card Component for Mobile View
  const UserCard = ({ user }: { user: User }) => {
    const isExpanded = expandedCard === user.id;

    return (
      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-4 hover:border-gold-500/30 transition-all duration-200">
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-medium truncate">{user.name}</span>
                {getStatusBadge(user.isActive)}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-0.5">
                <FiPhone className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{user.contact}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setExpandedCard(isExpanded ? null : user.id)}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 ml-2 flex-shrink-0"
          >
            <FiMoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Card Body - Always visible info */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-gray-300">
            <FiMapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <span className="truncate">{user.cityVillage}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-300">
            <span className="text-gray-500 text-xs">Pincode:</span>
            <span>{user.pincode}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-300 col-span-2">
            <FiMail className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <span className="truncate">{user.email || 'No email'}</span>
          </div>
        </div>

        {/* Expanded section */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-800 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Registered</p>
                <p className="text-gray-300">{formatDateShort(user.registrationDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Discount</p>
                <p className="text-white font-medium">{user.additionalDiscount}%</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => fetchUserDetails(user.id)}
                className="flex-1 min-w-[80px] py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-500/20 text-xs flex items-center justify-center gap-1.5"
              >
                <FiEye className="w-3.5 h-3.5" />
                View
              </button>
              <button
                onClick={() => {
                  setSelectedUser(user);
                  fetchUserOrders(user.id);
                }}
                className="flex-1 min-w-[80px] py-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors border border-purple-500/20 text-xs flex items-center justify-center gap-1.5"
              >
                <FiPackage className="w-3.5 h-3.5" />
                Orders
              </button>
              <button
                onClick={() => openEditModal(user)}
                className="flex-1 min-w-[80px] py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20 text-xs flex items-center justify-center gap-1.5"
              >
                <FiEdit2 className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => updateUserStatus(user.id, !user.isActive)}
                disabled={isUpdating}
                className={`flex-1 min-w-[80px] py-1.5 rounded-lg transition-colors border text-xs flex items-center justify-center gap-1.5 ${
                  user.isActive 
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20'
                    : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20'
                }`}
              >
                {user.isActive ? (
                  <>
                    <FiUserX className="w-3.5 h-3.5" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <FiUserCheck className="w-3.5 h-3.5" />
                    Activate
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">📋 User Registrations</h2>
          <p className="text-gray-400 text-sm mt-1">
            Manage and view all registered users
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => {
              fetchUsers();
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <div className="relative flex-1 sm:flex-none">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50 w-full md:w-80"
            />
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Total Users</p>
          <p className="text-2xl font-bold text-white">{userStats.total}</p>
        </div>
        <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Active Users</p>
          <p className="text-2xl font-bold text-green-400">
            {userStats.active}
          </p>
        </div>
        <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm">Inactive Users</p>
          <p className="text-2xl font-bold text-red-400">
            {userStats.inactive}
          </p>
        </div>
      </div>

      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden lg:block bg-gray-900/80 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  #
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Name
                    {sortBy === 'name' && (
                      sortOrder === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('registrationDate')}
                >
                  <div className="flex items-center gap-1">
                    Registered
                    {sortBy === 'registrationDate' && (
                      sortOrder === 'asc' ? <FiChevronUp /> : <FiChevronDown />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    <div className="flex justify-center items-center gap-2">
                      <FiRefreshCw className="w-5 h-5 animate-spin" />
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-white font-semibold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-300">
                        <FiPhone className="w-3.5 h-3.5 text-gray-500" />
                        {user.contact}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-300">
                        <FiMapPin className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-sm truncate max-w-[120px]">
                          {user.cityVillage}, {user.pincode}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-300">
                        <FiMail className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-sm truncate max-w-[120px]">
                          {user.email || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      <div className="flex items-center gap-1">
                        <FiCalendar className="w-3.5 h-3.5 text-gray-500" />
                        {formatDate(user.registrationDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(user.isActive)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">
                        {user.additionalDiscount}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fetchUserDetails(user.id)}
                          className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-500/20"
                          title="View Details"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            fetchUserOrders(user.id);
                          }}
                          className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors border border-purple-500/20"
                          title="View Orders"
                        >
                          <FiPackage className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
                          title="Edit User"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateUserStatus(user.id, !user.isActive)}
                          className={`p-1.5 rounded-lg transition-colors border ${
                            user.isActive 
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20'
                              : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20'
                          }`}
                          title={user.isActive ? 'Deactivate User' : 'Activate User'}
                          disabled={isUpdating}
                        >
                          {user.isActive ? (
                            <FiUserX className="w-4 h-4" />
                          ) : (
                            <FiUserCheck className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View - Visible on mobile */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <div className="flex justify-center items-center gap-2">
              <FiRefreshCw className="w-5 h-5 animate-spin" />
              Loading users...
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-gray-900/80 rounded-xl border border-gray-800">
            No users found
          </div>
        ) : (
          users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FiUser className="w-5 h-5 text-gold-400" />
                  User Details
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[70vh] p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Full Name</label>
                    <p className="text-white text-lg font-medium">{selectedUser.name}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Contact Number</label>
                    <p className="text-white flex items-center gap-2">
                      <FiPhone className="w-4 h-4 text-gray-500" />
                      {selectedUser.contact}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Email</label>
                    <p className="text-white flex items-center gap-2">
                      <FiMail className="w-4 h-4 text-gray-500" />
                      {selectedUser.email || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedUser.isActive)}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Address</label>
                    <p className="text-white">{selectedUser.address}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">City/Village</label>
                    <p className="text-white">{selectedUser.cityVillage}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Pincode</label>
                    <p className="text-white">{selectedUser.pincode}</p>
                  </div>
                  <div>
                    <label className="text-xs text-white uppercase tracking-wider">Additional Discount</label>
                    <p className="text-white text-xl font-bold">{selectedUser.additionalDiscount}%</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-800 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Registered On</label>
                  <p className="text-gray-300 text-sm">{formatDate(selectedUser.registrationDate)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Last Updated</label>
                  <p className="text-gray-300 text-sm">{selectedUser.updatedAt ? formatDate(selectedUser.updatedAt) : 'N/A'}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    openEditModal(selectedUser);
                  }}
                  className="flex-1 py-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors border border-amber-500/30 flex items-center justify-center gap-2"
                >
                  <FiEdit2 className="w-4 h-4" />
                  Edit User
                </button>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(selectedUser);
                    fetchUserOrders(selectedUser.id);
                  }}
                  className="flex-1 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors border border-purple-500/30 flex items-center justify-center gap-2"
                >
                  <FiPackage className="w-4 h-4" />
                  View Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Modal */}
      {showOrdersModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FiPackage className="w-5 h-5 text-purple-400" />
                  Orders for {selectedUser?.name}
                </h3>
                <p className="text-sm text-gray-400">
                  {selectedUser?.contact} • {selectedUser?.cityVillage}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowOrdersModal(false);
                  setSelectedUser(null);
                }}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-4">
              {userOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FiPackage className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p>No orders found for this user</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 hover:border-gold-500/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="text-white font-medium">
                            {order.orderNumber}
                          </p>
                          <p className="text-sm text-gray-400">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getOrderStatusColor(order.orderStatus)}`}>
                            {order.orderStatus}
                          </span>
                          <span className="text-gold-400 font-semibold text-white">
                            ₹{order.totalAmount.toFixed(2)}
                          </span>
                          <button
                            className="p-1.5 rounded-lg bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 transition-colors"
                            title="View Order Details"
                          >
                            <FiExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal - Full Edit */}
      {showEditModal && editingUser.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FiEdit2 className="w-5 h-5 text-amber-400" />
                  Edit User
                </h3>
                <p className="text-sm text-gray-400">Update user information and discount</p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setUpdateMessage(null);
                  setFormErrors({});
                }}
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[70vh] p-6">
              {updateMessage && (
                <div className={`p-3 rounded-lg text-sm mb-4 ${
                  updateMessage.type === 'success' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {updateMessage.text}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editingUser.name}
                    onChange={handleEditInputChange}
                    className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 ${
                      formErrors.name ? 'border-red-500' : 'border-gray-700'
                    }`}
                    placeholder="Enter full name"
                  />
                  {formErrors.name && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" />
                      {formErrors.name}
                    </p>
                  )}
                </div>

                {/* Contact */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Contact Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="contact"
                    value={editingUser.contact}
                    onChange={handleEditInputChange}
                    maxLength={10}
                    className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 ${
                      formErrors.contact ? 'border-red-500' : 'border-gray-700'
                    }`}
                    placeholder="10-digit mobile number"
                  />
                  {formErrors.contact && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" />
                      {formErrors.contact}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editingUser.email}
                    onChange={handleEditInputChange}
                    className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 ${
                      formErrors.email ? 'border-red-500' : 'border-gray-700'
                    }`}
                    placeholder="user@example.com"
                  />
                  {formErrors.email && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" />
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* City/Village */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    City/Village <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="cityVillage"
                    value={editingUser.cityVillage}
                    onChange={handleEditInputChange}
                    className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 ${
                      formErrors.cityVillage ? 'border-red-500' : 'border-gray-700'
                    }`}
                    placeholder="Enter city or village"
                  />
                  {formErrors.cityVillage && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" />
                      {formErrors.cityVillage}
                    </p>
                  )}
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Pincode <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={editingUser.pincode}
                    onChange={handleEditInputChange}
                    maxLength={6}
                    className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 ${
                      formErrors.pincode ? 'border-red-500' : 'border-gray-700'
                    }`}
                    placeholder="6-digit pincode"
                  />
                  {formErrors.pincode && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" />
                      {formErrors.pincode}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">
                    Address <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={editingUser.address}
                    onChange={handleEditInputChange}
                    rows={3}
                    className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 ${
                      formErrors.address ? 'border-red-500' : 'border-gray-700'
                    }`}
                    placeholder="Enter complete address"
                  />
                  {formErrors.address && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" />
                      {formErrors.address}
                    </p>
                  )}
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Additional Discount (%)
                  </label>
                  <input
                    type="text"
                    name="additionalDiscount"
                    value={editingUser.additionalDiscount}
                    onChange={handleEditInputChange}
                    min="0"
                    max="100"
                    step="0.5"
                    className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 ${
                      formErrors.additionalDiscount ? 'border-red-500' : 'border-gray-700'
                    }`}
                  />
                  {formErrors.additionalDiscount && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <FiAlertCircle className="w-3 h-3" />
                      {formErrors.additionalDiscount}
                    </p>
                  )}
                </div>

                {/* Status Toggle */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Account Status
                  </label>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => {
                        setEditingUser(prev => ({ ...prev, isActive: !prev.isActive }));
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        editingUser.isActive
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {editingUser.isActive ? '🟢 Active' : '🔴 Inactive'}
                    </button>
                    <span className="text-xs text-gray-500">
                      Click to toggle
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 p-4 border-t border-gray-800">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setUpdateMessage(null);
                  setFormErrors({});
                }}
                className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors border border-gray-700"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isUpdating}
                className="flex-1 py-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors border border-amber-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRegister;