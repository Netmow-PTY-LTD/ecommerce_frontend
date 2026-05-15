"use client";

import Link from 'next/link';
import { ShieldCheck, Lock, Eye, Cookie, UserCheck, Bell } from 'lucide-react';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header Banner */}
            <section className='py-3 bg-brand'>
                <div className="container px-4 mx-auto">
                    <div className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-white font-bold text-sm md:text-base tracking-wide">Privacy Policy</h1>
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
                            <Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
                            <span className="text-white/50">/</span>
                            <span className="text-white">Privacy Policy</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-8 md:py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        
                        <div className="mb-12">
                            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Introduction</h2>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                At LuxeStore, we respect your privacy and are committed to protecting it through our compliance with this policy. 
                                This policy describes the types of information we may collect from you or that you may provide when you visit our website 
                                and our practices for collecting, using, maintaining, protecting, and disclosing that information.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="shrink-0 p-2.5 h-fit bg-slate-50 rounded-xl border border-slate-100">
                                        <Eye className="w-5 h-5 text-brand" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 mb-2">Information We Collect</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            We collect information that identifies you, such as your name, email address, and phone number, when you create an account or place an order.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="shrink-0 p-2.5 h-fit bg-slate-50 rounded-xl border border-slate-100">
                                        <Cookie className="w-5 h-5 text-brand" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 mb-2">Cookies and Tracking</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            We use cookies to improve your browsing experience and understand how you use our site to personalize content and ads.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="shrink-0 p-2.5 h-fit bg-slate-50 rounded-xl border border-slate-100">
                                        <ShieldCheck className="w-5 h-5 text-brand" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 mb-2">How We Protect Data</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter your information.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="shrink-0 p-2.5 h-fit bg-slate-50 rounded-xl border border-slate-100">
                                        <UserCheck className="w-5 h-5 text-brand" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 mb-2">Your Rights</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            You have the right to access, correct, or delete your personal information at any time through your account settings or by contacting us.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Updates to This Policy</h3>
                            <div className="bg-slate-50 rounded-2xl p-6 flex items-start gap-4">
                                <Bell className="w-5 h-5 text-brand mt-0.5" />
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    We may update our privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date at the top.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </div>
    );
}
