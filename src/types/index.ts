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
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    category?: Category;
    unit?: Unit;
    gallery_items?: string[];
    attributes?: ProductAttribute[];
    similar_products?: number[];
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
    is_active: boolean;
    show_on_home?: boolean;
    section_id?: number | null;
    banner_url?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Unit {
    id: number;
    name: string;
    symbol: string;
    is_active?: boolean;
}

export interface Pagination {
    total: number;
    page: string | number;
    limit: string | number;
    totalPage: number;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
    pagination?: Pagination;
}
