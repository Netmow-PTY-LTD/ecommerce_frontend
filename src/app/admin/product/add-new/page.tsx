'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/contexts/CurrencyContext';
import api from '@/lib/api';
import AdminLayout from '@/components/admin/admin-layout';

interface Category {
  id: number;
  name: string;
}

interface Unit {
  id: number;
  name: string;
  symbol: string;
}

interface GalleryImage {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  width?: number;
  height?: number;
  category: string;
}

interface Attribute {
  id: string;
  name: string;
  values: string[];
}

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  image_url: string;
  thumb_url: string;
  gallery_items: string[];
  category?: {
    id: number;
    name: string;
  };
}

export default function AddNewProductPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [filteredGalleryImages, setFilteredGalleryImages] = useState<GalleryImage[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    specification: '',
    category_id: '',
    unit_id: '',
    price: '',
    cost: '',
    purchase_tax: '',
    sales_tax: '',
    stock_quantity: '',
    initial_stock: '',
    min_stock_level: '',
    max_stock_level: '',
    barcode: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    image_url: '',
    thumb_url: '',
    gallery_items: [] as string[],
    status: 'active' as 'active' | 'inactive',
    meta_title: '',
    meta_description: '',
    meta_image: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [gallerySearchTerm, setGallerySearchTerm] = useState('');
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState('');

  // Gallery modal states
  const [showThumbnailModal, setShowThumbnailModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showMainImageModal, setShowMainImageModal] = useState(false);
  const [selectedThumbnail, setSelectedThumbnail] = useState<GalleryImage | null>(null);
  const [selectedMainImage, setSelectedMainImage] = useState<GalleryImage | null>(null);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<GalleryImage[]>([]);
  const [showMetaImageModal, setShowMetaImageModal] = useState(false);
  const [selectedMetaImage, setSelectedMetaImage] = useState<GalleryImage | null>(null);

  // Attributes state
  const [attributes, setAttributes] = useState<Attribute[]>([]);

  // Similar Products state
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedSimilarProducts, setSelectedSimilarProducts] = useState<Product[]>([]);
  const [showSimilarProductsModal, setShowSimilarProductsModal] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
      fetchUnits();
      fetchGalleryImages();
      fetchProducts();
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

  useEffect(() => {
    if (productSearchTerm || productCategoryFilter) {
      const filtered = allProducts.filter((product) => {
        const matchesSearch = !productSearchTerm ||
          product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(productSearchTerm.toLowerCase());
        const matchesCategory = !productCategoryFilter || product.category?.id.toString() === productCategoryFilter;
        return matchesSearch && matchesCategory;
      });
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(allProducts);
    }
  }, [productSearchTerm, productCategoryFilter, allProducts]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await api.get('/products/units');
      setUnits(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch units:', error);
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

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?limit=100');
      setAllProducts(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleSelectThumbnail = (image: GalleryImage) => {
    setSelectedThumbnail(image);
    setFormData({ ...formData, thumb_url: image.url });
    setShowThumbnailModal(false);
  };

  const handleRemoveThumbnail = () => {
    setSelectedThumbnail(null);
    setFormData({ ...formData, thumb_url: '' });
  };

  const handleSelectMainImage = (image: GalleryImage) => {
    setSelectedMainImage(image);
    setFormData({ ...formData, image_url: image.url });
    setShowMainImageModal(false);
  };

  const handleRemoveMainImage = () => {
    setSelectedMainImage(null);
    setFormData({ ...formData, image_url: '' });
  };

  const handleToggleGalleryImage = (image: GalleryImage) => {
    const isSelected = selectedGalleryImages.some(img => img.id === image.id);
    if (isSelected) {
      setSelectedGalleryImages(selectedGalleryImages.filter(img => img.id !== image.id));
    } else {
      setSelectedGalleryImages([...selectedGalleryImages, image]);
    }
  };

  const handleConfirmGallerySelection = () => {
    const urls = selectedGalleryImages.map(img => img.url);
    setFormData({ ...formData, gallery_items: urls });
    setShowGalleryModal(false);
  };

  const handleRemoveGalleryItem = (url: string) => {
    setSelectedGalleryImages(selectedGalleryImages.filter(img => img.url !== url));
    setFormData({
      ...formData,
      gallery_items: formData.gallery_items.filter(item => item !== url)
    });
  };

  // Attribute handlers
  const handleAddAttribute = () => {
    const newAttribute: Attribute = {
      id: Date.now().toString(),
      name: '',
      values: [''],
    };
    setAttributes([...attributes, newAttribute]);
  };

  const handleRemoveAttribute = (id: string) => {
    setAttributes(attributes.filter(attr => attr.id !== id));
  };

  const handleAttributeNameChange = (id: string, name: string) => {
    setAttributes(attributes.map(attr =>
      attr.id === id ? { ...attr, name } : attr
    ));
  };

  const handleAddAttributeValue = (id: string) => {
    setAttributes(attributes.map(attr =>
      attr.id === id ? { ...attr, values: [...attr.values, ''] } : attr
    ));
  };

  const handleAttributeValueChange = (attrId: string, valueIndex: number, value: string) => {
    setAttributes(attributes.map(attr => {
      if (attr.id === attrId) {
        const newValues = [...attr.values];
        newValues[valueIndex] = value;
        return { ...attr, values: newValues };
      }
      return attr;
    }));
  };

  const handleRemoveAttributeValue = (attrId: string, valueIndex: number) => {
    setAttributes(attributes.map(attr => {
      if (attr.id === attrId) {
        return { ...attr, values: attr.values.filter((_, i) => i !== valueIndex) };
      }
      return attr;
    }));
  };

  // Similar Products handlers
  const handleToggleSimilarProduct = (product: Product) => {
    const isSelected = selectedSimilarProducts.some(p => p.id === product.id);
    if (isSelected) {
      setSelectedSimilarProducts(selectedSimilarProducts.filter(p => p.id !== product.id));
    } else {
      if (selectedSimilarProducts.length >= 20) {
        alert('You can select maximum 20 similar products');
        return;
      }
      setSelectedSimilarProducts([...selectedSimilarProducts, product]);
    }
  };

  const handleRemoveSimilarProduct = (productId: number) => {
    setSelectedSimilarProducts(selectedSimilarProducts.filter(p => p.id !== productId));
  };

  const handleConfirmSimilarProducts = () => {
    setShowSimilarProductsModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload: any = {
        name: formData.name,
        category_id: parseInt(formData.category_id),
        unit_id: parseInt(formData.unit_id),
        price: parseFloat(formData.price),
        status: formData.status,
      };

      if (formData.sku) payload.sku = formData.sku;
      if (formData.description) payload.description = formData.description;
      if (formData.specification) payload.specification = formData.specification;
      if (formData.cost) payload.cost = parseFloat(formData.cost);
      if (formData.purchase_tax) payload.purchase_tax = parseFloat(formData.purchase_tax);
      if (formData.sales_tax) payload.sales_tax = parseFloat(formData.sales_tax);
      if (formData.stock_quantity) payload.stock_quantity = parseInt(formData.stock_quantity);
      if (formData.initial_stock) payload.initial_stock = parseInt(formData.initial_stock);
      if (formData.min_stock_level) payload.min_stock_level = parseInt(formData.min_stock_level);
      if (formData.max_stock_level) payload.max_stock_level = parseInt(formData.max_stock_level);
      if (formData.barcode) payload.barcode = formData.barcode;
      if (formData.weight) payload.weight = parseFloat(formData.weight);
      if (formData.length) payload.length = parseFloat(formData.length);
      if (formData.width) payload.width = parseFloat(formData.width);
      if (formData.height) payload.height = parseFloat(formData.height);

      // Always include image fields, even if empty
      payload.image_url = formData.image_url || null;
      payload.thumb_url = formData.thumb_url || null;
      payload.gallery_items = formData.gallery_items || [];
      payload.meta_title = formData.meta_title || null;
      payload.meta_description = formData.meta_description || null;
      payload.meta_image = formData.meta_image || null;

      // Add attributes to payload
      const validAttributes = attributes
        .filter(attr => attr.name.trim() !== '' && attr.values.some(v => v.trim() !== ''))
        .map(attr => ({
          name: attr.name.trim(),
          values: attr.values.filter(v => v.trim() !== '').map(v => v.trim()),
        }));
      if (validAttributes.length > 0) payload.attributes = validAttributes;

      // Add similar products to payload
      if (selectedSimilarProducts.length > 0) {
        payload.similar_products = selectedSimilarProducts.map(p => p.id);
      }

      const response = await api.post('/products', payload);
      const newProductId = response.data.data.id;
      setSuccess('Product created successfully! Redirecting to edit page...');

      setTimeout(() => {
        router.push(`/admin/product/${newProductId}/edit`);
      }, 1500);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
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
      title="Add New Product"
      subtitle="Create a new product listing"
    >
      <div className="w-full max-w-5xl mx-auto py-4">
        {/* Alert Messages */}
        {success && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl shadow-sm flex items-center">
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 101.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm flex items-center">
            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Product Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Basic Information
              </h2>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                  placeholder="e.g., Wireless Mouse"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                  placeholder="e.g., WM-001 (Auto-generated if empty)"
                />
                <p className="mt-1 text-xs text-slate-500">Leave empty for auto-generation</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm resize-none"
                  placeholder="Product description..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Specification
                </label>
                <textarea
                  value={formData.specification}
                  onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm resize-none"
                  placeholder="e.g., Color: Black, DPI: 1600, Wireless: Yes"
                />
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l-2.714 2.714a1 1 0 01-1.414 0l-2.714-2.714C3.785 2.195 3.265 2 5 2h14c1.735 0 2.215.195 2.785 2.586l-2.714 2.714a1 1 0 01-1.414 0l-2.714-2.714C13.215 2.195 12.735 2 11 2H7z" />
                </svg>
                Classification
              </h2>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium appearance-none"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.unit_id}
                  onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium appearance-none"
                >
                  <option value="">Select Unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 2 3-1.343 2-3-.895-3-3-3 0-1.657.895-3 3-1.343 2-3 3-3 0 1.657-.895 3-3 3zm0 2c-.528 0-1.056-.18-1.586-.534l-3.262 3.262C7.628 15.828 11 18.668 11 21.014c0 2.346-3.372 5.186-7.848 5.186C7.058 26.2 3.72 23.36 3.262 20.48l3.262-3.262C5.722 22.18 6.472 21 7.5 21z" />
                </svg>
                Pricing
              </h2>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Sale Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cost Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sales Tax (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sales_tax}
                  onChange={(e) => setFormData({ ...formData, sales_tax: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Stock Management */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7h16" />
                </svg>
                Stock Management
              </h2>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Initial Stock</label>
                <input
                  type="number"
                  value={formData.initial_stock}
                  onChange={(e) => setFormData({ ...formData, initial_stock: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Min Stock Level</label>
                <input
                  type="number"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Max Stock Level</label>
                <input
                  type="number"
                  value={formData.max_stock_level}
                  onChange={(e) => setFormData({ ...formData, max_stock_level: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  placeholder="100"
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Additional Details
              </h2>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Barcode</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                  placeholder="e.g., 9876543210987"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Length (cm)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.length}
                  onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Width (cm)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                  placeholder="0.00"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Height (cm)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Images
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Main Image Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-700 mb-0">
                    Main Product Image <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMainImageModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Select from Gallery
                  </button>
                </div>

                {/* Selected Main Image Preview */}
                {formData.image_url ? (
                  <div className="relative inline-block group">
                    <img
                      src={formData.image_url}
                      alt="Main product image"
                      className="h-48 w-48 object-cover rounded-xl border-2 border-green-400 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveMainImage}
                      className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                      Main Image
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50">
                    <svg className="w-16 h-16 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-slate-500 font-medium mb-1">No main image selected</p>
                    <p className="text-xs text-slate-400">Click "Select from Gallery" to choose the main product image</p>
                  </div>
                )}
              </div>

              {/* Thumbnail Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-700 mb-0">
                    Thumbnail Image <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowThumbnailModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Select from Gallery
                  </button>
                </div>

                {/* Selected Thumbnail Preview */}
                {formData.thumb_url ? (
                  <div className="relative inline-block group">
                    <img
                      src={formData.thumb_url}
                      alt="Selected thumbnail"
                      className="h-32 w-32 object-cover rounded-xl border-2 border-indigo-300 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveThumbnail}
                      className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
                    <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-slate-500">No thumbnail selected</p>
                  </div>
                )}
              </div>

              {/* Gallery Images Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-700 mb-0">
                    Gallery Images
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowGalleryModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0h-6m0 0V6m0 0h6m-6 0v6" />
                    </svg>
                    Select from Gallery
                  </button>
                </div>

                {/* Selected Gallery Images Preview */}
                {formData.gallery_items.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {formData.gallery_items.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Gallery ${index + 1}`}
                          className="h-24 w-full object-cover rounded-xl border-2 border-slate-200 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryItem(url)}
                          className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
                    <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-slate-500">No gallery images selected</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attributes */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l-2.714 2.714a1 1 0 01-1.414 0l-2.714-2.714C3.785 2.195 3.265 2 5 2h14c1.735 0 2.215.195 2.785 2.586l-2.714 2.714a1 1 0 01-1.414 0l-2.714-2.714C13.215 2.195 12.735 2 11 2H7z" />
                  </svg>
                  Attributes
                </h2>
                <button
                  type="button"
                  onClick={handleAddAttribute}
                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl text-sm font-medium hover:from-rose-700 hover:to-pink-700 transition-all shadow-lg flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0h-6m0 0V6m0 0h6m-6 0v6" />
                  </svg>
                  Add Attribute
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {attributes.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-xl">
                  <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-slate-500 mb-2">No attributes added</p>
                  <p className="text-xs text-slate-400">Click "Add Attribute" to create product variants like Color, Size, etc.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attributes.map((attribute, attrIndex) => (
                    <div key={attribute.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                      <div className="flex items-center justify-between mb-3">
                        <input
                          type="text"
                          value={attribute.name}
                          onChange={(e) => handleAttributeNameChange(attribute.id, e.target.value)}
                          placeholder="Attribute name (e.g., Color, Size)"
                          className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all text-sm font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAttribute(attribute.id)}
                          className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Remove attribute"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                            Values
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAddAttributeValue(attribute.id)}
                            className="text-xs px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-all font-medium flex items-center"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Value
                          </button>
                        </div>

                        {attribute.values.length === 0 ? (
                          <div className="text-center py-4 bg-white border border-dashed border-slate-300 rounded-lg">
                            <p className="text-xs text-slate-500">No values added. Click "Add Value" to add options.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {attribute.values.map((value, valueIndex) => (
                              <div key={valueIndex} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={value}
                                  onChange={(e) => handleAttributeValueChange(attribute.id, valueIndex, e.target.value)}
                                  placeholder={`Value ${valueIndex + 1} (e.g., Red, 24inch)`}
                                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all text-sm"
                                />
                                {attribute.values.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAttributeValue(attribute.id, valueIndex)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Remove value"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Preview of attribute */}
                      {attribute.name && attribute.values.some(v => v.trim() !== '') && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-xs text-slate-500 mb-1">Preview:</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-sm font-medium text-slate-700">{attribute.name}:</span>
                            {attribute.values.filter(v => v.trim() !== '').map((value, i) => (
                              <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-rose-100 text-rose-800">
                                {value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Similar Products */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Similar Products
                </h2>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-slate-600">
                    {selectedSimilarProducts.length}/20 selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSimilarProductsModal(true)}
                    disabled={selectedSimilarProducts.length >= 20}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Select Products
                  </button>
                </div>
              </div>

              <div className="p-6">
                {selectedSimilarProducts.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
                    <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-sm text-slate-500">No similar products selected</p>
                    <p className="text-xs text-slate-400 mt-1">Click "Select Products" to add up to 20 similar products</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedSimilarProducts.map((product) => (
                      <div key={product.id} className="relative group bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-violet-300 transition-all">
                        <div className="flex items-start space-x-3">
                          {product.thumb_url && (
                            <img
                              src={product.thumb_url}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 truncate">{product.name}</h4>
                            <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                            <p className="text-sm font-bold text-violet-600 mt-1">{formatCurrency(product.price)}</p>
                            {product.category && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-violet-100 text-violet-700 rounded-full">
                                {product.category.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSimilarProduct(product.id)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Status
              </h2>
            </div>

            <div className="p-6">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.status === 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
                  className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                />
                <span className="text-sm font-medium text-slate-700">Active</span>
                <span className="text-sm text-slate-500">(Product will be visible in store)</span>
              </label>
            </div>
          </div>

          {/* SEO / Meta */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                SEO / Meta
              </h2>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Meta Title</label>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                  placeholder="SEO title for search engines"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Meta Description</label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                  placeholder="Brief description for search engine results..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-700">Meta Image</label>
                  <button
                    type="button"
                    onClick={() => setShowMetaImageModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Select from Gallery
                  </button>
                </div>

                {formData.meta_image ? (
                  <div className="relative inline-block group">
                    <img
                      src={formData.meta_image}
                      alt="Meta image"
                      className="h-40 w-40 object-cover rounded-xl border-2 border-emerald-400 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, meta_image: '' })}
                      className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50">
                    <svg className="w-12 h-12 mx-auto text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-slate-500 font-medium">No meta image selected</p>
                    <p className="text-xs text-slate-400">Click "Select from Gallery" to choose an image</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center bg-white px-6 py-4 rounded-2xl shadow-xl border border-slate-200">
            <a
              href="/admin/products"
              className="px-6 py-3 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-all"
            >
              Cancel
            </a>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    name: '',
                    sku: '',
                    description: '',
                    specification: '',
                    category_id: '',
                    unit_id: '',
                    price: '',
                    cost: '',
                    purchase_tax: '',
                    sales_tax: '',
                    stock_quantity: '',
                    initial_stock: '',
                    min_stock_level: '',
                    max_stock_level: '',
                    barcode: '',
                    weight: '',
                    length: '',
                    width: '',
                    height: '',
                    image_url: '',
                    thumb_url: '',
                    gallery_items: [],
                    status: 'active',
                    meta_title: '',
                    meta_description: '',
                    meta_image: '',
                  });
                  setSelectedThumbnail(null);
                  setSelectedGalleryImages([]);
                }}
                className="px-6 py-3 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-all"
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {submitting ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </div>
        </form>

        {/* Thumbnail Selection Modal */}
        {showThumbnailModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Select Thumbnail</h3>
                  <p className="text-sm text-slate-500">Choose an image from your gallery</p>
                </div>
                <button
                  onClick={() => setShowThumbnailModal(false)}
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
                  <option value="products">Products</option>
                  <option value="general">General</option>
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
                    <p className="text-slate-500">No images found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filteredGalleryImages.map((image) => (
                      <div
                        key={image.id}
                        onClick={() => handleSelectThumbnail(image)}
                        className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                          selectedThumbnail?.id === image.id
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
                        {selectedThumbnail?.id === image.id && (
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

        {/* Main Image Selection Modal */}
        {showMainImageModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Select Main Product Image</h3>
                  <p className="text-sm text-slate-500">Choose an image from your gallery</p>
                </div>
                <button
                  onClick={() => setShowMainImageModal(false)}
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
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                />
                <select
                  value={selectedGalleryCategory}
                  onChange={(e) => setSelectedGalleryCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm font-medium"
                >
                  <option value="">All Categories</option>
                  <option value="products">Products</option>
                  <option value="general">General</option>
                  <option value="banner">Banner</option>
                </select>
              </div>

              {/* Gallery Grid */}
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
                        onClick={() => handleSelectMainImage(image)}
                        className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                          selectedMainImage?.id === image.id || formData.image_url === image.url
                            ? 'border-green-500 ring-2 ring-green-200'
                            : 'border-slate-200 hover:border-green-300 hover:shadow-lg'
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
                        {(selectedMainImage?.id === image.id || formData.image_url === image.url) && (
                          <div className="absolute top-2 right-2">
                            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
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

        {/* Gallery Images Selection Modal */}
        {showGalleryModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Select Gallery Images</h3>
                  <p className="text-sm text-slate-500">Choose multiple images from your gallery</p>
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
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-sm"
                />
                <select
                  value={selectedGalleryCategory}
                  onChange={(e) => setSelectedGalleryCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-sm font-medium"
                >
                  <option value="">All Categories</option>
                  <option value="products">Products</option>
                  <option value="general">General</option>
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
                    <p className="text-slate-500">No images found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filteredGalleryImages.map((image) => (
                      <div
                        key={image.id}
                        onClick={() => handleToggleGalleryImage(image)}
                        className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                          selectedGalleryImages.some(img => img.id === image.id)
                            ? 'border-cyan-500 ring-2 ring-cyan-200'
                            : 'border-slate-200 hover:border-cyan-300 hover:shadow-lg'
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={image.originalName || image.filename}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute top-2 left-2">
                          {selectedGalleryImages.some(img => img.id === image.id) && (
                            <div className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
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
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer with Selected Count and Confirm */}
              <div className="p-6 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  {selectedGalleryImages.length} image{selectedGalleryImages.length !== 1 ? 's' : ''} selected
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowGalleryModal(false);
                      setSelectedGalleryImages([]);
                    }}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmGallerySelection}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg"
                  >
                    Confirm Selection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Similar Products Selection Modal */}
        {showSimilarProductsModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Select Similar Products</h3>
                  <p className="text-sm text-slate-500">Choose up to 20 similar products ({selectedSimilarProducts.length}/20 selected)</p>
                </div>
                <button
                  onClick={() => setShowSimilarProductsModal(false)}
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
                  placeholder="Search products by name or SKU..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-sm"
                />
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-sm font-medium"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Products Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-slate-500">No products found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => {
                      const isSelected = selectedSimilarProducts.some(p => p.id === product.id);
                      return (
                        <div
                          key={product.id}
                          onClick={() => handleToggleSimilarProduct(product)}
                          className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                            isSelected
                              ? 'border-violet-500 ring-2 ring-violet-200 bg-violet-50'
                              : 'border-slate-200 hover:border-violet-300 hover:shadow-lg bg-white'
                          }`}
                        >
                          <div className="p-4">
                            <div className="flex items-start space-x-3">
                              {product.thumb_url ? (
                                <img
                                  src={product.thumb_url}
                                  alt={product.name}
                                  className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-slate-900 truncate">{product.name}</h4>
                                <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                                <p className="text-sm font-bold text-violet-600 mt-1">{formatCurrency(product.price)}</p>
                                {product.category && (
                                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-violet-100 text-violet-700 rounded-full">
                                    {product.category.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-3 right-3">
                              <div className="w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center shadow-lg">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer with Selected Count and Confirm */}
              <div className="p-6 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  {selectedSimilarProducts.length} product{selectedSimilarProducts.length !== 1 ? 's' : ''} selected
                  {selectedSimilarProducts.length >= 20 && <span className="text-red-600 ml-2">(Maximum reached)</span>}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowSimilarProductsModal(false);
                    }}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSimilarProducts}
                    className="px-6 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg"
                  >
                    Confirm Selection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Meta Image Selection Modal */}
        {showMetaImageModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Select Meta Image</h3>
                  <p className="text-sm text-slate-500">Choose an image from your gallery</p>
                </div>
                <button
                  onClick={() => setShowMetaImageModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

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
                  <option value="products">Products</option>
                  <option value="general">General</option>
                  <option value="banner">Banner</option>
                </select>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {filteredGalleryImages.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-500">No images found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filteredGalleryImages.map((image) => (
                      <div
                        key={image.id}
                        onClick={() => {
                          setSelectedMetaImage(image);
                          setFormData({ ...formData, meta_image: image.url });
                          setShowMetaImageModal(false);
                        }}
                        className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                          selectedMetaImage?.id === image.id || formData.meta_image === image.url
                            ? 'border-emerald-500 ring-2 ring-emerald-200'
                            : 'border-slate-200 hover:border-emerald-300 hover:shadow-lg'
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
                        {(selectedMetaImage?.id === image.id || formData.meta_image === image.url) && (
                          <div className="absolute top-2 right-2">
                            <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
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
      </div>
    </AdminLayout>
  );
}
