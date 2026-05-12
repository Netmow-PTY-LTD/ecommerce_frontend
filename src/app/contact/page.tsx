"use client";

import { useState, useEffect } from 'react';
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
    Youtube
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
                    <p className="text-lg text-indigo-100 max-w-2xl mx-auto">
                        Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                    </p>
                </div>
            </div>

            <section className='py-16'>
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Information */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">Get in Touch</h2>
                                <p className="text-slate-600 mb-8">
                                    Feel free to reach out to us through any of the following channels. We're here to help!
                                </p>
                            </div>

                            {/* Main Contact */}
                            {(contactDetails?.email || contactDetails?.phone) && (
                                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                        <Mail className="w-5 h-5 mr-2 text-indigo-600" />
                                        Contact Information
                                    </h3>
                                    <div className="space-y-4">
                                        {contactDetails.email && (
                                            <div className="flex items-start">
                                                <Mail className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                                                <div>
                                                    <p className="text-sm text-slate-600">Email</p>
                                                    <a
                                                        href={`mailto:${contactDetails.email}`}
                                                        className="text-slate-900 font-medium hover:text-indigo-600 transition-colors"
                                                    >
                                                        {contactDetails.email}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        {contactDetails.phone && (
                                            <div className="flex items-start">
                                                <Phone className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                                                <div>
                                                    <p className="text-sm text-slate-600">Phone</p>
                                                    <a
                                                        href={`tel:${contactDetails.phone}`}
                                                        className="text-slate-900 font-medium hover:text-indigo-600 transition-colors"
                                                    >
                                                        {contactDetails.phone}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        {contactDetails.whatsapp && (
                                            <div className="flex items-start">
                                                <MessageCircle className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                                                <div>
                                                    <p className="text-sm text-slate-600">WhatsApp</p>
                                                    <a
                                                        href={`https://wa.me/${contactDetails.whatsapp.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-slate-900 font-medium hover:text-green-600 transition-colors"
                                                    >
                                                        {contactDetails.whatsapp}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Support Contact */}
                            {(contactDetails?.support_email || contactDetails?.support_phone) && (
                                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                        <Headphones className="w-5 h-5 mr-2 text-purple-600" />
                                        Support
                                    </h3>
                                    <div className="space-y-4">
                                        {contactDetails.support_email && (
                                            <div className="flex items-start">
                                                <Mail className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                                                <div>
                                                    <p className="text-sm text-slate-600">Support Email</p>
                                                    <a
                                                        href={`mailto:${contactDetails.support_email}`}
                                                        className="text-slate-900 font-medium hover:text-purple-600 transition-colors"
                                                    >
                                                        {contactDetails.support_email}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                        {contactDetails.support_phone && (
                                            <div className="flex items-start">
                                                <Phone className="w-5 h-5 text-slate-400 mr-3 mt-0.5" />
                                                <div>
                                                    <p className="text-sm text-slate-600">Support Phone</p>
                                                    <a
                                                        href={`tel:${contactDetails.support_phone}`}
                                                        className="text-slate-900 font-medium hover:text-purple-600 transition-colors"
                                                    >
                                                        {contactDetails.support_phone}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Working Hours */}
                            {contactDetails?.working_hours && (
                                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                        <Clock className="w-5 h-5 mr-2 text-amber-600" />
                                        Working Hours
                                    </h3>
                                    <p className="text-slate-700">{contactDetails.working_hours}</p>
                                </div>
                            )}

                            {/* Address */}
                            {getFullAddress() && (
                                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                                        <MapPin className="w-5 h-5 mr-2 text-red-600" />
                                        Address
                                    </h3>
                                    <p className="text-slate-700">{getFullAddress()}</p>
                                </div>
                            )}

                            {/* Social Links */}
                            {contactDetails?.social_links && Object.values(contactDetails.social_links).some(Boolean) && (
                                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Follow Us</h3>
                                    <div className="flex space-x-4">
                                        {Object.entries(contactDetails.social_links).map(([platform, url]) => {
                                            if (!url) return null;
                                            const Icon = socialIcons[platform as keyof typeof socialIcons];
                                            return (
                                                <a
                                                    key={platform}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                                                    title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Map Section */}
                        <div className="lg:sticky lg:top-8 h-fit">
                            {contactDetails?.map_embed_code ? (
                                <div
                                    className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200"
                                    dangerouslySetInnerHTML={{ __html: contactDetails.map_embed_code }}
                                />
                            ) : (
                                <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-lg p-12 border border-slate-300 flex items-center justify-center min-h-[400px]">
                                    <div className="text-center">
                                        <MapPin className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                                        <p className="text-slate-600">Map will be displayed here</p>
                                        <p className="text-sm text-slate-500 mt-2">
                                            Configure map embed code in admin settings
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
