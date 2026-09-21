import React from 'react';
import { Banknote, ShoppingCart, Truck, ShieldCheck } from 'lucide-react';

export const TrustSection: React.FC = () => {
  const trustPoints = [
    {
      icon: <Banknote className="w-4 h-4 text-emerald-800 shrink-0" />,
      title: 'ক্যাশ অন ডেলিভারি',
      desc: 'পণ্য হাতে পেয়ে মূল্য পরিশোধ',
    },
    {
      icon: <ShoppingCart className="w-4 h-4 text-emerald-800 shrink-0" />,
      title: 'সহজ অর্ডার',
      desc: 'রেজিস্ট্রেশন ছাড়াই দ্রুত অর্ডার',
    },
    {
      icon: <Truck className="w-4 h-4 text-emerald-800 shrink-0" />,
      title: 'দ্রুত ডেলিভারি',
      desc: 'সারাদেশে হোম ডেলিভারি',
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />,
      title: 'বিশ্বস্ত পণ্য',
      desc: 'শরীয়াহসম্মত ও যাচাইকৃত',
    },
  ];

  return (
    <div className="bg-[#F7F6F0] border-b border-stone-200/80 py-3.5 sm:py-4 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {trustPoints.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2.5 bg-white/70 sm:bg-transparent p-2 sm:p-0 rounded-xl border border-stone-200/50 sm:border-0"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100/70 text-emerald-900 flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-stone-900 block leading-tight truncate">
                {item.title}
              </span>
              <span className="text-[10px] sm:text-xs text-stone-500 block truncate">
                {item.desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
