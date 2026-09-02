// AdminBilling.tsx - Redesigned for Efficiency
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
  FiMinus,
  FiPlus as FiPlusIcon,
  FiArrowRight
} from 'react-icons/fi';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import companyLogo from '../../assets/Logo.png';

// ============================================
// API CONFIGURATION & CONSTANTS
// ============================================
const API_BASE = import.meta.env.VITE_API_URL || '';
const API_URL = `${API_BASE}/api`;

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
// PDF GENERATION (same as original)
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
// MAIN COMPONENT - REDESIGNED
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

  // NEW: Cart state - consolidated billing items
  const [cartItems, setCartItems] = useState<{
    productId: string;
    productName: string;
    quantity: number;
    mrp: number;
    total: number;
  }[]>([]);
  
  // NEW: Single item being added
  const [quantityInput, setQuantityInput] = useState<{ [key: string]: number }>({});

  // Form state (simplified)
  const [form, setForm] = useState({
    discount: 0,
    discountType: 'percentage' as 'percentage' | 'fixed',
    paymentMethod: 'cash' as 'cash' | 'online' | 'credit',
    paidAmount: 0,
    notes: '',
  });

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
  // NEW: Cart & Billing Handlers
  // ============================================
  
  // Add product to cart with quantity
  const addProductToCart = (product: Product, quantity: number = 1) => {
    if (quantity <= 0) return;
    
    setCartItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => 
          i.productId === product.id 
            ? { 
                ...i, 
                quantity: i.quantity + quantity,
                total: (i.quantity + quantity) * i.mrp 
              }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: quantity,
          mrp: product.price,
          total: quantity * product.price
        }
      ];
    });

    // Clear search and suggestions
    setProductSearch('');
    setProductSuggestions([]);
    setShowProductSuggestions(false);
    setTimeout(() => productInputRef.current?.focus(), 100);
  };

  // Update item quantity
  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeCartItem(productId);
      return;
    }
    
    setCartItems(prev => 
      prev.map(i => 
        i.productId === productId 
          ? { ...i, quantity: newQuantity, total: newQuantity * i.mrp }
          : i
      )
    );
  };

  // Remove item from cart
  const removeCartItem = (productId: string) => {
    setCartItems(prev => prev.filter(i => i.productId !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
    setProductSearch('');
    setForm(prev => ({ ...prev, discount: 0, paidAmount: 0 }));
  };

  // Calculate totals
  const calcSubtotal = () => cartItems.reduce((s, i) => s + i.total, 0);
  
  const calcDiscountAmount = () => {
    const subtotal = calcSubtotal();
    if (form.discountType === 'percentage') {
      return (subtotal * form.discount) / 100;
    }
    return Math.min(form.discount, subtotal);
  };

  const calcCustomerDiscount = () => {
    const subtotal = calcSubtotal();
    return selectedCustomer ? (subtotal * selectedCustomer.additionalDiscount) / 100 : 0;
  };

  const calcTotal = () => {
    const subtotal = calcSubtotal();
    const discountAmount = calcDiscountAmount();
    const customerDiscount = calcCustomerDiscount();
    return Math.max(0, subtotal - discountAmount - customerDiscount);
  };

  const getRemainingAmount = () => {
    const total = calcTotal();
    const paid = form.paymentMethod === 'credit' ? 0 : form.paidAmount;
    return Math.max(0, total - paid);
  };

  // ============================================
  // Bill Creation
  // ============================================
  const handleCreateBill = async () => {
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }
    if (cartItems.length === 0) {
      alert('Please add at least one product');
      return;
    }

    setSubmitting(true);
    const subtotal = calcSubtotal();
    const discountAmount = calcDiscountAmount();
    const customerDiscount = calcCustomerDiscount();
    const total = calcTotal();
    
    const paidAmount = form.paymentMethod === 'credit' ? 0 : form.paidAmount || 0;
    const remaining = Math.max(0, total - paidAmount);
    const status = paidAmount >= total ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';

    try {
      const res = await axios.post(`${API_URL}/bills`, {
        customerId: selectedCustomer.id,
        items: cartItems.map(i => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          mrp: i.mrp,
          total: i.total
        })),
        subtotal,
        discount: discountAmount,
        customerDiscount,
        total,
        paidAmount,
        remainingAmount: remaining,
        paymentMethod: form.paymentMethod,
        paymentStatus: status,
        notes: form.notes,
      });

      setBills([res.data, ...bills]);
      setIsNewBillOpen(false);
      clearCart();
      setSelectedCustomer(null);
      setCustomerSearch('');
      setForm({ discount: 0, discountType: 'percentage', paymentMethod: 'cash', paidAmount: 0, notes: '' });
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

  // ============================================
  // Handlers - Customer Selection
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
    // Focus on product search after customer selection
    setTimeout(() => productInputRef.current?.focus(), 200);
  };

  // ============================================
  // Handlers - Product Search
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

  // ============================================
  // Other Handlers
  // ============================================
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

  const handleEditBill = (bill: Bill) => {
    // Open edit in a separate modal or navigate
    alert('Edit functionality - expand as needed');
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
    fetchBills();
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // ============================================
  // RENDER - NEW BILL MODAL (Single Page)
  // ============================================
  const renderNewBillModal = () => {
    const subtotal = calcSubtotal();
    const discountAmount = calcDiscountAmount();
    const customerDiscount = calcCustomerDiscount();
    const total = calcTotal();
    const remaining = getRemainingAmount();

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <FiFileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">New Bill</h2>
                <p className="text-xs text-gray-500">Select customer, add products, and generate invoice</p>
              </div>
            </div>
            <button onClick={() => { setIsNewBillOpen(false); clearCart(); setSelectedCustomer(null); setCustomerSearch(''); }} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Main Content - Two Column Layout */}
          <div className="p-6 overflow-y-auto max-h-[calc(95vh-160px)]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Customer & Product Selection */}
              <div className="lg:col-span-2 space-y-6">
                {/* Customer Selection */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <FiUser className="w-4 h-4 text-blue-600" />
                    <span>Customer</span>
                    {selectedCustomer && (
                      <span className="ml-auto text-xs text-green-600 font-medium flex items-center gap-1">
                        <FiCheckCircle className="w-3 h-3" /> Selected
                      </span>
                    )}
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
                        placeholder="Search customer by name or phone..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                        autoComplete="off"
                      />
                    </div>
                    
                    {showCustomerSuggestions && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
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
                                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                                  <FiUser className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 text-sm">{c.name}</div>
                                  <div className="text-xs text-gray-500">📞 {c.contact} · {c.cityVillage || c.address || 'N/A'}</div>
                                </div>
                                {c.additionalDiscount > 0 && (
                                  <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full flex-shrink-0">
                                    {c.additionalDiscount}% off
                                  </span>
                                )}
                              </button>
                            ))
                          ) : customerSearch.trim().length >= 2 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">No customers found</div>
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">Type at least 2 characters to search</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedCustomer && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg flex-shrink-0">
                          {selectedCustomer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{selectedCustomer.name}</div>
                          <div className="text-xs text-gray-600">📞 {selectedCustomer.contact}</div>
                          {selectedCustomer.additionalDiscount > 0 && (
                            <div className="text-xs text-green-600 font-medium">⭐ {selectedCustomer.additionalDiscount}% discount applied</div>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => { 
                          setSelectedCustomer(null); 
                          setCustomerSearch(''); 
                          setShowCustomerSuggestions(false);
                        }} 
                        className="p-1 hover:bg-white/50 rounded-lg transition-colors flex-shrink-0"
                      >
                        <FiX className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Product Selection */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <FiPackage className="w-4 h-4 text-purple-600" />
                    <span>Add Products</span>
                    <span className="ml-auto text-xs text-gray-400">{cartItems.length} item{cartItems.length > 1 ? 's' : ''} added</span>
                  </div>
                  
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
                        placeholder="Search products by name..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                        autoComplete="off"
                        disabled={!selectedCustomer}
                      />
                    </div>
                    
                    {showProductSuggestions && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                        <div className="max-h-52 overflow-y-auto">
                          {isSearchingProduct ? (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
                              <FiLoader className="w-4 h-4 animate-spin" /> Searching...
                            </div>
                          ) : productSuggestions.length > 0 ? (
                            productSuggestions.map(p => {
                              const currentQty = cartItems.find(i => i.productId === p.id)?.quantity || 0;
                              return (
                                <div key={p.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors flex items-center gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 text-sm">{p.name}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-3">
                                      <span>₹{p.price}</span>
                                      {p.discount > 0 && (
                                        <span className="text-green-600">({p.discount}% off)</span>
                                      )}
                                      {currentQty > 0 && (
                                        <span className="text-blue-600 font-medium">(Added: {currentQty})</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <input
                                      type="text"
                                      min="1"
                                      max="999"
                                      value={quantityInput[p.id] || 1}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value) || 1;
                                        setQuantityInput(prev => ({ ...prev, [p.id]: Math.max(1, val) }));
                                      }}
                                      className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <button
                                      onClick={() => {
                                        const qty = quantityInput[p.id] || 1;
                                        addProductToCart(p, Math.max(1, qty));
                                        setQuantityInput(prev => ({ ...prev, [p.id]: 1 }));
                                      }}
                                      className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-sm hover:from-purple-700 hover:to-purple-800 transition-colors shadow-lg shadow-purple-500/30 flex-shrink-0"
                                    >
                                      Add
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          ) : productSearch.trim().length >= 2 ? (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">No products found</div>
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">Type at least 2 characters to search</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {!selectedCustomer && (
                    <div className="mt-2 text-xs text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg">
                      ⚠️ Please select a customer first
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Cart & Summary */}
              <div className="lg:col-span-1 space-y-6">
                {/* Cart Items */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Cart</span>
                    {cartItems.length > 0 && (
                      <button onClick={clearCart} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                        <FiTrash2 className="w-3 h-3" /> Clear
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto">
                    {cartItems.length > 0 ? (
                      cartItems.map((item) => (
                        <div key={item.productId} className="px-4 py-2.5 border-b border-gray-100 last:border-0 hover:bg-white/50 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">{item.productName}</div>
                              <div className="text-xs text-gray-500">₹{item.mrp} × {item.quantity}</div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                                  className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors"
                                >
                                  <FiMinus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 1;
                                    updateCartItemQuantity(item.productId, Math.max(1, val));
                                  }}
                                  className="w-12 px-1 py-0.5 border border-gray-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                  onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
                                  className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors"
                                >
                                  <FiPlusIcon className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="text-sm font-semibold text-gray-900 w-16 text-right">₹{item.total.toFixed(0)}</span>
                              <button onClick={() => removeCartItem(item.productId)} className="text-gray-400 hover:text-red-500 p-1">
                                <FiX className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FiShoppingBag className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400">Cart is empty</p>
                        <p className="text-xs text-gray-300">Search and add products</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary & Actions */}
                <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 p-4">
                  {/* Totals */}
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Discount</span>
                        <span className="text-red-500 font-medium">-₹{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {customerDiscount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">⭐ Customer Discount</span>
                        <span className="text-green-500 font-medium">-₹{customerDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-blue-600">₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Discount & Payment Controls */}
                  <div className="mt-4 space-y-3 border-t border-gray-200 pt-3">
                    <div className="flex items-center gap-2">
                      <FiPercent className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="number"
                          value={form.discount}
                          onChange={(e) => setForm({ ...form, discount: Math.max(0, parseFloat(e.target.value) || 0) })}
                          className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          step="1"
                          placeholder="0"
                        />
                        <select
                          value={form.discountType}
                          onChange={(e) => setForm({ ...form, discountType: e.target.value as 'percentage' | 'fixed' })}
                          className="px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="percentage">%</option>
                          <option value="fixed">₹</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <FiCreditCard className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <select
                        value={form.paymentMethod}
                        onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as 'cash' | 'online' | 'credit' })}
                        className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="cash">Cash</option>
                        <option value="online">Online</option>
                        <option value="credit">Credit</option>
                      </select>
                    </div>

                    {form.paymentMethod !== 'credit' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-12">Paid:</span>
                        <input
                          type="number"
                          value={form.paidAmount}
                          onChange={(e) => setForm({ ...form, paidAmount: Math.max(0, parseFloat(e.target.value) || 0) })}
                          className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          step="1"
                          placeholder="0"
                        />
                        <button
                          onClick={() => setForm({ ...form, paidAmount: total })}
                          className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap"
                        >
                          Pay Full
                        </button>
                      </div>
                    )}

                    {remaining > 0 && form.paymentMethod !== 'credit' && (
                      <div className="flex justify-between text-sm bg-yellow-50 px-3 py-1.5 rounded-lg">
                        <span className="text-yellow-700">Balance Due</span>
                        <span className="text-yellow-700 font-bold">₹{remaining.toFixed(2)}</span>
                      </div>
                    )}

                    {form.paymentMethod === 'credit' && (
                      <div className="flex justify-between text-sm bg-blue-50 px-3 py-1.5 rounded-lg">
                        <span className="text-blue-700">📋 On Credit</span>
                        <span className="text-blue-700 font-bold">₹{total.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        if (selectedCustomer && cartItems.length > 0) {
                          const previewBill: Bill = {
                            id: 'preview',
                            billNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
                            customerId: selectedCustomer.id,
                            customerName: selectedCustomer.name,
                            customerContact: selectedCustomer.contact,
                            customerAddress: selectedCustomer.address || selectedCustomer.cityVillage || '',
                            items: cartItems,
                            subtotal,
                            discount: discountAmount,
                            customerDiscount,
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
                          };
                          generateBillPDF(previewBill);
                        } else {
                          alert('Please select a customer and add products');
                        }
                      }}
                      className="flex-1 px-3 py-2 border-2 border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FiPrinter className="w-3 h-3" /> Preview
                    </button>
                    <button
                      onClick={handleCreateBill}
                      disabled={submitting || !selectedCustomer || cartItems.length === 0}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/30"
                    >
                      {submitting ? (
                        <><FiLoader className="w-3 h-3 animate-spin" /> Saving...</>
                      ) : (
                        <><FiCheckCircle className="w-3 h-3" /> Generate Bill</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center">
            <div className="text-xs text-gray-400">
              {cartItems.length} item{cartItems.length > 1 ? 's' : ''} · Total: ₹{calcTotal().toFixed(2)}
            </div>
            <button
              onClick={() => { setIsNewBillOpen(false); clearCart(); setSelectedCustomer(null); setCustomerSearch(''); }}
              className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
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
          onClick={() => { setIsNewBillOpen(true); clearCart(); setSelectedCustomer(null); setCustomerSearch(''); }}
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
      {/* NEW BILL MODAL (Redesigned) */}
      {/* ========================================== */}
      {isNewBillOpen && renderNewBillModal()}

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