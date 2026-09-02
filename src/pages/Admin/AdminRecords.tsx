// AdminRecords.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiSearch,
  FiRefreshCw,
  FiFileText,
  FiCreditCard,
  FiUser,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiEye,
  FiDownload,
  FiPrinter,
  FiX,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiInfo,
  FiFile,
  FiList,
  FiGrid
} from 'react-icons/fi';
import axios from 'axios';

// ============ Types ============

interface BillRecord {
  id: string;
  billNumber: string;
  customerId: string;
  customerName: string;
  customerContact: string;
  customerAddress: string;
  items: any[];
  subtotal: number;
  discount: number;
  customerDiscount: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: string;
  paymentStatus: 'paid' | 'partial' | 'pending' | 'overdue';
  date: string;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  paymentHistory: any[];
}

interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  shippingCharge: number;
  taxAmount: number;
  additionalDiscountPercentage: number;
  additionalDiscountAmount: number;
  finalAmount: number;
  paymentMethod: string;
  referenceId: string;
  isPaid: boolean;
  invoiceNumber: string;
  paidAmount: number;
  remainingAmount: number;
  paymentHistory: any[];
  orderStatus: string;
  paymentStatus: string;
  staffNotes: string | null;
  customerNotes: string | null;
  delivery: {
    name: string;
    contact: string;
    pincode: string;
    cityVillage: string;
    address: string;
    email: string;
  };
  items: any[];
  createdAt: string;
  updatedAt: string;
  confirmedAt: string | null;
  processingAt: string | null;
  shippedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}

interface UserRecord {
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

type RecordType = 'all' | 'orders' | 'bills' | 'users';

interface Stats {
  totalOrders: number;
  totalBills: number;
  totalUsers: number;
  totalRevenue: number;
  totalPaid: number;
  totalRemaining: number;
  pendingOrders: number;
  pendingBills: number;
}

// ============ AdminRecords Component ============

const AdminRecords: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RecordType>('all');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<UserRecord[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  // FIXED: Added setter to remove unused variable warning
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalBills: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalPaid: 0,
    totalRemaining: 0,
    pendingOrders: 0,
    pendingBills: 0
  });
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards'); // Changed default to cards for better mobile view
  const [filterStatus, setFilterStatus] = useState<string>('all');
  // FIXED: Added setters to remove unused variable warnings
  const [, setSortBy] = useState<string>('createdAt');
  const [, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statsLoading, setStatsLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || '';

  // ============ Status Mapping ============
  const getBackendStatus = (status: string): string | undefined => {
    if (status === 'all') return undefined;
    
    const orderStatusMap: Record<string, string> = {
      'PENDING': 'PENDING',
      'CONFIRMED': 'CONFIRMED',
      'PROCESSING': 'PROCESSING',
      'SHIPPED': 'SHIPPED',
      'COMPLETED': 'COMPLETED',
      'CANCELLED': 'CANCELLED',
      'REFUNDED': 'REFUNDED',
    };
    
    const paymentStatusMap: Record<string, string> = {
      'paid': 'paid',
      'partial': 'partial',
      'pending': 'pending',
      'overdue': 'overdue',
    };
    
    if (status in orderStatusMap) return orderStatusMap[status];
    if (status in paymentStatusMap) return paymentStatusMap[status];
    
    return undefined;
  };

  // ============ Fetch Stats from Orders List (More Reliable) ============
  const fetchStats = useCallback(async () => {
    if (statsLoading) return;
    setStatsLoading(true);
    
    try {
      console.log('🔍 Fetching stats from orders list...');
      
      const ordersRes = await axios.get(`${API_BASE}/api/orders`, {
        params: { 
          limit: 1000, 
          sort_by: 'createdAt', 
          sort_order: 'desc' 
        }
      });
      const orders = ordersRes.data || [];
      console.log(`📊 Fetched ${orders.length} orders for stats`);
      
      let billsData = {};
      try {
        const billsRes = await axios.get(`${API_BASE}/api/bills/stats`);
        billsData = billsRes.data || {};
        console.log('📊 Bills stats response:', billsData);
      } catch (billError) {
        console.error('❌ Bills stats error:', billError);
        billsData = {
          totalBills: 0,
          totalRevenue: 0,
          totalPaid: 0,
          totalRemaining: 0,
          statusBreakdown: { pending: 0 }
        };
      }
      
      let usersCount = 0;
      try {
        const usersRes = await axios.get(`${API_BASE}/api/users?limit=1`);
        const usersData = usersRes.data || [];
        usersCount = Array.isArray(usersData) ? usersData.length : 0;
        console.log(`📊 Users count: ${usersCount}`);
      } catch (userError) {
        console.error('❌ Users error:', userError);
        usersCount = 0;
      }

      const totalOrders = orders.length;
      const pendingOrders = orders.filter((o: any) => o.orderStatus === 'PENDING').length;
      
      const completedOrders = orders.filter((o: any) => o.orderStatus === 'COMPLETED');
      const shippedOrders = orders.filter((o: any) => o.orderStatus === 'SHIPPED');
      const processingOrders = orders.filter((o: any) => o.orderStatus === 'PROCESSING');
      
      const completedRevenue = completedOrders.reduce((sum: number, o: any) => sum + (o.finalAmount || 0), 0);
      const shippedRevenue = shippedOrders.reduce((sum: number, o: any) => sum + (o.finalAmount || 0), 0);
      const processingRevenue = processingOrders.reduce((sum: number, o: any) => sum + (o.finalAmount || 0), 0);
      
      const totalRevenue = completedRevenue + shippedRevenue + processingRevenue;
      
      const paidOrders = orders.filter((o: any) => o.paymentStatus === 'paid');
      const totalPaid = paidOrders.reduce((sum: number, o: any) => sum + (o.paidAmount || o.finalAmount || 0), 0);

      const totalBills = (billsData as any).totalBills || 0;
      const totalRemaining = (billsData as any).totalRemaining || 0;
      const pendingBills = (billsData as any).statusBreakdown?.pending || 0;

      const newStats = {
        totalOrders,
        totalBills,
        totalUsers: usersCount,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalRemaining: Math.round(totalRemaining * 100) / 100,
        pendingOrders,
        pendingBills
      };

      console.log('✅ Final stats:', newStats);
      setStats(newStats);

    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      setStats({
        totalOrders: 0,
        totalBills: 0,
        totalUsers: 0,
        totalRevenue: 0,
        totalPaid: 0,
        totalRemaining: 0,
        pendingOrders: 0,
        pendingBills: 0
      });
    } finally {
      setStatsLoading(false);
    }
  }, [API_BASE, statsLoading]);

  // ============ Fetch All Records ============
  const fetchAllRecords = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching records with params:', { search, filterStatus });
      
      const orderParams: any = {
        sort_by: 'createdAt',
        sort_order: 'desc',
        limit: 200
      };

      if (search && search.trim()) {
        orderParams.search = search.trim();
      }

      const orderStatus = getBackendStatus(filterStatus);
      if (orderStatus && ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(orderStatus)) {
        orderParams.order_status = orderStatus;
      }

      const billParams: any = {
        sort_by: 'createdAt',
        sort_order: 'desc',
        limit: 200
      };

      if (search && search.trim()) {
        billParams.search = search.trim();
      }

      const billStatus = getBackendStatus(filterStatus);
      if (billStatus && ['paid', 'partial', 'pending', 'overdue'].includes(billStatus)) {
        billParams.payment_status = billStatus;
      }

      const userParams: any = {
        sort_by: 'registrationDate',
        sort_order: 'desc',
        limit: 200
      };

      if (search && search.trim()) {
        userParams.search = search.trim();
      }

      const [ordersRes, billsRes, usersRes] = await Promise.all([
        axios.get(`${API_BASE}/api/orders`, { params: orderParams }).catch(err => {
          console.error('❌ Orders fetch error:', err);
          return { data: [] };
        }),
        axios.get(`${API_BASE}/api/bills`, { params: billParams }).catch(err => {
          console.error('❌ Bills fetch error:', err);
          return { data: [] };
        }),
        axios.get(`${API_BASE}/api/users`, { params: userParams }).catch(err => {
          console.error('❌ Users fetch error:', err);
          return { data: [] };
        })
      ]);

      const allRecords: any[] = [];

      const ordersData = ordersRes.data || [];
      (Array.isArray(ordersData) ? ordersData : []).forEach((order: any) => {
        allRecords.push({
          ...order,
          _type: 'order',
          _displayName: `Order ${order.orderNumber}`,
          _date: order.createdAt,
          _status: order.orderStatus,
          _amount: order.finalAmount,
          _customer: order.delivery?.name || 'N/A',
          _contact: order.delivery?.contact || 'N/A'
        });
      });

      const billsData = billsRes.data || [];
      (Array.isArray(billsData) ? billsData : []).forEach((bill: any) => {
        allRecords.push({
          ...bill,
          _type: 'bill',
          _displayName: `Bill ${bill.billNumber}`,
          _date: bill.createdAt,
          _status: bill.paymentStatus,
          _amount: bill.total,
          _customer: bill.customerName,
          _contact: bill.customerContact
        });
      });

      const usersData = usersRes.data || [];
      (Array.isArray(usersData) ? usersData : []).forEach((user: any) => {
        allRecords.push({
          ...user,
          _type: 'user',
          _displayName: user.name,
          _date: user.registrationDate,
          _status: user.isActive ? 'active' : 'inactive',
          _amount: 0,
          _customer: user.name,
          _contact: user.contact
        });
      });

      allRecords.sort((a, b) => {
        const dateA = new Date(a._date || a.createdAt || 0);
        const dateB = new Date(b._date || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      console.log(`✅ Loaded ${allRecords.length} records`);
      setRecords(allRecords);
    } catch (error) {
      console.error('❌ Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, API_BASE]);

  // ============ Search Suggestions ============
  const fetchSearchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/users`, {
        params: { 
          search: query.trim(), 
          limit: 10,
          sort_by: 'name',
          sort_order: 'asc'
        }
      });
      const users = response.data || [];
      setSearchSuggestions(Array.isArray(users) ? users : []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [API_BASE]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    fetchSearchSuggestions(value);
  }, [fetchSearchSuggestions]);

  const handleSuggestionClick = useCallback((user: UserRecord) => {
    setSearch(user.name);
    setShowSuggestions(false);
    setSearchSuggestions([]);
  }, []);

  // ============ Modal Handlers ============

  const handleViewRecord = useCallback((record: any) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  }, []);

  // ============ Format Helpers ============

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
    return `₹${amount.toFixed(2)}`;
  };

  // FIXED: Changed return type to React.ReactNode instead of JSX.Element
  const getStatusBadge = (status: string, type: string): React.ReactNode => {
    const statusMap: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      'PENDING': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: <FiClock className="w-3 h-3" /> },
      'CONFIRMED': { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: <FiCheckCircle className="w-3 h-3" /> },
      'PROCESSING': { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: <FiRefreshCw className="w-3 h-3" /> },
      'SHIPPED': { bg: 'bg-indigo-500/20', text: 'text-indigo-400', icon: <FiCheckCircle className="w-3 h-3" /> },
      'COMPLETED': { bg: 'bg-green-500/20', text: 'text-green-400', icon: <FiCheckCircle className="w-3 h-3" /> },
      'CANCELLED': { bg: 'bg-red-500/20', text: 'text-red-400', icon: <FiXCircle className="w-3 h-3" /> },
      'REFUNDED': { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: <FiXCircle className="w-3 h-3" /> },
      'paid': { bg: 'bg-green-500/20', text: 'text-green-400', icon: <FiCheckCircle className="w-3 h-3" /> },
      'partial': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: <FiClock className="w-3 h-3" /> },
      'pending': { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: <FiClock className="w-3 h-3" /> },
      'overdue': { bg: 'bg-red-500/20', text: 'text-red-400', icon: <FiAlertCircle className="w-3 h-3" /> },
      'active': { bg: 'bg-green-500/20', text: 'text-green-400', icon: <FiCheckCircle className="w-3 h-3" /> },
      'inactive': { bg: 'bg-red-500/20', text: 'text-red-400', icon: <FiXCircle className="w-3 h-3" /> },
    };

    const defaultStyle = { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: <FiInfo className="w-3 h-3" /> };
    const style = statusMap[status] || defaultStyle;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text} border border-current/20`}>
        {style.icon}
        {status}
      </span>
    );
  };

  // FIXED: Changed return type to React.ReactNode
  const getTypeBadge = (type: string): React.ReactNode => {
    const types: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      'order': { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: <FiFileText className="w-3 h-3" /> },
      'bill': { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: <FiCreditCard className="w-3 h-3" /> },
      'user': { bg: 'bg-green-500/20', text: 'text-green-400', icon: <FiUser className="w-3 h-3" /> },
    };

    const style = types[type] || types['order'];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.text}`}>
        {style.icon}
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  // ============ Filtered Records ============

  const filteredRecords = useMemo(() => {
    if (activeTab === 'all') return records;
    const typeMap: Record<RecordType, string> = {
      'all': 'all',
      'orders': 'order',
      'bills': 'bill',
      'users': 'user'
    };
    const targetType = typeMap[activeTab];
    return records.filter(r => r._type === targetType);
  }, [activeTab, records]);

  // ============ Effects ============

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchAllRecords();
  }, [fetchAllRecords]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAllRecords();
    }, 500);

    return () => clearTimeout(timer);
  }, [search, filterStatus, fetchAllRecords]);

  // ============ Render Detail Modal ============

  const renderDetailModal = (): React.ReactNode => {
    if (!selectedRecord || !isModalOpen) return null;

    const isOrder = selectedRecord._type === 'order';
    const isBill = selectedRecord._type === 'bill';
    const isUser = selectedRecord._type === 'user';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-3 min-w-0">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 truncate">
                {isOrder && <FiFileText className="w-5 h-5 text-blue-400 flex-shrink-0" />}
                {isBill && <FiCreditCard className="w-5 h-5 text-purple-400 flex-shrink-0" />}
                {isUser && <FiUser className="w-5 h-5 text-green-400 flex-shrink-0" />}
                <span className="truncate">{selectedRecord._displayName || 'Record Details'}</span>
              </h3>
              {getTypeBadge(selectedRecord._type)}
            </div>
            <button
              onClick={closeModal}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white flex-shrink-0"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto max-h-[70vh] p-4 md:p-6">
            {isOrder && renderOrderDetail(selectedRecord)}
            {isBill && renderBillDetail(selectedRecord)}
            {isUser && renderUserDetail(selectedRecord)}
          </div>

          {/* Footer */}
          <div className="flex flex-wrap justify-end gap-3 p-4 border-t border-gray-800">
            <button
              onClick={closeModal}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
            >
              Close
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center gap-2"
            >
              <FiDownload className="w-4 h-4" />
              Export
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors flex items-center gap-2"
            >
              <FiPrinter className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============ Detail Renderers ============

  // FIXED: Changed return type to React.ReactNode
  const renderOrderDetail = (order: OrderRecord): React.ReactNode => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-400 uppercase">Order Number</p>
          <p className="text-white font-medium truncate">{order.orderNumber}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-400 uppercase">Status</p>
          {getStatusBadge(order.orderStatus, 'order')}
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-400 uppercase">Total Amount</p>
          <p className="text-white font-bold text-lg">{formatCurrency(order.finalAmount)}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-400 uppercase">Payment Status</p>
          {getStatusBadge(order.paymentStatus, 'order')}
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
        <h4 className="text-sm font-semibold text-white mb-3">Customer Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-gray-300 min-w-0">
            <FiUser className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="truncate">{order.delivery?.name || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300 min-w-0">
            <FiPhone className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="truncate">{order.delivery?.contact || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300 min-w-0 md:col-span-2">
            <FiMapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="truncate">{order.delivery?.address || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <FiCalendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span>{formatDate(order.createdAt)}</span>
          </div>
        </div>
      </div>

      {order.items && order.items.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
          <h4 className="text-sm font-semibold text-white mb-3">Order Items</h4>
          <div className="space-y-2">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="flex flex-wrap items-center justify-between py-2 border-b border-gray-700/50 last:border-0 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-gray-400 text-sm">{idx + 1}.</span>
                  <span className="text-white truncate">{item.productName}</span>
                  <span className="text-gray-400 text-sm flex-shrink-0">x{item.quantity}</span>
                </div>
                <span className="text-white font-medium flex-shrink-0">{formatCurrency(item.totalPrice)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {order.paymentHistory && order.paymentHistory.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
          <h4 className="text-sm font-semibold text-white mb-3">Payment History</h4>
          <div className="space-y-2">
            {order.paymentHistory.map((payment: any, idx: number) => (
              <div key={idx} className="flex flex-wrap items-center justify-between py-2 border-b border-gray-700/50 last:border-0 gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-gray-400 text-sm">{formatDate(payment.timestamp)}</span>
                  <span className="text-gray-300">{payment.method}</span>
                </div>
                <span className="text-green-400 font-medium">{formatCurrency(payment.amount)}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-between mt-3 pt-3 border-t border-gray-700 gap-2">
            <span className="text-gray-400">Total Paid</span>
            <span className="text-green-400 font-bold">{formatCurrency(order.paidAmount || 0)}</span>
          </div>
          <div className="flex flex-wrap justify-between mt-1 gap-2">
            <span className="text-gray-400">Remaining</span>
            <span className="text-red-400 font-bold">{formatCurrency(order.remainingAmount || 0)}</span>
          </div>
        </div>
      )}
    </div>
  );

  // FIXED: Changed return type to React.ReactNode
  const renderBillDetail = (bill: BillRecord): React.ReactNode => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-400 uppercase">Bill Number</p>
          <p className="text-white font-medium truncate">{bill.billNumber}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-400 uppercase">Payment Status</p>
          {getStatusBadge(bill.paymentStatus, 'bill')}
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-400 uppercase">Total Amount</p>
          <p className="text-white font-bold text-lg">{formatCurrency(bill.total)}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-400 uppercase">Payment Method</p>
          <p className="text-white truncate">{bill.paymentMethod || 'N/A'}</p>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
        <h4 className="text-sm font-semibold text-white mb-3">Customer Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-gray-300 min-w-0">
            <FiUser className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="truncate">{bill.customerName}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300 min-w-0">
            <FiPhone className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="truncate">{bill.customerContact}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300 min-w-0 md:col-span-2">
            <FiMapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="truncate">{bill.customerAddress}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <FiCalendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span>{formatDate(bill.createdAt)}</span>
          </div>
        </div>
      </div>

      {bill.items && bill.items.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
          <h4 className="text-sm font-semibold text-white mb-3">Bill Items</h4>
          <div className="space-y-2">
            {bill.items.map((item: any, idx: number) => (
              <div key={idx} className="flex flex-wrap items-center justify-between py-2 border-b border-gray-700/50 last:border-0 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-gray-400 text-sm">{idx + 1}.</span>
                  <span className="text-white truncate">{item.productName}</span>
                  <span className="text-gray-400 text-sm flex-shrink-0">x{item.quantity}</span>
                </div>
                <span className="text-white font-medium flex-shrink-0">{formatCurrency(item.total || item.mrp * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
        <h4 className="text-sm font-semibold text-white mb-3">Payment Summary</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400">Subtotal</p>
            <p className="text-white">{formatCurrency(bill.subtotal)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Discount</p>
            <p className="text-red-400">-{formatCurrency(bill.discount || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Customer Discount</p>
            <p className="text-red-400">-{formatCurrency(bill.customerDiscount || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-white font-bold">{formatCurrency(bill.total)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Paid</p>
            <p className="text-green-400 font-medium">{formatCurrency(bill.paidAmount || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Remaining</p>
            <p className="text-red-400 font-medium">{formatCurrency(bill.remainingAmount || 0)}</p>
          </div>
        </div>
      </div>

      {bill.paymentHistory && bill.paymentHistory.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
          <h4 className="text-sm font-semibold text-white mb-3">Payment History</h4>
          <div className="space-y-2">
            {bill.paymentHistory.map((payment: any, idx: number) => (
              <div key={idx} className="flex flex-wrap items-center justify-between py-2 border-b border-gray-700/50 last:border-0 gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-gray-400 text-sm">{formatDate(payment.timestamp)}</span>
                  <span className="text-gray-300">{payment.method}</span>
                  <span className="text-xs text-gray-500">{payment.type}</span>
                </div>
                <span className="text-green-400 font-medium">{formatCurrency(payment.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // FIXED: Changed return type to React.ReactNode
  const renderUserDetail = (user: UserRecord): React.ReactNode => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-400 uppercase">User ID</p>
          <p className="text-white font-medium text-sm truncate">{user.id}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-400 uppercase">Status</p>
          {getStatusBadge(user.isActive ? 'active' : 'inactive', 'user')}
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-400 uppercase">Discount</p>
          <p className="text-white font-bold">{user.additionalDiscount}%</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-400 uppercase">Registered</p>
          <p className="text-white text-sm">{formatDate(user.registrationDate)}</p>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
        <h4 className="text-sm font-semibold text-white mb-3">Contact Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-gray-300 min-w-0">
            <FiUser className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="font-medium truncate">{user.name}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300 min-w-0">
            <FiPhone className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="truncate">{user.contact}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300 min-w-0 md:col-span-2">
            <FiMapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="truncate">{user.address}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-gray-500 text-sm">Pincode:</span>
            <span>{user.pincode}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
        <h4 className="text-sm font-semibold text-white mb-3">Location</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">City / Village</p>
            <p className="text-white">{user.cityVillage}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Email</p>
            <p className="text-white truncate">{user.email || 'Not provided'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ============ Render Record Cards - Mobile Optimized ============

  const renderCardView = (): React.ReactNode => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredRecords.map((record, idx) => (
        <div
          key={`${record._type}-${record.id || idx}`}
          className="bg-gray-900/80 rounded-xl border border-gray-800 p-4 hover:border-gold-500/30 transition-all duration-200 cursor-pointer"
          onClick={() => handleViewRecord(record)}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {getTypeBadge(record._type)}
              <span className="text-xs text-gray-400">{formatDate(record._date)}</span>
            </div>
            {record._type !== 'user' && (
              <span className="text-sm font-bold text-gold-400 flex-shrink-0">
                {formatCurrency(record._amount)}
              </span>
            )}
          </div>

          <div className="mt-3">
            <p className="text-white font-medium truncate">{record._displayName}</p>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-400 min-w-0">
              <FiUser className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{record._customer}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 min-w-0">
              <FiPhone className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{record._contact}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-800 flex flex-wrap items-center justify-between gap-2">
            {getStatusBadge(record._status, record._type)}
            <button className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-500/20 flex-shrink-0">
              <FiEye className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // ============ Render Table View ============

  const renderTableView = (): React.ReactNode => (
    <div className="bg-gray-900/80 rounded-xl border border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Reference</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden xl:table-cell">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                  <div className="flex justify-center items-center gap-2">
                    <FiRefreshCw className="w-5 h-5 animate-spin" />
                    Loading records...
                  </div>
                </td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                  No records found
                </td>
              </tr>
            ) : (
              filteredRecords.map((record, idx) => (
                <tr
                  key={`${record._type}-${record.id || idx}`}
                  className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                  onClick={() => handleViewRecord(record)}
                >
                  <td className="px-4 py-3 text-gray-400 text-sm">{idx + 1}</td>
                  <td className="px-4 py-3">{getTypeBadge(record._type)}</td>
                  <td className="px-4 py-3">
                    <span className="text-white font-medium text-sm truncate max-w-[120px] block">
                      {record._displayName}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-gray-300 text-sm truncate max-w-[100px] block">
                      {record._customer}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-gray-300 text-sm">{record._contact}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-gold-400 font-medium">
                      {record._type !== 'user' ? formatCurrency(record._amount) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(record._status, record._type)}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-gray-400 text-sm">{formatDate(record._date)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewRecord(record);
                      }}
                      className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-500/20"
                      title="View Details"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ============ Filters Bar - Mobile Optimized ============

  const renderFilters = (): React.ReactNode => (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Search with Suggestions */}
      <div className="relative flex-1 min-w-[180px]">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => search.length >= 2 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50 text-sm"
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto z-20">
            {searchSuggestions.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSuggestionClick(user)}
                className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm truncate">{user.name}</p>
                  <p className="text-gray-400 text-xs truncate">{user.contact} • {user.cityVillage}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status Filter */}
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50 text-sm flex-1 sm:flex-none min-w-[120px]"
      >
        <option value="all">All Status</option>
        <option value="PENDING">Pending</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="PROCESSING">Processing</option>
        <option value="SHIPPED">Shipped</option>
        <option value="COMPLETED">Completed</option>
        <option value="CANCELLED">Cancelled</option>
        <option value="paid">Paid</option>
        <option value="partial">Partial</option>
        <option value="overdue">Overdue</option>
      </select>

      {/* View Toggle */}
      <div className="flex bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex-shrink-0">
        <button
          onClick={() => setViewMode('table')}
          className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-gold-500/20 text-gold-400' : 'text-gray-400 hover:text-white'}`}
          title="Table View"
        >
          <FiList className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode('cards')}
          className={`p-2 transition-colors ${viewMode === 'cards' ? 'bg-gold-500/20 text-gold-400' : 'text-gray-400 hover:text-white'}`}
          title="Card View"
        >
          <FiGrid className="w-4 h-4" />
        </button>
      </div>

      {/* Refresh */}
      <button
        onClick={() => {
          fetchAllRecords();
          fetchStats();
        }}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700 flex-shrink-0"
      >
        <FiRefreshCw className={`w-4 h-4 ${loading || statsLoading ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline text-sm">Refresh</span>
      </button>
    </div>
  );

  // ============ Stats Summary - Mobile Optimized ============

  const renderStats = (): React.ReactNode => (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3 mb-6">
      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-2 sm:p-3">
        <p className="text-gray-400 text-[10px] sm:text-xs uppercase">Total</p>
        <p className="text-white font-bold text-base sm:text-lg">{stats.totalOrders + stats.totalBills + stats.totalUsers}</p>
      </div>
      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-2 sm:p-3">
        <p className="text-gray-400 text-[10px] sm:text-xs uppercase">Orders</p>
        <p className="text-blue-400 font-bold text-base sm:text-lg">{stats.totalOrders}</p>
      </div>
      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-2 sm:p-3">
        <p className="text-gray-400 text-[10px] sm:text-xs uppercase">Bills</p>
        <p className="text-purple-400 font-bold text-base sm:text-lg">{stats.totalBills}</p>
      </div>
      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-2 sm:p-3">
        <p className="text-gray-400 text-[10px] sm:text-xs uppercase">Users</p>
        <p className="text-green-400 font-bold text-base sm:text-lg">{stats.totalUsers}</p>
      </div>
      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-2 sm:p-3">
        <p className="text-gray-400 text-[10px] sm:text-xs uppercase">Revenue</p>
        <p className="text-gold-400 font-bold text-base sm:text-lg">{formatCurrency(stats.totalRevenue)}</p>
      </div>
      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-2 sm:p-3">
        <p className="text-gray-400 text-[10px] sm:text-xs uppercase">Paid</p>
        <p className="text-green-400 font-bold text-base sm:text-lg">{formatCurrency(stats.totalPaid)}</p>
      </div>
      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-2 sm:p-3">
        <p className="text-gray-400 text-[10px] sm:text-xs uppercase">Pend Orders</p>
        <p className="text-yellow-400 font-bold text-base sm:text-lg">{stats.pendingOrders}</p>
      </div>
      <div className="bg-gray-900/80 rounded-xl border border-gray-800 p-2 sm:p-3">
        <p className="text-gray-400 text-[10px] sm:text-xs uppercase">Pend Bills</p>
        <p className="text-orange-400 font-bold text-base sm:text-lg">{stats.pendingBills}</p>
      </div>
    </div>
  );

  // ============ Tabs ============

  const renderTabs = (): React.ReactNode => (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => setActiveTab('all')}
        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-sm ${
          activeTab === 'all' 
            ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' 
            : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
        }`}
      >
        All
      </button>
      <button
        onClick={() => setActiveTab('orders')}
        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-sm ${
          activeTab === 'orders' 
            ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' 
            : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
        }`}
      >
        <FiFileText className="inline mr-1" /> Orders
      </button>
      <button
        onClick={() => setActiveTab('bills')}
        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-sm ${
          activeTab === 'bills' 
            ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' 
            : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
        }`}
      >
        <FiCreditCard className="inline mr-1" /> Bills
      </button>
      <button
        onClick={() => setActiveTab('users')}
        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-sm ${
          activeTab === 'users' 
            ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30' 
            : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
        }`}
      >
        <FiUser className="inline mr-1" /> Users
      </button>
    </div>
  );

  // ============ Main Render ============

  return (
    <div className="relative px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <FiFile className="w-5 h-5 sm:w-6 sm:h-6 text-gold-400" />
            Records
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            View and manage orders, bills, and users
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 flex-shrink-0">
            {filteredRecords.length} records
          </span>
        </div>
      </div>

      {/* Stats */}
      {renderStats()}

      {/* Tabs */}
      {renderTabs()}

      {/* Filters */}
      {renderFilters()}

      {/* Records */}
      {viewMode === 'table' ? renderTableView() : renderCardView()}

      {/* Detail Modal */}
      {renderDetailModal()}
    </div>
  );
};

export default AdminRecords;