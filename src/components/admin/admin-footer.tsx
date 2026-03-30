'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function AdminFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between space-y-4 py-6 md:flex-row md:space-y-0">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} E-Commerce ERP.</span>
            <span>All rights reserved.</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            <span>using Next.js & shadcn/ui</span>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <Link href="/admin/settings" className="text-muted-foreground hover:text-foreground transition-colors">
              Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
