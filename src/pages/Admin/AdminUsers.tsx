// src/pages/Admin/AdminUsers.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Import your company logo
import companyLogo from '../../assets/Logo.png';

// API Configuration
const API_BASE_URL = '';
const API_URL = `${API_BASE_URL}/api`;

// Company Branding Configuration
const COMPANY_NAME = 'THANGATAMIL CRACKERS';

// ============ Types ============

interface CartItem {
    id: string;
    name: string;
    price: number;
    discountedPrice: number;
    discount: number;
    quantity: number;
    image: string;
    category: string;
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
    user?: UserRegistration;
    totalAmount: number;
    subtotal: number;
    discountAmount: number;
    shippingCharge: number;
    taxAmount: number;
    additionalDiscountPercentage: number;
    additionalDiscountAmount: number;
    finalAmount: number;
    orderStatus: string;
    paymentStatus: string;
    paymentMethod: string;
    referenceId: string;
    isPaid: boolean;
    invoiceNumber: string;
    statusHistory: Record<string, any>;
    staffNotes?: string;
    customerNotes?: string;
    // Payment tracking fields
    paidAmount: number;
    remainingAmount: number;
    paymentHistory: Array<{
        timestamp: string;
        amount: number;
        method: string;
        reference?: string;
        note?: string;
        paymentType: string;
    }>;
    delivery: {
        name: string;
        contact: string;
        pincode: string;
        cityVillage: string;
        address: string;
        email: string;
    };
    items: OrderItem[];
    createdAt: string;
    updatedAt: string;
    confirmedAt?: string;
    processingAt?: string;
    shippedAt?: string;
    completedAt?: string;
    cancelledAt?: string;
}

interface UserRegistration {
    id: string;
    name: string;
    contact: string;
    pincode: string;
    cityVillage: string;
    address: string;
    email: string;
    createdAt: string;
    registrationDate?: string;
    isActive?: boolean;
    additionalDiscount?: number;
    updatedAt?: string;
}

interface OrderWithUser extends Order {
    userDetails: UserRegistration;
}

// ============ Status Configuration - UPPERCASE ============

const ORDER_STATUSES = [
    { value: 'PENDING', label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: '⏳' },
    { value: 'CONFIRMED', label: 'Confirmed', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '✅' },
    { value: 'PROCESSING', label: 'Processing', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', icon: '🔧' },
    { value: 'SHIPPED', label: 'Shipped', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: '🚚' },
    { value: 'COMPLETED', label: 'Completed', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: '🎉' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '❌' },
    { value: 'REFUNDED', label: 'Refunded', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: '💰' },
];

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED'];

const getStatusConfig = (status: string) => {
    return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
};

// ============ Helper Functions ============

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
    if (imagePath.includes('/products/')) {
        return `${API_BASE_URL}${imagePath}`;
    }
    return `${API_BASE_URL}/uploads/products/${imagePath}`;
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
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
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

// ============ Helper function to format payment method for display ============

const getPaymentMethodDisplay = (paymentMethod: string | null | undefined): string => {
    const normalized = paymentMethod || 'cash';
    
    switch (normalized.toLowerCase()) {
        case 'netbanking':
            return 'Online (Net Banking)';
        case 'cash':
            return 'Cash on Delivery';
        case '':
            return 'Cash on Delivery';
        default:
            return 'Not Selected';
    }
};

// ============ Loading Spinner ============

const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
    </div>
);

// ============ API Functions ============

const updateUserDiscountAPI = async (userId: string, discount: number) => {
    try {
        const response = await axios.patch(
            `${API_URL}/users/${userId}/discount`,
            { discount },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating user discount:', error);
        throw error;
    }
};

const updateOrderPaymentAPI = async (orderId: string, data: {
    paymentMethod: string;
    referenceId: string;
    isPaid: boolean;
    paidAmount?: number;
    remainingAmount?: number;
    paymentNote?: string;
}) => {
    try {
        const response = await axios.patch(
            `${API_URL}/orders/${orderId}/payment`,
            data,
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating order payment:', error);
        throw error;
    }
};

const updateOrderStatusAPI = async (orderId: string, status: string, staffNotes?: string, restorationReason?: string) => {
    try {
        const response = await axios.patch(
            `${API_URL}/orders/${orderId}/status`,
            { 
                orderStatus: status, 
                staffNotes,
                restorationReason 
            },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
};

// ============ Restore Dialog Component ============

const RestoreOrderDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    currentStatus: string;
    onRestore: (orderId: string, status: string, reason: string) => void;
}> = ({ isOpen, onClose, orderId, currentStatus, onRestore }) => {
    const [selectedStatus, setSelectedStatus] = useState('PENDING');
    const [reason, setReason] = useState('');
    const [isRestoring, setIsRestoring] = useState(false);
    
    if (!isOpen) return null;
    
    const handleRestore = async () => {
        if (!reason.trim()) {
            alert('Please provide a reason for restoring the order');
            return;
        }
        
        setIsRestoring(true);
        try {
            await onRestore(orderId, selectedStatus, reason);
            onClose();
        } catch (error) {
            console.error('Error restoring order:', error);
            alert('Failed to restore order');
        } finally {
            setIsRestoring(false);
        }
    };
    
    return (
        <>
            <div
                className="fixed inset-0 bg-black/80 z-[70] transition-opacity duration-300"
                onClick={onClose}
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <div className="bg-gray-900 rounded-2xl max-w-md w-full border border-gold-500/20 shadow-2xl shadow-gold-500/10">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="text-2xl">🔄</span>
                                Restore Order
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded-full"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-2">
                                Restore to Status
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
                            >
                                <option value="PENDING">⏳ Pending</option>
                                <option value="CONFIRMED">✅ Confirmed</option>
                                {currentStatus === 'CANCELLED' && (
                                    <option value="PROCESSING">🔧 Processing</option>
                                )}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Current status: <span className="text-yellow-400">{currentStatus.toLowerCase()}</span>
                            </p>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-sm text-gray-400 mb-2">
                                Reason for Restoration
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Why is this order being restored? (e.g., Customer requested to proceed, System error, etc.)"
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all min-h-[80px] text-sm"
                            />
                        </div>
                        
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRestore}
                                disabled={isRestoring || !reason.trim()}
                                className={`px-5 py-2.5 rounded-xl transition-all duration-300 text-sm font-medium flex items-center gap-2 ${
                                    isRestoring || !reason.trim()
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : 'bg-green-500 hover:bg-green-600 text-black hover:scale-105 active:scale-95'
                                }`}
                            >
                                {isRestoring ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Restoring...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Restore Order
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

// ============ Status Dropdown Component with Restore Support ============

const StatusDropdown: React.FC<{
    currentStatus: string;
    orderId: string;
    onStatusChange: (orderId: string, newStatus: string, reason?: string) => void;
    isUpdating?: boolean;
}> = ({ currentStatus, orderId, onStatusChange, isUpdating }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showRestoreDialog, setShowRestoreDialog] = useState(false);
    
    const isCancelledOrRefunded = ['CANCELLED', 'REFUNDED'].includes(currentStatus);
    const currentConfig = getStatusConfig(currentStatus);
    
    const handleStatusChange = (newStatus: string) => {
        // If changing from cancelled/refunded to active status, show restore dialog
        if (isCancelledOrRefunded && !['CANCELLED', 'REFUNDED'].includes(newStatus)) {
            setShowRestoreDialog(true);
            setIsOpen(false);
            return;
        }
        
        if (newStatus !== currentStatus) {
            onStatusChange(orderId, newStatus);
        }
        setIsOpen(false);
    };
    
    const handleRestore = async (orderId: string, status: string, reason: string) => {
        await onStatusChange(orderId, status, reason);
    };
    
    const availableStatuses = ORDER_STATUSES
        .filter(status => status.value !== currentStatus)
        .map(status => status.value);
    
    return (
        <>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={isUpdating}
                    className={`px-2.5 py-1 text-xs rounded-lg flex items-center gap-1 transition-all ${
                        isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700 cursor-pointer'
                    } ${currentConfig.color}`}
                >
                    {currentConfig.icon} {currentStatus.toLowerCase()}
                    {!isUpdating && (
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    )}
                </button>
                
                {isOpen && availableStatuses.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[160px] max-h-[300px] overflow-y-auto">
                        {/* Show restore options for cancelled/refunded orders */}
                        {isCancelledOrRefunded && (
                            <>
                                <div className="px-3 py-2 text-xs text-yellow-400 border-b border-gray-700 bg-gray-800/50">
                                    ⚡ Restore Options
                                </div>
                                <button
                                    onClick={() => handleStatusChange('PENDING')}
                                    className="w-full px-3 py-2 text-xs text-left hover:bg-gray-700 transition-colors flex items-center gap-2 text-blue-400"
                                >
                                    🔄 Restore to Pending
                                </button>
                                <button
                                    onClick={() => handleStatusChange('CONFIRMED')}
                                    className="w-full px-3 py-2 text-xs text-left hover:bg-gray-700 transition-colors flex items-center gap-2 text-indigo-400"
                                >
                                    🔄 Restore to Confirmed
                                </button>
                                <div className="border-t border-gray-700 my-1"></div>
                            </>
                        )}
                        
                        {/* Regular status options */}
                        {ORDER_STATUSES
                            .filter(status => {
                                // Don't show cancelled/refunded if already in those states
                                if (isCancelledOrRefunded && ['CANCELLED', 'REFUNDED'].includes(status.value)) {
                                    return false;
                                }
                                return status.value !== currentStatus;
                            })
                            .map((status) => {
                                const config = getStatusConfig(status);
                                return (
                                    <button
                                        key={status.value}
                                        onClick={() => handleStatusChange(status.value)}
                                        className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-700 transition-colors flex items-center gap-2 ${config.color}`}
                                    >
                                        {config.icon} {status.label}
                                    </button>
                                );
                            })}
                    </div>
                )}
            </div>
            
            <RestoreOrderDialog
                isOpen={showRestoreDialog}
                onClose={() => setShowRestoreDialog(false)}
                orderId={orderId}
                currentStatus={currentStatus}
                onRestore={handleRestore}
            />
        </>
    );
};

// ============ Status Timeline Component ============

const StatusTimeline: React.FC<{ history: Record<string, any> }> = ({ history }) => {
    const statuses = STATUS_ORDER;
    
    return (
        <div className="relative pl-6">
            {statuses.map((status, index) => {
                const statusEntry = history?.[status];
                const isCompleted = !!statusEntry;
                const config = getStatusConfig(status);
                
                // Check if this was a restoration
                const isRestoration = isCompleted && typeof statusEntry === 'object' && statusEntry.is_restoration;
                const restoredFrom = isRestoration ? statusEntry.restored_from : null;
                
                return (
                    <div key={status} className="relative pb-4 last:pb-0">
                        {index < statuses.length - 1 && (
                            <div className={`absolute left-[-2px] top-4 w-[2px] h-[calc(100%-12px)] ${
                                isCompleted ? 'bg-gold-500/50' : 'bg-gray-700'
                            }`} />
                        )}
                        
                        <div className={`absolute left-[-8px] top-1 w-4 h-4 rounded-full flex items-center justify-center ${
                            isCompleted ? 'bg-gold-500' : 'bg-gray-700'
                        }`}>
                            {isCompleted && (
                                <svg className="w-2 h-2 text-black" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        
                        <div className={`ml-4 ${isCompleted ? 'text-white' : 'text-gray-500'}`}>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium capitalize">
                                    {config.icon} {status.toLowerCase()}
                                </span>
                                {isRestoration && (
                                    <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">
                                        🔄 Restored from {restoredFrom?.toLowerCase()}
                                    </span>
                                )}
                            </div>
                            {isCompleted && (
                                <div className="text-xs text-gray-400 mt-0.5">
                                    {typeof statusEntry === 'object' ? (
                                        <>
                                            {statusEntry.timestamp && (
                                                <span>
                                                    {new Date(statusEntry.timestamp).toLocaleString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            )}
                                            {statusEntry.restoration_reason && (
                                                <div className="mt-1 text-yellow-400 text-xs italic">
                                                    Reason: {statusEntry.restoration_reason}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <span>
                                            {new Date(statusEntry).toLocaleString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    )}
                                </div>
                            )}
                            {history?.[`${status}_note`] && (
                                <p className="text-xs text-gray-400 mt-0.5 italic">
                                    Note: {history[`${status}_note`]}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ============ Payment History Component ============

const PaymentHistoryDisplay: React.FC<{ 
    paymentHistory: Array<{
        timestamp: string;
        amount: number;
        method: string;
        reference?: string;
        note?: string;
        paymentType: string;
    }>;
    formatCurrency: (amount: number) => string;
}> = ({ paymentHistory, formatCurrency }) => {
    if (!paymentHistory || paymentHistory.length === 0) {
        return (
            <div className="text-center py-4 text-gray-500 text-sm">
                No payment transactions recorded
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {paymentHistory.map((payment, index) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-xs text-gray-400">
                                {new Date(payment.timestamp).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    payment.paymentType === 'full' 
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                    {payment.paymentType === 'full' ? 'Full Payment' : 'Partial Payment'}
                                </span>
                                <span className="text-xs text-gray-400">
                                    via {getPaymentMethodDisplay(payment.method)}
                                </span>
                            </div>
                            {payment.reference && (
                                <p className="text-xs text-gray-500 mt-1">Ref: {payment.reference}</p>
                            )}
                            {payment.note && (
                                <p className="text-xs text-gray-400 mt-1 italic">{payment.note}</p>
                            )}
                        </div>
                        <span className="text-lg font-bold text-green-400">
                            {formatCurrency(payment.amount)}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

// ============ PDF Generation Function - FIXED ============

const generateOrderPDF = async (order: OrderWithUser, formatCurrency: (amount: number) => string) => {
    try {
        console.log('Generating PDF for order:', order.orderNumber);
        console.log('Payment data:', {
            paidAmount: order.paidAmount,
            remainingAmount: order.remainingAmount,
            finalAmount: order.finalAmount,
            isPaid: order.isPaid,
            paymentHistory: order.paymentHistory,
            additionalDiscountAmount: order.additionalDiscountAmount,
            additionalDiscountPercentage: order.additionalDiscountPercentage
        });
        
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
            console.warn('Could not load logo, using text fallback:', error);
        }
        
        const orderDate = new Date(order.createdAt);
        const formattedDate = orderDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        const formattedTime = orderDate.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let itemsHtml = '';
        (order.items || []).forEach((item, idx) => {
            const itemTotal = (item.discountedUnitPrice || item.unitPrice) * item.quantity;
            const discountAmount = (item.unitPrice - (item.discountedUnitPrice || item.unitPrice)) * item.quantity;
            
            itemsHtml += `
                <tr>
                    <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; color: #333;">
                        ${item.productName}
                        <div style="font-size: 10px; color: #999; margin-top: 2px;">${item.category || ''}</div>
                    </td>
                    <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center; font-size: 13px; color: #333;">${item.quantity}</td>
                    <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right; font-size: 13px; color: #333;">${formatCurrency(item.unitPrice)}</td>
                    <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right; font-size: 13px; color: #d4a843;">
                        ${item.discountPercentage > 0 ? `-${formatCurrency(discountAmount)}` : '—'}
                    </td>
                    <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right; font-size: 13px; font-weight: bold; color: #333;">${formatCurrency(itemTotal)}</td>
                </tr>
            `;
        });
        
        // FIXED: Use correct amounts
        const subtotal = order.subtotal || 0;
        const productDiscount = order.discountAmount || 0;
        const additionalDiscountAmount = order.additionalDiscountAmount || 0;
        const grandTotal = order.finalAmount || order.totalAmount || 0;
        
        // FIXED: These should come directly from the order, not calculated
        const paidAmount = order.paidAmount || 0;        // ← This is what customer actually paid (₹20)
        const remainingAmount = order.remainingAmount || 0; // ← This is what's still owed (₹34)
        
        const displayInvoiceNumber = order.invoiceNumber || order.orderNumber;
        const paymentMethodDisplay = getPaymentMethodDisplay(order.paymentMethod);
        
        // Determine payment status display
        let paymentStatusDisplay = 'Pending';
        let paymentStatusColor = '#eab308'; // yellow
        if (remainingAmount <= 0 && paidAmount > 0) {
            paymentStatusDisplay = 'Paid';
            paymentStatusColor = '#22c55e'; // green
        } else if (paidAmount > 0 && remainingAmount > 0) {
            paymentStatusDisplay = 'Partially Paid';
            paymentStatusColor = '#eab308'; // yellow
        } else if (paidAmount === 0) {
            paymentStatusDisplay = 'Pending';
            paymentStatusColor = '#ef4444'; // red
        }
        
        // Build payment history HTML
        let paymentHistoryHtml = '';
        if (order.paymentHistory && order.paymentHistory.length > 0) {
            paymentHistoryHtml = `
                <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
                    <div style="font-size: 12px; font-weight: bold; color: #333; margin-bottom: 8px;">Payment History</div>
                    ${order.paymentHistory.map((p, idx) => `
                        <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f5f5f5; font-size: 11px; color: #666;">
                            <span>${new Date(p.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            <span>${p.paymentType === 'full' ? 'Full' : 'Partial'}</span>
                            <span style="font-weight: bold; color: #333;">${formatCurrency(p.amount)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Get restoration info from status history
        let restorationInfo = '';
        const statusHistory = order.statusHistory || {};
        for (const [status, entry] of Object.entries(statusHistory)) {
            if (typeof entry === 'object' && entry.is_restoration) {
                restorationInfo = `
                    <div style="margin-top: 10px; padding: 10px; background: #fef3c7; border-radius: 4px; border-left: 3px solid #eab308;">
                        <div style="font-size: 11px; color: #92400e;">
                            🔄 Order was restored from ${entry.restored_from?.toLowerCase() || 'cancelled'} 
                            ${entry.restoration_reason ? `- Reason: ${entry.restoration_reason}` : ''}
                        </div>
                    </div>
                `;
                break;
            }
        }
        
        container.innerHTML = `
            <div style="max-width: 100%; padding: 20px;">
                <!-- Header -->
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #d4a843; padding-bottom: 15px; margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        ${logoImageUrl ? `
                            <img src="${logoImageUrl}" alt="${COMPANY_NAME}" style="width: 60px; height: 60px; object-fit: contain;" />
                        ` : `
                            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #d4a843, #f5d06b); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; color: white;">🎆</div>
                        `}
                        <div>
                            <div style="font-size: 22px; font-weight: bold; color: #d4a843; letter-spacing: 1px;">${COMPANY_NAME}</div>
                            <div style="font-size: 11px; color: #666; letter-spacing: 2px;">PREMIUM FIREWORKS & CELEBRATIONS</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 28px; font-weight: bold; color: #d4a843; letter-spacing: 3px;">INVOICE</div>
                    </div>
                </div>
                
                <!-- Customer Information -->
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <div style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Customer Information</div>
                            <div style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 8px;">
                                ${order.userDetails.name}
                            </div>
                            <div style="font-size: 14px; color: #666; margin-top: 4px;">
                                ${order.userDetails.address}, ${order.userDetails.cityVillage}, ${order.userDetails.pincode}
                            </div>
                            <div style="font-size: 14px; color: #666; margin-top: 4px;">
                                ${order.userDetails.contact}
                            </div>
                            <div style="font-size: 14px; color: #666; margin-top: 4px;">
                                ${order.userDetails.email || 'N/A'}
                            </div>
                            ${order.userDetails.additionalDiscount && order.userDetails.additionalDiscount > 0 ? `
                                <div style="font-size: 13px; color: #22c55e; margin-top: 6px; font-weight: bold;">
                                    🎉 ${order.userDetails.additionalDiscount}% Additional Discount Applied!
                                </div>
                            ` : ''}
                        </div>
                        <div style="text-align: right; padding-left: 20px;">
                            <div style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Invoice #</div>
                            <div style="font-size: 18px; font-weight: bold; color: #333;">${displayInvoiceNumber}</div>
                            <div style="font-size: 12px; color: #666; margin-top: 4px;">Status: ${order.orderStatus}</div>
                            <div style="font-size: 12px; color: #666; margin-top: 2px;">Payment: ${paymentStatusDisplay}</div>
                            <div style="font-size: 12px; color: #666; margin-top: 2px;">Method: ${paymentMethodDisplay}</div>
                            ${order.referenceId ? `<div style="font-size: 12px; color: #666; margin-top: 2px;">Ref ID: ${order.referenceId}</div>` : ''}
                        </div>
                    </div>
                </div>
                
                <!-- Order Items -->
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 12px;">
                        <div style="font-size: 16px; font-weight: bold; color: #333;">Order Items</div>
                        <div style="font-size: 12px; color: #999;">${order.items?.length || 0} ITEMS</div>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #f9f9f9;">
                                <th style="padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd;">Product</th>
                                <th style="padding: 8px 12px; text-align: center; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd;">Qty</th>
                                <th style="padding: 8px 12px; text-align: right; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd;">Price</th>
                                <th style="padding: 8px 12px; text-align: right; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd;">Discount</th>
                                <th style="padding: 8px 12px; text-align: right; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                </div>
                
                <!-- Payment Summary - FIXED -->
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: flex-end;">
                        <div style="width: 340px;">
                            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0;">
                                <span style="font-size: 13px; color: #666;">Subtotal</span>
                                <span style="font-size: 13px; color: #333;">${formatCurrency(subtotal)}</span>
                            </div>
                            ${productDiscount > 0 ? `
                                <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0;">
                                    <span style="font-size: 13px; color: #666;">Product Discounts</span>
                                    <span style="font-size: 13px; color: #d4a843;">-${formatCurrency(productDiscount)}</span>
                                </div>
                            ` : ''}
                            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0;">
                                <span style="font-size: 13px; color: #666;">After Product Discount</span>
                                <span style="font-size: 13px; color: #333;">${formatCurrency(subtotal - productDiscount)}</span>
                            </div>
                            ${additionalDiscountAmount > 0 ? `
                                <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0; background: #f0fdf4;">
                                    <span style="font-size: 13px; color: #22c55e; font-weight: bold;">Additional Discount (${order.additionalDiscountPercentage || 0}%)</span>
                                    <span style="font-size: 13px; color: #22c55e; font-weight: bold;">-${formatCurrency(additionalDiscountAmount)}</span>
                                </div>
                            ` : ''}
                            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #333; margin-top: 4px;">
                                <span style="font-size: 16px; font-weight: bold; color: #333;">Grand Total</span>
                                <span style="font-size: 18px; font-weight: bold; color: #d4a843;">${formatCurrency(grandTotal)}</span>
                            </div>
                            
                            <!-- FIXED: Payment Details Section - Shows actual paid amount -->
                            <div style="border-top: 2px solid #d4a843; margin-top: 12px; padding-top: 12px;">
                                <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                                    <span style="font-size: 12px; color: #666;">Payment Method</span>
                                    <span style="font-size: 12px; color: #333;">${paymentMethodDisplay}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                                    <span style="font-size: 12px; color: #666;">Payment Status</span>
                                    <span style="font-size: 12px; font-weight: bold; color: ${paymentStatusColor};">
                                        ${paymentStatusDisplay}
                                    </span>
                                </div>
                                <!-- FIXED: Total Paid - Shows actual amount customer paid -->
                                <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0;">
                                    <span style="font-size: 13px; color: #666; font-weight: bold;">Total Paid</span>
                                    <span style="font-size: 13px; color: #22c55e; font-weight: bold;">${formatCurrency(paidAmount)}</span>
                                </div>
                                <!-- FIXED: Remaining Balance - Shows what's still owed -->
                                <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                                    <span style="font-size: 13px; color: #666; font-weight: bold;">Remaining Balance</span>
                                    <span style="font-size: 13px; color: ${remainingAmount > 0 ? '#eab308' : '#22c55e'}; font-weight: bold;">
                                        ${formatCurrency(remainingAmount)}
                                    </span>
                                </div>
                                ${order.referenceId ? `
                                    <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                                        <span style="font-size: 12px; color: #666;">Reference ID</span>
                                        <span style="font-size: 12px; color: #333;">${order.referenceId}</span>
                                    </div>
                                ` : ''}
                            </div>
                            
                            ${paymentHistoryHtml}
                        </div>
                    </div>
                </div>
                
                ${restorationInfo}
                
                <!-- Thank You Message -->
                <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;">
                    <div style="font-size: 16px; font-weight: bold; color: #333;">
                        Thank You for Your Order, ${order.userDetails.name}!
                    </div>
                    ${remainingAmount > 0 ? `
                        <div style="font-size: 13px; color: #eab308; margin-top: 5px;">
                            ⚠️ Remaining Balance: ${formatCurrency(remainingAmount)} - Please complete your payment.
                        </div>
                    ` : paidAmount > 0 ? `
                        <div style="font-size: 13px; color: #22c55e; margin-top: 5px;">
                            ✅ Payment Complete - Thank you!
                        </div>
                    ` : `
                        <div style="font-size: 13px; color: #ef4444; margin-top: 5px;">
                            ⏳ Payment Pending - Please complete your payment.
                        </div>
                    `}
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = await html2canvas(container, {
            scale: 2,
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
        pdf.save(`Invoice_${displayInvoiceNumber}.pdf`);
        
        console.log('PDF downloaded successfully');
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please try again.');
    }
};

// ============ Status History Modal Component ============

interface StatusHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: Record<string, any>;
    staffNotes?: string;
}

const StatusHistoryModal: React.FC<StatusHistoryModalProps> = ({
    isOpen,
    onClose,
    history,
    staffNotes
}) => {
    if (!isOpen) return null;

    const hasRestorations = Object.values(history).some(
        entry => typeof entry === 'object' && entry.is_restoration
    );

    return (
        <>
            <div
                className="fixed inset-0 bg-black/80 z-[60] transition-opacity duration-300"
                onClick={onClose}
            />
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto border border-gold-500/20 shadow-2xl shadow-gold-500/10">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Status History
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded-full"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {hasRestorations && (
                            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <p className="text-xs text-green-400 flex items-center gap-2">
                                    <span>🔄</span>
                                    This order has been restored from cancelled/refunded status
                                </p>
                            </div>
                        )}
                        <StatusTimeline history={history || {}} />
                        {staffNotes && (
                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Staff Notes</p>
                                <p className="text-sm text-gray-300 mt-1">{staffNotes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

// ============ User Detail Modal Component ============

interface UserDetailModalProps {
    order: OrderWithUser | null;
    isOpen: boolean;
    onClose: () => void;
    formatCurrency: (amount: number) => string;
    getImageUrl: (path: string) => string;
    onUpdateDiscount: (userId: string, discount: number) => void;
    onRefreshData?: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
    order,
    isOpen,
    onClose,
    formatCurrency,
    getImageUrl,
    onUpdateDiscount,
    onRefreshData
}) => {
    const [additionalDiscount, setAdditionalDiscount] = useState<number>(0);
    const [discountInput, setDiscountInput] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [isApplied, setIsApplied] = useState<boolean>(false);
    const [paymentMethod, setPaymentMethod] = useState<string>('');
    const [referenceId, setReferenceId] = useState<string>('');
    const [isPaid, setIsPaid] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
    const [hasChanges, setHasChanges] = useState<boolean>(false);
    const [originalDiscount, setOriginalDiscount] = useState<number>(0);
    const [showStatusHistory, setShowStatusHistory] = useState<boolean>(false);
    const [paidAmount, setPaidAmount] = useState<string>('');
    const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
    const [paymentNote, setPaymentNote] = useState<string>('');
    const [showPaymentHistory, setShowPaymentHistory] = useState<boolean>(false);

    useEffect(() => {
        if (isOpen && order) {
            const savedDiscount = order.userDetails?.additionalDiscount || 0;
            setAdditionalDiscount(savedDiscount);
            setDiscountInput(savedDiscount > 0 ? savedDiscount.toString() : '');
            setIsApplied(savedDiscount > 0);
            setOriginalDiscount(savedDiscount);
            setPaymentMethod(order.paymentMethod || 'cash');
            setReferenceId(order.referenceId || '');
            setIsPaid(order.isPaid || false);
            setPaymentType('full');
            setPaidAmount('');
            setPaymentNote('');
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, order]);

    useEffect(() => {
        if (isOpen && order) {
            const hasDiscountChange = additionalDiscount !== originalDiscount;
            setHasChanges(hasDiscountChange);
        }
    }, [additionalDiscount, originalDiscount, isOpen, order]);

    if (!isOpen || !order) return null;

    const orderItems = order.items || [];

    const subtotal = orderItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const productDiscount = orderItems.reduce((sum, item) => sum + ((item.unitPrice - item.discountedUnitPrice) * item.quantity), 0);
    const discountedSubtotal = orderItems.reduce((sum, item) => sum + ((item.discountedUnitPrice || item.unitPrice) * item.quantity), 0);
    const additionalDiscountAmount = discountedSubtotal * (additionalDiscount / 100);
    const finalTotal = discountedSubtotal - additionalDiscountAmount;
    const totalDiscountAmount = productDiscount + additionalDiscountAmount;

    const existingPaidAmount = order.paidAmount || 0;
    const existingRemainingAmount = order.remainingAmount || 0;
    const existingPaymentHistory = order.paymentHistory || [];

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDiscountInput(value);
        
        if (value === '') {
            setAdditionalDiscount(0);
            setIsApplied(false);
            return;
        }
        
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
            setAdditionalDiscount(numValue);
            setIsApplied(false);
        }
    };

    const handleApplyDiscount = () => {
        if (order && additionalDiscount > 0) {
            setIsUpdating(true);
            onUpdateDiscount(order.userId, additionalDiscount);
            setIsApplied(true);
            setOriginalDiscount(additionalDiscount);
            setIsUpdating(false);
        } else if (additionalDiscount === 0) {
            onUpdateDiscount(order.userId, 0);
            setIsApplied(false);
            setOriginalDiscount(0);
        }
    };

    const handleSaveChanges = async (silent: boolean = false) => {
        if (!order) return;

        if (paymentMethod === 'netbanking' && !referenceId.trim()) {
            if (!silent) {
                alert('⚠️ Please enter Reference ID for Net Banking payment.');
            }
            return;
        }

        setIsSaving(true);
        setSaveSuccess(false);

        try {
            if (additionalDiscount !== originalDiscount) {
                await updateUserDiscountAPI(order.userId, additionalDiscount);
                onUpdateDiscount(order.userId, additionalDiscount);
            }

            let paidAmountValue = 0;
            let remainingAmountValue = 0;
            
            if (paymentType === 'full') {
                paidAmountValue = finalTotal;
                remainingAmountValue = 0;
            } else {
                paidAmountValue = parseFloat(paidAmount) || 0;
                remainingAmountValue = finalTotal - paidAmountValue;
                if (remainingAmountValue < 0) remainingAmountValue = 0;
            }

            await updateOrderPaymentAPI(order.id, {
                paymentMethod: paymentMethod || 'cash',
                referenceId: referenceId,
                isPaid: isPaid || paidAmountValue > 0,
                paidAmount: paidAmountValue,
                remainingAmount: remainingAmountValue,
                paymentNote: paymentNote || undefined
            });

            setIsSaving(false);
            setSaveSuccess(true);
            setHasChanges(false);
            setOriginalDiscount(additionalDiscount);

            if (!silent) {
                alert('✅ Discount and payment details updated successfully!');
            }

            if (onRefreshData) {
                setTimeout(onRefreshData, 500);
            }

            setTimeout(() => {
                setSaveSuccess(false);
            }, 3000);

        } catch (error: any) {
            console.error('Error saving data:', error);
            setIsSaving(false);
            if (!silent) {
                alert(`❌ Failed to save: ${error.response?.data?.detail || error.message}`);
            }
        }
    };

    const handleWhatsAppClick = () => {
        const actualPaidAmount = order.paidAmount || 0;
        const actualRemainingAmount = order.remainingAmount || 0;
        
        const message = `Hi ${order.userDetails.name},\n\nThank you for your order! Here are your details:\n\n` +
            `📞 Contact: ${order.userDetails.contact}\n` +
            `📍 Address: ${order.userDetails.address}, ${order.userDetails.cityVillage}, ${order.userDetails.pincode}\n` +
            `📧 Email: ${order.userDetails.email || 'N/A'}\n\n` +
            `🛒 Order Summary:\n` +
            orderItems.map(item =>
                `• ${item.productName} x${item.quantity} - ${formatCurrency((item.discountedUnitPrice || item.unitPrice) * item.quantity)}`
            ).join('\n') +
            `\n\n` +
            `📊 Amount Breakdown:\n` +
            `Subtotal: ${formatCurrency(subtotal)}\n` +
            `Product Discount: -${formatCurrency(productDiscount)}\n` +
            (additionalDiscount > 0 ? `Additional Discount (${additionalDiscount}%): -${formatCurrency(additionalDiscountAmount)}\n` : '') +
            `─────────────────\n` +
            `Total Amount: ${formatCurrency(finalTotal)}` +
            `\n\nInvoice #${order.invoiceNumber || order.orderNumber}` +
            `\nPayment Method: ${getPaymentMethodDisplay(paymentMethod)}` +
            `\nPayment Status: ${actualRemainingAmount <= 0 ? 'Paid' : actualPaidAmount > 0 ? 'Partially Paid' : 'Pending'}` +
            `\nTotal Paid: ${formatCurrency(actualPaidAmount)}` +
            `${actualRemainingAmount > 0 ? `\nRemaining Balance: ${formatCurrency(actualRemainingAmount)}` : ''}` +
            (paymentMethod === 'netbanking' ? `\nReference ID: ${referenceId}` : '') +
            (paymentNote ? `\nNote: ${paymentNote}` : '');

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${order.userDetails.contact}?text=${encodedMessage}`, '_blank');
    };

    const handleDownloadPDF = () => {
        generateOrderPDF(order, formatCurrency);
    };

    const handleMarkAsPaid = () => {
        setIsPaid(!isPaid);
        setHasChanges(true);
    };

    return (
        <>
            <div
                className="fixed inset-0 bg-black/80 z-50 transition-opacity duration-300"
                onClick={onClose}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-gray-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gold-500/20 shadow-2xl shadow-gold-500/10">
                    <div className="p-6 md:p-8">
                        {/* Modal Header */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white">
                                    Order Details
                                </h2>
                                <p className="text-gray-400 text-sm mt-1">
                                    Invoice #{order.invoiceNumber || order.orderNumber} placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                                {order.invoiceNumber && (
                                    <p className="text-sm text-gold-400 mt-1 font-mono">
                                        🧾 Invoice: {order.invoiceNumber}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-xs text-gray-500">Status:</span>
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusConfig(order.orderStatus).color}`}>
                                        {getStatusConfig(order.orderStatus).icon} {order.orderStatus.toLowerCase()}
                                    </span>
                                    <button
                                        onClick={() => setShowStatusHistory(true)}
                                        className="ml-2 px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        View History
                                    </button>
                                    {existingPaymentHistory.length > 0 && (
                                        <button
                                            onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                                            className="ml-2 px-3 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v1m0 1c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2M12 17v1m0-1v-1" />
                                            </svg>
                                            Payment History ({existingPaymentHistory.length})
                                        </button>
                                    )}
                                </div>
                                <div className="mt-1 flex items-center gap-3 flex-wrap">
                                    {existingPaidAmount > 0 ? (
                                        <>
                                            <span className="text-xs text-green-400">
                                                💰 Paid: {formatCurrency(existingPaidAmount)}
                                            </span>
                                            {existingRemainingAmount > 0 && (
                                                <span className="text-xs text-yellow-400">
                                                    Remaining: {formatCurrency(existingRemainingAmount)}
                                                </span>
                                            )}
                                            {existingRemainingAmount <= 0 && existingPaidAmount > 0 && (
                                                <span className="text-xs text-green-400">
                                                    ✅ Fully Paid
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-xs text-red-400">
                                            ⏳ Payment Pending
                                        </span>
                                    )}
                                </div>
                                {order.userDetails?.additionalDiscount && order.userDetails.additionalDiscount > 0 && (
                                    <p className="text-sm text-green-400 mt-1">
                                        💰 User Discount: {order.userDetails.additionalDiscount}% OFF
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <button
                                    onClick={handleDownloadPDF}
                                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center gap-2 transition-all duration-300 text-sm font-medium hover:scale-105 active:scale-95"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download PDF
                                </button>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-full"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Customer Name</p>
                                <p className="text-white font-medium text-lg">{order.userDetails.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Contact</p>
                                <p className="text-white font-medium text-lg">{order.userDetails.contact}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Email</p>
                                <p className="text-white font-medium">{order.userDetails.email || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Pincode</p>
                                <p className="text-white font-medium">{order.userDetails.pincode}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Address</p>
                                <p className="text-white font-medium">{order.userDetails.address}, {order.userDetails.cityVillage}</p>
                            </div>
                            {order.userDetails.additionalDiscount !== undefined && (
                                <div className="md:col-span-2">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Additional Discount</p>
                                    <p className="text-green-400 font-medium">{order.userDetails.additionalDiscount}% OFF</p>
                                </div>
                            )}
                        </div>

                        {/* Payment History Display */}
                        {showPaymentHistory && existingPaymentHistory.length > 0 && (
                            <div className="mb-4 bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-sm font-semibold text-white">Payment History</h4>
                                    <button
                                        onClick={() => setShowPaymentHistory(false)}
                                        className="text-gray-400 hover:text-white text-xs"
                                    >
                                        Close
                                    </button>
                                </div>
                                <PaymentHistoryDisplay 
                                    paymentHistory={existingPaymentHistory} 
                                    formatCurrency={formatCurrency}
                                />
                            </div>
                        )}

                        {/* Order Items Table */}
                        {orderItems.length > 0 ? (
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <span>🛒</span>
                                        Order Items
                                        <span className="text-sm text-gray-400 font-normal">
                                            ({orderItems.length} items)
                                        </span>
                                    </h3>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-800 border-b border-gray-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Product</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Qty</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Discount</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {orderItems.map((item) => {
                                                let imageUrl = '';
                                                if (item.productImage) {
                                                    imageUrl = getImageUrl(item.productImage);
                                                }
                                                
                                                return (
                                                    <tr key={item.id} className="hover:bg-gray-800/50 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                                                                {item.productImage ? (
                                                                    (() => {
                                                                        const imgUrl = getImageUrl(item.productImage);
                                                                        return (
                                                                            <img
                                                                                src={imgUrl}
                                                                                alt={item.productName}
                                                                                className="w-full h-full object-cover"
                                                                                loading="lazy"
                                                                                onError={(e) => {
                                                                                    const target = e.target as HTMLImageElement;
                                                                                    target.onerror = null;
                                                                                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%23666" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpath d="M21 15l-5-5L5 21"%3E%3C/path%3E%3C/svg%3E';
                                                                                    target.style.objectFit = 'contain';
                                                                                    target.style.padding = '8px';
                                                                                }}
                                                                            />
                                                                        );
                                                                    })()
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                                                        📷
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-white">
                                                            {item.productName}
                                                            <span className="block text-xs text-gray-500">{item.category || 'N/A'}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-white text-center">
                                                            {item.quantity}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-300">
                                                            {formatCurrency(item.unitPrice)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            {item.discountPercentage > 0 ? (
                                                                <span className="text-green-400">
                                                                    {item.discountPercentage}% OFF
                                                                    <span className="block text-xs text-gray-500 line-through">
                                                                        {formatCurrency(item.unitPrice * item.quantity)}
                                                                    </span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-500">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-bold text-gold-400">
                                                            {formatCurrency((item.discountedUnitPrice || item.unitPrice) * item.quantity)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-800/30 rounded-xl border border-gray-700 mb-4">
                                <div className="text-4xl mb-2">📦</div>
                                <p className="text-gray-400">No items in this order</p>
                            </div>
                        )}

                        {/* Amount Breakdown Section */}
                        {orderItems.length > 0 && (
                            <div className="mb-6 bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-gray-300">Amount Breakdown</h4>

                                        <div className="flex justify-between py-1.5 border-b border-gray-700/50">
                                            <span className="text-sm text-gray-400">Subtotal</span>
                                            <span className="text-sm text-white font-medium">{formatCurrency(subtotal)}</span>
                                        </div>

                                        {productDiscount > 0 && (
                                            <div className="flex justify-between py-1.5 border-b border-gray-700/50">
                                                <span className="text-sm text-green-400">Product Discount</span>
                                                <span className="text-sm text-green-400">-{formatCurrency(productDiscount)}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between py-1.5 border-b border-gray-700/50">
                                            <span className="text-sm text-gray-400">After Product Discount</span>
                                            <span className="text-sm text-white font-medium">{formatCurrency(discountedSubtotal)}</span>
                                        </div>

                                        {additionalDiscount > 0 && (
                                            <>
                                                <div className="flex justify-between py-1.5 border-b border-gray-700/50">
                                                    <span className="text-sm text-green-400">
                                                        Additional Discount ({additionalDiscount}%)
                                                    </span>
                                                    <span className="text-sm text-green-400">-{formatCurrency(additionalDiscountAmount)}</span>
                                                </div>
                                                <div className="flex justify-between py-1.5 border-b border-gray-700/50">
                                                    <span className="text-sm text-gray-400">Total Discount</span>
                                                    <span className="text-sm text-green-400">-{formatCurrency(totalDiscountAmount)}</span>
                                                </div>
                                            </>
                                        )}

                                        {additionalDiscount === 0 && (
                                            <div className="flex justify-between py-1.5 border-b border-gray-700/50">
                                                <span className="text-sm text-gray-500">Additional Discount</span>
                                                <span className="text-sm text-gray-500">None applied</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 flex flex-col justify-center">
                                        <div className="text-center">
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">
                                                {additionalDiscount > 0 ? 'Final Amount (After All Discounts)' : 'Total Amount'}
                                            </p>
                                            <p className="text-3xl font-bold text-gold-400 mt-1">
                                                {formatCurrency(finalTotal)}
                                            </p>
                                            {additionalDiscount > 0 && (
                                                <>
                                                    <p className="text-xs text-gray-500 line-through mt-1">
                                                        Was: {formatCurrency(discountedSubtotal)}
                                                    </p>
                                                    <p className="text-xs text-green-400 mt-1">
                                                        🎉 You saved {formatCurrency(additionalDiscountAmount)} with {additionalDiscount}% discount!
                                                    </p>
                                                </>
                                            )}
                                            {existingRemainingAmount > 0 && (
                                                <p className="text-xs text-yellow-400 mt-2">
                                                    ⚠️ Remaining Balance: {formatCurrency(existingRemainingAmount)}
                                                </p>
                                            )}
                                            {existingRemainingAmount <= 0 && existingPaidAmount > 0 && (
                                                <p className="text-xs text-green-400 mt-2">
                                                    ✅ Fully Paid
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Summary */}
                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <h4 className="text-sm font-medium text-gray-300 mb-3">Payment Summary</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-gray-800/30 rounded-lg p-3 text-center border border-gray-700">
                                            <p className="text-xs text-gray-400 uppercase">Total Amount</p>
                                            <p className="text-lg font-bold text-white">{formatCurrency(finalTotal)}</p>
                                        </div>
                                        <div className="bg-gray-800/30 rounded-lg p-3 text-center border border-gray-700">
                                            <p className="text-xs text-gray-400 uppercase">Total Paid</p>
                                            <p className={`text-lg font-bold ${existingPaidAmount > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                                {formatCurrency(existingPaidAmount)}
                                            </p>
                                        </div>
                                        <div className="bg-gray-800/30 rounded-lg p-3 text-center border border-gray-700">
                                            <p className="text-xs text-gray-400 uppercase">Remaining</p>
                                            <p className={`text-lg font-bold ${existingRemainingAmount > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                                                {formatCurrency(existingRemainingAmount)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-center">
                                        <span className={`text-sm font-medium ${existingRemainingAmount <= 0 && existingPaidAmount > 0 ? 'text-green-400' : existingPaidAmount > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {existingRemainingAmount <= 0 && existingPaidAmount > 0 ? '✅ Fully Paid' : existingPaidAmount > 0 ? '⏳ Partially Paid' : '⏳ Payment Pending'}
                                        </span>
                                    </div>
                                </div>

                                {order.userDetails?.additionalDiscount && order.userDetails.additionalDiscount === additionalDiscount && (
                                    <div className="mt-3 pt-3 border-t border-gray-700 flex items-center gap-2">
                                        <span className="text-xs text-green-400">✅</span>
                                        <span className="text-xs text-gray-400">
                                            Saved in user_registrations: {order.userDetails.additionalDiscount}% discount
                                        </span>
                                    </div>
                                )}
                                {hasChanges && (
                                    <div className="mt-3 pt-3 border-t border-gray-700">
                                        <span className="text-xs text-yellow-400">
                                            ⚠️ You have unsaved discount changes. Click the save button below to save to user_registrations.
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Additional Discount Input Section */}
                        {orderItems.length > 0 && (
                            <div className="mb-6 bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                                <div className="flex flex-col gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">
                                            Additional Discount (%)
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={discountInput}
                                                onChange={handleDiscountChange}
                                                placeholder="0"
                                                className="w-full sm:w-32 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
                                            />
                                            <span className="text-sm text-gray-400">%</span>
                                            <button
                                                onClick={handleApplyDiscount}
                                                disabled={isUpdating}
                                                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                                                    isUpdating || additionalDiscount === originalDiscount
                                                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                                        : 'bg-gold-500 hover:bg-gold-400 text-black hover:scale-105 active:scale-95'
                                                }`}
                                            >
                                                {isUpdating ? (
                                                    <>
                                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Applying...
                                                    </>
                                                ) : (
                                                    'Apply Discount'
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            💡 Applies to the total amount after product discounts
                                        </p>
                                        {additionalDiscount > 0 && (
                                            <p className="text-xs text-green-400 mt-1">
                                                ✅ {additionalDiscount}% discount applied
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Section */}
                        {orderItems.length > 0 && (
                            <div className="mb-6 bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                                <div className="flex flex-col gap-4">
                                    {/* Existing Payment Info */}
                                    {existingPaidAmount > 0 && (
                                        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600">
                                            <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Existing Payment</h4>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-300">Already Paid</span>
                                                <span className="text-sm font-bold text-green-400">{formatCurrency(existingPaidAmount)}</span>
                                            </div>
                                            {existingRemainingAmount > 0 && (
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-sm text-gray-300">Remaining Balance</span>
                                                    <span className="text-sm font-bold text-yellow-400">{formatCurrency(existingRemainingAmount)}</span>
                                                </div>
                                            )}
                                            {existingRemainingAmount <= 0 && existingPaidAmount > 0 && (
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-sm text-gray-300">Status</span>
                                                    <span className="text-sm font-bold text-green-400">✅ Fully Paid</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Step 1: Payment Type */}
                                    <div>
                                        <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                            Step 1: Payment Type
                                        </label>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <button
                                                onClick={() => {
                                                    setPaymentType('full');
                                                    setPaidAmount('');
                                                    setIsPaid(true);
                                                    setHasChanges(true);
                                                }}
                                                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                                                    paymentType === 'full'
                                                        ? 'bg-green-500 text-black shadow-lg shadow-green-500/20'
                                                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                                }`}
                                            >
                                                ✅ Full Payment
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setPaymentType('partial');
                                                    setHasChanges(true);
                                                }}
                                                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                                                    paymentType === 'partial'
                                                        ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                                                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                                }`}
                                            >
                                                ⏳ Partial Payment
                                            </button>
                                        </div>

                                        {/* Partial Payment Amount Input */}
                                        {paymentType === 'partial' && (
                                            <div className="mt-3">
                                                <label className="block text-xs text-gray-400 mb-1.5">
                                                    Enter Paid Amount
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={paidAmount}
                                                        onChange={(e) => {
                                                            setPaidAmount(e.target.value);
                                                            setHasChanges(true);
                                                            if (parseFloat(e.target.value) >= finalTotal) {
                                                                setIsPaid(true);
                                                            } else if (parseFloat(e.target.value) > 0) {
                                                                setIsPaid(true);
                                                            } else {
                                                                setIsPaid(false);
                                                            }
                                                        }}
                                                        placeholder="Enter amount"
                                                        className="w-full sm:w-48 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
                                                    />
                                                    <span className="text-sm text-gray-400">
                                                        Max: {formatCurrency(finalTotal)}
                                                    </span>
                                                </div>
                                                {paidAmount && parseFloat(paidAmount) > 0 && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <span className="text-xs text-green-400">✅ Paid: {formatCurrency(parseFloat(paidAmount) || 0)}</span>
                                                        <span className="text-xs text-yellow-400">
                                                            Remaining: {formatCurrency(finalTotal - (parseFloat(paidAmount) || 0))}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Full Payment Status */}
                                        {paymentType === 'full' && (
                                            <div className="mt-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-300">Mark as Paid</p>
                                                        <p className="text-xs text-gray-500">
                                                            Toggle to mark this order as paid
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={handleMarkAsPaid}
                                                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                                                            isPaid ? 'bg-green-500' : 'bg-gray-600'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-md ${
                                                                isPaid ? 'translate-x-7' : 'translate-x-1'
                                                            }`}
                                                        />
                                                    </button>
                                                </div>
                                                <div className="mt-2">
                                                    <span className={`text-xs font-medium ${
                                                        isPaid ? 'text-green-400' : 'text-yellow-400'
                                                    }`}>
                                                        {isPaid ? '✅ Payment marked as PAID' : '⏳ Payment pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Step 2: Payment Method */}
                                    <div className="pt-4 border-t border-gray-700">
                                        <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                            Step 2: Payment Method - <span className="text-blue-400">Saves to orders table</span>
                                        </label>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <button
                                                onClick={() => {
                                                    setPaymentMethod('cash');
                                                    setReferenceId('');
                                                    setHasChanges(true);
                                                }}
                                                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                                                    paymentMethod === 'cash'
                                                        ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/20 border-2 border-gold-400'
                                                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                                }`}
                                            >
                                                💵 Cash on Delivery
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setPaymentMethod('netbanking');
                                                    setHasChanges(true);
                                                }}
                                                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                                                    paymentMethod === 'netbanking'
                                                        ? 'bg-gold-500 text-black shadow-lg shadow-gold-500/20'
                                                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                                }`}
                                            >
                                                🏦 Online (Net Banking)
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                                            💡 Default: <span className="text-gold-400">Cash on Delivery</span>
                                        </p>
                                    </div>

                                    {/* Net Banking Reference ID */}
                                    {paymentMethod === 'netbanking' && (
                                        <div className="pt-4 border-t border-gray-700">
                                            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">
                                                Step 3: Reference ID (Transaction ID / UPI ID)
                                            </label>
                                            <input
                                                type="text"
                                                value={referenceId}
                                                onChange={(e) => {
                                                    setReferenceId(e.target.value);
                                                    setHasChanges(true);
                                                    if (e.target.value.trim()) {
                                                        setIsPaid(true);
                                                    } else {
                                                        setIsPaid(false);
                                                    }
                                                }}
                                                placeholder="Enter reference ID (e.g., UPI1234567890)"
                                                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                ⚠️ Reference ID is required for Net Banking payments
                                            </p>
                                            {referenceId.trim() && (
                                                <div className="mt-2">
                                                    <span className="text-xs text-green-400">✅ Online payment verified</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Payment Note */}
                                    <div className="pt-4 border-t border-gray-700">
                                        <label className="block text-xs text-gray-400 uppercase tracking-wider mb-1.5">
                                            Payment Note (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={paymentNote}
                                            onChange={(e) => {
                                                setPaymentNote(e.target.value);
                                                setHasChanges(true);
                                            }}
                                            placeholder="Add a note for this payment"
                                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all text-sm"
                                        />
                                    </div>

                                    {/* Payment Status Summary */}
                                    <div className="pt-4 border-t border-gray-700/50">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">
                                                💾 Payment details are saved to the <span className="text-blue-400 font-mono">orders</span> table
                                            </span>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400">Payment Status</p>
                                                <p className={`text-sm font-medium ${
                                                    isPaid ? 'text-green-400' : 'text-yellow-400'
                                                }`}>
                                                    {isPaid ? '✅ Paid' : '⏳ Pending'}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Method: {paymentMethod === 'cash' ? 'Cash on Delivery' : paymentMethod === 'netbanking' ? 'Net Banking' : 'Not Selected'}
                                                </p>
                                                {paymentType === 'partial' && paidAmount && parseFloat(paidAmount) > 0 && (
                                                    <p className="text-xs text-yellow-400 mt-1">
                                                        Partial: {formatCurrency(parseFloat(paidAmount))} paid
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-800">
                            {hasChanges && (
                                <button
                                    onClick={() => handleSaveChanges(false)}
                                    disabled={isSaving}
                                    className={`px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 text-sm font-medium ${
                                        isSaving
                                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                            : saveSuccess
                                                ? 'bg-green-500 text-black'
                                                : 'bg-amber-400 text-white hover:bg-gold-400 hover:scale-105 active:scale-95'
                                    }`}
                                >
                                    {isSaving ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Saving...
                                        </>
                                    ) : saveSuccess ? (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Saved!
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                            </svg>
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            )}
                            
                            <button
                                onClick={handleWhatsAppClick}
                                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-2 transition-all duration-300 text-sm font-medium"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                                WhatsApp
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl flex items-center gap-2 transition-all duration-300 text-sm font-medium ml-auto"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status History Modal */}
            <StatusHistoryModal
                isOpen={showStatusHistory}
                onClose={() => setShowStatusHistory(false)}
                history={order.statusHistory || {}}
                staffNotes={order.staffNotes}
            />
        </>
    );
};

// ============ Order Card Component for Mobile ============

interface OrderCardProps {
    order: OrderWithUser;
    onView: (order: OrderWithUser) => void;
    onStatusChange: (orderId: string, newStatus: string, reason?: string) => void;
    onWhatsApp: (order: OrderWithUser) => void;
    onPDF: (order: OrderWithUser) => void;
    formatCurrency: (amount: number) => string;
    getPaymentBadge: (order: OrderWithUser) => React.ReactNode;
    getStatusBadge: (order: OrderWithUser) => React.ReactNode;
    loading: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({
    order,
    onView,
    onStatusChange,
    onWhatsApp,
    onPDF,
    formatCurrency,
    getPaymentBadge,
    getStatusBadge,
    loading
}) => {
    const orderDate = new Date(order.createdAt);
    const timeAgo = getRelativeTime(order.createdAt);
    
    return (
        <div className="bg-gray-800/80 rounded-xl border border-gray-700 p-4 mb-3 hover:border-gold-500/30 transition-all duration-200">
            {/* Header: Order # and Status */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-mono text-gold-400 font-bold">
                            #{order.orderNumber}
                        </span>
                        {order.invoiceNumber && (
                            <span className="text-xs bg-gold-500/10 text-amber-400 px-2 py-0.5 rounded border border-gold-500/20">
                                INV: {order.invoiceNumber}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{timeAgo}</span>
                        <span className="text-xs text-gray-600">•</span>
                        <span className="text-xs text-gray-500">
                            {orderDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                </div>
                {getStatusBadge(order)}
            </div>

            {/* Customer Info */}
            <div className="flex items-start gap-3 mb-3">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                        {order.userDetails.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                        {order.userDetails.address}, {order.userDetails.cityVillage}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <a 
                            href={`tel:${order.userDetails.contact}`}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                        >
                            📞 {order.userDetails.contact}
                        </a>
                        {order.userDetails.email && (
                            <span className="text-xs text-gray-500 truncate max-w-[150px]">
                                ✉️ {order.userDetails.email}
                            </span>
                        )}
                    </div>
                    {order.userDetails.additionalDiscount && order.userDetails.additionalDiscount > 0 && (
                        <span className="text-xs text-green-400 inline-block mt-1">
                            💰 {order.userDetails.additionalDiscount}% OFF
                        </span>
                    )}
                </div>
            </div>

            {/* Items and Total */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <span className="text-xs text-gray-500">Items:</span>
                    <span className="text-sm text-white ml-1 font-medium">
                        {order.items?.length || 0}
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-sm font-bold text-white">
                        {formatCurrency(order.finalAmount || order.totalAmount || 0)}
                    </span>
                    {order.additionalDiscountPercentage > 0 && (
                        <span className="text-xs text-green-400 block">
                            -{order.additionalDiscountPercentage}% off
                        </span>
                    )}
                </div>
            </div>

            {/* Payment and Actions */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    {getPaymentBadge(order)}
                    <StatusDropdown
                        currentStatus={order.orderStatus}
                        orderId={order.id}
                        onStatusChange={onStatusChange}
                        isUpdating={loading}
                    />
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => onView(order)}
                        className="px-2.5 py-1.5 text-xs bg-yellow-400/20 hover:bg-gold-500/30 text-white rounded-lg transition-all duration-200 flex items-center gap-1"
                        aria-label="View order"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onWhatsApp(order)}
                        className="px-2.5 py-1.5 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-all duration-200 flex items-center gap-1"
                        aria-label="Send WhatsApp"
                    >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                    </button>
                    <button
                        onClick={() => onPDF(order)}
                        className="px-2.5 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200 flex items-center gap-1"
                        aria-label="Download PDF"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============ Main Admin Users Component ============

const AdminUsers: React.FC = () => {
    const [orders, setOrders] = useState<OrderWithUser[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<OrderWithUser | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [userDiscounts, setUserDiscounts] = useState<Record<string, number>>({});

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch orders
            const response = await axios.get(`${API_URL}/orders`, {
                params: {
                    limit: 1000,
                    sort_by: 'createdAt',
                    sort_order: 'desc'
                }
            });

            const ordersData = response.data;
            console.log('📦 Fetched orders from backend:', ordersData);

            // Fetch users
            const usersResponse = await axios.get(`${API_URL}/users`, {
                params: {
                    limit: 1000,
                    sort_by: 'registrationDate',
                    sort_order: 'desc'
                }
            });

            const users = usersResponse.data;
            console.log('👤 Fetched users:', users);

            // Build user map with all fields including additionalDiscount
            const userMap: Record<string, UserRegistration> = {};
            users.forEach((user: any) => {
                userMap[user.id] = {
                    id: user.id,
                    name: user.name,
                    contact: user.contact,
                    pincode: user.pincode,
                    cityVillage: user.cityVillage,
                    address: user.address,
                    email: user.email || '',
                    createdAt: user.registrationDate || user.createdAt || new Date().toISOString(),
                    registrationDate: user.registrationDate || user.createdAt,
                    isActive: user.isActive !== undefined ? user.isActive : true,
                    additionalDiscount: user.additionalDiscount || 0,
                    updatedAt: user.updatedAt
                };
            });

            // Map orders with user details
            const ordersWithUser: OrderWithUser[] = ordersData.map((order: any) => {
                const userDetails = userMap[order.userId] || null;
                
                // Update userDiscounts state if user has discount
                if (userDetails && userDetails.additionalDiscount && userDetails.additionalDiscount > 0) {
                    setUserDiscounts(prev => ({
                        ...prev,
                        [userDetails.id]: userDetails.additionalDiscount
                    }));
                }

                return {
                    ...order,
                    userDetails: userDetails || {
                        id: order.userId,
                        name: order.delivery?.name || 'Unknown',
                        contact: order.delivery?.contact || '',
                        pincode: order.delivery?.pincode || '',
                        cityVillage: order.delivery?.cityVillage || '',
                        address: order.delivery?.address || '',
                        email: order.delivery?.email || '',
                        createdAt: order.createdAt,
                        registrationDate: order.createdAt,
                        isActive: true,
                        additionalDiscount: 0
                    },
                    paidAmount: order.paidAmount || 0,
                    remainingAmount: order.remainingAmount || 0,
                    paymentHistory: order.paymentHistory || []
                };
            });

            setOrders(ordersWithUser);
            console.log(`✅ Loaded ${ordersWithUser.length} orders`);
            console.log('💰 User discounts:', userDiscounts);
            
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.detail || err.message || 'Failed to fetch orders');
            } else {
                setError('Failed to fetch orders');
            }
            console.error('Error fetching orders:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const filteredOrders = useMemo(() => {
        let filtered = orders;

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(order =>
                order.orderNumber.toLowerCase().includes(term) ||
                order.userDetails.name.toLowerCase().includes(term) ||
                order.userDetails.contact.includes(term) ||
                (order.userDetails.email && order.userDetails.email.toLowerCase().includes(term)) ||
                order.userDetails.cityVillage.toLowerCase().includes(term)
            );
        }

        if (selectedStatus !== 'all') {
            filtered = filtered.filter(order => order.orderStatus === selectedStatus);
        }

        return filtered;
    }, [orders, searchTerm, selectedStatus]);

    const handleViewOrder = (order: OrderWithUser) => {
        setSelectedOrder(order);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedOrder(null);
    };

    const handleUpdateDiscount = (userId: string, discount: number) => {
        setUserDiscounts(prev => ({
            ...prev,
            [userId]: discount
        }));
        setOrders(prev =>
            prev.map(order =>
                order.userId === userId
                    ? {
                        ...order,
                        userDetails: {
                            ...order.userDetails,
                            additionalDiscount: discount
                        }
                    }
                    : order
            )
        );
    };

    const handleRefreshData = () => {
        fetchOrders();
    };

    const handleStatusChange = async (orderId: string, newStatus: string, reason?: string) => {
        try {
            setLoading(true);
            
            const statusToSend = newStatus.toUpperCase();
            
            const response = await axios.patch(
                `${API_URL}/orders/${orderId}/status`,
                { 
                    orderStatus: statusToSend,
                    restorationReason: reason 
                },
                { headers: { 'Content-Type': 'application/json' } }
            );
            
            if (response.data) {
                await fetchOrders();
                const isRestoration = response.data.restoration;
                if (isRestoration) {
                    alert(`✅ Order restored from ${isRestoration.restored_from?.toLowerCase()} to ${isRestoration.restored_to?.toLowerCase()}`);
                } else {
                    alert(`✅ Order status updated to ${statusToSend.toLowerCase()}`);
                }
            }
        } catch (error: any) {
            console.error('Error updating order status:', error);
            alert(`❌ Failed to update status: ${error.response?.data?.detail || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (order: OrderWithUser) => {
        const config = getStatusConfig(order.orderStatus);
        return (
            <span className={`px-2.5 py-1 text-xs capitalize border rounded-full flex items-center gap-1 ${config.color}`}>
                {config.icon} {order.orderStatus.toLowerCase()}
            </span>
        );
    };

    const getPaymentBadge = (order: OrderWithUser) => {
        const remaining = order.remainingAmount || 0;
        const paid = order.paidAmount || 0;
        
        if (remaining <= 0 && paid > 0) {
            return (
                <span className="px-2.5 py-1 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-full">
                    Fully Paid
                </span>
            );
        }
        if (paid > 0 && remaining > 0) {
            return (
                <span className="px-2.5 py-1 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full">
                    Partial ({formatCurrency(paid)})
                </span>
            );
        }
        return (
            <span className="px-2.5 py-1 text-xs bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-full">
                Unpaid
            </span>
        );
    };

    const handleWhatsAppClick = (order: OrderWithUser) => {
        const remaining = order.remainingAmount || 0;
        const message = `Hi ${order.userDetails.name},\n\nThank you for your order #${order.orderNumber}!\n\n` +
            `📞 Contact: ${order.userDetails.contact}\n` +
            `📍 Address: ${order.userDetails.address}, ${order.userDetails.cityVillage}, ${order.userDetails.pincode}\n\n` +
            `🛒 Order Items:\n` +
            (order.items || []).map(item =>
                `• ${item.productName} x${item.quantity} - ${formatCurrency((item.discountedUnitPrice || item.unitPrice) * item.quantity)}`
            ).join('\n') +
            `\n\nTotal: ${formatCurrency(order.finalAmount || order.totalAmount || 0)}` +
            (remaining > 0 ? `\n⚠️ Remaining Balance: ${formatCurrency(remaining)}` : '');
        
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${order.userDetails.contact}?text=${encodedMessage}`, '_blank');
    };

    const handlePDFClick = (order: OrderWithUser) => {
        generateOrderPDF(order, formatCurrency);
    };

    const uniqueUsers = new Set(orders.map(o => o.userId)).size;
    const pendingCount = orders.filter(o => o.orderStatus === 'PENDING').length;
    const processingCount = orders.filter(o => o.orderStatus === 'PROCESSING').length;
    const completedCount = orders.filter(o => o.orderStatus === 'COMPLETED').length;
    const cancelledCount = orders.filter(o => o.orderStatus === 'CANCELLED').length;
    const paidCount = orders.filter(o => o.isPaid === true).length;

    return (
        <div className="min-h-screen bg-black py-8 px-4 md:px-8 relative">
            <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-gradient-to-b from-black via-gray-900/30 to-black" />
                <div className="absolute top-0 left-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6 md:mb-10">
                    <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-4 py-1.5 mb-3 md:mb-4">
                        <span className="text-xs font-medium text-gold-400 uppercase tracking-wider">Admin Panel</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white">
                        All <span className="text-gold-400">Orders</span>
                    </h1>
                    <div className="mt-3 flex justify-center">
                        <div className="w-20 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent rounded-full" />
                    </div>
                    <p className="text-gray-400 mt-4 max-w-2xl mx-auto text-xs md:text-sm">
                        View and manage all orders placed by customers. Track order status and manage discounts.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3 mb-6 md:mb-8">
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-2 md:p-3 text-center">
                        <p className="text-lg md:text-xl font-bold text-white">{orders.length}</p>
                        <p className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider">Total Orders</p>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-2 md:p-3 text-center">
                        <p className="text-lg md:text-xl font-bold text-blue-400">{uniqueUsers}</p>
                        <p className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider">Unique Users</p>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-2 md:p-3 text-center">
                        <p className="text-lg md:text-xl font-bold text-yellow-400">{pendingCount}</p>
                        <p className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider">Pending</p>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-2 md:p-3 text-center">
                        <p className="text-lg md:text-xl font-bold text-blue-400">{processingCount}</p>
                        <p className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider">Processing</p>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-2 md:p-3 text-center">
                        <p className="text-lg md:text-xl font-bold text-green-400">{completedCount}</p>
                        <p className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider">Completed</p>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-2 md:p-3 text-center">
                        <p className="text-lg md:text-xl font-bold text-red-400">{cancelledCount}</p>
                        <p className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider">Cancelled</p>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-2 md:p-3 text-center col-span-2 sm:col-span-1">
                        <p className="text-lg md:text-xl font-bold text-green-400">{paidCount}</p>
                        <p className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider">Paid</p>
                    </div>
                </div>

                {/* Search and Filter Section */}
                <div className="mb-6">
                    <div className="flex flex-col lg:flex-row gap-3 md:gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 md:h-5 md:w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by order number, name, contact, email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2.5 md:py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all text-sm"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white"
                                    >
                                        <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                            <span className="text-[10px] md:text-xs text-gray-500 whitespace-nowrap mr-0.5 md:mr-1">Filter:</span>
                            {['all', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED'].map((status) => {
                                const config = getStatusConfig(status);
                                const isActive = selectedStatus === status;
                                return (
                                    <button
                                        key={status}
                                        onClick={() => setSelectedStatus(status)}
                                        className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-xl text-[10px] md:text-xs font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-1 md:gap-1.5 ${
                                            isActive
                                                ? `${config.color} border shadow-lg shadow-gold-500/10`
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                                        }`}
                                    >
                                        {config.icon} {status === 'all' ? 'All' : status.toLowerCase()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end mt-2 md:mt-3 gap-2">
                        <button
                            onClick={fetchOrders}
                            className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-all duration-200 flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                            disabled={loading}
                        >
                            <svg className={`w-3.5 h-3.5 md:w-4 md:h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </button>
                        
                        {searchTerm && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedStatus('all');
                                }}
                                className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-all duration-200 flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/30 border border-red-500 text-red-300 rounded-xl text-center max-w-lg mx-auto">
                        <p>{error}</p>
                        <button
                            onClick={fetchOrders}
                            className="mt-2 text-sm text-gold-400 underline hover:text-gold-300"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <>
                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-12 md:py-16 bg-gray-900/50 rounded-2xl border border-gray-800">
                                <div className="text-5xl md:text-6xl mb-4">📦</div>
                                <p className="text-gray-400 text-base md:text-lg">No orders found</p>
                                <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden lg:block bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-800/80 border-b border-gray-700">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Invoice</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Contact</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Items</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Payment</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800">
                                                {filteredOrders.map((order) => (
                                                    <tr key={order.id} className="hover:bg-gray-800/50 transition-colors">
                                                        
                                                        <td className="px-4 py-3">
                                                            {order.invoiceNumber ? (
                                                                <span className="text-xs font-mono bg-gold-500/10 text-amber-400 px-2 py-1 rounded border border-gold-500/20">
                                                                    {order.invoiceNumber}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-gray-500">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <p className="text-sm font-medium text-white">{order.userDetails.name}</p>
                                                                <p className="text-xs text-gray-500">{order.userDetails.cityVillage}</p>
                                                                {order.userDetails.additionalDiscount && order.userDetails.additionalDiscount > 0 && (
                                                                    <span className="text-xs text-green-400">💰 {order.userDetails.additionalDiscount}% OFF</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-300">
                                                            <a
                                                                href={`tel:${order.userDetails.contact}`}
                                                                className="hover:text-gold-400 transition-colors"
                                                            >
                                                                {order.userDetails.contact}
                                                            </a>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="text-sm text-white font-medium">
                                                                {order.items?.length || 0}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-sm font-bold text-white">
                                                                {formatCurrency(order.finalAmount || order.totalAmount || 0)}
                                                            </span>
                                                            {order.additionalDiscountPercentage > 0 && (
                                                                <span className="text-xs text-green-400 block">
                                                                    -{order.additionalDiscountPercentage}% off
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <StatusDropdown
                                                                currentStatus={order.orderStatus}
                                                                orderId={order.id}
                                                                onStatusChange={handleStatusChange}
                                                                isUpdating={loading}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {getPaymentBadge(order)}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleViewOrder(order)}
                                                                    className="px-3 py-1.5 text-xs bg-yellow-400/20 hover:bg-gold-500/30 text-white rounded-lg transition-all duration-200 flex items-center gap-1"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                    View
                                                                </button>
                                                                <button
                                                                    onClick={() => handleWhatsAppClick(order)}
                                                                    className="px-3 py-1.5 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-all duration-200 flex items-center gap-1"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                                                    </svg>
                                                                    WA
                                                                </button>
                                                                <button
                                                                    onClick={() => handlePDFClick(order)}
                                                                    className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200 flex items-center gap-1"
                                                                    title="Download PDF"
                                                                >
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                    </svg>
                                                                    PDF
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Mobile Card View */}
                                <div className="lg:hidden">
                                    {filteredOrders.map((order) => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            onView={handleViewOrder}
                                            onStatusChange={handleStatusChange}
                                            onWhatsApp={handleWhatsAppClick}
                                            onPDF={handlePDFClick}
                                            formatCurrency={formatCurrency}
                                            getPaymentBadge={getPaymentBadge}
                                            getStatusBadge={getStatusBadge}
                                            loading={loading}
                                        />
                                    ))}
                                    <div className="text-center text-xs text-gray-500 mt-4">
                                        Showing {filteredOrders.length} of {orders.length} orders
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            <UserDetailModal
                order={selectedOrder}
                isOpen={showModal}
                onClose={closeModal}
                formatCurrency={formatCurrency}
                getImageUrl={getImageUrl}
                onUpdateDiscount={handleUpdateDiscount}
                onRefreshData={handleRefreshData}
            />
        </div>
    );
};

export default AdminUsers;