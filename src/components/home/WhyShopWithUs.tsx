import React from 'react';
import { useShop } from '../../context/ShopContext';
import { Truck, MousePointerClick, ShieldCheck, MessageCircle, ArrowRight } from 'lucide-react';
import { getWhatsAppUrl, getGeneralWhatsAppMessage } from '../../utils/helpers';

export const WhyShopWithUs: React.FC = () => {
  const { settings } = useShop();

  const whatsAppUrl = getWhatsAppUrl(
    settings.whatsappNumber,
    getGeneralWhatsAppMessage(settings.shopName)
  );

  return (
    <section className="py-12 bg-stone-100/70 border-t border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-snug">
            কেন হালাল শপ থেকে অর্ডার করবেন?
          </h2>
          <p className="text-stone-600 text-xs sm:text-sm mt-1.5">
            আমরা নিশ্চিত করি সবচেয়ে সহজ ও বিশ্বস্ত অনলাইন কেনাকাটার অভিজ্ঞতা
          </p>
        </div>

        {/* 4 Trust Points Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {/* 1. Cash on Delivery */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-1">
              ক্যাশ অন ডেলিভারি
            </h3>
            <p className="text-stone-500 text-xs leading-relaxed">
              আগে কোনো টাকা দিতে হবে না। পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধ করবেন।
            </p>
          </div>

          {/* 2. Easy Ordering */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center mb-3">
              <MousePointerClick className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-1">
              সহজ অর্ডার প্রক্রিয়া
            </h3>
            <p className="text-stone-500 text-xs leading-relaxed">
              কোনো জটিল রেজিস্ট্রেশন বা পাসওয়ার্ডের ঝামেলা নেই। শুধু নাম-ঠিকানা দিয়েই অর্ডার সম্পন্ন করুন।
            </p>
          </div>

          {/* 3. Home Delivery */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-1">
              দ্রুত হোম ডেলিভারি
            </h3>
            <p className="text-stone-500 text-xs leading-relaxed">
              ঢাকা ও সারাদেশে নির্ভরযোগ্য কুরিয়ারের মাধ্যমে সরাসরি আপনার ঠিকানায় পৌঁছে যাবে।
            </p>
          </div>

          {/* 4. WhatsApp Support */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-1">
              হোয়াটসঅ্যাপ সহায়তা
            </h3>
            <p className="text-stone-500 text-xs leading-relaxed">
              অর্ডার করতে অসুবিধা হলে বা যেকোনো তথ্য জানতে সরাসরি হোয়াটসঅ্যাপে মেসেজ দিন।
            </p>
          </div>
        </div>

        {/* WhatsApp Callout Banner */}
        <div className="bg-emerald-800 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div>
            <span className="text-amber-300 text-xs font-bold tracking-wider uppercase block mb-1">
              লাইভ কাস্টমার সার্ভিস
            </span>
            <h3 className="text-xl sm:text-2xl font-bold leading-tight">
              অর্ডার করতে সমস্যা হচ্ছে? সরাসরি হোয়াটসঅ্যাপে অর্ডার করুন
            </h3>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
              আমাদের টিম আপনাকে সাহায্য করতে সর্বদা প্রস্তুত। নাম্বার: +{settings.whatsappNumber}
            </p>
          </div>

          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold px-6 py-3.5 rounded-2xl text-sm sm:text-base flex items-center justify-center gap-2 shrink-0 shadow-sm transition-all"
            id="home-whatsapp-callout-btn"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>হোয়াটসঅ্যাপে কথা বলুন</span>
          </a>
        </div>
      </div>
    </section>
  );
};
