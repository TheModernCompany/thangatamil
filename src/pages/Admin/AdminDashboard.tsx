// src/pages/Admin/AdminDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  FiPackage, 
  FiUsers, 
  FiDollarSign, 
  FiShoppingCart,
  FiTrendingUp,
  FiTrendingDown,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiBarChart2,
  FiCalendar,
  FiChevronRight,
  FiRefreshCw,
  FiEye,
  FiUser,
  FiPhone,
  FiMapPin,
  FiMail,
  FiSearch,
  FiDownload,
  FiPrinter,
  FiFileText,
  FiPlus,
  FiStar,

  FiMessageSquare,
  FiImage,
  FiUpload,
  FiEdit2,
  FiTrash2,
  FiSettings,
  FiBell,
  FiMoreVertical
} from 'react-icons/fi';

// API Configuration
const API_BASE_URL = '';
const API_URL = `${API_BASE_URL}/api`;

// ============================================
// TYPES
// ============================================

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
  createdAt: string;
  updatedAt: string | null;
}

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
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  unitPrice: number;
  discountedUnitPrice: number;
  discountPercentage: number;
  quantity: number;
  totalPrice: number;
  productImage?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user: User;
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  shippingCharge: number;
  taxAmount: number;
  additionalDiscountPercentage: number;
  additionalDiscountAmount: number;
  finalAmount: number;
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'cash' | 'online' | 'credit';
  isPaid: boolean;
  invoiceNumber: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

interface ContactSubmission {
  id: string;
  name: string;
  contactNumber: string;
  location: string;
  category: string;
  enquiryType: 'retail' | 'wholesale' | 'manufacturing';
  message?: string;
  status: 'pending' | 'read' | 'responded' | 'archived';
  createdAt: string;
  isStarred: boolean;
}

interface BillItem {
  productId: string;
  productName: string;
  quantity: number;
  mrp: number;
  total: number;
}

interface Bill {
  id: string;
  billNumber: string;
  customerId: string;
  customerName: string;
  customerContact: string;
  customerAddress: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'online' | 'credit';
  paymentStatus: 'paid' | 'pending' | 'overdue';
  date: string;
  createdAt: string;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  totalBills: number;
  pendingPayments: number;
  totalContacts: number;
  pendingContacts: number;
  totalProducts: number;
  activeProducts: number;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'user' | 'contact' | 'bill' | 'product';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
  link?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getRelativeTime = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatDate(dateString);
};

const getOrderStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    CONFIRMED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    PROCESSING: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    SHIPPED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
    CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
    REFUNDED: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
};

// ============================================
// MAIN COMPONENT
// ============================================

const AdminDashboard: React.FC = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    totalBills: 0,
    pendingPayments: 0,
    totalContacts: 0,
    pendingContacts: 0,
    totalProducts: 0,
    activeProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentContacts, setRecentContacts] = useState<ContactSubmission[]>([]);
  const [recentBills, setRecentBills] = useState<Bill[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [showAllBills, setShowAllBills] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<RecentActivity | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);

  // Fetch all data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [
        productsRes,
        usersRes,
        ordersRes,
        contactsRes,
        billsRes
      ] = await Promise.all([
        axios.get(`${API_URL}/products`, { params: { limit: 1000 } }),
        axios.get(`${API_URL}/users`, { params: { limit: 1000 } }),
        axios.get(`${API_URL}/orders`, { params: { limit: 1000, sort_by: 'createdAt', sort_order: 'desc' } }),
        axios.get(`${API_URL}/submissions`, { params: { limit: 1000 } }),
        axios.get(`${API_URL}/bills`, { params: { limit: 1000 } }).catch(() => ({ data: [] }))
      ]);

      const products: Product[] = productsRes.data || [];
      const users: User[] = usersRes.data || [];
      const orders: Order[] = ordersRes.data || [];
      const contacts: ContactSubmission[] = contactsRes.data || [];
      const bills: Bill[] = billsRes.data || [];

      // Calculate stats
      const activeUsers = users.filter(u => u.isActive !== false).length;
      const pendingOrders = orders.filter(o => o.orderStatus === 'PENDING').length;
      const completedOrders = orders.filter(o => o.orderStatus === 'COMPLETED').length;
      
      const totalRevenue = orders.reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0);
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders.filter(o => o.createdAt?.startsWith(today));
      const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0);
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthOrders = orders.filter(o => {
        const d = new Date(o.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.finalAmount || o.totalAmount || 0), 0);
      
      const pendingContacts = contacts.filter(c => c.status === 'pending').length;
      const activeProducts = products.filter(p => p.isActive !== false).length;
      
      const pendingBills = bills.filter(b => b.paymentStatus === 'pending').length;
      const pendingPayments = bills.reduce((sum, b) => b.paymentStatus === 'pending' ? sum + b.total : sum, 0);

      setStats({
        totalUsers: users.length,
        activeUsers,
        totalOrders: orders.length,
        pendingOrders,
        completedOrders,
        totalRevenue,
        todayRevenue,
        monthRevenue,
        totalBills: bills.length,
        pendingPayments,
        totalContacts: contacts.length,
        pendingContacts,
        totalProducts: products.length,
        activeProducts
      });

      // Get recent data
      const recentOrdersData = orders.slice(0, 5);
      const recentContactsData = contacts.slice(0, 5);
      const recentBillsData = bills.slice(0, 5);

      setRecentOrders(recentOrdersData);
      setRecentContacts(recentContactsData);
      setRecentBills(recentBillsData);

      // Build activities feed
      const activities: RecentActivity[] = [];

      // Recent orders
      recentOrdersData.forEach(order => {
        activities.push({
          id: `order-${order.id}`,
          type: 'order',
          title: `New Order #${order.orderNumber}`,
          description: `Order from ${order.user?.name || 'Customer'} • ${formatCurrency(order.finalAmount || order.totalAmount || 0)}`,
          timestamp: order.createdAt,
          icon: '🛒',
          color: 'bg-blue-500/20 text-blue-400',
          link: '/admin/orders'
        });
      });

      // Recent contacts
      recentContactsData.forEach(contact => {
        activities.push({
          id: `contact-${contact.id}`,
          type: 'contact',
          title: `New Contact: ${contact.name}`,
          description: `${contact.enquiryType} enquiry • ${contact.category}`,
          timestamp: contact.createdAt,
          icon: '💬',
          color: 'bg-purple-500/20 text-purple-400',
          link: '/admin/contact'
        });
      });

      // Recent bills
      recentBillsData.forEach(bill => {
        activities.push({
          id: `bill-${bill.id}`,
          type: 'bill',
          title: `New Bill #${bill.billNumber}`,
          description: `Customer: ${bill.customerName} • ${formatCurrency(bill.total)}`,
          timestamp: bill.createdAt,
          icon: '🧾',
          color: 'bg-amber-500/20 text-amber-400',
          link: '/admin/billing'
        });
      });

      // Sort activities by timestamp (newest first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivities(activities.slice(0, 10));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Refresh data
  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Handle activity click
  const handleActivityClick = (activity: RecentActivity) => {
    setSelectedActivity(activity);
    setShowActivityModal(true);
  };

  // ============================================
  // STAT CARDS
  // ============================================

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    subtitle 
  }: { 
    title: string; 
    value: string | number; 
    icon: React.ReactNode; 
    color: string;
    subtitle?: string;
  }) => (
    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-4 hover:border-gold-500/30 transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1 truncate">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-gold-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-6 px-4 md:px-8 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="w-full h-full bg-gradient-to-b from-black via-gray-900/10 to-black" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-4 py-1.5 mb-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-gold-400 uppercase tracking-wider">Live Dashboard</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Welcome Back, <span className="text-gold-400">Admin</span>
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Here's what's happening with your business today.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleRefresh}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-all duration-200 flex items-center gap-2 text-sm border border-gray-700"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button className="px-4 py-2.5 bg-gold-500 text-black rounded-xl hover:bg-gold-400 transition-all duration-300 flex items-center gap-2 text-sm font-medium hover:scale-105 active:scale-95">
              <FiFileText className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500 text-red-300 rounded-xl text-center">
            <p>{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-sm text-gold-400 underline hover:text-gold-300"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-8">
          <StatCard
            title="Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={<FiDollarSign className="w-6 h-6" />}
            color="bg-green-500/20 text-green-400"
            subtitle={`Today: ${formatCurrency(stats.todayRevenue)}`}
          />
          <StatCard
            title="Orders"
            value={stats.totalOrders}
            icon={<FiShoppingCart className="w-6 h-6" />}
            color="bg-blue-500/20 text-blue-400"
            subtitle={`${stats.pendingOrders} pending`}
          />
          <StatCard
            title="Users"
            value={stats.totalUsers}
            icon={<FiUsers className="w-6 h-6" />}
            color="bg-purple-500/20 text-purple-400"
            subtitle={`${stats.activeUsers} active`}
          />
          <StatCard
            title="Products"
            value={stats.totalProducts}
            icon={<FiPackage className="w-6 h-6" />}
            color="bg-amber-500/20 text-amber-400"
            subtitle={`${stats.activeProducts} active`}
          />
          <StatCard
            title="Bills"
            value={stats.totalBills}
            icon={<FiFileText className="w-6 h-6" />}
            color="bg-orange-500/20 text-orange-400"
            subtitle={`Pending: ${formatCurrency(stats.pendingPayments)}`}
          />
          <StatCard
            title="Contacts"
            value={stats.totalContacts}
            icon={<FiMessageSquare className="w-6 h-6" />}
            color="bg-pink-500/20 text-pink-400"
            subtitle={`${stats.pendingContacts} pending`}
          />
          <StatCard
            title="Month Revenue"
            value={formatCurrency(stats.monthRevenue)}
            icon={<FiCalendar className="w-6 h-6" />}
            color="bg-cyan-500/20 text-cyan-400"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activities Feed - 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FiBell className="w-5 h-5 text-gold-400" />
                    Recent Activity
                  </h3>
                  <p className="text-xs text-gray-500">Latest updates from your business</p>
                </div>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No recent activity</p>
                  </div>
                ) : (
                  recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      onClick={() => handleActivityClick(activity)}
                      className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-all duration-200 cursor-pointer border border-transparent hover:border-gold-500/20 group"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                        <span className="text-lg">{activity.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{activity.title}</p>
                        <p className="text-xs text-gray-400 truncate">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{getRelativeTime(activity.timestamp)}</p>
                      </div>
                      <FiChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gold-400 transition-colors flex-shrink-0 mt-2" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats & Actions - 1 column */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <FiBarChart2 className="w-4 h-4 text-gold-400" />
                Quick Stats
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-sm text-gray-400">Orders Today</span>
                  <span className="text-sm font-medium text-white">
                    {recentOrders.filter(o => o.createdAt?.startsWith(new Date().toISOString().split('T')[0])).length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-sm text-gray-400">Pending Orders</span>
                  <span className="text-sm font-medium text-yellow-400">{stats.pendingOrders}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-sm text-gray-400">Completed Orders</span>
                  <span className="text-sm font-medium text-green-400">{stats.completedOrders}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800">
                  <span className="text-sm text-gray-400">Pending Contacts</span>
                  <span className="text-sm font-medium text-pink-400">{stats.pendingContacts}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-400">Active Products</span>
                  <span className="text-sm font-medium text-amber-400">{stats.activeProducts}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <FiSettings className="w-4 h-4 text-gold-400" />
                Quick Actions
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-xl text-center transition-all group border border-gray-700 hover:border-gold-500/30">
                  <div className="text-2xl mb-1">📦</div>
                  <p className="text-xs text-gray-400 group-hover:text-white transition-colors">Add Product</p>
                </button>
                <button className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-xl text-center transition-all group border border-gray-700 hover:border-gold-500/30">
                  <div className="text-2xl mb-1">🧾</div>
                  <p className="text-xs text-gray-400 group-hover:text-white transition-colors">New Bill</p>
                </button>
                <button className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-xl text-center transition-all group border border-gray-700 hover:border-gold-500/30">
                  <div className="text-2xl mb-1">👤</div>
                  <p className="text-xs text-gray-400 group-hover:text-white transition-colors">Add User</p>
                </button>
                <button className="p-3 bg-gray-800/50 hover:bg-gray-800 rounded-xl text-center transition-all group border border-gray-700 hover:border-gold-500/30">
                  <div className="text-2xl mb-1">📊</div>
                  <p className="text-xs text-gray-400 group-hover:text-white transition-colors">Report</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="mt-8 bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FiShoppingCart className="w-5 h-5 text-gold-400" />
                Recent Orders
              </h3>
              <p className="text-xs text-gray-500">Latest orders placed by customers</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No recent orders
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-white">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-white">{order.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{order.user?.cityVillage || ''}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">{order.items?.length || 0} items</td>
                      <td className="px-4 py-3 text-sm font-bold text-white">{formatCurrency(order.finalAmount || order.totalAmount || 0)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 text-xs rounded-full border ${getOrderStatusColor(order.orderStatus)}`}>
                          {order.orderStatus.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{getRelativeTime(order.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Contacts & Bills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Recent Contacts */}
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <FiMessageSquare className="w-4 h-4 text-pink-400" />
                Recent Contacts
              </h4>
            </div>
            <div className="divide-y divide-gray-800 max-h-[300px] overflow-y-auto custom-scrollbar">
              {recentContacts.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No recent contacts</div>
              ) : (
                recentContacts.map((contact) => (
                  <div key={contact.id} className="p-4 hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-pink-400 text-lg">{contact.isStarred ? '⭐' : '👤'}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{contact.name}</p>
                          <p className="text-xs text-gray-400 truncate">{contact.contactNumber} • {contact.category}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        contact.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        contact.status === 'read' ? 'bg-blue-500/20 text-blue-400' :
                        contact.status === 'responded' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {contact.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Bills */}
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-amber-400" />
                Recent Bills
              </h4>
            </div>
            <div className="divide-y divide-gray-800 max-h-[300px] overflow-y-auto custom-scrollbar">
              {recentBills.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No recent bills</div>
              ) : (
                recentBills.map((bill) => (
                  <div key={bill.id} className="p-4 hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-amber-400 text-lg">🧾</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{bill.billNumber}</p>
                          <p className="text-xs text-gray-400 truncate">{bill.customerName} • {bill.items.length} items</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-white">{formatCurrency(bill.total)}</p>
                        <span className={`text-xs ${
                          bill.paymentStatus === 'paid' ? 'text-green-400' :
                          bill.paymentStatus === 'pending' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {bill.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Detail Modal */}
      {showActivityModal && selectedActivity && (
        <>
          <div
            className="fixed inset-0 bg-black/80 z-50 transition-opacity duration-300"
            onClick={() => setShowActivityModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl max-w-lg w-full border border-gold-500/20 shadow-2xl shadow-gold-500/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedActivity.color}`}>
                    <span className="text-2xl">{selectedActivity.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedActivity.title}</h3>
                    <p className="text-xs text-gray-400">{getRelativeTime(selectedActivity.timestamp)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowActivityModal(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full"
                >
                  <FiXCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
                <p className="text-gray-300">{selectedActivity.description}</p>
              </div>
              {selectedActivity.link && (
                <button
                  onClick={() => {
                    setShowActivityModal(false);
                    // Navigate to the link
                  }}
                  className="w-full py-2.5 bg-gold-500 text-black rounded-xl hover:bg-gold-400 transition-all duration-300 font-medium text-sm"
                >
                  View Details
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Custom Scrollbar Styles */}
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
      `}</style>
    </div>
  );
};

export default AdminDashboard;