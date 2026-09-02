// src/pages/UserRegister.tsx - User Registration/Checkout Page with Backend Integration
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useCart } from './ProductCart';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// API Configuration
const API_BASE_URL = '';
const API_URL = `${API_BASE_URL}/api`;

interface FormData {
    name: string;
    contact: string;
    pincode: string;
    cityVillage: string;
    address: string;
    email: string;
}

interface FormErrors {
    name?: string;
    contact?: string;
    pincode?: string;
    cityVillage?: string;
    address?: string;
    email?: string;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    delay: number;
    duration: number;
    rotation: number;
    translateX: number;
    translateY: number;
}

// Separate InputField component to prevent re-renders
const InputField = React.memo(({ 
    name, 
    type = 'text', 
    label, 
    placeholder, 
    required = true, 
    maxLength,
    error,
    value,
    onChange,
    onBlur,
    touched
}: {
    name: string;
    type?: string;
    label: string;
    placeholder: string;
    required?: boolean;
    maxLength?: number;
    error?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    touched?: boolean;
}) => {
    const inputId = `input-${name}`;
    
    return (
        <div className="w-full">
            <label 
                htmlFor={inputId}
                className="block text-sm font-medium text-gray-300 mb-1.5"
            >
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <input
                id={inputId}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={placeholder}
                maxLength={maxLength}
                aria-invalid={!!error}
                aria-describedby={error ? `${inputId}-error` : undefined}
                className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    error && touched ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-700 focus:border-gold-500 focus:ring-gold-500/50'
                }`}
            />
            {error && touched && (
                <p id={`${inputId}-error`} className="text-red-400 text-xs mt-1">
                    {error}
                </p>
            )}
        </div>
    );
});

InputField.displayName = 'InputField';

const UserRegister: React.FC = () => {
    const navigate = useNavigate();
    const { 
        clearCart, 
        getCartItems, 
        getSubtotal, 
        getDiscount, 
        getTotalPrice, 
        checkout,
        cartItems 
    } = useCart();
    
    const [formData, setFormData] = useState<FormData>({
        name: '',
        contact: '',
        pincode: '',
        cityVillage: '',
        address: '',
        email: ''
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<keyof FormData, boolean>>({
        name: false,
        contact: false,
        pincode: false,
        cityVillage: false,
        address: false,
        email: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [celebrationParticles, setCelebrationParticles] = useState<Particle[]>([]);
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    const [cartWarning, setCartWarning] = useState<string | null>(null);
    
    const isMounted = useRef(true);

    // Check cart status
    useEffect(() => {
        const items = getCartItems();
        const isEmpty = items.length === 0;
        
        if (isEmpty) {
            setCartWarning('⚠️ Your cart is empty. You can still register, but no order will be placed.');
        } else {
            setCartWarning(null);
        }
        
        console.log('🛒 UserRegister: cart items:', items.length);
    }, [cartItems, getCartItems]);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Memoized validation function
    const validateField = useCallback((name: keyof FormData, value: string): string | undefined => {
        switch (name) {
            case 'name':
                if (!value.trim()) return 'Name is required';
                if (value.trim().length < 2) return 'Name must be at least 2 characters';
                return undefined;
            case 'contact':
                if (!value.trim()) return 'Contact number is required';
                const contactRegex = /^[6-9]\d{9}$/;
                if (!contactRegex.test(value.trim())) return 'Enter a valid 10-digit mobile number';
                return undefined;
            case 'pincode':
                if (!value.trim()) return 'Pincode is required';
                const pincodeRegex = /^[1-9][0-9]{5}$/;
                if (!pincodeRegex.test(value.trim())) return 'Enter a valid 6-digit pincode';
                return undefined;
            case 'cityVillage':
                if (!value.trim()) return 'City or Village name is required';
                if (value.trim().length < 2) return 'City/Village name must be at least 2 characters';
                return undefined;
            case 'address':
                if (!value.trim()) return 'Address is required';
                if (value.trim().length < 5) return 'Address must be at least 5 characters';
                return undefined;
            case 'email':
                if (value.trim()) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value.trim())) return 'Enter a valid email address';
                }
                return undefined;
            default:
                return undefined;
        }
    }, []);

    const validateForm = useCallback((): boolean => {
        const newErrors: FormErrors = {};
        let isValid = true;

        (Object.keys(formData) as Array<keyof FormData>).forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) {
                newErrors[key] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    }, [formData, validateField]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        // Handle maxLength for specific fields
        let processedValue = value;
        if (name === 'contact' && value.length > 10) {
            processedValue = value.slice(0, 10);
        } else if (name === 'pincode' && value.length > 6) {
            processedValue = value.slice(0, 6);
        }
        
        setFormData(prev => ({ ...prev, [name]: processedValue }));
        
        // Clear error for this field when user starts typing if it was touched
        if (touched[name as keyof FormData] && errors[name as keyof FormErrors]) {
            const error = validateField(name as keyof FormData, processedValue);
            setErrors(prev => ({ 
                ...prev, 
                [name]: error 
            }));
        }
    }, [errors, touched, validateField]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        // Mark field as touched
        setTouched(prev => ({ ...prev, [name]: true }));
        
        // Validate on blur
        const error = validateField(name as keyof FormData, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    }, [validateField]);

    const generateCelebrationParticles = useCallback(() => {
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8A5C', '#6C5CE7', '#FD79A8', '#00B894', '#FDCB6E'];
        const particles: Particle[] = [];
        for (let i = 0; i < 80; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const distance = 100 + Math.random() * 300;
            particles.push({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: Math.random() * 12 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                delay: Math.random() * 1.5,
                duration: Math.random() * 2 + 2,
                rotation: Math.random() * 360,
                translateX: Math.cos(angle) * distance,
                translateY: Math.sin(angle) * distance
            });
        }
        return particles;
    }, []);

    // Sync cart from localStorage as fallback
    const syncCartFromLocalStorage = useCallback(() => {
        try {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                const parsed = JSON.parse(savedCart);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    console.log('🔄 Syncing cart from localStorage:', parsed.length, 'items');
                    return parsed;
                }
            }
        } catch (error) {
            console.error('Error syncing cart:', error);
        }
        return [];
    }, []);

    /**
     * ✅ FIXED: Registration-only function
     * Uses the /api/register endpoint which ONLY creates user_registrations records
     * NO orders are created - this is for empty cart registration flow
     */
    const sendRegistrationOnly = useCallback(async (userData: any) => {
        try {
            console.log('📝 Registering user at /api/register (registration-only)');
            const response = await axios.post(`${API_URL}/register`, userData);
            console.log('✅ Registration successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Registration error:', error);
            const errorMessage = error.response?.data?.detail || 'Registration failed. Please try again.';
            throw new Error(errorMessage);
        }
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError(null);
        setCartWarning(null);
        
        // Mark all fields as touched
        const allTouched = Object.keys(formData).reduce((acc, key) => {
            acc[key as keyof FormData] = true;
            return acc;
        }, {} as Record<keyof FormData, boolean>);
        setTouched(allTouched);
        
        if (!validateForm()) {
            // Scroll to first error
            const firstErrorField = Object.keys(errors)[0];
            if (firstErrorField) {
                const element = document.getElementById(`input-${firstErrorField}`);
                if (element) {
                    element.focus();
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            return;
        }

        // Check if cart is empty
        let cartItemsFromContext = getCartItems();
        let effectiveCart = cartItemsFromContext;
        
        // If context cart is empty, try to get from localStorage
        if (effectiveCart.length === 0) {
            const localStorageCart = syncCartFromLocalStorage();
            if (localStorageCart.length > 0) {
                effectiveCart = localStorageCart;
                console.log('🔄 Using localStorage cart items:', localStorageCart.length);
            }
        }

        // Prepare user data
        const userData = {
            name: formData.name,
            contact: formData.contact,
            pincode: formData.pincode,
            cityVillage: formData.cityVillage,
            address: formData.address,
            email: formData.email || undefined
        };

        setIsSubmitting(true);

        try {
            /**
             * ✅ FIXED: If cart is empty, ONLY register the user
             * Uses /api/register endpoint - NO orders created
             */
            if (effectiveCart.length === 0) {
                console.log('📝 Cart is empty, registering user only...');
                const result = await sendRegistrationOnly(userData);
                
                if (isMounted.current) {
                    setIsSubmitting(false);
                    setIsSuccess(true);
                    setOrderDetails({ 
                        message: 'Registration successful!', 
                        user: result.user || result,
                        isRegistration: true
                    });
                    setCelebrationParticles(generateCelebrationParticles());
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    console.log('✅ Registration successful:', result);
                }
                return;
            }

            /**
             * ✅ Cart has items, proceed with checkout
             * This creates orders and order_items records
             */
            console.log('🛒 Cart has items, proceeding with checkout...');
            const result = await checkout(userData);
            
            if (isMounted.current) {
                setIsSubmitting(false);
                setIsSuccess(true);
                setOrderDetails(result);
                setCelebrationParticles(generateCelebrationParticles());
                clearCart();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                console.log('✅ Order placed successfully:', result);
                // ✅ FIXED: Get invoice number from response
                const invoiceNumber = result?.order?.invoiceNumber || 
                                     result?.order?.invoice_number || 
                                     result?.invoiceNumber || 
                                     result?.invoice_number || 
                                     'N/A';
                console.log('📄 Invoice Number:', invoiceNumber);
            }
        } catch (error: any) {
            if (isMounted.current) {
                setIsSubmitting(false);
                const errorMessage = error.message || 'Failed to process request. Please try again.';
                setApiError(errorMessage);
                console.error('❌ Error:', error);
            }
        }
    }, [validateForm, generateCelebrationParticles, clearCart, formData, errors, getCartItems, checkout, syncCartFromLocalStorage, sendRegistrationOnly]);

    const handleReset = useCallback(() => {
        setIsSuccess(false);
        setCelebrationParticles([]);
        setOrderDetails(null);
        setApiError(null);
        setCartWarning(null);
        setFormData({
            name: '',
            contact: '',
            pincode: '',
            cityVillage: '',
            address: '',
            email: ''
        });
        setErrors({});
        setTouched({
            name: false,
            contact: false,
            pincode: false,
            cityVillage: false,
            address: false,
            email: false
        });
    }, []);

    // ✅ FIXED: SuccessMessage component - NOW SHOWS INVOICE NUMBER
    const SuccessMessage = useCallback(() => {
        // ✅ Extract INVOICE NUMBER from order (not order number)
        const invoiceNumber = orderDetails?.order?.invoiceNumber || 
                              orderDetails?.order?.invoice_number || 
                              orderDetails?.invoiceNumber || 
                              orderDetails?.invoice_number || 
                              null;
        
        // Also get order number as fallback
        const orderNumber = orderDetails?.order?.orderNumber || 
                            orderDetails?.order?.order_number || 
                            orderDetails?.orderNumber || 
                            orderDetails?.order_number || 
                            null;
        
        const totalAmount = orderDetails?.order?.finalAmount || 
                            orderDetails?.order?.final_amount || 
                            orderDetails?.finalAmount || 
                            orderDetails?.final_amount || 
                            null;

        const isRegistration = orderDetails?.isRegistration || false;

        // Determine which number to display - prefer invoice number
        const displayNumber = invoiceNumber || orderNumber;

        return (
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gold-500/30 p-8 md:p-12 text-center max-w-2xl mx-auto shadow-2xl shadow-gold-500/10">
                {/* Celebration Particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {celebrationParticles.map((particle) => {
                        const uniqueKeyframes = `
                            @keyframes particleBurst_${particle.id} {
                                0% {
                                    opacity: 1;
                                    transform: translate(0, 0) scale(1) rotate(0deg);
                                }
                                100% {
                                    opacity: 0;
                                    transform: translate(${particle.translateX}px, ${particle.translateY}px) scale(0) rotate(720deg);
                                }
                            }
                        `;
                        
                        return (
                            <React.Fragment key={particle.id}>
                                <style>{uniqueKeyframes}</style>
                                <div
                                    className="particle"
                                    style={{
                                        left: `${particle.x}%`,
                                        top: `${particle.y}%`,
                                        width: `${particle.size}px`,
                                        height: `${particle.size}px`,
                                        backgroundColor: particle.color,
                                        animation: `particleBurst_${particle.id} ${particle.duration}s ease-out ${particle.delay}s forwards`,
                                        transform: `rotate(${particle.rotation}deg)`,
                                        boxShadow: `0 0 20px ${particle.color}40`,
                                        borderRadius: '50%',
                                        position: 'absolute',
                                        pointerEvents: 'none',
                                    }}
                                />
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className="relative z-10">
                    <div className="text-7xl md:text-8xl mb-6 bounce-slow">
                        🎉
                    </div>

                    <div className="flex justify-center gap-3 mb-6">
                        <span className="text-4xl float-animation" style={{ animationDelay: '0s' }}>✨</span>
                        <span className="text-4xl float-animation" style={{ animationDelay: '0.3s' }}>🎆</span>
                        <span className="text-4xl float-animation" style={{ animationDelay: '0.6s' }}>🎇</span>
                        <span className="text-4xl float-animation" style={{ animationDelay: '0.9s' }}>🌟</span>
                        <span className="text-4xl float-animation" style={{ animationDelay: '1.2s' }}>🎊</span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Thank You, <span className="text-gold-400">{formData.name}</span>!
                    </h2>

                    {/* ✅ FIXED: Display INVOICE NUMBER */}
                    {displayNumber && !isRegistration && (
                        <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-4 mb-4">
                            <p className="text-gray-300 text-sm">
                                Invoice Number: <span className="text-gold-400 font-bold">{displayNumber}</span>
                            </p>
                            {totalAmount && (
                                <p className="text-gray-400 text-xs mt-1">
                                    Total Amount: <span className="text-white font-medium">₹{totalAmount}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {isRegistration && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
                            <p className="text-gray-300 text-sm">
                                ✅ {orderDetails?.message || 'Registration completed successfully!'}
                            </p>
                        </div>
                    )}

                    {orderDetails?.message && !isRegistration && !displayNumber && (
                        <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-4 mb-4">
                            <p className="text-gray-300 text-sm">
                                {orderDetails.message}
                            </p>
                        </div>
                    )}

                    <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-6 mb-6">
                        {displayNumber && !isRegistration ? (
                            <>
                                <p className="text-gray-300 text-lg leading-relaxed">
                                    We've received your order <span className="text-gold-400 font-bold">#{displayNumber}</span> and will get back to you within{' '}
                                    <span className="text-gold-400 font-bold">24 hours</span>.
                                </p>
                                <p className="text-gray-400 text-sm mt-3">
                                    📞 We'll contact you at <span className="text-white">{formData.contact}</span>
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-300 text-lg leading-relaxed">
                                    Your registration has been completed successfully!
                                </p>
                                <p className="text-gray-400 text-sm mt-3">
                                    📞 We'll contact you at <span className="text-white">{formData.contact}</span>
                                </p>
                            </>
                        )}
                    </div>

                    <div className="flex flex-wrap justify-center gap-4">
                        <button
                            onClick={handleReset}
                            className="px-8 py-3 bg-gold-500 text-black font-semibold rounded-xl hover:bg-gold-400 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-gold-500/30"
                        >
                            🛍️ Continue Shopping
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="px-8 py-3 border border-gray-600 text-gray-300 font-semibold rounded-xl hover:bg-gray-800 transition-all duration-300"
                        >
                            🏠 Go to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }, [celebrationParticles, formData.name, formData.contact, orderDetails, handleReset, navigate]);

    // Memoized registration form
    const RegistrationForm = useMemo(() => (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 md:p-8 max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-4 py-1.5 mb-4">
                    <span className="text-xs font-medium text-gold-400 uppercase tracking-wider">
                        {getCartItems().length > 0 ? 'Checkout' : 'Register'}
                    </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                    {getCartItems().length > 0 ? 'Complete Your ' : ''}
                    <span className="text-gold-400">
                        {getCartItems().length > 0 ? 'Order' : 'Registration'}
                    </span>
                </h2>
                <p className="text-gray-400 mt-2 text-sm">
                    {getCartItems().length > 0 
                        ? 'Fill in your details and we\'ll get back to you within 24 hours'
                        : 'Register with us and get exclusive offers!'}
                </p>
            </div>

            {cartWarning && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                    <p className="text-yellow-400 text-sm flex items-center gap-2">
                        <span>⚠️</span>
                        {cartWarning}
                    </p>
                </div>
            )}

            {/* API Error Message */}
            {apiError && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-500 rounded-xl text-red-300 text-sm">
                    <div className="flex items-start gap-2">
                        <span className="text-red-400 text-lg">⚠️</span>
                        <p>{apiError}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <InputField
                    key="name"
                    name="name"
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    error={errors.name}
                    touched={touched.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                />

                <InputField
                    key="contact"
                    name="contact"
                    type="tel"
                    label="Contact Number"
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    value={formData.contact}
                    error={errors.contact}
                    touched={touched.contact}
                    onChange={handleChange}
                    onBlur={handleBlur}
                />

                <InputField
                    key="pincode"
                    name="pincode"
                    type="text"
                    label="Pincode"
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                    value={formData.pincode}
                    error={errors.pincode}
                    touched={touched.pincode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                />

                <InputField
                    key="cityVillage"
                    name="cityVillage"
                    label="City / Village"
                    placeholder="Enter city or village name"
                    value={formData.cityVillage}
                    error={errors.cityVillage}
                    touched={touched.cityVillage}
                    onChange={handleChange}
                    onBlur={handleBlur}
                />

                <div>
                    <label htmlFor="input-address" className="block text-sm font-medium text-gray-300 mb-1.5">
                        Address <span className="text-red-400">*</span>
                    </label>
                    <textarea
                        id="input-address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Enter your complete address"
                        rows={3}
                        aria-invalid={!!errors.address}
                        aria-describedby={errors.address ? "input-address-error" : undefined}
                        className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${
                            errors.address && touched.address ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-700 focus:border-gold-500 focus:ring-gold-500/50'
                        }`}
                    />
                    {errors.address && touched.address && (
                        <p id="input-address-error" className="text-red-400 text-xs mt-1">
                            {errors.address}
                        </p>
                    )}
                </div>

                <InputField
                    key="email"
                    name="email"
                    type="email"
                    label="Email Address"
                    placeholder="Enter your email address"
                    required={false}
                    value={formData.email}
                    error={errors.email}
                    touched={touched.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                />

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-gold-500 text-white font-bold rounded-xl hover:bg-gold-400 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 disabled:opacity-70 disabled:cursor-not-allowed text-lg"
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </>
                    ) : (
                        <>
                            <span>📝</span>
                            {getCartItems().length > 0 ? 'Place Order' : 'Register Now'}
                        </>
                    )}
                </button>

                <p className="text-center text-xs text-gray-500 mt-4">
                    By submitting, you agree to our terms and conditions. 
                    {getCartItems().length > 0 && " We'll contact you within 24 hours."}
                </p>
            </form>
        </div>
    ), [formData, errors, touched, isSubmitting, apiError, cartWarning, handleChange, handleBlur, handleSubmit, getCartItems]);

    return (
        <section className="min-h-screen bg-black py-16 px-4 md:px-8 relative">
            <div className="absolute inset-0 z-0">
                <div className="w-full h-full bg-gradient-to-b from-black via-gray-900/30 to-black" />
                <div className="absolute top-0 left-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-4 py-1.5 mb-4">
                        <span className="text-xs font-medium text-gold-400 uppercase tracking-wider">
                            {getCartItems().length > 0 ? 'Checkout' : 'Registration'}
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white">
                        {getCartItems().length > 0 ? 'Get ' : ''}
                        <span className="text-gold-400">
                            {getCartItems().length > 0 ? 'Started' : 'Register'}
                        </span>
                    </h1>
                    <div className="mt-3 flex justify-center">
                        <div className="w-20 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent rounded-full" />
                    </div>
                </div>

                {isSuccess ? <SuccessMessage /> : RegistrationForm}
            </div>

            <style>{`
                .sparkle {
                    position: absolute;
                    width: 3px;
                    height: 3px;
                    background: #FFD700;
                    border-radius: 50%;
                    animation: sparklePulse 3s ease-in-out infinite;
                    pointer-events: none;
                }

                @keyframes sparklePulse {
                    0%, 100% {
                        opacity: 0;
                        transform: scale(0);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .float-animation {
                    display: inline-block;
                    animation: floatUp 2s ease-in-out infinite;
                }

                @keyframes floatUp {
                    0%, 100% {
                        transform: translateY(0px) rotate(0deg);
                    }
                    50% {
                        transform: translateY(-10px) rotate(10deg);
                    }
                }

                .bounce-slow {
                    display: inline-block;
                    animation: bounceSlow 2.5s ease-in-out infinite;
                }

                @keyframes bounceSlow {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-20px);
                    }
                }
            `}</style>
        </section>
    );
};

export default UserRegister;