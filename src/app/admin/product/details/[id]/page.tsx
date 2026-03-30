'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import AdminLayout from '@/components/admin/admin-layout';
import {
    ArrowLeft,
    Package,
    DollarSign,
    Box,
    AlertCircle,
    CheckCircle,
    Clock,
    Edit,
    Trash2,
    BarChart3,
    ShoppingCart,
    Star,
    TrendingUp,
    TrendingDown,
    Activity
} from 'lucide-react';

interface Product {
    id: number;
    name: string;
    sku: string;
    slug?: string;
    description: string;
    specification?: string;
    category_id: number;
    unit_id: number;
    price: number;
    cost: number;
    purchase_tax: number;
    sales_tax: number;
    stock_quantity: number;
    initial_stock: number;
    min_stock_level: number;
    max_stock_level: number;
    barcode: string;
    image_url: string;
    thumb_url?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    category?: {
        id: number;
        name: string;
    };
    unit?: {
        id: number;
        name: string;
        symbol: string;
    };
    attributes?: Array<{
        name: string;
        values: string[];
    }>;
    similar_products?: number[];
    gallery_items?: string[];
}

interface StockMovement {
    id: number;
    product_id: number;
    operation: 'purchase' | 'sale' | 'adjustment' | 'return' | 'damage' | 'transfer_in' | 'transfer_out';
    quantity: number;
    movement_type: string;
    notes?: string;
    user_id?: number;
    user_name?: string;
    created_at: string;
}

export default function ProductDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { formatCurrency } = useCurrency();
    const { isAuthenticated, loading } = useAuth();
    const { id } = params as { id: string };

    const [product, setProduct] = useState<Product | null>(null);
    const [loadingProduct, setLoadingProduct] = useState(true);
    const [error, setError] = useState('');
    const [mainImageError, setMainImageError] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
    const [loadingMovements, setLoadingMovements] = useState(false);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/admin/login');
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        if (isAuthenticated && id) {
            fetchProductDetails();
            fetchStockMovements();
        }
    }, [isAuthenticated, id]);

    const fetchProductDetails = async () => {
        try {
            setLoadingProduct(true);
            const response = await api.get(`/products/${id}`);
            const productData = response.data.data;
            setProduct(productData);
            // Set selected image only if image_url exists and is not empty
            if (productData.image_url && productData.image_url.trim()) {
                setSelectedImage(productData.image_url);
            } else {
                setMainImageError(true);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load product details');
        } finally {
            setLoadingProduct(false);
        }
    };

    const fetchStockMovements = async () => {
        try {
            setLoadingMovements(true);
            const response = await api.get(`/products/${id}/stock/movements?limit=10`);
            setStockMovements(response.data.data || []);
        } catch (err: any) {
            console.error('Failed to load stock movements:', err);
        } finally {
            setLoadingMovements(false);
        }
    };

    if (loading || loadingProduct) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
                        {error || 'Product not found'}
                    </div>
                </div>
            </div>
        );
    }

    const profitMargin = product.price > 0 ? ((product.price - product.cost) / product.price * 100).toFixed(2) : 0;
    const stockStatus = product.stock_quantity === 0
        ? { label: 'Out of Stock', color: 'bg-red-100 text-red-700', icon: AlertCircle }
        : product.stock_quantity <= product.min_stock_level
        ? { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle }
        : { label: 'In Stock', color: 'bg-green-100 text-green-700', icon: CheckCircle };

    return (
        <AdminLayout
            title={product.name}
            subtitle="Product details and management"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Action Buttons */}
                <div className="flex gap-3 mb-6">
                    <a
                        href={`/product/${product.slug || product.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-all shadow-lg flex items-center"
                    >
                        <Star className="w-4 h-4 mr-2" />
                        View on Store
                    </a>
                    <a
                        href={`/admin/product/${product.id}/edit`}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all shadow-lg flex items-center"
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Product
                    </a>
                </div>
                {/* Product Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Product Image */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Product Image</h2>
                            {/* Main Image */}
                            <div className="aspect-square relative rounded-xl overflow-hidden bg-slate-100 mb-4">
                                {mainImageError || !selectedImage || !selectedImage.trim() ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Package className="h-24 w-24 text-slate-300" />
                                    </div>
                                ) : (
                                    <Image
                                        src={selectedImage}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                        onError={() => setMainImageError(true)}
                                        unoptimized
                                    />
                                )}
                            </div>

                            {/* Gallery Thumbnails */}
                            {product.gallery_items && product.gallery_items.length > 0 && (
                                <div className="grid grid-cols-5 gap-2 mt-4">
                                    {/* Main image thumbnail */}
                                    {product.image_url && (
                                        <div
                                            className={`aspect-square relative rounded-lg overflow-hidden bg-slate-100 cursor-pointer border-2 transition-all ${
                                                selectedImage === product.image_url
                                                    ? 'border-indigo-600 ring-2 ring-indigo-200'
                                                    : 'border-transparent hover:border-slate-300'
                                            }`}
                                            onClick={() => {
                                                setSelectedImage(product.image_url);
                                                setMainImageError(false);
                                            }}
                                        >
                                            <Image
                                                src={product.image_url}
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        </div>
                                    )}
                                    {/* Gallery thumbnails */}
                                    {product.gallery_items.map((galleryImage, index) => (
                                        galleryImage && (
                                            <div
                                                key={index}
                                                className={`aspect-square relative rounded-lg overflow-hidden bg-slate-100 cursor-pointer border-2 transition-all ${
                                                    selectedImage === galleryImage
                                                        ? 'border-indigo-600 ring-2 ring-indigo-200'
                                                        : 'border-transparent hover:border-slate-300'
                                                }`}
                                                onClick={() => {
                                                    setSelectedImage(galleryImage);
                                                    setMainImageError(false);
                                                }}
                                            >
                                                <Image
                                                    src={galleryImage}
                                                    alt={`${product.name} ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}

                            {/* Image Info */}
                            <div className="mt-4 text-sm text-slate-500">
                                <p>Total Images: {1 + (product.gallery_items?.length || 0)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Basic Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600">Status</p>
                                        <div className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full mt-1 ${
                                            product.is_active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {product.is_active ? 'Active' : 'Inactive'}
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-full ${
                                        product.is_active ? 'bg-green-100' : 'bg-red-100'
                                    }`}>
                                        <CheckCircle className={`h-6 w-6 ${
                                            product.is_active ? 'text-green-600' : 'text-red-600'
                                        }`} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600">Stock</p>
                                        <div className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full mt-1 ${stockStatus.color}`}>
                                            {stockStatus.label}
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-full ${stockStatus.color}`}>
                                        <stockStatus.icon className="h-6 w-6" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600">Profit Margin</p>
                                        <p className="text-2xl font-bold text-slate-900 mt-1">{profitMargin}%</p>
                                    </div>
                                    <div className="p-3 rounded-full bg-blue-100">
                                        <BarChart3 className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Product Details */}
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Product Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Product Name</label>
                                        <p className="text-lg font-semibold text-slate-900">{product.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">SKU</label>
                                        <p className="text-slate-900 font-mono">{product.sku}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Barcode</label>
                                        <p className="text-slate-900 font-mono">{product.barcode}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Category</label>
                                        <p className="text-slate-900">{product.category?.name || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Unit</label>
                                        <p className="text-slate-900">{product.unit?.name || '-'} {product.unit?.symbol || ''}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Selling Price</label>
                                        <p className="text-2xl font-bold text-green-600">{formatCurrency(product.price)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Cost Price</label>
                                        <p className="text-xl font-semibold text-slate-900">{formatCurrency(product.cost)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Sales Tax</label>
                                        <p className="text-slate-900">{product.sales_tax}%</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-500 mb-1">Purchase Tax</label>
                                        <p className="text-slate-900">{product.purchase_tax}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stock Information */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                            <Box className="w-5 h-5 mr-2" />
                            Stock Information
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Current Stock</label>
                                <p className="text-3xl font-bold text-slate-900">{product.stock_quantity}</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Initial Stock</label>
                                <p className="text-3xl font-bold text-slate-900">{product.initial_stock}</p>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Min Stock Level</label>
                                <p className="text-3xl font-bold text-slate-900">{product.min_stock_level}</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Max Stock Level</label>
                                <p className="text-3xl font-bold text-slate-900">{product.max_stock_level}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stock Movements */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                            <Activity className="w-5 h-5 mr-2" />
                            Stock Movements
                        </h2>
                        <span className="text-sm text-slate-500">Last 10 movements</span>
                    </div>
                    <div className="p-6">
                        {loadingMovements ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                            </div>
                        ) : stockMovements.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-xl">
                                <Activity className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                                <p className="text-sm text-slate-500 mb-2">No stock movements found</p>
                                <p className="text-xs text-slate-400">Stock movements will appear here when inventory changes</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Type</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Operation</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Quantity</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Notes</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">User</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {stockMovements.map((movement) => {
                                            const isInflow = ['purchase', 'transfer_in', 'adjustment'].includes(movement.operation) ||
                                                          (movement.operation === 'adjustment' && movement.quantity > 0);

                                            return (
                                                <tr key={movement.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 text-sm text-slate-600">
                                                        {new Date(movement.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                                                            isInflow
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {isInflow ? (
                                                                <TrendingUp className="h-3 w-3" />
                                                            ) : (
                                                                <TrendingDown className="h-3 w-3" />
                                                            )}
                                                            {movement.movement_type || movement.operation}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-600 capitalize">
                                                        {movement.operation.replace('_', ' ')}
                                                    </td>
                                                    <td className={`px-4 py-3 text-sm font-semibold ${
                                                        isInflow ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                        {isInflow ? '+' : '-'}{Math.abs(movement.quantity)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                                                        {movement.notes || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-slate-600">
                                                        {movement.user_name || 'System'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900">Description</h2>
                    </div>
                    <div className="p-6">
                        <p className="text-slate-700 whitespace-pre-wrap">{product.description || 'No description provided'}</p>
                    </div>
                </div>

                {/* Specifications */}
                {product.specification && (
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-900">Specifications</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-700 whitespace-pre-wrap">{product.specification}</p>
                        </div>
                    </div>
                )}

                {/* Attributes */}
                {product.attributes && Array.isArray(product.attributes) && product.attributes.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-900">Product Attributes</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {product.attributes.map((attr, index) => (
                                    <div key={index} className="border border-slate-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-slate-900 mb-2">{attr.name}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {attr.values && Array.isArray(attr.values) && attr.values.map((value, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                                                    {value}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Timestamps */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Timestamp Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Created At</label>
                            <p className="text-slate-900 flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-slate-400" />
                                {new Date(product.created_at).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Last Updated</label>
                            <p className="text-slate-900 flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-slate-400" />
                                {new Date(product.updated_at).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
