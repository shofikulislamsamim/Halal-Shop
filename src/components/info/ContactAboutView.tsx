import React from 'react';
import { useShop } from '../../context/ShopContext';
import {
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { getWhatsAppUrl, getGeneralWhatsAppMessage } from '../../utils/helpers';

interface ContactAboutViewProps {
  initialTab?: 'contact' | 'about';
}

export const ContactAboutView: React.FC<ContactAboutViewProps> = ({ initialTab = 'contact' }) => {
  const { settings } = useShop();

  const whatsAppUrl = getWhatsAppUrl(
    settings.whatsappNumber,
    getGeneralWhatsAppMessage(settings.shopName)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-20">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 leading-snug mb-2">
          {settings.shopName} এর সাথে যোগাযোগ ও তথ্য
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm">
          বিশ্বস্ত হালাল পণ্যের নিরাপদ অনলাইন শপ। আমরা গ্রাহক সেবায় সর্বদা দায়বদ্ধ।
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* Contact info card 1: WhatsApp */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-1">
              হোয়াটসঅ্যাপ কাস্টমার সার্ভিস
            </h3>
            <p className="text-stone-500 text-xs leading-relaxed mb-4">
              যেকোনো প্রশ্ন, পণ্যের বিবরণ বা সরাসরি অর্ডারের জন্য হোয়াটসঅ্যাপে মেসেজ দিন।
            </p>
            <div className="font-mono font-bold text-emerald-800 text-sm mb-4">
              +{settings.whatsappNumber}
            </div>
          </div>

          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>সরাসরি চ্যাট শুরু করুন</span>
          </a>
        </div>

        {/* Contact info card 2: Phone Hotline */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mb-4">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-1">
              সরাসরি হেল্পলাইন
            </h3>
            <p className="text-stone-500 text-xs leading-relaxed mb-4">
              {settings.supportHours || settings.businessHours || 'আমাদের নির্ধারিত সাপোর্ট সময়ে কাস্টমার প্রতিনিধির সাথে যোগাযোগ করতে পারেন।'}
            </p>
            <div className="font-mono font-bold text-stone-900 text-sm mb-4">
              {settings.contactNumber}
            </div>
          </div>

          <a
            href={`tel:${settings.contactNumber}`}
            className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-stone-300"
          >
            <Phone className="w-4 h-4" />
            <span>সরাসরি কল দিন</span>
          </a>
        </div>

        {/* Contact info card 3: Address & Hours */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-1">
              দোকান / কার্যালয়
            </h3>
            <p className="text-stone-700 text-xs leading-relaxed mb-3">
              {settings.shopAddress}
            </p>
            <div className="text-[11px] text-stone-500 space-y-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>{settings.businessHours || 'সপ্তাহের ৭ দিনই অর্ডার গ্রহণ করা হয়'}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 text-xs font-semibold text-emerald-800">
            ★ শতভাগ বিশ্বস্ত অনলাইন সার্ভিস
          </div>
        </div>
      </div>

      {/* About Section: Story & Delivery Policy */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-xs space-y-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-3 border-b-2 border-emerald-700 pb-1 inline-block">
            আমাদের লক্ষ্য ও পরিচিতি
          </h2>
          <p className="text-stone-700 text-sm sm:text-base leading-relaxed mb-4">
            <strong>{settings.shopName}</strong> একটি আন্তরিক ও বিশ্বস্ত বাংলাদেশি ই-কমার্স প্ল্যাটফর্ম। আমাদের মূল লক্ষ্য হলো মুসলিম পরিবার ও সচেতন ক্রেতাদের কাছে শতভাগ খাঁটি, নির্ভেজাল ও হালাল পণ্য পৌঁছে দেওয়া। আমরা কৃত্রিম জটিলতা, দীর্ঘ নিবন্ধন বা জটিল পেমেন্ট গেটওয়ের ঝামেলা মুক্ত রেখে কেনাকাটাকে অত্যন্ত সহজ করেছি।
          </p>
          <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
            আমরা বিশ্বাস করি সততা ও বিশ্বস্ততাই ব্যবসার সবচেয়ে বড় পুঁজি। তাই প্রতিটি পণ্য গ্রাহকের কাছে পাঠানোর পূর্বে নিজস্ব টিম দিয়ে গুণগত মান যাচাই করা হয়।
          </p>
        </div>

        {/* 3 Core Commitments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-stone-200">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <ShieldCheck className="w-6 h-6 text-emerald-700 mb-2" />
            <h3 className="font-bold text-stone-900 text-sm mb-1">
              ১০০% খাঁটি ও হালাল
            </h3>
            <p className="text-stone-500 text-xs leading-relaxed">
              মধু, সুগন্ধি আতর, বই ও ইলেকট্রনিক্স পণ্যের ক্ষেত্রে আমরা সর্বদা সর্বোচ্চ মানের উৎস বেছে নিই।
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <Truck className="w-6 h-6 text-emerald-700 mb-2" />
            <h3 className="font-bold text-stone-900 text-sm mb-1">
              ক্যাশ অন ডেলিভারি সুবিধা
            </h3>
            <p className="text-stone-500 text-xs leading-relaxed">
              পণ্য হাতে পেয়ে দেখে টাকা দেওয়ার সুযোগ। {settings.deliveryCoverage || 'ডেলিভারি কভারেজ ও আনুমানিক সময় প্রশাসনিক সেটিংস অনুযায়ী প্রযোজ্য।'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <RotateCcw className="w-6 h-6 text-emerald-700 mb-2" />
            <h3 className="font-bold text-stone-900 text-sm mb-1">
              সহজ পরিবর্তন নীতিমালা
            </h3>
            <p className="text-stone-500 text-xs leading-relaxed">
              {settings.returnPolicy || 'রিটার্ন বা রিপ্লেসমেন্টের বিস্তারিত তথ্য নিচের নীতিমালা অংশে দেখুন।'}
            </p>
          </div>
        </div>
      </div>

      {(settings.returnPolicy || settings.termsAndConditions) && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-xs space-y-7">
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900">নীতিমালা ও শর্তাবলি</h2>
          {settings.returnPolicy && (
            <div>
              <h3 className="font-bold text-stone-900 mb-2">রিটার্ন / রিপ্লেসমেন্ট নীতিমালা</h3>
              <p className="text-sm text-stone-700 leading-7 whitespace-pre-line">{settings.returnPolicy}</p>
            </div>
          )}
          {settings.termsAndConditions && (
            <div className="pt-5 border-t border-stone-200">
              <h3 className="font-bold text-stone-900 mb-2">শর্তাবলি</h3>
              <p className="text-sm text-stone-700 leading-7 whitespace-pre-line">{settings.termsAndConditions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
