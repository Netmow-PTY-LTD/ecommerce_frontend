"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/admin-layout';
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    Globe,
    DollarSign,
    Save,
    Loader2,
    Image as ImageIcon
} from 'lucide-react';

interface CompanyProfile {
    company_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    website?: string;
    description?: string;
    logo_url?: string;
    currency?: string;
    tax_id?: string;
}

interface GalleryImage {
    id: number;
    filename: string;
    originalName: string;
    url: string;
    size: number;
    category: string;
}

export default function SettingsPage() {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
        company_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
        website: '',
        description: '',
        logo_url: '',
        currency: 'USD',
        tax_id: ''
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Gallery states
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
    const [filteredGalleryImages, setFilteredGalleryImages] = useState<GalleryImage[]>([]);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [gallerySearchTerm, setGallerySearchTerm] = useState('');
    const [selectedGalleryCategory, setSelectedGalleryCategory] = useState('');

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/admin/login');
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchCompanyProfile();
            fetchGalleryImages();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (gallerySearchTerm || selectedGalleryCategory) {
            const filtered = galleryImages.filter((img) => {
                const matchesSearch = !gallerySearchTerm ||
                    img.filename.toLowerCase().includes(gallerySearchTerm.toLowerCase()) ||
                    img.originalName?.toLowerCase().includes(gallerySearchTerm.toLowerCase());
                const matchesCategory = !selectedGalleryCategory || img.category === selectedGalleryCategory;
                return matchesSearch && matchesCategory;
            });
            setFilteredGalleryImages(filtered);
        } else {
            setFilteredGalleryImages(galleryImages);
        }
    }, [gallerySearchTerm, selectedGalleryCategory, galleryImages]);

    const fetchCompanyProfile = async () => {
        try {
            setLoadingProfile(true);
            const response = await api.get('/settings/company/profile');
            if (response.data && response.data.data) {
                setCompanyProfile(response.data.data);
                if (response.data.data.logo_url) {
                    setLogoPreview(response.data.data.logo_url);
                }
            }
        } catch (error: any) {
            console.error('Failed to load company profile:', error);
            // If no profile exists, that's okay - start with empty form
        } finally {
            setLoadingProfile(false);
        }
    };

    const fetchGalleryImages = async () => {
        try {
            const response = await api.get('/gallery?limit=100');
            setGalleryImages(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch gallery images:', error);
        }
    };

    const handleSelectLogo = (image: GalleryImage) => {
        setCompanyProfile(prev => ({ ...prev, logo_url: image.url }));
        setLogoPreview(image.url);
        setShowGalleryModal(false);
    };

    const handleRemoveLogo = () => {
        setCompanyProfile(prev => ({ ...prev, logo_url: '' }));
        setLogoPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await api.put('/settings/company/profile', companyProfile);
            toast.success('Settings saved successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCompanyProfile(prev => ({ ...prev, [name]: value }));
    };

    if (loading || loadingProfile) {
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
            title="Settings"
            subtitle="Manage your store configuration"
        >
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Company Information */}
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                                <Building2 className="w-5 h-5 mr-2 text-indigo-600" />
                                Company Information
                            </h2>
                            <p className="text-sm text-slate-600 mt-1">Basic details about your business</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Logo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-3">
                                    Company Logo
                                </label>
                                <div className="flex items-start space-x-6">
                                    {logoPreview ? (
                                        <div className="relative group">
                                            <img
                                                src={logoPreview}
                                                alt="Company Logo"
                                                className="w-32 h-32 object-contain rounded-xl border-2 border-slate-200 bg-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveLogo}
                                                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                                            <ImageIcon className="w-8 h-8 text-slate-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => setShowGalleryModal(true)}
                                                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center"
                                            >
                                                <ImageIcon className="w-4 h-4 mr-2" />
                                                Select from Gallery
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Recommended: Square image, at least 200x200px. Max 2MB.
                                        </p>
                                        {companyProfile.logo_url && (
                                            <p className="text-xs text-green-600 font-medium">
                                                ✓ Logo selected from gallery
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Company Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Company Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="company_name"
                                    required
                                    value={companyProfile.company_name || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                                    placeholder="e.g., ABC Corporation"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Company Description
                                </label>
                                <textarea
                                    name="description"
                                    value={companyProfile.description || ''}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm resize-none"
                                    placeholder="Brief description of your company..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                                <Mail className="w-5 h-5 mr-2 text-green-600" />
                                Contact Information
                            </h2>
                            <p className="text-sm text-slate-600 mt-1">How customers can reach you</p>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={companyProfile.email || ''}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                                        placeholder="contact@company.com"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={companyProfile.phone || ''}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>

                            {/* Website */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Website
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="url"
                                        name="website"
                                        value={companyProfile.website || ''}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                                        placeholder="https://www.company.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                                Business Address
                            </h2>
                            <p className="text-sm text-slate-600 mt-1">Your company's physical location</p>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Street Address */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Street Address
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={companyProfile.address || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                    placeholder="123 Business Street"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* City */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={companyProfile.city || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                        placeholder="New York"
                                    />
                                </div>

                                {/* State */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        State/Province
                                    </label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={companyProfile.state || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                        placeholder="NY"
                                    />
                                </div>

                                {/* Postal Code */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Postal Code
                                    </label>
                                    <input
                                        type="text"
                                        name="postal_code"
                                        value={companyProfile.postal_code || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                        placeholder="10001"
                                    />
                                </div>
                            </div>

                            {/* Country */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Country
                                </label>
                                <input
                                    type="text"
                                    name="country"
                                    value={companyProfile.country || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                    placeholder="United States"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financial Settings */}
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                                <DollarSign className="w-5 h-5 mr-2 text-amber-600" />
                                Financial Settings
                            </h2>
                            <p className="text-sm text-slate-600 mt-1">Currency and tax information</p>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Currency */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Default Currency
                                </label>
                                <select
                                    name="currency"
                                    value={companyProfile.currency || 'USD'}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm font-medium"
                                >
                                    {/* Major Currencies */}
                                    <option value="USD">USD - US Dollar ($)</option>
                                    <option value="EUR">EUR - Euro (€)</option>
                                    <option value="GBP">GBP - British Pound (£)</option>
                                    <option value="JPY">JPY - Japanese Yen (¥)</option>
                                    <option value="CNY">CNY - Chinese Yuan (¥)</option>
                                    <option value="INR">INR - Indian Rupee (₹)</option>
                                    <option value="AUD">AUD - Australian Dollar (A$)</option>
                                    <option value="CAD">CAD - Canadian Dollar (C$)</option>
                                    <option value="CHF">CHF - Swiss Franc (Fr)</option>
                                    <option value="HKD">HKD - Hong Kong Dollar (HK$)</option>
                                    <option value="SGD">SGD - Singapore Dollar (S$)</option>
                                    <option value="NZD">NZD - New Zealand Dollar (NZ$)</option>
                                    <option value="KRW">KRW - South Korean Won (₩)</option>
                                    <option value="ZAR">ZAR - South African Rand (R)</option>
                                    <option value="BRL">BRL - Brazilian Real (R$)</option>
                                    <option value="MXN">MXN - Mexican Peso ($)</option>

                                    {/* European Currencies */}
                                    <option value="SEK">SEK - Swedish Krona (kr)</option>
                                    <option value="NOK">NOK - Norwegian Krone (kr)</option>
                                    <option value="DKK">DKK - Danish Krone (kr)</option>
                                    <option value="PLN">PLN - Polish Złoty (zł)</option>
                                    <option value="CZK">CZK - Czech Koruna (Kč)</option>
                                    <option value="HUF">HUF - Hungarian Forint (Ft)</option>
                                    <option value="RON">RON - Romanian Leu (lei)</option>
                                    <option value="BGN">BGN - Bulgarian Lev (лв)</option>
                                    <option value="HRK">HRK - Croatian Kuna (kn)</option>
                                    <option value="RUB">RUB - Russian Ruble (₽)</option>
                                    <option value="TRY">TRY - Turkish Lira (₺)</option>

                                    {/* Middle Eastern Currencies */}
                                    <option value="ILS">ILS - Israeli New Shekel (₪)</option>
                                    <option value="SAR">SAR - Saudi Riyal (﷼)</option>
                                    <option value="AED">AED - UAE Dirham (د.إ)</option>
                                    <option value="QAR">QAR - Qatari Riyal (﷼)</option>
                                    <option value="KWD">KWD - Kuwaiti Dinar (د.ك)</option>
                                    <option value="BHD">BHD - Bahraini Dinar (BD)</option>
                                    <option value="OMR">OMR - Omani Rial (﷼)</option>
                                    <option value="JOD">JOD - Jordanian Dinar (د.ا)</option>
                                    <option value="LBP">LBP - Lebanese Pound (ل.ل)</option>

                                    {/* Asian Currencies */}
                                    <option value="THB">THB - Thai Baht (฿)</option>
                                    <option value="MYR">MYR - Malaysian Ringgit (RM)</option>
                                    <option value="IDR">IDR - Indonesian Rupiah (Rp)</option>
                                    <option value="PHP">PHP - Philippine Peso (₱)</option>
                                    <option value="VND">VND - Vietnamese Dong (₫)</option>
                                    <option value="PKR">PKR - Pakistani Rupee (₨)</option>
                                    <option value="BDT">BDT - Bangladeshi Taka (৳)</option>
                                    <option value="LKR">LKR - Sri Lankan Rupee (Rs)</option>
                                    <option value="NPR">NPR - Nepalese Rupee (₨)</option>
                                    <option value="MMK">MMK - Myanmar Kyat (K)</option>

                                    {/* Americas Currencies */}
                                    <option value="ARS">ARS - Argentine Peso ($)</option>
                                    <option value="CLP">CLP - Chilean Peso ($)</option>
                                    <option value="COP">COP - Colombian Peso ($)</option>
                                    <option value="PEN">PEN - Peruvian Sol (S/.)</option>
                                    <option value="BOB">BOB - Bolivian Boliviano (Bs.)</option>
                                    <option value="UYU">UYU - Uruguayan Peso ($)</option>
                                    <option value="PYG">PYG - Paraguayan Guaraní (₲)</option>
                                    <option value="CRC">CRC - Costa Rican Colón (₡)</option>
                                    <option value="DOP">DOP - Dominican Peso ($)</option>
                                    <option value="CUP">CUP - Cuban Peso ($)</option>

                                    {/* African Currencies */}
                                    <option value="EGP">EGP - Egyptian Pound (E£)</option>
                                    <option value="NGN">NGN - Nigerian Naira (₦)</option>
                                    <option value="KES">KES - Kenyan Shilling (Sh)</option>
                                    <option value="GHS">GHS - Ghanaian Cedi (₵)</option>
                                    <option value="ETB">ETB - Ethiopian Birr (Br)</option>
                                    <option value="TZS">TZS - Tanzanian Shilling (TSh)</option>
                                    <option value="UGX">UGX - Ugandan Shilling (Sh)</option>
                                    <option value="XOF">XOF - CFA Franc BCEAO (CFA)</option>
                                    <option value="XAF">XAF - CFA Franc BEAC (FCFA)</option>
                                    <option value="XOF">XOF - West African CFA Franc (CFA)</option>

                                    {/* Oceanian Currencies */}
                                    <option value="FJD">FJD - Fijian Dollar ($)</option>
                                    <option value="PGK">PGK - Papua New Guinean Kina (K)</option>
                                    <option value="WST">WST - Samoan Tala (WS$)</option>
                                    <option value="VUV">VUV - Vanuatu Vatu (Vt)</option>
                                    <option value="TOP">TOP - Tongan Pa'anga (T$)</option>
                                </select>
                            </div>

                            {/* Tax ID */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Tax ID / VAT Number
                                </label>
                                <input
                                    type="text"
                                    name="tax_id"
                                    value={companyProfile.tax_id || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
                                    placeholder="TAX123456"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment Configuration Info */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Stripe Payment Configuration</h3>
                                    <p className="text-sm text-slate-600 mb-4">
                                        Stripe payment integration is configured via environment variables for security.
                                    </p>
                                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                                        <h4 className="text-sm font-medium text-slate-800 mb-3">Configuration Location</h4>
                                        <p className="text-xs text-slate-600 mb-2">
                                            Add your Stripe keys to the <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">.env</code> file in your API directory:
                                        </p>
                                        <div className="space-y-2 font-mono text-xs">
                                            <div className="bg-slate-50 px-3 py-2 rounded-lg">
                                                <span className="text-purple-700">STRIPE_SECRET_KEY</span>=sk_test_...
                                            </div>
                                            <div className="bg-slate-50 px-3 py-2 rounded-lg">
                                                <span className="text-purple-700">STRIPE_WEBHOOK_SECRET</span>=whsec_test_...
                                            </div>
                                            <div className="bg-slate-50 px-3 py-2 rounded-lg">
                                                <span className="text-purple-700">STRIPE_PUBLIC_KEY</span>=pk_test_...
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-3">
                                            After updating the .env file, restart your API server for changes to take effect.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={saving}
                            size="lg"
                            className="px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                        >
                            {saving ? (
                                <span className="flex items-center">
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Settings
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Gallery Selection Modal */}
            {showGalleryModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Select Company Logo</h3>
                                <p className="text-sm text-slate-500">Choose an image from your gallery</p>
                            </div>
                            <button
                                onClick={() => setShowGalleryModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Search and Filter */}
                        <div className="p-6 border-b border-slate-200 space-y-4">
                            <input
                                type="text"
                                placeholder="Search images..."
                                value={gallerySearchTerm}
                                onChange={(e) => setGallerySearchTerm(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                            />
                            <select
                                value={selectedGalleryCategory}
                                onChange={(e) => setSelectedGalleryCategory(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium"
                            >
                                <option value="">All Categories</option>
                                <option value="general">General</option>
                                <option value="products">Products</option>
                                <option value="banner">Banner</option>
                            </select>
                        </div>

                        {/* Images Grid */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {filteredGalleryImages.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-slate-500">No images found in gallery</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {filteredGalleryImages.map((image) => (
                                        <div
                                            key={image.id}
                                            onClick={() => handleSelectLogo(image)}
                                            className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                                                companyProfile.logo_url === image.url
                                                    ? 'border-indigo-500 ring-2 ring-indigo-200'
                                                    : 'border-slate-200 hover:border-indigo-300 hover:shadow-lg'
                                            }`}
                                        >
                                            <img
                                                src={image.url}
                                                alt={image.originalName || image.filename}
                                                className="w-full h-32 object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                                <p className="text-xs font-medium text-white truncate">
                                                    {image.originalName || image.filename}
                                                </p>
                                                {image.size && (
                                                    <p className="text-xs text-slate-300">
                                                        {(image.size / 1024).toFixed(1)} KB
                                                    </p>
                                                )}
                                            </div>
                                            {companyProfile.logo_url === image.url && (
                                                <div className="absolute top-2 right-2">
                                                    <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
