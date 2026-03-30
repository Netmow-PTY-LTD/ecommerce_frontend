"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Truck, Shield, CreditCard, DollarSign } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';

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
    currency
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
}) {
    const router = useRouter();

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
        if (!formData.state) newErrors.state = 'State is required';
        if (!formData.postalCode) newErrors.postalCode = 'Postal code is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsProcessing(true);

        try {
            // Show processing message
            if (paymentMethod === 'cod') {
                toast.info('Creating your order...');
            }

            if (paymentMethod === 'online') {
                // Online payment with Stripe Checkout
                // Store order details for later use after payment
                const orderDetails = {
                    items: items,
                    subtotal: cartTotals.cartTotal,
                    shipping_cost: cartTotals.shippingCost,
                    tax_amount: cartTotals.tax,
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
                    tax_amount: cartTotals.tax,
                    shipping_cost: cartTotals.shippingCost,
                    total_amount: finalTotal,
                    discount_amount: 0,
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
                    // Store order ID for success page
                    localStorage.setItem('lastOrderId', orderData_response.id);
                    localStorage.setItem('lastOrderNumber', orderData_response.order_number);
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

                    {/* Shipping Address */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm mr-3">2</span>
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

                    {/* Payment Method */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm mr-3">3</span>
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
                                            <h4 className="text-sm font-medium line-clamp-1">{item.name}</h4>
                                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>

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
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Shipping</span>
                                <span className="font-medium">
                                    {cartTotals.shippingCost === 0 ? 'Free' : formatCurrency(cartTotals.shippingCost)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax</span>
                                <span className="font-medium">{formatCurrency(cartTotals.tax)}</span>
                            </div>
                            <div className="border-t border-border pt-3 flex justify-between items-center text-base font-bold">
                                <span>Total</span>
                                <span>{formatCurrency(finalTotal)}</span>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full mt-6 text-base font-semibold h-12"
                            disabled={isProcessing}
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
    const router = useRouter();
    const searchParams = useSearchParams();
    const { items, total, clearCart } = useCartStore();
    const { formatCurrency, currency } = useCurrency();
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

    const finalTotal = cartTotals.cartTotal + cartTotals.shippingCost + cartTotals.tax;

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
            <div className="bg-secondary/30 border-b border-border">
                <div className="container px-4 py-4">
                    <Link href="/cart" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Cart
                    </Link>
                </div>
            </div>

            <div className="container px-4 py-8 mx-auto">
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
                />
            </div>
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

