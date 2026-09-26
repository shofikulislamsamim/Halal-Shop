import React from 'react';
import { useShop } from '../../context/ShopContext';
import {
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Facebook,
  Instagram,
  Youtube,
  Music2,
} from 'lucide-react';
import { getWhatsAppUrl, getGeneralWhatsAppMessage } from '../../utils/helpers';

export const Footer: React.FC = () => {
  const { settings, navigateTo, activeCategories } = useShop();

  const whatsAppUrl = getWhatsAppUrl(
    settings.whatsappNumber,
    getGeneralWhatsAppMessage(settings.shopName)
  );

  return (
    <footer className="bg-stone-900 text-stone-300 pt-12 pb-24 md:pb-12 border-t border-stone-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Trust Badges Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-10 mb-10 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-900/50 text-amber-400 flex items-center justify-center shrink-0 border border-emerald-800">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold">ক্যাশ অন ডেলিভারি</h4>
              <p className="text-stone-400 text-xs">পণ্য হাতে পেয়ে মূল্য পরিশোধ</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-900/50 text-amber-400 flex items-center justify-center shrink-0 border border-emerald-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold">১০০% হালাল ও খাঁটি</h4>
              <p className="text-stone-400 text-xs">মান ও বিশুদ্ধতার নিশ্চয়তা</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-900/50 text-amber-400 flex items-center justify-center shrink-0 border border-emerald-800">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold">সহজ অর্ডার</h4>
              <p className="text-stone-400 text-xs">অ্যাকাউন্ট খোলার ঝামেলা নেই</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-900/50 text-amber-400 flex items-center justify-center shrink-0 border border-emerald-800">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold">হোয়াটসঅ্যাপ সাপোর্ট</h4>
              <p className="text-stone-400 text-xs">সরাসরি যে কোন প্রশ্ন করুন</p>
            </div>
          </div>
        </div>

        {/* Links & Info Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-amber-300 flex items-center justify-center font-bold">
                হ
              </div>
              <span className="text-xl font-bold text-white leading-snug">
                {settings.shopName}
              </span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed mb-4">
              {settings.heroSubtitle}
            </p>
            <div className="text-xs text-amber-400 font-medium">
              ★ বিশ্বস্ত হালাল পণ্যের অনলাইন শপ
            </div>
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {[
                ['Facebook', settings.facebookPage, Facebook],
                ['Instagram', settings.instagramPage, Instagram],
                ['YouTube', settings.youtubeChannel, Youtube],
                ['TikTok', settings.tiktokPage, Music2],
              ].filter(([, url]) => Boolean(url)).map(([label, url, Icon]) => {
                const SocialIcon = Icon as React.ElementType;
                return (
                  <a key={label as string} href={url as string} target="_blank" rel="noopener noreferrer" aria-label={label as string}
                    className="w-8 h-8 rounded-lg border border-stone-700 bg-stone-800 hover:bg-emerald-800 text-stone-300 hover:text-white flex items-center justify-center transition-colors">
                    <SocialIcon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h5 className="text-white text-sm font-semibold mb-3 border-b border-stone-800 pb-1 inline-block">
              ক্যাটাগরি সমূহ
            </h5>
            <ul className="space-y-2 text-xs">
              {activeCategories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => navigateTo('products', { categorySlug: cat.slug })}
                    className="text-stone-400 hover:text-amber-300 transition-colors"
                  >
                    {cat.nameBn}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => navigateTo('products')}
                  className="text-emerald-400 hover:underline"
                >
                  সকল পণ্য দেখুন →
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Service */}
          <div>
            <h5 className="text-white text-sm font-semibold mb-3 border-b border-stone-800 pb-1 inline-block">
              গ্রাহক সেবা
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => navigateTo('track')}
                  className="text-stone-400 hover:text-amber-300 transition-colors"
                >
                  অর্ডার ট্র্যাকিং
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('contact')}
                  className="text-stone-400 hover:text-amber-300 transition-colors"
                >
                  যোগাযোগ ও অভিযোগ
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('about')}
                  className="text-stone-400 hover:text-amber-300 transition-colors"
                >
                  আমাদের সম্পর্কে ও ডেলিভারি পলিসি
                </button>
              </li>
              <li>
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline inline-flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  হোয়াটসঅ্যাপে সরাসরি চ্যাট
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact details */}
          <div>
            <h5 className="text-white text-sm font-semibold mb-3 border-b border-stone-800 pb-1 inline-block">
              সরাসরি যোগাযোগ
            </h5>
            <div className="space-y-2.5 text-xs text-stone-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{settings.shopAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <a href={`tel:${settings.contactNumber}`} className="hover:text-white">
                  {settings.contactNumber}
                </a>
              </div>
              {settings.businessHours && (
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{settings.businessHours}</span>
                </div>
              )}
              {settings.supportHours && (
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>সাপোর্ট: {settings.supportHours}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  হোয়াটসঅ্যাপ: +{settings.whatsappNumber}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div>{settings.footerNotice}</div>
          <div className="text-stone-600">নিরাপদ ও সহজ অনলাইন কেনাকাটা</div>
        </div>
      </div>
    </footer>
  );
};
