"use client";

import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ProductCard } from '@/components/product-card';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  show_on_home?: boolean;
}

export function HomeCategories() {
  const { formatCurrency } = useCurrency();

  // Fetch categories with show_on_home=true
  const { data: categoriesData, isLoading: catLoading } = useSWR(
    '/ecommerce/categories?limit=100',
    fetcher
  );
  const homeCategories: Category[] = (categoriesData?.data || []).filter(
    (c: Category) => c.show_on_home === true
  );

  // Fetch all products
  const { data: productsData, isLoading: prodLoading } = useSWR(
    '/ecommerce/products?limit=100',
    fetcher
  );
  const allProducts = productsData?.data || [];

  if (catLoading || prodLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (homeCategories.length === 0) return null;

  return (
    <div>
      {homeCategories.map((category) => {
        const categoryProducts = allProducts.filter(
          (p: any) => p.category_id === category.id
        );

        if (categoryProducts.length === 0) return null;

        return (
          <section key={category.id} className="py-8 md:py-16">
            <div className="container">
              <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="text-muted-foreground text-sm mt-2">
                      {category.description}
                    </p>
                  )}
                </div>
                <Link
                  href={`/shop?category_id=${category.id}`}
                  className="text-primary font-medium hover:underline flex items-center gap-1"
                >
                  View All
                  <span className="text-lg">&rarr;</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {categoryProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
