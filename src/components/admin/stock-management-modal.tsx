'use client';

import { useState } from 'react';
import { X, Package, TrendingUp, TrendingDown, Settings } from 'lucide-react';
import api from '@/lib/api';

interface StockManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: number;
    productName: string;
    currentStock: number;
    onSuccess: () => void;
}

interface Operation {
    id: 'add' | 'subtract' | 'set';
    label: string;
    icon: React.ReactNode;
    color: string;
    description: string;
}

const operations: Operation[] = [
    {
        id: 'add',
        label: 'Add Stock',
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'bg-green-50 border-green-200 text-green-700',
        description: 'Add stock to inventory (purchase, restock)'
    },
    {
        id: 'subtract',
        label: 'Remove Stock',
        icon: <TrendingDown className="w-5 h-5" />,
        color: 'bg-red-50 border-red-200 text-red-700',
        description: 'Remove stock from inventory (damage, loss)'
    },
    {
        id: 'set',
        label: 'Set Stock',
        icon: <Settings className="w-5 h-5" />,
        color: 'bg-blue-50 border-blue-200 text-blue-700',
        description: 'Set stock to exact value (adjustment)'
    }
];

export default function StockManagementModal({
    isOpen,
    onClose,
    productId,
    productName,
    currentStock,
    onSuccess
}: StockManagementModalProps) {
    const [selectedOperation, setSelectedOperation] = useState<'add' | 'subtract' | 'set'>('add');
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');
    const [movementType, setMovementType] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const resetForm = () => {
        setSelectedOperation('add');
        setQuantity('');
        setNotes('');
        setMovementType('');
        setError('');
        setSuccess(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        const qty = parseInt(quantity);
        if (isNaN(qty) || qty <= 0) {
            setError('Please enter a valid quantity');
            return;
        }

        // Check if subtract operation will result in negative stock
        if (selectedOperation === 'subtract' && qty > currentStock) {
            setError(`Cannot subtract ${qty}. Only ${currentStock} units available in stock.`);
            return;
        }

        setLoading(true);

        try {
            await api.put(`/products/${productId}/stock`, {
                operation: selectedOperation,
                quantity: qty,
                notes: notes || `${selectedOperation} operation`,
                movement_type: movementType || undefined
            });

            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                handleClose();
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update stock');
        } finally {
            setLoading(false);
        }
    };

    const getNewStockPreview = (): number => {
        const qty = parseInt(quantity) || 0;
        switch (selectedOperation) {
            case 'add':
                return currentStock + qty;
            case 'subtract':
                return Math.max(0, currentStock - qty);
            case 'set':
                return qty;
            default:
                return currentStock;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Stock Management</h2>
                            <p className="text-sm text-blue-100">{productName}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Current Stock Display */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Current Stock</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{currentStock}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">After Update</p>
                                <p className={`text-2xl font-bold ${
                                    getNewStockPreview() > currentStock ? 'text-green-600' :
                                    getNewStockPreview() < currentStock ? 'text-red-600' :
                                    'text-slate-900 dark:text-white'
                                }`}>
                                    {getNewStockPreview()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Stock updated successfully! Redirecting...
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Operation Selection */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                Select Operation
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {operations.map((op) => (
                                    <button
                                        key={op.id}
                                        type="button"
                                        onClick={() => setSelectedOperation(op.id)}
                                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                                            selectedOperation === op.id
                                                ? op.color + ' border-current ring-2 ring-offset-2 ring-current'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        <div className="flex flex-col items-center text-center gap-2">
                                            {op.icon}
                                            <span className="text-sm font-semibold">{op.label}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                {operations.find(op => op.id === selectedOperation)?.description}
                            </p>
                        </div>

                        {/* Quantity Input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Quantity
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="Enter quantity"
                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-card"
                                disabled={loading}
                            />
                        </div>

                        {/* Movement Type (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Movement Type <span className="text-slate-400">(optional)</span>
                            </label>
                            <select
                                value={movementType}
                                onChange={(e) => setMovementType(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-card"
                                disabled={loading}
                            >
                                <option value="">Auto-detect</option>
                                <option value="purchase">Purchase</option>
                                <option value="sale">Sale</option>
                                <option value="adjustment">Adjustment</option>
                                <option value="return">Return</option>
                                <option value="transfer">Transfer</option>
                            </select>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Notes <span className="text-slate-400">(optional)</span>
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add a note about this stock change..."
                                rows={3}
                                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-card resize-none"
                                disabled={loading}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || success}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Updating Stock...
                                </>
                            ) : success ? (
                                <>
                                    <TrendingUp className="w-4 h-4" />
                                    Updated!
                                </>
                            ) : (
                                <>
                                    <Package className="w-4 h-4" />
                                    Update Stock
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

