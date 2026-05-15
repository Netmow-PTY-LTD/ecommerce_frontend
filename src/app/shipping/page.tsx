"use client";

import Link from 'next/link';
import { Truck, RefreshCw, Clock, ShieldCheck, AlertCircle, Package, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ShippingAndReturnsPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header Banner - Professional and consistent with red branding */}
            <section className='py-3 bg-brand'>
                <div className="container px-4 mx-auto">
                    <div className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-white font-bold text-sm md:text-base tracking-wide">Shipping & Returns</h1>
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
                            <Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
                            <span className="text-white/50">/</span>
                            <span className="text-white">Shipping & Returns</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-8 md:py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        
                        {/* Intro */}
                        <div className="mb-12">
                            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Shipping Policy</h2>
                            <p className="text-sm text-slate-500 leading-relaxed mb-8">
                                We strive to get your products to you as quickly and safely as possible. Below you will find detailed information about our shipping methods, costs, and estimated delivery times.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="shrink-0 p-2.5 h-fit bg-slate-50 rounded-xl border border-slate-100">
                                            <Clock className="w-5 h-5 text-brand" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 mb-1">Processing Time</h3>
                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                All orders are processed within 1-2 business days. Orders placed after 2 PM are processed the next business day.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="shrink-0 p-2.5 h-fit bg-slate-50 rounded-xl border border-slate-100">
                                            <Package className="w-5 h-5 text-brand" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 mb-1">Safe Packaging</h3>
                                            <p className="text-sm text-slate-600 leading-relaxed">
                                                Every item is carefully inspected and packaged in secure, eco-friendly materials to ensure it reaches you in perfect condition.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-brand" />
                                        Delivery Estimates
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600">Standard Shipping</span>
                                            <span className="font-bold text-slate-900">3-5 Days</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-4">
                                            <span className="text-slate-600">Express Delivery</span>
                                            <span className="font-bold text-slate-900">1-2 Days</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-4 text-brand">
                                            <span className="font-bold">Orders over $100</span>
                                            <span className="font-bold uppercase tracking-wider text-[10px] bg-brand text-white px-2 py-0.5 rounded">Free</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Returns Section */}
                        <div className="mb-12 pt-12 border-t border-slate-100">
                            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6">Returns & Exchanges</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-brand mb-4">
                                        <RefreshCw className="w-4 h-4" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-2">30-Day Window</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">You have 30 days from the date of delivery to return any item.</p>
                                </div>
                                <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-brand mb-4">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-2">Original Condition</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">Items must be unworn, with original tags and in original packaging.</p>
                                </div>
                                <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-brand mb-4">
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-2">Easy Process</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">Contact our support team to receive a prepaid return label.</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 md:p-8">
                                <div className="max-w-2xl">
                                    <h3 className="text-sm font-bold text-slate-900 mb-4">How to return an item:</h3>
                                    <ol className="space-y-4">
                                        <li className="flex gap-4 text-sm">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400 text-xs">1</span>
                                            <p className="text-slate-600"><span className="text-slate-900 font-bold">Initiate:</span> Contact us via email or our support portal with your order number.</p>
                                        </li>
                                        <li className="flex gap-4 text-sm">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400 text-xs">2</span>
                                            <p className="text-slate-600"><span className="text-slate-900 font-bold">Pack:</span> Securely pack your items in their original packaging.</p>
                                        </li>
                                        <li className="flex gap-4 text-sm">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400 text-xs">3</span>
                                            <p className="text-slate-600"><span className="text-slate-900 font-bold">Ship:</span> Drop off the package at any authorized carrier location using our label.</p>
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        {/* Help Banner */}
                        <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-lg font-bold mb-2">Still have questions?</h3>
                                    <p className="text-slate-400 text-sm max-w-md">
                                        Our support team is available 24/7 to help you with any shipping or return inquiries.
                                    </p>
                                </div>
                                <Link href="/contact">
                                    <button className="flex items-center gap-2 bg-brand hover:bg-brand/90 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand/20">
                                        Contact Us <ArrowRight className="w-4 h-4" />
                                    </button>
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
}
