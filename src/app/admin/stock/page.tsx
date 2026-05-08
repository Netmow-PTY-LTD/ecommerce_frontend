'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/lib/api';
import AdminLayout from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import {
    Package,
    AlertTriangle,
    Search,
    Filter,
    Box,
    TrendingUp,
    TrendingDown,
    Activity,
    Plus,
    Edit
} from 'lucide-react';
import StockManagementModal from '@/components/admin/stock-management-modal';

interface Product {
    id: number;
    name: string;
    sku: string;
    price: number;
    stock_quantity: number;
    min_stock_level: number;
    max_stock_level: number;
    thumb_url: string;
    status: 'active' | 'inactive';
    category?: { id: number; name: string };
    unit?: { id: number; name: string; symbol: string };
}

interface StockStats {
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalStock: number;
}

export default function StockManagementPage() {
    const { user, isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const { formatCurrency } = useCurrency();

    const [products, setProducts] = useState<Product[]>([]);
    const [stats, setStats] = useState<StockStats>({
        totalProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalStock: 0
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'low' | 'out'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        page: '1',
        limit: '20',
        totalPage: 0
    });

    const [dataLoading, setDataLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/admin/login');
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchProducts();
            fetchStats();
        }
    }, [isAuthenticated, currentPage, selectedFilter]);

    const fetchProducts = useCallback(async () => {
        try {
            setDataLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '20',
            });

            if (searchTerm) params.append('search', searchTerm);
            if (selectedFilter === 'low') params.append('low_stock', 'true');
            if (selectedFilter === 'out') params.append('out_of_stock', 'true');

            const response = await api.get(`/products/stock?${params}`);
            setProducts(response.data.data || []);
            setPagination(response.data.pagination || {
                total: response.data.data?.length || 0,
                page: currentPage.toString(),
                limit: '20',
                totalPage: 1
            });
        } catch (error: any) {
            console.error('Failed to fetch products:', error);
        } finally {
            setDataLoading(false);
        }
    }, [currentPage, searchTerm, selectedFilter]);

    const fetchStats = async () => {
        try {
            const response = await api.get('/products/stock/stats');
            setStats(response.data.data || {
                totalProducts: 0,
                lowStockProducts: 0,
                outOfStockProducts: 0,
                totalStock: 0
            });
        } catch (error) {
            console.error('Failed to fetch stock stats:', error);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchProducts();
    };

    const openStockModal = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleStockUpdateSuccess = () => {
        fetchProducts();
        fetchStats();
    };

    const getStockStatus = (product: Product) => {
        if (product.stock_quantity === 0) {
            return {
                label: 'Out of Stock',
                color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                icon: AlertTriangle
            };
        } else if (product.stock_quantity <= product.min_stock_level) {
            return {
                label: 'Low Stock',
                color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                icon: AlertTriangle
            };
        } else if (product.stock_quantity >= product.max_stock_level * 0.9) {
            return {
                label: 'Overstocked',
                color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                icon: Box
            };
        }
        return {
            label: 'In Stock',
            color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            icon: Activity
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <AdminLayout
            title="Stock Management"
            subtitle="Monitor and manage product inventory"
        >
            <div className="w-full space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Products</p>
                                <p className="text-3xl font-bold mt-1">{stats.totalProducts}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-lg">
                                <Package className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Total Stock</p>
                                <p className="text-3xl font-bold mt-1">{stats.totalStock}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-lg">
                                <Box className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-yellow-100 text-sm font-medium">Low Stock</p>
                                <p className="text-3xl font-bold mt-1">{stats.lowStockProducts}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-lg">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-500 to-rose-500 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-100 text-sm font-medium">Out of Stock</p>
                                <p className="text-3xl font-bold mt-1">{stats.outOfStockProducts}</p>
                            </div>
                            <div className="p-3 bg-white/20 rounded-lg">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white dark:bg-card shadow rounded-lg p-6">
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-64">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, SKU, or barcode..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedFilter('all');
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    selectedFilter === 'all'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedFilter('low');
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                    selectedFilter === 'low'
                                        ? 'bg-yellow-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <AlertTriangle className="w-4 h-4" />
                                Low Stock
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedFilter('out');
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                    selectedFilter === 'out'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <AlertTriangle className="w-4 h-4" />
                                Out of Stock
                            </button>
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {/* Products Table */}
                <div className="bg-white dark:bg-card shadow rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-border">
                            <thead className="bg-gray-50 dark:bg-muted">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        SKU
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock Level
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-border">
                                {dataLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                                <span className="text-sm text-muted-foreground">Loading products...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                            No products found.
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => {
                                        const stockStatus = getStockStatus(product);
                                        const stockPercentage = product.max_stock_level > 0
                                            ? (product.stock_quantity / product.max_stock_level) * 100
                                            : 0;

                                        return (
                                            <tr key={product.id} className="hover:bg-muted/50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {product.thumb_url && (
                                                            <img
                                                                src={product.thumb_url}
                                                                alt={product.name}
                                                                className="h-10 w-10 rounded object-cover mr-4"
                                                            />
                                                        )}
                                                        <div>
                                                            <div className="text-sm font-medium text-foreground">{product.name}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {product.category?.name || '-'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-mono">
                                                    {product.sku}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                                    {formatCurrency(product.price)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium">{product.stock_quantity}</span>
                                                            <span className="text-xs text-muted-foreground">/ {product.max_stock_level}</span>
                                                            <span className="text-xs text-muted-foreground">{product.unit?.symbol || 'units'}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full ${
                                                                    stockPercentage >= 90 ? 'bg-green-500' :
                                                                    stockPercentage >= 50 ? 'bg-yellow-500' :
                                                                    stockPercentage > 0 ? 'bg-orange-500' :
                                                                    'bg-red-500'
                                                                }`}
                                                                style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Min: {product.min_stock_level} {product.unit?.symbol || 'units'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                                                        <stockStatus.icon className="w-3 h-3" />
                                                        {stockStatus.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                    <button
                                                        onClick={() => openStockModal(product)}
                                                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Manage Stock
                                                    </button>
                                                    <span className="text-gray-300">|</span>
                                                    <a
                                                        href={`/admin/product/details/${product.id}`}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        View
                                                    </a>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-white dark:bg-card px-4 py-3 border-t border-gray-200 dark:border-border sm:px-6">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Showing <span className="font-medium">{((currentPage - 1) * 20) + 1}</span> to{' '}
                                <span className="font-medium">{Math.min(currentPage * 20, pagination.total)}</span> of{' '}
                                <span className="font-medium">{pagination.total}</span> results
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage((prev) => prev + 1)}
                                    disabled={currentPage >= pagination.totalPage}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stock Management Modal */}
            {selectedProduct && (
                <StockManagementModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    productId={selectedProduct.id}
                    productName={selectedProduct.name}
                    currentStock={selectedProduct.stock_quantity}
                    onSuccess={handleStockUpdateSuccess}
                />
            )}
        </AdminLayout>
    );
}
