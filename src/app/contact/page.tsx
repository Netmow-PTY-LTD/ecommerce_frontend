"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSettings } from '@/hooks/use-settings';
import api from '@/lib/api';
import {
    Mail,
    Phone,
    MapPin,
    Clock,
    MessageCircle,
    Headphones,
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    Youtube,
    ArrowLeft,
    Send,
    ExternalLink
} from 'lucide-react';

interface ContactDetails {
    email?: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    working_hours?: string;
    support_email?: string;
    support_phone?: string;
    map_embed_code?: string;
    social_links?: {
        facebook?: string;
        twitter?: string;
        instagram?: string;
        linkedin?: string;
        youtube?: string;
    };
}

export default function ContactPage() {
    const { settings } = useSettings();
    const [contactDetails, setContactDetails] = useState<ContactDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContactDetails();
    }, []);

    const fetchContactDetails = async () => {
        try {
            const response = await api.get('/settings/contact-details');
            if (response.data && response.data.data) {
                setContactDetails(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load contact details:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFullAddress = () => {
        if (!contactDetails) return '';
        const parts = [
            contactDetails.address,
            contactDetails.city,
            contactDetails.state,
            contactDetails.postal_code,
            contactDetails.country
        ].filter(Boolean);
        return parts.join(', ');
    };

    const socialIcons = {
        facebook: Facebook,
        twitter: Twitter,
        instagram: Instagram,
        linkedin: Linkedin,
        youtube: Youtube
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header Banner */}
            <section className='py-3 bg-brand'>
                <div className="container px-4 mx-auto">
                    <div className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-white font-bold text-sm md:text-base tracking-wide hidden sm:block">Contact Us</h1>
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-sm font-medium">
                            <Link href="/" className="text-white/80 hover:text-white transition-colors">Home</Link>
                            <span className="text-white/50">-</span>
                            <span className="text-white">Contact</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-12 md:py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">

                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4 uppercase">Get in Touch</h2>
                            <p className="text-slate-500 max-w-xl mx-auto font-medium">
                                Have questions about our products or need assistance? Our team is here to help you. Reach out through any of the channels below.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                            {/* Contact Info Cards */}
                            <div className="lg:col-span-2 space-y-6">

                                {/* Primary Contact */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-xl bg-brand/5 flex items-center justify-center text-brand">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">General Inquiry</h3>
                                    </div>
                                    <div className="space-y-5">
                                        {contactDetails?.email && (
                                            <a href={`mailto:${contactDetails.email}`} className="flex items-start group cursor-pointer">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-brand transition-colors mr-3">
                                                    <Mail className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Email Us</p>
                                                    <p className="text-sm font-bold text-slate-700 group-hover:text-brand transition-colors">{contactDetails.email}</p>
                                                </div>
                                            </a>
                                        )}
                                        {contactDetails?.phone && (
                                            <a href={`tel:${contactDetails.phone}`} className="flex items-start group cursor-pointer">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-brand transition-colors mr-3">
                                                    <Phone className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Call Support</p>
                                                    <p className="text-sm font-bold text-slate-700 group-hover:text-brand transition-colors">{contactDetails.phone}</p>
                                                </div>
                                            </a>
                                        )}
                                        {contactDetails?.whatsapp && (
                                            <a href={`https://wa.me/${contactDetails.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-start group cursor-pointer">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 mr-3">
                                                    <MessageCircle className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">WhatsApp</p>
                                                    <p className="text-sm font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">{contactDetails.whatsapp}</p>
                                                </div>
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Support Center */}
                                {(contactDetails?.support_email || contactDetails?.support_phone) && (
                                    <div className="bg-slate-900 rounded-2xl p-6 shadow-xl shadow-slate-200 text-white">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-brand">
                                                <Headphones className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-sm font-bold uppercase tracking-wider">Support Center</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {contactDetails.support_email && (
                                                <div className="flex items-center justify-between group">
                                                    <span className="text-xs text-slate-400 font-medium uppercase tracking-tight">Technical Support</span>
                                                    <a href={`mailto:${contactDetails.support_email}`} className="text-xs font-bold text-white hover:text-brand transition-colors cursor-pointer">{contactDetails.support_email}</a>
                                                </div>
                                            )}
                                            {contactDetails.support_phone && (
                                                <div className="flex items-center justify-between group">
                                                    <span className="text-xs text-slate-400 font-medium uppercase tracking-tight">Support Hotline</span>
                                                    <a href={`tel:${contactDetails.support_phone}`} className="text-xs font-bold text-white hover:text-brand transition-colors cursor-pointer">{contactDetails.support_phone}</a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Location & Hours */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <div className="space-y-6">
                                        {contactDetails?.working_hours && (
                                            <div className="flex items-start">
                                                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 mr-3 shrink-0">
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Working Hours</p>
                                                    <p className="text-sm font-bold text-slate-700 mt-0.5">{contactDetails.working_hours}</p>
                                                </div>
                                            </div>
                                        )}
                                        {getFullAddress() && (
                                            <div className="flex items-start">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 mr-3 shrink-0">
                                                    <MapPin className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Office Address</p>
                                                    <p className="text-sm font-bold text-slate-700 mt-0.5 leading-relaxed">{getFullAddress()}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Social Links */}
                                {contactDetails?.social_links && Object.values(contactDetails.social_links).some(Boolean) && (
                                    <div className="flex items-center justify-center gap-3">
                                        {Object.entries(contactDetails.social_links).map(([platform, url]) => {
                                            if (!url) return null;
                                            const Icon = socialIcons[platform as keyof typeof socialIcons];
                                            return (
                                                <a
                                                    key={platform}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand hover:border-brand hover:shadow-lg hover:shadow-brand/5 transition-all cursor-pointer"
                                                    title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                                                >
                                                    <Icon className="w-4 h-4" />
                                                </a>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Map / Content Area */}
                            <div className="lg:col-span-3">
                                <div className="h-full min-h-[400px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-brand" />
                                            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Find us on map</span>
                                        </div>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getFullAddress() || 'Google Maps')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] font-bold text-brand uppercase tracking-tight flex items-center gap-1 cursor-pointer hover:underline transition-all"
                                        >
                                            Open in Maps <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                    <div className="flex-1 relative min-h-[400px]">
                                        {getFullAddress() ? (
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                style={{ border: 0, minHeight: '400px' }}
                                                src={`https://maps.google.com/maps?q=${encodeURIComponent(getFullAddress())}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                                allowFullScreen
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                                className="grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                                            ></iframe>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-12 text-center">
                                                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
                                                    <MapPin className="w-8 h-8" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Map Preview Unavailable</p>
                                                <p className="text-xs text-slate-400 mt-2">The map location will appear here once the office address is configured.</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-8 bg-brand/5 border-t border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand/20">
                                                <Send className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Need immediate help?</h4>
                                                <p className="text-xs text-slate-500 font-medium">Our customer success team is available 24/7 for technical support and order inquiries.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
