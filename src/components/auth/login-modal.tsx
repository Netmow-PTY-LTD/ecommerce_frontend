"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Eye, EyeOff, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { useSettings } from '@/hooks/use-settings';
import Image from 'next/image';


interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { login } = useCustomerAuth();
    const { settings, isLoading: settingsLoading } = useSettings();


    // Reset state and handle scroll lock when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setError('');
            setSubmitting(false);
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setSubmitting(true);

        try {
            await login(email, password);
            toast.success('Welcome back!');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all z-[99] cursor-pointer"
                            aria-label="Close modal"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="relative z-10 p-8 sm:p-10">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center mb-4">
                                    {settingsLoading ? (
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 animate-pulse" />
                                    ) : settings.logo_url ? (
                                        <Image
                                            src={settings.logo_url}
                                            alt={settings.company_name || 'Store Logo'}
                                            width={120}
                                            height={40}
                                            className="h-10 w-auto object-contain"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center">
                                            <ShoppingBag className="h-6 w-6 text-brand" />
                                        </div>
                                    )}
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
                                <p className="text-slate-500 text-sm mt-1">
                                    {settings.company_name ? `Access your ${settings.company_name} account` : 'Access your customer account'}
                                </p>
                            </div>


                            {/* Error Banner */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl text-sm bg-red-50 border border-red-100 text-red-600"
                                >
                                    <X className="w-4 h-4 mt-0.5 flex-shrink-0 cursor-pointer" onClick={() => setError('')} />
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700 ml-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            required
                                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-xs font-semibold text-slate-700">Password</label>
                                        <Link href="/forgot-password" onClick={onClose} className="text-xs text-brand hover:opacity-80 font-medium transition-colors cursor-pointer">Forgot?</Link>

                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className="w-full pl-11 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3.5 mt-2 rounded-xl text-white font-bold text-sm bg-brand hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand/20"
                                >
                                    {submitting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Signing in...</span>
                                        </div>
                                    ) : (
                                        <>
                                            Sign In
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </button>

                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
