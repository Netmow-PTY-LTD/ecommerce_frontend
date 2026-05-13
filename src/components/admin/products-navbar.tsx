'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ProductsNavbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin/products', label: 'Products', active: pathname === '/admin/products' },
    { href: '/admin/products/categories', label: 'Categories', active: pathname === '/admin/products/categories' },
    { href: '/admin/products/units', label: 'Units', active: pathname === '/admin/products/units' },
  ];

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 mb-6">
      <div className="w-full px-4">
        <nav className="flex space-x-8 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition duration-200 ${
                item.active
                  ? 'bg-brand/10 text-brand'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
