import React from 'react';
import { useShop } from '../../context/ShopContext';
import { HeroSection } from './HeroSection';
import { TrustSection } from './TrustSection';
import { CategorySection } from './CategorySection';
import { WhyShopWithUs } from './WhyShopWithUs';
import { ProductCard } from '../products/ProductCard';
import { ArrowRight, Sparkles, Flame } from 'lucide-react';

export const HomeView: React.FC = () => {
  const { products, navigateTo } = useShop();

  const featuredProducts = products.filter((p) => p.isFeatured && p.isActive).slice(0, 8);
  const popularProducts = products.filter((p) => p.isPopular && p.isActive).slice(0, 4);

  return (
    <div className="pb-16">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Compact Trust Points Strip */}
      <TrustSection />

      {/* 3. Categories Section */}
      <CategorySection />

      {/* 4. Featured Products Section */}
      <section className="py-6 sm:py-8 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-stone-900 leading-snug">
                নির্বাচিত পণ্য সমূহ (Featured)
              </h2>
              <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
                গ্রাহকদের সর্বাধিক পছন্দের স্পেশাল কালেকশন
              </p>
            </div>
          </div>

          <button
            onClick={() => navigateTo('products')}
            className="text-xs sm:text-sm font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 group py-1"
            id="view-all-featured-btn"
          >
            <span>সব দেখুন</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 2-column mobile grid, 4-column desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. Popular Products Section */}
      {popularProducts.length > 0 && (
        <section className="py-6 sm:py-8 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-100 text-rose-900 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-stone-900 leading-snug">
                  জনপ্রিয় পণ্য (Popular)
                </h2>
                <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
                  সবচেয়ে বেশি অর্ডার করা পণ্য সমূহ
                </p>
              </div>
            </div>

            <button
              onClick={() => navigateTo('products')}
              className="text-xs sm:text-sm font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 group py-1"
              id="view-all-popular-btn"
            >
              <span>সব দেখুন</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* 2-column mobile grid, 4-column desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Why Shop With Us Trust Points */}
      <WhyShopWithUs />
    </div>
  );
};
