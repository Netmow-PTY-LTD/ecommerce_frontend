"use client";

import Link from 'next/link';
import { Scale, FileText, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight } from 'lucide-react';

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header Banner */}
            <section className='py-3 bg-brand'>
                <div className="container px-4 mx-auto">
                    <div className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-white font-bold text-sm md:text-base tracking-wide">Terms of Service</h1>
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
                            <Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
                            <span className="text-white/50">/</span>
                            <span className="text-white">Terms</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-8 md:py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        
                        <div className="mb-12">
                            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Agreement to Terms</h2>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                By accessing or using LuxeStore, you agree to be bound by these Terms of Service and all applicable laws and regulations. 
                                If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                            </p>
                        </div>

                        <div className="space-y-12">
                            {/* Intellectual Property */}
                            <div className="flex gap-6">
                                <div className="shrink-0 p-3 h-fit bg-slate-50 rounded-2xl border border-slate-100">
                                    <Scale className="w-6 h-6 text-brand" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-2">Intellectual Property Rights</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        The content, features, and functionality of this website are owned by LuxeStore and are protected by international copyright, trademark, and other intellectual property laws.
                                    </p>
                                </div>
                            </div>

                            {/* User Conduct */}
                            <div className="flex gap-6">
                                <div className="shrink-0 p-3 h-fit bg-slate-50 rounded-2xl border border-slate-100">
                                    <CheckCircle2 className="w-6 h-6 text-brand" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-2">User Responsibilities</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                                    </p>
                                </div>
                            </div>

                            {/* Prohibited Activities */}
                            <div className="bg-red-50/50 rounded-2xl p-6 border border-red-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                    <h3 className="text-sm font-bold text-slate-900">Prohibited Activities</h3>
                                </div>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-red-400" />
                                        Systematic data retrieval or scraping
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-red-400" />
                                        Unauthorized framing or linking
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-red-400" />
                                        Interfering with security features
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-red-400" />
                                        Harassing or intimidating employees
                                    </li>
                                </ul>
                            </div>

                            {/* Limitation of Liability */}
                            <div className="flex gap-6">
                                <div className="shrink-0 p-3 h-fit bg-slate-50 rounded-2xl border border-slate-100">
                                    <FileText className="w-6 h-6 text-brand" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 mb-2">Limitation of Liability</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        In no event shall LuxeStore or its suppliers be liable for any damages arising out of the use or inability to use the materials on LuxeStore's website.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Help Footer */}
                        <div className="mt-16 pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    <HelpCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">Questions about our terms?</h4>
                                    <p className="text-xs text-slate-500">Our legal team is here to help clarify any points.</p>
                                </div>
                            </div>
                            <Link href="/contact">
                                <button className="flex items-center gap-2 text-sm font-bold text-brand hover:gap-3 transition-all">
                                    Contact Legal Support <ArrowRight className="w-4 h-4" />
                                </button>
                            </Link>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
}
