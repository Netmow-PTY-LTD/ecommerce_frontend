import { Hero } from "@/components/hero";
import { HomeCategories } from "@/components/home-categories";
import { FlashSalesSection } from "@/components/flash-sales-section";
import { CouponsSection } from "@/components/coupons-section";

export default function Home() {
  return (
    <>
      <Hero />
      <HomeCategories />
      <FlashSalesSection />
      <CouponsSection />

      {/* Promotional Section - Just for visual appeal */}
      <section className="py-24 bg-zinc-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="container mx-auto px-4 relative z-10 text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Join the Revolution</h2>
          <p className="max-w-2xl mx-auto text-lg text-zinc-400">
            Experience the future of shopping with our exclusive membership. Get early access to drops, special discounts, and more.
          </p>
          <div className="flex justify-center">
            <button className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors">
              Sign Up Now
            </button>
          </div>
        </div>
      </section>
    </>
  );
}





