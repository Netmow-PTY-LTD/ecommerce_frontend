import { Hero } from "@/components/hero";
import { PopularCategories } from "@/components/popular-categories";
import { HomeCategories } from "@/components/home-categories";
import { FlashSalesSection } from "@/components/flash-sales-section";
import { CouponsSection } from "@/components/coupons-section";
import { NewArrivals } from "@/components/new-arrivals";
import { FeaturedArrivals } from "@/components/featured-arrivals";
import { FeaturedProducts } from "@/components/featured-products";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Hero />
      <PopularCategories />
      <HomeCategories />


      {/* Promotional Section */}
      <section className="py-8 md:py-16 bg-slate-50 overflow-hidden">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center">

            {/* Left Illustration - Colorful shopping bag */}
            <div className="hidden md:flex items-end justify-center h-full">
              <svg viewBox="0 0 220 200" className="w-48 h-48" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Shopping bag body */}
                <rect x="40" y="80" width="140" height="110" rx="10" className="fill-brand" stroke="#333" strokeWidth="2.5" />
                {/* Bag handle */}
                <path d="M80 80 Q80 45 110 45 Q140 45 140 80" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
                {/* Recycle icon */}
                <circle cx="110" cy="140" r="22" fill="white" opacity="0.9" />
                <text x="110" y="147" textAnchor="middle" fontSize="20" className="fill-brand">♻</text>
                {/* Vegetables poking out */}
                <ellipse cx="70" cy="78" rx="14" ry="18" fill="#4caf50" stroke="#333" strokeWidth="1.5" />
                <ellipse cx="95" cy="70" rx="12" ry="16" fill="#ff9800" stroke="#333" strokeWidth="1.5" />
                <ellipse cx="125" cy="72" rx="13" ry="17" fill="#8bc34a" stroke="#333" strokeWidth="1.5" />
                <ellipse cx="150" cy="76" rx="11" ry="15" fill="#f44336" stroke="#333" strokeWidth="1.5" />
                {/* Carrot */}
                <path d="M55 90 Q50 110 58 120" stroke="#ff9800" strokeWidth="3" strokeLinecap="round" />
                {/* Small veggies at bottom */}
                <circle cx="65" cy="185" r="12" fill="#f44336" stroke="#333" strokeWidth="1.5" />
                <circle cx="90" cy="188" r="10" fill="#ff9800" stroke="#333" strokeWidth="1.5" />
                <circle cx="155" cy="184" r="11" fill="#4caf50" stroke="#333" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Center Content */}
            <div className="text-center space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
                Join the Revolution
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                Experience the future of shopping with our exclusive membership.
                Get early access to drops, special discounts, and more.
              </p>
              <div className="flex justify-center">
                <Link href="/shop" className="bg-brand hover:opacity-90 active:scale-95 text-white px-8 py-2.5 rounded text-sm font-bold transition-all duration-200 shadow-md shadow-brand/20">
                  Shop Now                </Link>
              </div>
            </div>

            {/* Right Illustration - Faded line art */}
            <div className="hidden md:flex items-end justify-center h-full">
              <svg viewBox="0 0 220 200" className="w-48 h-48 opacity-20" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Hand holding a bag outline */}
                <path d="M60 160 Q55 130 65 110 Q70 95 80 90 L100 85 L140 85 Q155 90 158 110 Q165 135 160 160 Z" stroke="#555" strokeWidth="3" fill="none" />
                {/* Fingers */}
                <path d="M80 90 Q75 70 82 55 Q87 45 95 50 Q100 55 97 70 L95 85" stroke="#555" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M100 87 Q97 62 104 48 Q109 38 118 43 Q124 50 120 67 L117 85" stroke="#555" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M120 86 Q119 62 127 50 Q132 42 141 47 Q147 55 142 70 L140 85" stroke="#555" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M140 87 Q141 68 148 58 Q154 50 162 55 Q167 63 162 76 L158 88" stroke="#555" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* Thumb */}
                <path d="M65 110 Q50 108 45 98 Q42 88 52 83 Q62 80 70 90" stroke="#555" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* Veggies in hand */}
                <ellipse cx="100" cy="55" rx="14" ry="10" stroke="#555" strokeWidth="2" fill="none" />
                <path d="M100 45 Q105 30 100 20" stroke="#555" strokeWidth="2" fill="none" strokeLinecap="round" />
                <ellipse cx="135" cy="48" rx="12" ry="9" stroke="#555" strokeWidth="2" fill="none" />
                <path d="M135 39 Q140 24 136 15" stroke="#555" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </div>

          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <NewArrivals />

      {/* Featured Arrivals Section */}
      <FeaturedArrivals />

      {/* Featured Products Section */}
      <FeaturedProducts />

      {/* Flash Sales Section */}
      <FlashSalesSection />

      {/* Coupons Section */}
      <CouponsSection />
    </>
  );
}





