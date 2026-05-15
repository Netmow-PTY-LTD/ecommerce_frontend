export interface Product {
    id: number;
    slug?: string;
    name: string;
    sku?: string;
    description?: string;
    specification?: string;
    category_id?: number;
    unit_id?: number;
    price: number;
    sale_price?: number;
    price_source?: 'original' | 'flash_sale' | 'tier';
    cost?: number;
    purchase_tax?: number;
    sales_tax?: number;
    stock_quantity?: number;
    initial_stock?: number;
    min_stock_level?: number;
    max_stock_level?: number;
    barcode?: string;
    image_url?: string;
    thumb_url?: string;
    status: 'active' | 'inactive';
    created_at?: string;
    updated_at?: string;
    category?: Category;
    unit?: Unit;
    gallery_items?: string[];
    attributes?: ProductAttribute[];
    similar_products?: number[];
}

export interface User {
    id: number;
    name: string;
    email: string;
    role_id?: number;
    phone?: string;
    status: 'active' | 'inactive';
    profile_picture?: string;
    role?: {
        id: number;
        name: string;
        display_name: string;
        permissions: string[];
    };
}

export interface Customer {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postal_code: string | null;
    customer_type: 'individual' | 'company';
    status: 'active' | 'inactive';
    created_at: string;
}

export interface ProductAttribute {
    name: string;
    values: string[];
}

export interface Category {
    id: number;
    slug: string;
    name: string;
    description: string;
    image_url?: string;
    parent_id: number | null;
    status: 'active' | 'inactive';
    show_on_home?: boolean;
    section_id?: number | null;
    banner_url?: string;
    total_products?: number;
    products_count?: number;
    created_at?: string;

    updated_at?: string;
}

export interface Unit {
    id: number;
    name: string;
    symbol: string;
    status: 'active' | 'inactive';
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPage: number;

}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
    pagination?: Pagination;
}

export interface ArrivalProduct {
    id: number;
    product_id: number;
    arrival_date: string;
    featured: boolean;
    display_order: number;
    expiry_date?: string | null;
    badge_text?: string | null;
    status: 'active' | 'inactive' | 'scheduled';
    created_at?: string;
    updated_at?: string;
    product?: Product;
}

export interface GalleryImage {
    id: number;
    filename: string;
    originalName: string;
    url: string;
    size: number;
    width?: number;
    height?: number;
    mimeType?: string;
    category: string;
    created_at?: string;
    updated_at?: string;
}
