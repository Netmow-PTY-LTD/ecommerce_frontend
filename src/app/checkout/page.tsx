"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Truck, Shield, CreditCard, DollarSign, User, Lock, Mail, Tag, X, Loader2, Gift } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

// CheckoutForm component
function CheckoutForm({
    formData,
    setFormData,
    errors,
    setErrors,
    isProcessing,
    setIsProcessing,
    finalTotal,
    clearCart,
    items,
    imageErrors,
    setImageErrors,
    cartTotals,
    paymentMethod,
    setPaymentMethod,
    formatCurrency,
    currency,
    isAuthenticated,
    customer,
    appliedCoupon,
    discountAmount,
    freeShipping,
    applyCoupon,
    removeCoupon
}: {
    formData: any;
    setFormData: (data: any) => void;
    errors: Record<string, string>;
    setErrors: (errors: Record<string, string>) => void;
    isProcessing: boolean;
    setIsProcessing: (processing: boolean) => void;
    finalTotal: number;
    clearCart: () => void;
    items: any[];
    imageErrors: Set<number>;
    setImageErrors: (errors: Set<number>) => void;
    cartTotals: { cartTotal: number; shippingCost: number; tax: number };
    paymentMethod: 'cod' | 'online';
    setPaymentMethod: (method: 'cod' | 'online') => void;
    formatCurrency: (amount: number) => string;
    currency: string;
    isAuthenticated: boolean;
    customer: any;
    appliedCoupon: any;
    discountAmount: number;
    freeShipping: boolean;
    applyCoupon: (coupon: any, discountAmount: number, freeShipping: boolean) => void;
    removeCoupon: () => void;
}) {
    const router = useRouter();
    const [couponCode, setCouponCode] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');

    // BOGO deals state
    const [bogoProductIds, setBogoProductIds] = useState<Set<number>>(new Set());
    const [bogoCouponCodes, setBogoCouponCodes] = useState<Map<number, string>>(new Map());

    useEffect(() => {
        api.get('/pricing/public/bogo-deals').then(res => {
            const deals = res.data?.data || res.data || [];
            const ids = new Set<number>();
            const codes = new Map<number, string>();
            for (const deal of deals) {
                for (const pid of deal.product_ids) {
                    ids.add(pid);
                    codes.set(pid, deal.coupon_code);
                }
            }
            setBogoProductIds(ids);
            setBogoCouponCodes(codes);
        }).catch(() => { });
    }, []);

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponLoading(true);
        setCouponError('');
        try {
            const cartItemsPayload = items.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                unit_price: item.price
            }));
            const res = await api.post('/pricing/coupons/validate', {
                code: couponCode.toUpperCase(),
                cart_total: cartTotals.cartTotal,
                cart_items: cartItemsPayload
            });
            const data = res.data?.data || res.data;
            if (data?.valid) {
                applyCoupon(data.coupon, data.discountAmount, data.freeShipping);
                setCouponCode('');
            } else {
                setCouponError(res.data?.message || 'Invalid coupon');
            }
        } catch (err: any) {
            setCouponError(err.response?.data?.message || 'Failed to validate coupon');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.phone) newErrors.phone = 'Phone is required';
        if (!formData.firstName) newErrors.firstName = 'First name is required';
        if (!formData.lastName) newErrors.lastName = 'Last name is required';
        if (!formData.address) newErrors.address = 'Address is required';
        if (!formData.city) newErrors.city = 'City is required';
        // state and postalCode are optional

        // Password validation if user wants to create account
        if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.password && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (Object.keys(newErrors).length > 0) {
            console.warn('❌ Validation failed:', newErrors);
            toast.error(`Please fill in: ${Object.keys(newErrors).join(', ')}`, { duration: 5000 });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🚀 handleSubmit called, paymentMethod:', paymentMethod);

        if (!validateForm()) {
            console.log('❌ Form validation failed');
            return;
        }

        console.log('✅ Validation passed, processing order...');
        setIsProcessing(true);

        try {
            // Create account if password is provided
            if (formData.password && formData.password.length >= 6) {
                try {
                    toast.info('Creating your account...');
                    const registerData = {
                        name: `${formData.firstName} ${formData.lastName}`,
                        email: formData.email,
                        password: formData.password,
                        phone: formData.phone
                    };

                    const registerResponse = await api.post('/auth/register', registerData);

                    if (registerResponse.data?.status === true || registerResponse.data?.data) {
                        toast.success('Account created successfully!');
                    }
                } catch (error: any) {
                    // If account creation fails, log but continue with order
                    console.error('Account creation failed:', error);
                    toast.warning('Could not create account, but your order will still be processed');
                }
            }

            // Show processing message
            if (paymentMethod === 'cod') {
                toast.info('Creating your order...');
            }

            if (paymentMethod === 'online') {
                // Online payment with Stripe Checkout
                // Map items to correct format BEFORE saving to pendingOrder
                const mappedItems = items.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: item.price * item.quantity,
                    line_total: item.price * item.quantity,
                    name: item.name,
                }));

                // Store order details for later use after payment
                const orderDetails = {
                    items: mappedItems,
                    subtotal: cartTotals.cartTotal,
                    shipping_cost: cartTotals.shippingCost,
                    tax_amount: Math.max(0, cartTotals.cartTotal - Math.min(discountAmount, cartTotals.cartTotal)) * 0.08,
                    total_amount: finalTotal,
                    payment_method: 'online',
                    customer_email: formData.email,
                    customer_phone: formData.phone,
                    shipping_address: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        address: formData.address,
                        apartment: formData.apartment,
                        city: formData.city,
                        state: formData.state,
                        postalCode: formData.postalCode,
                        country: formData.country
                    }
                };

                // Save order details to localStorage
                localStorage.setItem('pendingOrder', JSON.stringify(orderDetails));

                const response = await api.post('/payments/public/create-checkout-session', {
                    amount: finalTotal,
                    currency: currency.toLowerCase(),
                    metadata: {
                        customer_email: formData.email,
                        customer_name: `${formData.firstName} ${formData.lastName}`,
                        phone: formData.phone,
                        address: formData.address,
                        apartment: formData.apartment,
                        city: formData.city,
                        state: formData.state,
                        postal_code: formData.postalCode
                    }
                });

                if (response.data?.data?.url) {
                    // Clear cart before redirecting
                    clearCart();
                    // Redirect to Stripe Checkout
                    window.location.href = response.data.data.url;
                } else {
                    throw new Error('Failed to create checkout session');
                }
            } else {
                // Cash on Delivery - Create actual order
                console.log('🛒 Creating COD order with items:', items);
                console.log('📧 Customer email:', formData.email);
                console.log('💰 Total:', finalTotal);

                const orderData = {
                    items: items.map(item => ({
                        product_id: item.id,
                        quantity: item.quantity,
                        unit_price: item.price,
                        total_price: item.price * item.quantity,
                        line_total: item.price * item.quantity
                    })),
                    customer_email: formData.email,
                    customer_phone: formData.phone,
                    shipping_address: JSON.stringify({
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        address: formData.address,
                        apartment: formData.apartment,
                        city: formData.city,
                        state: formData.state,
                        postalCode: formData.postalCode,
                        country: formData.country
                    }),
                    billing_address: JSON.stringify({
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        address: formData.address,
                        apartment: formData.apartment,
                        city: formData.city,
                        state: formData.state,
                        postalCode: formData.postalCode,
                        country: formData.country
                    }),
                    subtotal: cartTotals.cartTotal,
                    tax_amount: Math.max(0, cartTotals.cartTotal - Math.min(discountAmount, cartTotals.cartTotal)) * 0.08,
                    shipping_cost: cartTotals.shippingCost,
                    total_amount: finalTotal,
                    discount_amount: Math.min(discountAmount, cartTotals.cartTotal),
                    coupon_id: appliedCoupon?.id || null,
                    payment_method: 'cod',
                    payment_status: 'pending',
                    status: 'pending',
                    notes: formData.newsletter ? 'Customer subscribed to newsletter' : ''
                };

                console.log('📦 Sending order data:', orderData);

                const response = await api.post('/sales/public/checkout-order', orderData);
                console.log('✅ Order response:', response.data);

                // Check if order was created successfully
                if (response.data && (response.data.status === true || response.data.data)) {
                    const orderData_response = response.data.data || response.data;
                    // Order created successfully
                    clearCart();
                    toast.success(`Order placed successfully! Order #${orderData_response.order_number || 'created'}. Pay on delivery.`);
                    // Store order ID for success page — convert to string explicitly
                    const orderId = String(orderData_response.id || orderData_response.order_id || '');
                    const orderNum = String(orderData_response.order_number || '');
                    console.log('💾 Storing in localStorage:', { orderId, orderNum });
                    if (orderId && orderId !== 'undefined') {
                        localStorage.setItem('lastOrderId', orderId);
                    }
                    if (orderNum && orderNum !== 'undefined') {
                        localStorage.setItem('lastOrderNumber', orderNum);
                    }
                    router.push('/checkout/success');
                } else {
                    console.error('❌ Invalid response:', response.data);
                    throw new Error(response.data?.message || 'Failed to create order');
                }
            }
        } catch (error: any) {
            console.error('❌ Checkout error:', error);
            console.error('Error response:', error.response);
            console.error('Error message:', error.message);

            // Show detailed error message
            const errorMessage = error.response?.data?.message ||
                error.message ||
                'Order processing failed';
            toast.error(errorMessage, { duration: 5000 });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column - Form */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Contact Information */}
                    {!isAuthenticated ? (
                        <section>
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm mr-3">1</span>
                                Contact Information
                            </h2>
                            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors.email ? 'border-red-500' : 'border-input'}`}
                                            placeholder="you@example.com"
                                        />
                                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors.phone ? 'border-red-500' : 'border-input'}`}
                                            placeholder="+1 (555) 000-0000"
                                        />
                                        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                                    </div>
                                </div>
                            </div>
                        </section>
                    ) : (
                        <section>
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm mr-3">✓</span>
                                Contact Information (Logged in as {customer?.name})
                            </h2>
                            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-green-900 dark:text-green-100">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-green-300 dark:border-green-700 rounded-lg bg-white dark:bg-green-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-green-900 dark:text-green-100">Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-green-300 dark:border-green-700 rounded-lg bg-white dark:bg-green-900"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Shipping Address */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm mr-3">
                                {isAuthenticated ? '2' : '2'}
                            </span>
                            Shipping Address
                        </h2>
                        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">First Name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors.firstName ? 'border-red-500' : 'border-input'}`}
                                    />
                                    {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors.lastName ? 'border-red-500' : 'border-input'}`}
                                    />
                                    {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors.address ? 'border-red-500' : 'border-input'}`}
                                    placeholder="Street address"
                                />
                                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Apartment, suite, etc. (optional)</label>
                                <input
                                    type="text"
                                    name="apartment"
                                    value={formData.apartment}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors.city ? 'border-red-500' : 'border-input'}`}
                                    />
                                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors.state ? 'border-red-500' : 'border-input'}`}
                                    />
                                    {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Postal Code</label>
                                    <input
                                        type="text"
                                        name="postalCode"
                                        value={formData.postalCode}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${errors.postalCode ? 'border-red-500' : 'border-input'}`}
                                    />
                                    {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Authentication Info */}
                    {!isAuthenticated ? (
                        <section>
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm mr-3">3</span>
                                Authentication Info
                            </h2>
                            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                                {/* Login Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        <span>Already have an account?</span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => router.push('/login?redirect=checkout')}
                                    >
                                        <Lock className="h-4 w-4 mr-2" />
                                        Login to Existing Account
                                    </Button>
                                </div>

                                {/* Guest Checkout */}
                                <div className="border-t border-border pt-4">
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="guestCheckout"
                                            name="guestCheckout"
                                            checked={formData.guestCheckout}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 mt-1"
                                        />
                                        <div className="flex-1">
                                            <label htmlFor="guestCheckout" className="text-sm font-medium cursor-pointer">
                                                Continue as Guest
                                            </label>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                You can create an account later after placing your order
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Account Creation (Optional) */}
                                {!formData.guestCheckout && (
                                    <div className="border-t border-border pt-4 space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                            <Mail className="h-4 w-4" />
                                            <span>Create account with checkout email</span>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Password (optional)</label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                                placeholder="Create a password for your account"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Leave empty to continue as guest. Minimum 6 characters.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Confirm Password</label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={formData.confirmPassword || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                                placeholder="Confirm your password"
                                            />
                                            {errors.confirmPassword && (
                                                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    ) : null}

                    {/* Payment Method */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm mr-3">
                                {isAuthenticated ? '3' : '4'}
                            </span>
                            Payment Method
                        </h2>
                        <div className="space-y-3">
                            {/* Cash on Delivery */}
                            <div
                                className={`bg-card border-2 rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary' : 'border-border'}`}
                                onClick={() => setPaymentMethod('cod')}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            checked={paymentMethod === 'cod'}
                                            onChange={() => setPaymentMethod('cod')}
                                            className="w-4 h-4 text-primary"
                                        />
                                        <div className="ml-3">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-5 w-5 text-green-600" />
                                                <p className="font-medium">Cash on Delivery</p>
                                            </div>
                                            <p className="text-sm text-muted-foreground">Pay with cash when your order arrives</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground">No additional fees</span>
                                </div>
                            </div>

                            {/* Online Payment */}
                            <div
                                className={`bg-card border-2 rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-primary' : 'border-border'}`}
                                onClick={() => setPaymentMethod('online')}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            checked={paymentMethod === 'online'}
                                            onChange={() => setPaymentMethod('online')}
                                            className="w-4 h-4 text-primary"
                                        />
                                        <div className="ml-3">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-5 w-5 text-blue-600" />
                                                <p className="font-medium">Pay Now</p>
                                            </div>
                                            <p className="text-sm text-muted-foreground">Pay securely with credit/debit card</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-medium text-muted-foreground">Secure</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Online Payment Info */}
                        {paymentMethod === 'online' && (
                            <div className="mt-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Secure Stripe Checkout</p>
                                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                            You will be redirected to Stripe's secure payment page to complete your purchase.
                                            We accept all major credit and debit cards.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Newsletter */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="newsletter"
                                checked={formData.newsletter}
                                onChange={handleInputChange}
                                className="w-4 h-4"
                            />
                            <span className="text-sm">Email me with news and offers</span>
                        </label>
                    </div>
                </div>

                {/* Right Column - Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

                        {/* Items */}
                        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                            {items.map((item) => {
                                // Create unique key combining product ID and selected attributes
                                const uniqueKey = `${item.id}-${JSON.stringify(item.selectedAttributes)}`;

                                return (
                                    <div key={uniqueKey} className="flex gap-3">
                                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
                                            {imageErrors.has(item.id) || (!item.image_url && !item.thumb_url) ? (
                                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                                    <Package className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            ) : (
                                                <Image
                                                    src={item.image_url || item.thumb_url || ''}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                    onError={() => {
                                                        setImageErrors(new Set(imageErrors).add(item.id));
                                                    }}
                                                    unoptimized
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium line-clamp-1">
                                                {item.name}
                                                {bogoProductIds.has(item.id) && (
                                                    <span className="ml-1.5 inline-flex items-center gap-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                                                        <Gift className="h-2.5 w-2.5" /> BOGO
                                                    </span>
                                                )}
                                            </h4>
                                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>

                                            {bogoProductIds.has(item.id) && item.quantity < 2 && (
                                                <p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium mt-0.5">
                                                    Need 2+ for Buy 1 Get 1 Free (code: {bogoCouponCodes.get(item.id)})
                                                </p>
                                            )}
                                            {bogoProductIds.has(item.id) && item.quantity >= 2 && (
                                                <p className="text-[10px] text-green-600 dark:text-green-400 font-medium mt-0.5">
                                                    {Math.floor(item.quantity / 2)} free with code {bogoCouponCodes.get(item.id)}
                                                </p>
                                            )}

                                            {/* Selected Attributes */}
                                            {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {Object.entries(item.selectedAttributes).map(([name, value], idx) => (
                                                        <span
                                                            key={idx}
                                                            className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded border border-border"
                                                        >
                                                            {String(name)}: {String(value)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium">{formatCurrency(item.price * item.quantity)}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Totals */}
                        <div className="space-y-3 border-t border-border pt-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">{formatCurrency(cartTotals.cartTotal)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-green-600 dark:text-green-400">
                                    <span className="flex items-center gap-1">
                                        <Tag className="h-3.5 w-3.5" />
                                        Discount
                                        {appliedCoupon && <span className="text-xs">({appliedCoupon.code})</span>}
                                    </span>
                                    <span className="font-medium">-{formatCurrency(Math.min(discountAmount, cartTotals.cartTotal))}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Shipping</span>
                                <span className="font-medium">
                                    {cartTotals.shippingCost === 0 ? 'Free' : formatCurrency(cartTotals.shippingCost)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax</span>
                                <span className="font-medium">{formatCurrency(Math.max(0, cartTotals.cartTotal - Math.min(discountAmount, cartTotals.cartTotal)) * 0.08)}</span>
                            </div>
                            <div className="border-t border-border pt-3 flex justify-between items-center text-base font-bold">
                                <span>Total</span>
                                <span>{formatCurrency(finalTotal)}</span>
                            </div>
                        </div>

                        {/* Coupon Input */}
                        <div className="mt-4 pt-4 border-t border-border">
                            {appliedCoupon ? (
                                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2.5">
                                    <Tag className="text-green-600 dark:text-green-400 h-4 w-4" />
                                    <span className="text-sm text-green-700 dark:text-green-400 font-medium">{appliedCoupon.code}</span>
                                    <span className="text-sm text-green-600 dark:text-green-500">applied</span>
                                    <button type="button" onClick={removeCoupon} className="ml-auto p-0.5 hover:bg-green-100 dark:hover:bg-green-900/40 rounded">
                                        <X className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Have a coupon?</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter code"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                                            className="flex-1 px-3 py-2 border border-input rounded-lg bg-background text-sm uppercase"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleApplyCoupon}
                                            disabled={!couponCode.trim() || couponLoading}
                                            className="h-9 px-4 shrink-0"
                                        >
                                            {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                                        </Button>
                                    </div>
                                    {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full mt-6 text-base font-semibold h-12"
                            disabled={isProcessing}
                            onClick={(e) => {
                                // Fallback: directly call handleSubmit if form onSubmit doesn't fire
                                const form = e.currentTarget.closest('form');
                                if (form) {
                                    // Let the form's onSubmit handle it
                                } else {
                                    e.preventDefault();
                                    handleSubmit(e as any);
                                }
                            }}
                        >
                            {isProcessing ? (
                                <span className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Processing...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    {paymentMethod === 'cod' ? (
                                        <>
                                            <DollarSign className="mr-2 h-4 w-4" />
                                            Place Order (COD)
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            Pay Now
                                        </>
                                    )}
                                </span>
                            )}
                        </Button>

                        {/* Trust Badges */}
                        <div className="mt-6 pt-6 border-t border-border">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <Shield className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">Secure Payment</p>
                                </div>
                                <div>
                                    <Truck className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">Fast Shipping</p>
                                </div>
                                <div>
                                    <Package className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">Easy Returns</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}

// Main Checkout Page Component
function CheckoutPageContent() {
    const searchParams = useSearchParams();
    const { items, total, clearCart, coupon, discountAmount, freeShipping, applyCoupon, removeCoupon } = useCartStore();
    const { formatCurrency, currency } = useCurrency();
    const { isAuthenticated, customer } = useCustomerAuth();
    const [mounted, setMounted] = useState(false);
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('online');

    const [formData, setFormData] = useState({
        // Contact
        email: '',
        phone: '',

        // Shipping
        firstName: '',
        lastName: '',
        address: '',
        apartment: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States',

        // Authentication
        guestCheckout: false,
        password: '',
        confirmPassword: '',

        // Options
        saveInfo: false,
        newsletter: false
    });

    const [cartTotals, setCartTotals] = useState({
        cartTotal: 0,
        shippingCost: 0,
        tax: 0
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        setMounted(true);

        // Calculate totals
        const cartTotal = total();
        const shippingCost = cartTotal > 100 ? 0 : 15;
        const taxRate = 0.08; // 8% tax
        const tax = cartTotal * taxRate;

        setCartTotals({
            cartTotal,
            shippingCost,
            tax
        });

        // Check if user was redirected from canceled payment
        if (searchParams.get('canceled') === 'true') {
            toast.error('Payment was canceled. Please try again.');
        }
    }, [items, total, searchParams]);

    // Re-validate coupon when cart items change
    useEffect(() => {
        if (!coupon || !mounted) return;
        const cartTotal = total();
        if (cartTotal === 0) { removeCoupon(); return; }
        api.post('/pricing/coupons/validate', {
            code: coupon.code,
            cart_total: cartTotal,
            cart_items: items.map(i => ({ product_id: i.id, quantity: i.quantity, unit_price: i.price }))
        }).then(res => {
            const data = res.data?.data || res.data;
            if (data?.valid) {
                applyCoupon(data.coupon, data.discountAmount, data.freeShipping);
            } else {
                removeCoupon();
            }
        }).catch(() => {
            removeCoupon();
        });
    }, [items, coupon?.code, mounted]);

    // Pre-fill form with customer data when logged in
    useEffect(() => {
        if (isAuthenticated && customer) {
            // Split name into first and last name
            const nameParts = customer.name?.split(' ') || ['', ''];
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            setFormData(prev => ({
                ...prev,
                // Contact info
                email: customer.email || '',
                phone: customer.phone || '',

                // Shipping info
                firstName: firstName || prev.firstName,
                lastName: lastName || prev.lastName,
                address: customer.address || prev.address,
                city: customer.city || prev.city,
                state: customer.state || prev.state,
                postalCode: customer.postal_code || prev.postalCode,
                country: customer.country || 'United States'
            }));
        }
    }, [isAuthenticated, customer]);

    const effectiveDiscount = Math.min(discountAmount, cartTotals.cartTotal);
    const discountedSubtotal = Math.max(0, cartTotals.cartTotal - effectiveDiscount);
    const effectiveTax = discountedSubtotal * 0.08;
    const finalTotal = Math.max(0, discountedSubtotal + cartTotals.shippingCost + effectiveTax);

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold">Your cart is empty</h2>
                    <p className="text-muted-foreground">Add items to your cart before checkout</p>
                    <Link href="/shop">
                        <Button size="lg">Browse Products</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-secondary/30 border-b border-border py-1">
                <div className="container px-4 py-4">
                    <Link href="/cart" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Cart
                    </Link>
                </div>
            </div>

            <section className='py-10'>
                <div className="container mx-auto">
                    <h1 className="text-3xl font-bold mb-8">Checkout</h1>

                    <CheckoutForm
                        formData={formData}
                        setFormData={setFormData}
                        errors={errors}
                        setErrors={setErrors}
                        isProcessing={isProcessing}
                        setIsProcessing={setIsProcessing}
                        finalTotal={finalTotal}
                        clearCart={clearCart}
                        items={items}
                        imageErrors={imageErrors}
                        setImageErrors={setImageErrors}
                        cartTotals={cartTotals}
                        paymentMethod={paymentMethod}
                        setPaymentMethod={setPaymentMethod}
                        formatCurrency={formatCurrency}
                        currency={currency}
                        isAuthenticated={isAuthenticated}
                        customer={customer}
                        appliedCoupon={coupon}
                        discountAmount={discountAmount}
                        freeShipping={freeShipping}
                        applyCoupon={applyCoupon}
                        removeCoupon={removeCoupon}
                    />
                </div>
            </section>
        </div>
    );
}

// Wrapper component with Suspense boundary
export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <CheckoutPageContent />
        </Suspense>
    );
}

