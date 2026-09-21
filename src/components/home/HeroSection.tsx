import React from 'react';
import { useShop } from '../../context/ShopContext';
import { ShoppingBag, ArrowRight, Truck, ShieldCheck, Sparkles } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { settings, navigateTo } = useShop();

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#064E3B] via-[#065F46] to-[#064E3B] text-white py-8 sm:py-14 px-4 sm:px-6">
      {/* Subtle Islamic geometric pattern overlay */}
      <div className="absolute inset-0 opacity-8 bg-[radial-gradient(#C8A951_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
        {/* Left / Center Text Content */}
        <div className="text-center md:text-left flex-1 max-w-2xl">
          {/* Subtle Trust Pill */}
          <div className="inline-flex items-center gap-1.5 bg-emerald-800/80 border border-emerald-600/60 text-amber-300 text-xs font-semibold px-3 py-1 rounded-full mb-3 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>১০০% খাঁটি ও হালাল পণ্যের বিশ্বস্ত প্ল্যাটফর্ম</span>
          </div>

          {/* Short, Punchy Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-2.5 sm:mb-3.5 leading-snug sm:leading-tight">
            বিশ্বস্ত পণ্য, সহজে অর্ডার
          </h1>

          {/* Short Supporting Text (No large paragraphs) */}
          <p className="text-xs sm:text-base text-emerald-100/90 max-w-xl mb-5 sm:mb-7 font-normal leading-relaxed">
            {settings.heroSubtitle || 'খাঁটি মধু, কালোজিরা, ইসলামিক বই ও হালাল নিত্যপ্রয়োজনীয় পণ্য পৌঁছে যাবে আপনার ঠিকানায়।'}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-row items-center justify-center md:justify-start gap-2.5 sm:gap-3 w-full">
            {/* Primary CTA: "এখনই কেনাকাটা করুন" */}
            <button
              onClick={() => navigateTo('products')}
              className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
              id="hero-shop-now-btn"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>এখনই কেনাকাটা করুন</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Secondary CTA: Order Tracking */}
            <button
              onClick={() => navigateTo('track')}
              className="bg-emerald-800/70 hover:bg-emerald-800 text-emerald-100 font-semibold px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm border border-emerald-600/60 transition-all flex items-center justify-center gap-1.5"
              id="hero-track-btn"
            >
              <Truck className="w-4 h-4 text-amber-300" />
              <span>অর্ডার ট্র্যাকিং</span>
            </button>
          </div>
        </div>

        {/* Right Subtle Visual Graphic Card */}
        <div className="hidden md:flex flex-col items-center justify-center shrink-0 w-72 bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-5 text-center backdrop-blur-xs shadow-inner">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-3 font-extrabold text-2xl">
            হ
          </div>
          <h3 className="text-white font-bold text-base mb-1">
            {settings.shopName}
          </h3>
          <p className="text-emerald-200 text-xs leading-relaxed">
            কোনো ধরনের অগ্রিম পেমেন্ট ছাড়াই সারা বাংলাদেশে হোম ডেলিভারি সুবিধা
          </p>
          <div className="mt-3 pt-3 border-t border-emerald-800/80 w-full flex justify-around text-[11px] text-amber-200 font-medium">
            <span>✓ ক্যাশ অন ডেলিভারি</span>
            <span>✓ দ্রুত হোম ডেলিভারি</span>
          </div>
        </div>
      </div>
    </div>
  );
};
