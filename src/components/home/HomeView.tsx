import React from 'react';
import { useShop } from '../../context/ShopContext';
import { HeroSection } from './HeroSection';
import { TrustSection } from './TrustSection';
import { CategorySection } from './CategorySection';
import { WhyShopWithUs } from './WhyShopWithUs';
import { ProductCard } from '../products/ProductCard';
import { ArrowRight, Sparkles, Flame } from 'lucide-react';

export const HomeView: React.FC = () => {
  const { products, navigateTo, settings } = useShop();

  const featuredProducts = products.filter((p) => p.isFeatured && p.isActive).slice(0, Math.max(0, settings.featuredProductsCount ?? 8));
  const popularProducts = products.filter((p) => p.isPopular && p.isActive).slice(0, Math.max(0, settings.popularProductsCount ?? 4));

  const SectionHeading = ({ icon, title, subtitle }: {
    icon: React.ReactNode; title: string; subtitle: string;
  }) => (
    <div className="flex items-end justify-between gap-4 mb-5 sm:mb-6">
      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
        <div className="mt-0.5 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-extrabold text-stone-900 leading-snug">{title}</h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">{subtitle}</p>
        </div>
      </div>
      <button onClick={() => navigateTo('products')} className="shrink-0 text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-emerald-50 transition-colors">
        <span>সব দেখুন</span><ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <div className="pb-16">
      <HeroSection />
      <TrustSection />
      {settings.categorySectionEnabled !== false && <CategorySection />}

      <section aria-labelledby="halal-shop-intro-title" className="py-8 sm:py-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-7 shadow-sm">
          <h2 id="halal-shop-intro-title" className="text-xl sm:text-2xl font-extrabold text-emerald-950">
            Halal Shop — বিশ্বস্ত হালাল পণ্যের অনলাইন শপ
          </h2>
          <p className="mt-3 text-sm sm:text-base leading-7 text-stone-600">
            Halal Shop-এ প্রয়োজনীয় হালাল পণ্য সহজে খুঁজে দেখুন এবং অনলাইনে অর্ডার করুন। আমাদের লক্ষ্য হলো সহজ কেনাকাটার অভিজ্ঞতার মাধ্যমে মানসম্মত ও বিশ্বস্ত পণ্য গ্রাহকের কাছে পৌঁছে দেওয়া। পণ্যের তথ্য, অর্ডার এবং ডেলিভারি সংক্রান্ত সহায়তার জন্য আমাদের সাপোর্টে যোগাযোগ করতে পারেন।
          </p>
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="py-8 sm:py-10 max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading icon={<Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />} title="নির্বাচিত পণ্য" subtitle="গ্রাহকদের জন্য বাছাই করা বিশেষ কালেকশন" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
            {featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      )}

      {popularProducts.length > 0 && (
        <section className="py-8 sm:py-10 max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading icon={<Flame className="w-4 h-4 sm:w-5 sm:h-5 text-rose-700" />} title="জনপ্রিয় পণ্য" subtitle="গ্রাহকদের পছন্দের পণ্যগুলো একসাথে" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
            {popularProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      )}

      <WhyShopWithUs />
    </div>
  );
};
