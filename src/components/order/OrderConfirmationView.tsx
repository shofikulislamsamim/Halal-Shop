import React from 'react';
import { useShop } from '../../context/ShopContext';
import { formatPrice, getWhatsAppUrl } from '../../utils/helpers';
import {
  CheckCircle,
  Truck,
  MessageCircle,
  ArrowRight,
  ShoppingBag,
  MapPin,
  Calendar,
  ShieldCheck,
  Copy,
  Printer,
} from 'lucide-react';

export const OrderConfirmationView: React.FC = () => {
  const { lastCreatedOrder, navigateTo, settings, showToast } = useShop();

  if (!lastCreatedOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-stone-600 mb-4">কোনো সাম্প্রতিক অর্ডার পাওয়া যায়নি।</p>
        <button
          onClick={() => navigateTo('home')}
          className="bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm"
        >
          হোমে ফিরে যান
        </button>
      </div>
    );
  }

  const order = lastCreatedOrder;

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    showToast(`অর্ডার আইডি #${order.id} কপি করা হয়েছে!`);
  };

  const whatsAppMsg = `আসসালামু আলাইকুম। আমি ${settings.shopName} এ একটি অর্ডার করেছি (অর্ডার আইডি: #${order.id})। আমি আমার অর্ডার কনফার্মেশন ও ডেলিভারি সম্পর্কে জানতে চাই।`;
  const whatsAppUrl = getWhatsAppUrl(settings.whatsappNumber, whatsAppMsg);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-20">
      {/* Success Hero Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 text-center shadow-xs mb-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50">
          <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2.5]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 mb-2">
          অর্ডার সফলভাবে গ্রহণ করা হয়েছে!
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm max-w-lg mx-auto mb-6">
          {settings.orderConfirmationMessage
            ? settings.orderConfirmationMessage.replace(/\{customerName\}/g, order.customerName)
            : `ধন্যবাদ ${order.customerName}! আপনার অর্ডারটি আমাদের ডাটাবেজে রেকর্ড করা হয়েছে। খুব শীঘ্রই আমাদের প্রতিনিধি আপনাকে ফোন করে অর্ডারটি নিশ্চিত করবেন।`}
        </p>

        {/* Order ID Badge */}
        <div className="inline-flex items-center gap-2 bg-stone-100 border border-stone-300 px-4 py-2 rounded-2xl">
          <span className="text-xs text-stone-500">আপনার অর্ডার আইডি:</span>
          <span className="font-extrabold text-base text-emerald-800 tracking-wide font-mono">
            #{order.id}
          </span>
          <button
            onClick={copyOrderId}
            className="p-1 hover:bg-stone-200 rounded-md text-stone-500"
            title="কপি করুন"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Structured Order Information Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs mb-6 space-y-6">
        {/* Customer & Delivery Summary */}
        <div>
          <h2 className="text-base font-bold text-stone-900 mb-3 pb-2 border-b border-stone-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-700" />
            <span>ডেলিভারি তথ্য</span>
          </h2>

          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-xs sm:text-sm space-y-2">
            <div>
              <span className="font-semibold text-stone-500">গ্রাহকের নাম: </span>
              <span className="font-bold text-stone-900">{order.customerName}</span>
            </div>
            <div>
              <span className="font-semibold text-stone-500">ফোন নাম্বার: </span>
              <span className="font-bold text-emerald-800">{order.mobile}</span>
              {order.altMobile && <span className="text-stone-500"> (বিকল্প: {order.altMobile})</span>}
            </div>
            <div>
              <span className="font-semibold text-stone-500">সম্পূর্ণ ঠিকানা: </span>
              <span className="text-stone-900">{order.address.formattedFullAddress}</span>
            </div>
            {order.orderNote && (
              <div>
                <span className="font-semibold text-stone-500">গ্রাহকের নোট: </span>
                <span className="text-stone-700 italic">"{order.orderNote}"</span>
              </div>
            )}
          </div>
        </div>

        {/* Products Ordered Table */}
        <div>
          <h2 className="text-base font-bold text-stone-900 mb-3 pb-2 border-b border-stone-100 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-700" />
            <span>অর্ডারের পণ্যসমূহ</span>
          </h2>

          <div className="divide-y divide-stone-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                    <img
                      src={item.imageUrl}
                      alt={item.nameBn}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-stone-900 line-clamp-1">
                      {item.nameBn}
                    </h3>
                    <span className="text-[11px] text-stone-500">
                      {formatPrice(item.price)} x {item.quantity} টি
                    </span>
                  </div>
                </div>

                <span className="font-bold text-xs sm:text-sm text-stone-900">
                  {formatPrice(item.total)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="pt-4 border-t border-stone-200 space-y-2 text-xs sm:text-sm text-stone-600">
            <div className="flex justify-between">
              <span>উপমোট (Subtotal):</span>
              <span className="font-semibold text-stone-900">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>ডেলিভারি চার্জ:</span>
              <span className="font-semibold text-stone-900">
                {order.deliveryCharge === 0 ? 'ফ্রি (৳ ০)' : formatPrice(order.deliveryCharge)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-stone-200 text-sm sm:text-base font-bold text-stone-900">
              <span>মোট প্রদেয় টাকা:</span>
              <span className="text-lg sm:text-xl font-black text-emerald-800">
                {formatPrice(order.total)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-lg">
              <span>পেমেন্ট মেথড:</span>
              <span>ক্যাশ অন ডেলিভারি (পণ্য পেয়ে টাকা দিন)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons as requested in prompt */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Continue Shopping */}
        <button
          onClick={() => navigateTo('products')}
          className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
          id="confirm-continue-shopping-btn"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>

        {/* WhatsApp Support */}
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
          id="confirm-whatsapp-btn"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>WhatsApp Support</span>
        </a>

        {/* Track Order */}
        <button
          onClick={() => navigateTo('track')}
          className="w-full py-3.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
          id="confirm-order-details-track-btn"
        >
          <Truck className="w-4 h-4" />
          <span>অর্ডার ডিটেইলস ও ট্র্যাকিং</span>
        </button>
      </div>
    </div>
  );
};
