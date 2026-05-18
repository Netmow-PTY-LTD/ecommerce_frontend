import { Hero } from "@/components/hero";
import { PopularCategories } from "@/components/popular-categories";
import { HomeCategories } from "@/components/home-categories";
import { FlashSalesSection } from "@/components/flash-sales-section";
import { CouponsSection } from "@/components/coupons-section";
import { NewArrivals } from "@/components/new-arrivals";
import { FeaturedProducts } from "@/components/featured-products";
import { PromotionalSection } from "@/components/promotional-section";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Hero />
      <PopularCategories />
      <HomeCategories />


      {/* Promotional Section */}
      <PromotionalSection />

      {/* New Arrivals Section */}
      <NewArrivals />

      {/* Featured Products Section */}
      <FeaturedProducts />

      {/* Flash Sales Section */}
      <FlashSalesSection />

      {/* Coupons Section */}
      <CouponsSection />
    </>
  );
}





