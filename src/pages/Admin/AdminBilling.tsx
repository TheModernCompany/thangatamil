// AdminBilling.tsx - Fixed Add Products Flow & Customer Search
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FiPlus, 
  FiSearch, 
  FiPrinter, 
  FiUser, 
  FiPackage, 
  FiFileText,
  FiCalendar,
  FiX,
  FiEye,
  FiTrash2,
  FiCheckCircle,
  FiClock,
  FiLoader,
  FiRefreshCw,
  FiSave,
  FiDownload,
  FiEdit2,
  FiPercent,
  FiCreditCard,
  FiUserCheck,
  FiShoppingBag,
  FiChevronRight,
  FiChevronLeft,
  FiMinus,
  FiPlus as FiPlusIcon
} from 'react-icons/fi';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import companyLogo from '../../assets/Logo.png';

// ============================================
// API CONFIGURATION
// ============================================
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_URL = `${API_BASE}/api`;

// ============================================
// COMPANY CONFIG
// ============================================
const COMPANY_CONFIG = {
  name: 'THANGATAMIL CRACKERS',
  tagline: 'Your Trusted Partner',
  address: 'Elayirampannai Rd, Kovilpatti, Chittrampatti, Tamil Nadu 628502',
  phone: '+91 98765 43210',
  email: 'email',
  website: 'www.accord.in',
};

// ============================================
// TYPES
// ============================================
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
  customerDiscount: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: 'cash' | 'online' | 'credit';
  paymentStatus: 'paid' | 'partial' | 'pending' | 'overdue';
  date: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  paymentHistory?: PaymentRecord[];
}

interface PaymentRecord {
  timestamp: string;
  amount: number;
  method: string;
  type: 'full' | 'partial';
  note?: string;
}

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
}

interface Customer {
  id: string;
  name: string;
  contact: string;
  address: string;
  pincode: string;
  cityVillage: string;
  email: string | null;
  additionalDiscount: number;
  isActive: boolean;
}

interface BillStats {
  totalBills: number;
  totalRevenue: number;
  totalPaid: number;
  totalRemaining: number;
  statusBreakdown: { paid: number; partial: number; pending: number; overdue: number };
  today: { bills: number; revenue: number };
  thisMonth: { bills: number; revenue: number };
}

const getImageUrl = (imagePath: string) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  if (imagePath.startsWith('/uploads')) return `${API_BASE}${imagePath}`;
  if (imagePath.startsWith('uploads')) return `${API_BASE}/${imagePath}`;
  return `${API_BASE}/uploads/products/${imagePath}`;
};

// ============================================
// PDF GENERATION
// ============================================
const generateBillPDF = async (bill: Bill) => {
  try {
    console.log('Generating PDF for bill:', bill.billNumber);
    
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '794px';
    container.style.backgroundColor = 'white';
    container.style.padding = '40px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.zIndex = '-1000';
    
    let logoImageUrl = '';
    try {
      const response = await fetch(companyLogo);
      const blob = await response.blob();
      logoImageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Could not load logo:', error);
    }
    
    const orderDate = new Date(bill.createdAt || bill.date || Date.now());
    const formattedDate = orderDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const formattedTime = orderDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const remainingAmount = bill.remainingAmount || 0;
    const paidAmount = bill.paidAmount || 0;
    let paymentStatusDisplay = 'Pending';
    let paymentStatusColor = '#eab308';
    if (remainingAmount <= 0 && paidAmount > 0) {
      paymentStatusDisplay = 'Paid';
      paymentStatusColor = '#22c55e';
    } else if (paidAmount > 0 && remainingAmount > 0) {
      paymentStatusDisplay = 'Partially Paid';
      paymentStatusColor = '#eab308';
    } else if (paidAmount === 0) {
      paymentStatusDisplay = 'Pending';
      paymentStatusColor = '#ef4444';
    }

    let itemsHtml = '';
    bill.items.forEach((item, idx) => {
      itemsHtml += `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #333; text-align: center; background: ${idx % 2 === 0 ? '#fafafa' : 'white'};">
            ${idx + 1}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #333; background: ${idx % 2 === 0 ? '#fafafa' : 'white'};">
            <strong>${item.productName}</strong>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align: right; font-size: 13px; color: #333; background: ${idx % 2 === 0 ? '#fafafa' : 'white'};">
            ₹${item.mrp.toFixed(2)}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align: center; font-size: 13px; color: #333; background: ${idx % 2 === 0 ? '#fafafa' : 'white'};">
            ${item.quantity}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; text-align: right; font-size: 13px; font-weight: bold; color: #1a1a2e; background: ${idx % 2 === 0 ? '#fafafa' : 'white'};">
            ₹${item.total.toFixed(2)}
          </td>
        </tr>
      `;
    });

    container.innerHTML = `
      <div style="max-width: 100%; padding: 20px; background: white;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #d4a843; padding-bottom: 20px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 15px;">
            ${logoImageUrl ? `
              <img src="${logoImageUrl}" alt="${COMPANY_CONFIG.name}" style="width: 70px; height: 70px; object-fit: contain; border-radius: 8px;" />
            ` : `
              <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #d4a843, #f5d06b); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: white;">🎆</div>
            `}
            <div>
              <div style="font-size: 24px; font-weight: bold; color: #1a1a2e; letter-spacing: 1px;">${COMPANY_CONFIG.name}</div>
              <div style="font-size: 12px; color: #6b7280; letter-spacing: 2px; margin-top: 2px;">${COMPANY_CONFIG.tagline}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 32px; font-weight: bold; color: #d4a843; letter-spacing: 4px;">INVOICE</div>
            <div style="font-size: 14px; color: #6b7280; margin-top: 4px; font-weight: 500;">#${bill.billNumber}</div>
          </div>
        </div>

        <div style="text-align: center; font-size: 12px; color: #6b7280; margin-bottom: 20px; padding: 10px 0; border-bottom: 1px solid #f3f4f6; background: #fafafa; border-radius: 8px;">
          📍 ${COMPANY_CONFIG.address} &nbsp;|&nbsp; 📞 ${COMPANY_CONFIG.phone} &nbsp;|&nbsp; ✉ ${COMPANY_CONFIG.email} &nbsp;|&nbsp; 🌐 ${COMPANY_CONFIG.website}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
          <div style="border: 1px solid #e5e7eb; padding: 16px 20px; border-radius: 8px; background: #f8fafc;">
            <div style="font-size: 11px; font-weight: bold; color: #d4a843; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">
              👤 Bill To
            </div>
            <div style="font-size: 16px; font-weight: bold; color: #1a1a2e; margin: 4px 0;">${bill.customerName}</div>
            <div style="font-size: 13px; color: #4b5563; margin: 2px 0;">📞 ${bill.customerContact}</div>
            <div style="font-size: 13px; color: #4b5563; margin: 2px 0;">📍 ${bill.customerAddress || 'N/A'}</div>
          </div>
          <div style="border: 1px solid #e5e7eb; padding: 16px 20px; border-radius: 8px; background: #f8fafc;">
            <div style="font-size: 11px; font-weight: bold; color: #d4a843; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">
              📋 Invoice Details
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 2px 0;">
              <span style="color: #6b7280;">Date</span>
              <span style="font-weight: 500;">${formattedDate}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 2px 0;">
              <span style="color: #6b7280;">Time</span>
              <span style="font-weight: 500;">${formattedTime}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 2px 0;">
              <span style="color: #6b7280;">Payment</span>
              <span style="font-weight: 500; text-transform: uppercase;">${bill.paymentMethod}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; padding: 2px 0;">
              <span style="color: #6b7280;">Status</span>
              <span style="display: inline-block; padding: 2px 14px; border-radius: 9999px; font-size: 11px; font-weight: 600; color: #fff; background: ${paymentStatusColor};">
                ${paymentStatusDisplay.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <thead>
            <tr style="background: linear-gradient(135deg, #d4a843, #c49a3a); color: #fff;">
              <th style="padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; width: 40px;">#</th>
              <th style="padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Item Description</th>
              <th style="padding: 12px 16px; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Rate (₹)</th>
              <th style="padding: 12px 16px; text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
              <th style="padding: 12px 16px; text-align: right; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
          <div style="width: 360px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #f3f4f6;">
              <span style="font-size: 13px; color: #6b7280;">Subtotal</span>
              <span style="font-size: 14px; color: #1a1a2e; font-weight: 500;">₹${(bill.subtotal || 0).toFixed(2)}</span>
            </div>
            ${(bill.discount || 0) > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #f3f4f6;">
                <span style="font-size: 13px; color: #6b7280;">Discount</span>
                <span style="font-size: 14px; color: #ef4444; font-weight: 500;">-₹${(bill.discount || 0).toFixed(2)}</span>
              </div>
            ` : ''}
            ${(bill.customerDiscount || 0) > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #f3f4f6; background: #f0fdf4;">
                <span style="font-size: 13px; color: #22c55e; font-weight: 600;">⭐ Customer Discount</span>
                <span style="font-size: 14px; color: #22c55e; font-weight: 600;">-₹${(bill.customerDiscount || 0).toFixed(2)}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding: 12px 12px; border-top: 2px solid #d4a843; margin-top: 4px; background: #f8fafc; border-radius: 0 0 8px 8px;">
              <span style="font-size: 18px; font-weight: bold; color: #1a1a2e;">Grand Total</span>
              <span style="font-size: 22px; font-weight: bold; color: #d4a843;">₹${(bill.total || 0).toFixed(2)}</span>
            </div>

            <div style="border-top: 2px solid #e5e7eb; margin-top: 15px; padding-top: 15px;">
              <div style="display: flex; justify-content: space-between; padding: 4px 12px;">
                <span style="font-size: 12px; color: #6b7280;">Payment Method</span>
                <span style="font-size: 13px; color: #1a1a2e; font-weight: 500; text-transform: uppercase;">${bill.paymentMethod}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 4px 12px;">
                <span style="font-size: 12px; color: #6b7280;">Payment Status</span>
                <span style="font-size: 13px; font-weight: 600; color: ${paymentStatusColor};">${paymentStatusDisplay}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px 12px; border-bottom: 1px solid #f3f4f6;">
                <span style="font-size: 13px; color: #6b7280; font-weight: 600;">Total Paid</span>
                <span style="font-size: 14px; color: #22c55e; font-weight: 600;">₹${(paidAmount).toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 12px;">
                <span style="font-size: 14px; color: #6b7280; font-weight: 600;">Balance Due</span>
                <span style="font-size: 16px; font-weight: bold; color: ${remainingAmount > 0 ? '#eab308' : '#22c55e'};">
                  ₹${remainingAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style="text-align: center; padding: 25px 0 15px; border-top: 2px solid #e5e7eb; margin-top: 10px;">
          <div style="font-size: 18px; font-weight: bold; color: #1a1a2e; margin-bottom: 6px;">
            Thank You for Your Business!
          </div>
          <div style="font-size: 14px; color: #4b5563;">
            We appreciate your trust in ${COMPANY_CONFIG.name}
          </div>
          ${remainingAmount > 0 ? `
            <div style="margin-top: 8px; padding: 8px 16px; background: #fef3c7; border-radius: 6px; display: inline-block;">
              <span style="font-size: 13px; color: #d97706; font-weight: 600;">
                ⚠️ Remaining Balance: ₹${remainingAmount.toFixed(2)} - Please complete your payment
              </span>
            </div>
          ` : paidAmount > 0 ? `
            <div style="margin-top: 8px;">
              <span style="font-size: 13px; color: #22c55e; font-weight: 600;">
                ✅ Payment Complete - Thank you!
              </span>
            </div>
          ` : `
            <div style="margin-top: 8px;">
              <span style="font-size: 13px; color: #ef4444; font-weight: 600;">
                ⏳ Payment Pending - Please complete your payment
              </span>
            </div>
          `}
          <div style="font-size: 10px; color: #9ca3af; margin-top: 12px; padding-top: 8px; border-top: 1px solid #f3f4f6;">
            This is a computer-generated invoice. Goods once sold will not be taken back.
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    await new Promise(resolve => setTimeout(resolve, 200));

    const canvas = await html2canvas(container, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      height: container.scrollHeight,
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4',
      hotfixes: ['px_scaling']
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice_${bill.billNumber}.pdf`);

    console.log('PDF downloaded successfully');
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};

// ============================================
// MAIN COMPONENT
// ============================================
const AdminBilling: React.FC = () => {
  // State
  const [bills, setBills] = useState<Bill[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isNewBillOpen, setIsNewBillOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState<BillStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  // Product search
  const [productSearch, setProductSearch] = useState('');
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);

  // Form state
  const [form, setForm] = useState({
    customerId: '',
    items: [] as { productId: string; quantity: number; mrp: number; productName?: string }[],
    discount: 0,
    discountType: 'percentage' as 'percentage' | 'fixed',
    paymentMethod: 'cash' as 'cash' | 'online' | 'credit',
    paidAmount: 0,
  });
  const [editingBillId, setEditingBillId] = useState<string | null>(null);

  // Bill generation step
  const [currentStep, setCurrentStep] = useState<'customer' | 'products' | 'discount' | 'review'>('customer');

  // Payment modal
  const [paymentBill, setPaymentBill] = useState<Bill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const customerRef = useRef<HTMLDivElement>(null);
  const productRef = useRef<HTMLDivElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // API Calls
  // ============================================
  const fetchCustomers = useCallback(async (search = '') => {
    setIsSearchingCustomer(true);
    try {
      const res = await axios.get(`${API_URL}/users`, { 
        params: { search: search || undefined, limit: 20 } 
      });
      const data = res.data || [];
      setCustomers(data);
      return data;
    } catch { return []; }
    finally { setIsSearchingCustomer(false); }
  }, []);

  const fetchProducts = useCallback(async (search = '') => {
    setIsSearchingProduct(true);
    try {
      const res = await axios.get(`${API_URL}/products`, { 
        params: { search: search || undefined, limit: 20 } 
      });
      const data = res.data || [];
      setProducts(data);
      return data;
    } catch { return []; }
    finally { setIsSearchingProduct(false); }
  }, []);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (filterStatus !== 'all') params.payment_status = filterStatus;
      const res = await axios.get(`${API_URL}/bills`, { params });
      setBills(res.data || []);
    } catch { setBills([]); }
    finally { setLoading(false); }
  }, [searchTerm, filterStatus]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/bills/stats`);
      setStats(res.data);
    } catch {}
  }, []);

  // ============================================
  // Handlers - Customer
  // ============================================
  const handleCustomerSearch = async (value: string) => {
    setCustomerSearch(value);
    setShowCustomerSuggestions(true);
    if (value.trim().length >= 2) {
      const results = await fetchCustomers(value);
      setCustomerSuggestions(results);
    } else {
      setCustomerSuggestions([]);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setShowCustomerSuggestions(false);
    setForm({ ...form, customerId: customer.id });
    // Auto advance to products step after selection
    setTimeout(() => setCurrentStep('products'), 300);
  };

  // ============================================
  // Handlers - Products (Fixed Flow)
  // ============================================
  const handleProductSearch = async (value: string) => {
    setProductSearch(value);
    setShowProductSuggestions(true);
    if (value.trim().length >= 2) {
      const results = await fetchProducts(value);
      setProductSuggestions(results);
    } else {
      setProductSuggestions([]);
    }
  };

  // Select product with default quantity 1
  const selectProduct = (product: Product) => {
    const existing = form.items.find(i => i.productId === product.id);
    if (existing) {
      // If product already exists, add 1 to quantity
      setForm({
        ...form,
        items: form.items.map(i => 
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      });
    } else {
      // Add new product with quantity 1
      setForm({
        ...form,
        items: [...form.items, { 
          productId: product.id, 
          quantity: 1, 
          mrp: product.price,
          productName: product.name
        }]
      });
    }
    setProductSearch('');
    setProductSuggestions([]);
    setShowProductSuggestions(false);
    // Focus back on search input
    setTimeout(() => productInputRef.current?.focus(), 100);
  };

  const removeItem = (productId: string) => {
    setForm({ ...form, items: form.items.filter(i => i.productId !== productId) });
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty < 1) return;
    setForm({
      ...form,
      items: form.items.map(i => i.productId === productId ? { ...i, quantity: qty } : i)
    });
  };

  const incrementQuantity = (productId: string) => {
    setForm({
      ...form,
      items: form.items.map(i => 
        i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
      )
    });
  };

  const decrementQuantity = (productId: string) => {
    setForm({
      ...form,
      items: form.items.map(i => 
        i.productId === productId && i.quantity > 1 ? { ...i, quantity: i.quantity - 1 } : i
      )
    });
  };

  const calcSubtotal = () => form.items.reduce((s, i) => s + i.mrp * i.quantity, 0);
  
  const calcDiscountAmount = () => {
    const subtotal = calcSubtotal();
    if (form.discountType === 'percentage') {
      return (subtotal * form.discount) / 100;
    }
    return form.discount;
  };

  const calcCustomerDiscount = () => {
    const subtotal = calcSubtotal();
    return selectedCustomer ? (subtotal * selectedCustomer.additionalDiscount) / 100 : 0;
  };

  const calcTotal = () => {
    const subtotal = calcSubtotal();
    const discountAmount = calcDiscountAmount();
    const customerDiscount = calcCustomerDiscount();
    return subtotal - discountAmount - customerDiscount;
  };

  const goToNextStep = () => {
    if (currentStep === 'customer' && !selectedCustomer) {
      alert('Please select a customer');
      return;
    }
    if (currentStep === 'products' && form.items.length === 0) {
      alert('Please add at least one product');
      return;
    }
    if (currentStep === 'customer') setCurrentStep('products');
    else if (currentStep === 'products') setCurrentStep('discount');
    else if (currentStep === 'discount') setCurrentStep('review');
  };

  const goToPreviousStep = () => {
    if (currentStep === 'products') setCurrentStep('customer');
    else if (currentStep === 'discount') setCurrentStep('products');
    else if (currentStep === 'review') setCurrentStep('discount');
  };

  const handleCreateBill = async () => {
    if (!form.customerId || !form.items.length) {
      alert('Please select a customer and add products');
      return;
    }

    setSubmitting(true);
    const subtotal = calcSubtotal();
    const discountAmount = calcDiscountAmount();
    const customerDiscount = calcCustomerDiscount();
    const total = subtotal - discountAmount - customerDiscount;
    
    const paidAmount = form.paymentMethod === 'credit' ? 0 : form.paidAmount || 0;
    const remaining = Math.max(0, total - paidAmount);
    const status = paidAmount >= total ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';

    try {
      const res = await axios.post(`${API_URL}/bills`, {
        customerId: form.customerId,
        items: form.items.map(i => ({
          productId: i.productId,
          productName: i.productName || products.find(p => p.id === i.productId)?.name || 'Unknown',
          quantity: i.quantity,
          mrp: i.mrp,
          total: i.mrp * i.quantity
        })),
        subtotal,
        discount: discountAmount,
        customerDiscount,
        total,
        paidAmount,
        remainingAmount: remaining,
        paymentMethod: form.paymentMethod,
        paymentStatus: status,
      });

      setBills([res.data, ...bills]);
      setIsNewBillOpen(false);
      resetForm();
      fetchStats();
      
      if (confirm('✅ Bill created successfully! Would you like to download the PDF?')) {
        generateBillPDF(res.data);
      }
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create bill');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBill = async () => {
    if (!editingBillId || !form.customerId || !form.items.length) {
      alert('Please select a customer and add products');
      return;
    }

    setSubmitting(true);
    const subtotal = calcSubtotal();
    const discountAmount = calcDiscountAmount();
    const customerDiscount = calcCustomerDiscount();
    const total = subtotal - discountAmount - customerDiscount;
    
    const paidAmount = form.paymentMethod === 'credit' ? 0 : form.paidAmount || 0;
    const remaining = Math.max(0, total - paidAmount);
    const status = paidAmount >= total ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';

    try {
      const res = await axios.put(`${API_URL}/bills/${editingBillId}`, {
        customerId: form.customerId,
        items: form.items.map(i => ({
          productId: i.productId,
          productName: i.productName || products.find(p => p.id === i.productId)?.name || 'Unknown',
          quantity: i.quantity,
          mrp: i.mrp,
          total: i.mrp * i.quantity
        })),
        subtotal,
        discount: discountAmount,
        customerDiscount,
        total,
        paidAmount,
        remainingAmount: remaining,
        paymentMethod: form.paymentMethod,
        paymentStatus: status,
      });

      setBills(bills.map(b => b.id === editingBillId ? res.data : b));
      setIsEditOpen(false);
      resetForm();
      fetchStats();
      alert('✅ Bill updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to update bill');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ customerId: '', items: [], discount: 0, discountType: 'percentage', paymentMethod: 'cash', paidAmount: 0 });
    setSelectedCustomer(null);
    setCustomerSearch('');
    setProductSearch('');
    setEditingBillId(null);
    setCurrentStep('customer');
    setCustomerSuggestions([]);
    setProductSuggestions([]);
    setShowCustomerSuggestions(false);
    setShowProductSuggestions(false);
  };

  const handleEditBill = (bill: Bill) => {
    setEditingBillId(bill.id);
    const customer: Customer = {
      id: bill.customerId,
      name: bill.customerName,
      contact: bill.customerContact,
      address: bill.customerAddress,
      pincode: '',
      cityVillage: '',
      email: null,
      additionalDiscount: 0,
      isActive: true
    };
    setSelectedCustomer(customer);
    setCustomerSearch(bill.customerName);
    setForm({
      customerId: bill.customerId,
      items: bill.items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        mrp: i.mrp,
        productName: i.productName
      })),
      discount: 0,
      discountType: 'percentage',
      paymentMethod: bill.paymentMethod || 'cash',
      paidAmount: bill.paidAmount || 0,
    });
    setCurrentStep('customer');
    setIsEditOpen(true);
  };

  const handlePayment = async () => {
    if (!paymentBill || paymentAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (paymentAmount > paymentBill.remainingAmount) {
      alert(`Max: ₹${paymentBill.remainingAmount.toFixed(2)}`);
      return;
    }

    try {
      const res = await axios.patch(`${API_URL}/bills/${paymentBill.id}/payment`, {
        paidAmount: paymentAmount,
        paymentMethod,
        note: 'Payment received'
      });
      const updated = res.data.bill;
      setBills(bills.map(b => b.id === updated.id ? updated : b));
      setIsPaymentOpen(false);
      setPaymentBill(null);
      fetchStats();
      alert(`✅ ₹${paymentAmount.toFixed(2)} payment processed!`);
    } catch (error) {
      alert('Failed to process payment');
    }
  };

  const deleteBill = async (id: string) => {
    if (!confirm('Delete this bill?')) return;
    try {
      await axios.delete(`${API_URL}/bills/${id}`);
      setBills(bills.filter(b => b.id !== id));
      fetchStats();
    } catch {
      alert('Failed to delete');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = { 
      paid: 'bg-green-100 text-green-700', 
      partial: 'bg-yellow-100 text-yellow-700', 
      pending: 'bg-red-100 text-red-700', 
      overdue: 'bg-gray-100 text-gray-700' 
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getStatusBadge = (status: string, remaining: number) => {
    if (status === 'partial' && remaining > 0) {
      return `Partial (₹${remaining.toFixed(0)})`;
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // ============================================
  // Effects
  // ============================================
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setShowCustomerSuggestions(false);
      }
      if (productRef.current && !productRef.current.contains(e.target as Node)) {
        setShowProductSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // ============================================
  // RENDER - BILL FORM STEPS
  // ============================================
  const renderStepIndicator = () => (
    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
      {['customer', 'products', 'discount', 'review'].map((step, index) => {
        const stepLabels = ['Customer', 'Products', 'Discount', 'Review'];
        const isActive = currentStep === step;
        const isCompleted = ['customer', 'products', 'discount', 'review'].indexOf(step) < ['customer', 'products', 'discount', 'review'].indexOf(currentStep);
        
        return (
          <div key={step} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' : 
                isCompleted ? 'bg-green-500 text-white' : 
                'bg-gray-200 text-gray-500'
              }`}>
                {isCompleted ? <FiCheckCircle className="w-4 h-4" /> : index + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${
                isActive ? 'text-blue-600' : 
                isCompleted ? 'text-green-600' : 
                'text-gray-500'
              }`}>
                {stepLabels[index]}
              </span>
            </div>
            {index < 3 && (
              <div className={`w-8 sm:w-12 h-0.5 mx-2 sm:mx-3 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ============================================
  // RENDER - CUSTOMER STEP (Improved Scroll)
  // ============================================
  const renderCustomerStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <FiUser className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Select Customer</h3>
          <p className="text-sm text-gray-500">Type name or phone number to search</p>
        </div>
      </div>

      <div ref={customerRef} className="relative">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={customerInputRef}
            type="text"
            value={customerSearch}
            onChange={(e) => handleCustomerSearch(e.target.value)}
            onFocus={() => {
              if (customerSearch.trim().length >= 2) {
                setShowCustomerSuggestions(true);
              }
            }}
            placeholder="Type name or phone number..."
            className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            autoComplete="off"
          />
        </div>
        
        {/* Customer Suggestions Dropdown - Fixed Scrolling */}
        {showCustomerSuggestions && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
            <div className="max-h-52 overflow-y-auto">
              {isSearchingCustomer ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
                  <FiLoader className="w-4 h-4 animate-spin" /> Searching...
                </div>
              ) : customerSuggestions.length > 0 ? (
                customerSuggestions.map(c => (
                  <button
                    key={c.id}
                    onClick={() => selectCustomer(c)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                      <FiUser className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{c.name}</div>
                      <div className="text-sm text-gray-500">📞 {c.contact} · {c.cityVillage || c.address || 'N/A'}</div>
                      {c.additionalDiscount > 0 && (
                        <span className="text-xs text-green-600 font-medium">🎯 {c.additionalDiscount}% discount</span>
                      )}
                    </div>
                    <FiChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                ))
              ) : customerSearch.trim().length >= 2 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No customers found. <button className="text-blue-600 hover:underline">Create new customer</button>
                </div>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-400 text-center">
                  Type at least 2 characters to search
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg flex-shrink-0">
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{selectedCustomer.name}</div>
                <div className="text-sm text-gray-600">📞 {selectedCustomer.contact}</div>
                <div className="text-sm text-gray-600">📍 {selectedCustomer.address || selectedCustomer.cityVillage || 'N/A'}</div>
                {selectedCustomer.additionalDiscount > 0 && (
                  <div className="text-xs text-green-600 font-medium">🎯 {selectedCustomer.additionalDiscount}% Customer Discount Applied</div>
                )}
              </div>
            </div>
            <button 
              onClick={() => { 
                setSelectedCustomer(null); 
                setCustomerSearch(''); 
                setForm({ ...form, customerId: '' });
                setShowCustomerSuggestions(false);
              }} 
              className="p-1.5 hover:bg-white/50 rounded-lg transition-colors flex-shrink-0"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ============================================
  // RENDER - PRODUCTS STEP (Fixed Flow)
  // ============================================
  const renderProductsStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <FiPackage className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Add Products</h3>
          <p className="text-sm text-gray-500">Search and click product to add with quantity</p>
        </div>
      </div>

      {/* Product Search */}
      <div ref={productRef} className="relative">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={productInputRef}
            type="text"
            value={productSearch}
            onChange={(e) => handleProductSearch(e.target.value)}
            onFocus={() => {
              if (productSearch.trim().length >= 2) {
                setShowProductSuggestions(true);
              }
            }}
            placeholder="Type product name to search..."
            className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
            autoComplete="off"
          />
        </div>
        
        {/* Product Suggestions Dropdown - Fixed Scrolling */}
        {showProductSuggestions && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
            <div className="max-h-52 overflow-y-auto">
              {isSearchingProduct ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
                  <FiLoader className="w-4 h-4 animate-spin" /> Searching...
                </div>
              ) : productSuggestions.length > 0 ? (
                productSuggestions.map(p => (
                  <button
                    key={p.id}
                    onClick={() => selectProduct(p)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors flex items-center gap-3"
                  >
                    {p.images?.length > 0 && (
                      <img src={getImageUrl(p.images[0])} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{p.name}</div>
                      <div className="text-sm text-gray-500">
                        ₹{p.price} 
                        {p.discount > 0 && (
                          <span className="text-green-600 ml-2">({p.discount}% off)</span>
                        )}
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-sm hover:from-purple-700 hover:to-purple-800 transition-colors shadow-lg shadow-purple-500/30 flex-shrink-0">
                      Add
                    </button>
                  </button>
                ))
              ) : productSearch.trim().length >= 2 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">No products found</div>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-400 text-center">
                  Type at least 2 characters to search
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Items List */}
      {form.items.length > 0 ? (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              {form.items.length} item{form.items.length > 1 ? 's' : ''} added
            </span>
            <span className="text-sm font-semibold text-blue-600">Subtotal: ₹{calcSubtotal().toFixed(2)}</span>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {form.items.map((item) => {
              const product = products.find(p => p.id === item.productId);
              return (
                <div key={item.productId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                  {product?.images?.length > 0 && (
                    <img src={getImageUrl(product.images[0])} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{product?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">₹{item.mrp} × {item.quantity} = <span className="font-medium text-gray-700">₹{(item.mrp * item.quantity).toFixed(0)}</span></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => decrementQuantity(item.productId)}
                      className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors"
                      disabled={item.quantity <= 1}
                    >
                      <FiMinus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => incrementQuantity(item.productId)}
                      className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors"
                    >
                      <FiPlusIcon className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeItem(item.productId)} className="ml-1 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <FiShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No products added yet</p>
          <p className="text-sm text-gray-400">Search and click a product to add</p>
        </div>
      )}
    </div>
  );

  const renderDiscountStep = () => {
    const subtotal = calcSubtotal();
    const customerDiscount = calcCustomerDiscount();
    const discountAmount = calcDiscountAmount();
    const total = calcTotal();

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <FiPercent className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Discount & Payment</h3>
            <p className="text-sm text-gray-500">Apply discounts and choose payment method</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FiPercent className="w-4 h-4 text-yellow-600" />
                Apply Discount
              </h4>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setForm({ ...form, discountType: 'percentage' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 ${
                    form.discountType === 'percentage' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  onClick={() => setForm({ ...form, discountType: 'fixed' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 ${
                    form.discountType === 'fixed' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Fixed (₹)
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: Math.max(0, parseFloat(e.target.value) || 0) })}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step={form.discountType === 'percentage' ? 1 : 1}
                  placeholder={form.discountType === 'percentage' ? 'Enter %' : 'Enter amount'}
                />
                <span className="text-sm font-medium text-gray-500 w-4">
                  {form.discountType === 'percentage' ? '%' : '₹'}
                </span>
              </div>
            </div>

            {selectedCustomer?.additionalDiscount > 0 && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
                <div className="flex items-center gap-2 text-green-700">
                  <FiUserCheck className="w-4 h-4" />
                  <span className="font-medium">Customer Discount: {selectedCustomer.additionalDiscount}%</span>
                </div>
                <p className="text-sm text-green-600 mt-1">₹{customerDiscount.toFixed(2)} will be applied automatically</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FiCreditCard className="w-4 h-4 text-blue-600" />
                Payment Method
              </h4>
              <div className="flex gap-2">
                {['cash', 'online', 'credit'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setForm({ ...form, paymentMethod: m as any })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 capitalize ${
                      form.paymentMethod === m 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {form.paymentMethod !== 'credit' && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-3">Payment Amount</h4>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Paid:</span>
                  <input
                    type="number"
                    value={form.paidAmount}
                    onChange={(e) => setForm({ ...form, paidAmount: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="1"
                    placeholder="Enter amount"
                  />
                  <span className="text-sm font-medium text-gray-500">/ ₹{total.toFixed(0)}</span>
                </div>
                <button
                  onClick={() => setForm({ ...form, paidAmount: total })}
                  className="mt-2 text-sm text-blue-600 hover:underline font-medium"
                >
                  Pay Full Amount
                </button>
              </div>
            )}

            {form.paymentMethod === 'credit' && (
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 shadow-sm">
                <div className="flex items-center gap-2 text-yellow-700">
                  <FiClock className="w-4 h-4" />
                  <span className="font-medium">Credit Payment</span>
                </div>
                <p className="text-sm text-yellow-600 mt-1">Payment will be collected later</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-gray-500">Subtotal</p>
              <p className="text-sm font-semibold text-gray-900">₹{subtotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Discount</p>
              <p className="text-sm font-semibold text-red-500">-₹{discountAmount.toFixed(2)}</p>
            </div>
            {selectedCustomer?.additionalDiscount > 0 && (
              <div>
                <p className="text-xs text-gray-500">Customer Disc.</p>
                <p className="text-sm font-semibold text-green-600">-₹{customerDiscount.toFixed(2)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Grand Total</p>
              <p className="text-lg font-bold text-blue-600">₹{total.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReviewStep = () => {
    const subtotal = calcSubtotal();
    const discountAmount = calcDiscountAmount();
    const customerDiscount = calcCustomerDiscount();
    const total = calcTotal();
    const remaining = total - form.paidAmount;

    const createPreviewBill = () => {
      if (!selectedCustomer) return null;
      return {
        id: 'preview',
        billNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        customerId: form.customerId,
        customerName: selectedCustomer.name,
        customerContact: selectedCustomer.contact,
        customerAddress: selectedCustomer.address || selectedCustomer.cityVillage || '',
        items: form.items.map(i => ({
          productId: i.productId,
          productName: i.productName || products.find(p => p.id === i.productId)?.name || 'Unknown',
          quantity: i.quantity,
          mrp: i.mrp,
          total: i.mrp * i.quantity
        })),
        subtotal,
        discount: discountAmount,
        customerDiscount: customerDiscount,
        total,
        paidAmount: form.paidAmount,
        remainingAmount: remaining,
        paymentMethod: form.paymentMethod,
        paymentStatus: form.paymentMethod === 'credit' ? 'pending' : 
                       form.paidAmount >= total ? 'paid' : 
                       form.paidAmount > 0 ? 'partial' : 'pending',
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Bill;
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b-2 border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <FiFileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Invoice Preview</h3>
              <p className="text-sm text-gray-500">Review the complete invoice before generation</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Invoice #</div>
            <div className="text-sm font-mono font-bold text-blue-600">
              INV-{new Date().getFullYear()}-{String(Math.floor(Math.random() * 10000)).padStart(4, '0')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              <FiUser className="w-4 h-4" />
              <span>Bill To</span>
            </div>
            {selectedCustomer ? (
              <>
                <div className="font-bold text-gray-900 text-lg">{selectedCustomer.name}</div>
                <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  <span>📞</span> {selectedCustomer.contact}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <span>📍</span> {selectedCustomer.address || selectedCustomer.cityVillage || 'N/A'}
                </div>
                {selectedCustomer.email && (
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span>✉️</span> {selectedCustomer.email}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500">No customer selected</div>
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              <FiCalendar className="w-4 h-4" />
              <span>Invoice Details</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-medium">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment Method</span>
                <span className="font-medium capitalize">{form.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment Status</span>
                <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                  form.paymentMethod === 'credit' ? 'bg-yellow-100 text-yellow-700' :
                  form.paidAmount >= total ? 'bg-green-100 text-green-700' :
                  form.paidAmount > 0 ? 'bg-blue-100 text-blue-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {form.paymentMethod === 'credit' ? 'On Credit' :
                   form.paidAmount >= total ? 'Paid' :
                   form.paidAmount > 0 ? 'Partial' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item Description</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Rate</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {form.items.length > 0 ? (
                form.items.map((item, idx) => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <tr key={item.productId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-center text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.productName || product?.name || 'Unknown'}</div>
                        {product?.category && (
                          <div className="text-xs text-gray-400">{product.category}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">₹{item.mrp.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-600 font-semibold rounded-lg">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">₹{(item.mrp * item.quantity).toFixed(2)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    <FiShoppingBag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No items added
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-full md:w-80">
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-red-500 font-medium">-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                {customerDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Customer Discount ({selectedCustomer?.additionalDiscount}%)</span>
                    <span className="text-green-500 font-medium">-₹{customerDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-base font-bold text-gray-900">Grand Total</span>
                    <span className="text-xl font-bold text-blue-600">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {form.paymentMethod !== 'credit' && (
                  <div className="border-t border-gray-200 pt-2 mt-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount Paid</span>
                      <span className="text-green-600 font-medium">₹{form.paidAmount.toFixed(2)}</span>
                    </div>
                    {remaining > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Balance Due</span>
                        <span className="text-red-500 font-bold">₹{remaining.toFixed(2)}</span>
                      </div>
                    )}
                    {remaining <= 0 && form.paidAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status</span>
                        <span className="text-green-600 font-bold">✓ Paid in Full</span>
                      </div>
                    )}
                  </div>
                )}

                {form.paymentMethod === 'credit' && (
                  <div className="border-t border-gray-200 pt-2 mt-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status</span>
                      <span className="text-yellow-600 font-bold">📋 On Credit</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Due Date</span>
                      <span className="font-medium">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
          <div className="flex items-start gap-3">
            <FiFileText className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-yellow-800">Notes</div>
              <div className="text-sm text-yellow-700">
                Goods once sold will not be taken back. Please verify all items before generating the bill.
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => setCurrentStep('discount')}
            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <FiEdit2 className="w-4 h-4" /> Edit Details
          </button>
          
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                const previewBill = createPreviewBill();
                if (previewBill) {
                  generateBillPDF(previewBill);
                } else {
                  alert('Please select a customer and add products first');
                }
              }}
              className="px-4 py-2.5 border-2 border-blue-600 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <FiPrinter className="w-4 h-4" /> Preview PDF
            </button>
            
            <button
              onClick={handleCreateBill}
              disabled={submitting || form.items.length === 0}
              className="flex-1 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
            >
              {submitting ? (
                <><FiLoader className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><FiCheckCircle className="w-4 h-4" /> Generate & Save Bill</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER - MAIN
  // ============================================
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-sm text-gray-500">Manage invoices and payments</p>
        </div>
        <button
          onClick={() => { setIsNewBillOpen(true); setCurrentStep('customer'); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors text-sm font-medium shadow-lg shadow-blue-500/30"
        >
          <FiPlus className="w-4 h-4" />
          New Bill
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <p className="text-xs text-gray-500 font-medium">Total Bills</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalBills || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <p className="text-xs text-gray-500 font-medium">Revenue</p>
          <p className="text-2xl font-bold text-green-600">₹{stats?.totalRevenue?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <p className="text-xs text-gray-500 font-medium">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">₹{stats?.totalRemaining?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <p className="text-xs text-gray-500 font-medium">Today</p>
          <p className="text-2xl font-bold text-blue-600">{stats?.today?.bills || 0}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search bills by number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </select>
          <button
            onClick={() => { fetchBills(); fetchStats(); }}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  <FiLoader className="w-5 h-5 mx-auto animate-spin mb-2" />
                  Loading...
                </td></tr>
              ) : bills.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  <FiFileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No bills found
                </td></tr>
              ) : bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-blue-600">{bill.billNumber}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{bill.customerName}</div>
                    <div className="text-xs text-gray-400">{bill.customerContact}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {new Date(bill.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">₹{bill.total.toFixed(0)}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">₹{bill.paidAmount.toFixed(0)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bill.paymentStatus)}`}>
                      {getStatusBadge(bill.paymentStatus, bill.remainingAmount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => generateBillPDF(bill)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <FiDownload className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditBill(bill)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Bill"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setSelectedBill(bill); setIsViewOpen(true); }}
                        className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                        title="View"
                      >
                        <FiEye className="w-4 h-4" />
                      </button>
                      {bill.paymentStatus !== 'paid' && bill.remainingAmount > 0 && (
                        <button
                          onClick={() => { setPaymentBill(bill); setPaymentAmount(0); setPaymentMethod(bill.paymentMethod || 'cash'); setIsPaymentOpen(true); }}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Receive Payment"
                        >
                          <FiCheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteBill(bill.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* NEW BILL MODAL */}
      {/* ========================================== */}
      {isNewBillOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900">Create New Bill</h2>
              <button onClick={() => { setIsNewBillOpen(false); resetForm(); }} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {renderStepIndicator()}

            <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
              {currentStep === 'customer' && renderCustomerStep()}
              {currentStep === 'products' && renderProductsStep()}
              {currentStep === 'discount' && renderDiscountStep()}
              {currentStep === 'review' && renderReviewStep()}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-between">
              <button
                onClick={goToPreviousStep}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                  currentStep === 'customer' ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'
                }`}
                disabled={currentStep === 'customer'}
              >
                <FiChevronLeft className="w-4 h-4" /> Back
              </button>
              {currentStep !== 'review' ? (
                <button
                  onClick={goToNextStep}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/30"
                >
                  Continue <FiChevronRight className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* EDIT BILL MODAL */}
      {/* ========================================== */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Edit Bill</h2>
              <button onClick={() => { setIsEditOpen(false); resetForm(); }} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {renderStepIndicator()}

            <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
              {currentStep === 'customer' && renderCustomerStep()}
              {currentStep === 'products' && renderProductsStep()}
              {currentStep === 'discount' && renderDiscountStep()}
              {currentStep === 'review' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                      <FiCheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Review & Update</h3>
                      <p className="text-sm text-gray-500">Review the bill details before updating</p>
                    </div>
                  </div>

                  {selectedCustomer && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                          {selectedCustomer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{selectedCustomer.name}</div>
                          <div className="text-sm text-gray-600">📞 {selectedCustomer.contact}</div>
                        </div>
                      </div>
                      <button onClick={() => setCurrentStep('customer')} className="text-sm text-blue-600 hover:underline">
                        Edit
                      </button>
                    </div>
                  )}

                  <div className="border rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 flex justify-between text-sm font-medium text-gray-700">
                      <span>{form.items.length} items</span>
                      <button onClick={() => setCurrentStep('products')} className="text-blue-600 hover:underline font-normal">
                        Edit
                      </button>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-32 overflow-y-auto">
                      {form.items.map((item, idx) => (
                        <div key={item.productId} className="px-4 py-2 flex justify-between text-sm">
                          <span>{idx + 1}. {item.productName || 'Unknown'} × {item.quantity}</span>
                          <span className="font-medium">₹{(item.mrp * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-gray-600">Subtotal</span>
                      <span>₹{calcSubtotal().toFixed(2)}</span>
                    </div>
                    {calcDiscountAmount() > 0 && (
                      <div className="flex justify-between text-sm py-1">
                        <span className="text-gray-600">Discount</span>
                        <span className="text-red-500">-₹{calcDiscountAmount().toFixed(2)}</span>
                      </div>
                    )}
                    {calcCustomerDiscount() > 0 && (
                      <div className="flex justify-between text-sm py-1">
                        <span className="text-gray-600">Customer Discount</span>
                        <span className="text-green-500">-₹{calcCustomerDiscount().toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 mt-2">
                      <span className="text-blue-600">Grand Total</span>
                      <span className="text-blue-600">₹{calcTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2">
                      <span className="text-gray-600">Payment Method</span>
                      <span className="font-medium">{form.paymentMethod.toUpperCase()}</span>
                    </div>
                    {form.paymentMethod !== 'credit' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Paid Amount</span>
                        <span className="text-green-600">₹{form.paidAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {form.paymentMethod !== 'credit' && form.paidAmount < calcTotal() && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Remaining</span>
                        <span className="text-yellow-600">₹{(calcTotal() - form.paidAmount).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setCurrentStep('discount')}
                      className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <FiChevronLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      onClick={handleUpdateBill}
                      disabled={submitting}
                      className="flex-1 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                    >
                      {submitting ? (
                        <><FiLoader className="w-4 h-4 animate-spin" /> Updating...</>
                      ) : (
                        <><FiSave className="w-4 h-4" /> Update Bill</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-between">
              <button
                onClick={goToPreviousStep}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                  currentStep === 'customer' ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'
                }`}
                disabled={currentStep === 'customer'}
              >
                <FiChevronLeft className="w-4 h-4" /> Back
              </button>
              {currentStep !== 'review' && (
                <button
                  onClick={goToNextStep}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/30"
                >
                  Continue <FiChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* PAYMENT MODAL */}
      {/* ========================================== */}
      {isPaymentOpen && paymentBill && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Receive Payment</h2>
              <button onClick={() => setIsPaymentOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Bill</span><span className="font-medium">{paymentBill.billNumber}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Customer</span><span className="font-medium">{paymentBill.customerName}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Total</span><span className="font-medium">₹{paymentBill.total.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Paid</span><span className="font-medium text-green-600">₹{paymentBill.paidAmount.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-200"><span className="text-gray-700">Remaining</span><span className="text-red-600">₹{paymentBill.remainingAmount.toFixed(2)}</span></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(Math.max(0, parseFloat(e.target.value) || 0))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter amount" min="0" step="1" />
                <p className="text-xs text-gray-400 mt-1">Max: ₹{paymentBill.remainingAmount.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                  <option value="credit">Credit</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsPaymentOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handlePayment} disabled={paymentAmount <= 0 || paymentAmount > paymentBill.remainingAmount} className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30">Process Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* VIEW BILL MODAL */}
      {/* ========================================== */}
      {isViewOpen && selectedBill && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Bill #{selectedBill.billNumber}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => generateBillPDF(selectedBill)} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5">
                  <FiDownload className="w-4 h-4" /> PDF
                </button>
                <button onClick={() => { setIsViewOpen(false); handleEditBill(selectedBill); }} className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5">
                  <FiEdit2 className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => setIsViewOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-500 uppercase font-medium">Customer</div>
                    <div className="font-medium text-gray-900">{selectedBill.customerName}</div>
                    <div className="text-sm text-gray-500">{selectedBill.customerContact}</div>
                    <div className="text-sm text-gray-500">{selectedBill.customerAddress}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-500 uppercase font-medium">Details</div>
                    <div className="text-sm text-gray-700">Date: {new Date(selectedBill.date).toLocaleDateString('en-IN')}</div>
                    <div className="text-sm text-gray-700">Method: {selectedBill.paymentMethod.toUpperCase()}</div>
                    <div className="text-sm text-gray-700">
                      Status: <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedBill.paymentStatus)}`}>
                        {getStatusBadge(selectedBill.paymentStatus, selectedBill.remainingAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">MRP</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedBill.items.map((item, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-center text-gray-500">{i+1}</td>
                          <td className="px-4 py-2 text-gray-900">{item.productName}</td>
                          <td className="px-4 py-2 text-right text-gray-600">₹{item.mrp.toFixed(2)}</td>
                          <td className="px-4 py-2 text-center text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-2 text-right font-medium">₹{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <div className="w-64 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{selectedBill.subtotal.toFixed(2)}</span></div>
                    {selectedBill.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="text-red-500">-₹{selectedBill.discount.toFixed(2)}</span></div>}
                    {selectedBill.customerDiscount > 0 && <div className="flex justify-between"><span className="text-gray-500">Customer Discount</span><span className="text-green-500">-₹{selectedBill.customerDiscount.toFixed(2)}</span></div>}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span className="text-blue-600">₹{selectedBill.total.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-500">Paid</span><span className="text-green-600">₹{selectedBill.paidAmount.toFixed(2)}</span></div>
                    {selectedBill.remainingAmount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Remaining</span><span className="text-red-600">₹{selectedBill.remainingAmount.toFixed(2)}</span></div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBilling;