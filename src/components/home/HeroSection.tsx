import React from 'react';
import { useShop } from '../../context/ShopContext';
import { ShoppingBag, ArrowRight, Truck, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { settings, navigateTo } = useShop();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#043C2E] via-[#075A45] to-[#063F31] text-white">
      <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(#C8A951_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-24 -bottom-32 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-9 sm:py-14 lg:py-16">
        <div className="grid lg:grid-cols-[1.15fr_.85fr] items-center gap-8 lg:gap-12">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-white/5 px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold text-amber-200 backdrop-blur">
              <Sparkles className="w-3.5 h-3.5" />
              <span>বিশ্বস্ত হালাল পণ্যের অনলাইন শপ</span>
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.2]">
              বিশ্বস্ত পণ্য,
              <span className="block text-amber-300">সহজে কেনাকাটা</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto lg:mx-0 text-sm sm:text-base text-emerald-50/85 leading-7">
              {settings.heroSubtitle || 'খাঁটি মধু, কালোজিরা, ইসলামিক বই ও প্রয়োজনীয় হালাল পণ্য পৌঁছে যাবে আপনার ঠিকানায়।'}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              <button onClick={() => navigateTo('products')} className="group inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 sm:px-6 py-3.5 text-xs sm:text-sm font-extrabold text-stone-950 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-amber-300 active:translate-y-0" id="hero-shop-now-btn">
                <ShoppingBag className="w-4 h-4" />
                <span>এখনই কেনাকাটা করুন</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button onClick={() => navigateTo('track')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-xs sm:text-sm font-bold text-white backdrop-blur transition-all hover:bg-white/10" id="hero-track-btn">
                <Truck className="w-4 h-4 text-amber-300" />
                <span>অর্ডার ট্র্যাক করুন</span>
              </button>
            </div>
            <div className="mt-6 flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2 text-[11px] sm:text-xs text-emerald-100/80">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />ক্যাশ অন ডেলিভারি</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />সারা দেশে ডেলিভারি</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />সহজ অর্ডার</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-3 shadow-2xl shadow-black/20 backdrop-blur-sm">
              <div className="rounded-[1.5rem] bg-white p-6 sm:p-7 text-center text-stone-900">
                <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-stone-100 bg-stone-50 shadow-sm">
                  <img src={settings.logoUrl || '/Halal-Shop/halal-shop-logo.jpg'} alt={settings.shopName} className="h-full w-full object-cover" />
                </div>
                <h2 className="mt-4 text-xl font-black text-emerald-950">{settings.shopName}</h2>
                <p className="mt-1 text-xs font-medium text-stone-500">{settings.tagline}</p>
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                    <ShieldCheck className="mx-auto h-5 w-5 text-emerald-700" />
                    <p className="mt-1.5 text-[11px] font-bold text-emerald-900">বিশ্বস্ত পণ্য</p>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3">
                    <Truck className="mx-auto h-5 w-5 text-amber-700" />
                    <p className="mt-1.5 text-[11px] font-bold text-amber-900">হোম ডেলিভারি</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-stone-50 px-3 py-2.5 text-[11px] font-semibold text-stone-600">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  অগ্রিম পেমেন্ট ছাড়াই অর্ডার করুন
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
