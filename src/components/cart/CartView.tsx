import React from 'react';
import { useShop } from '../../context/ShopContext';
import { formatPrice } from '../../utils/helpers';
import {
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Truck,
  ShieldCheck,
} from 'lucide-react';

export const CartView: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    navigateTo,
    settings,
  } = useShop();

  const isEligibleForFreeDelivery = cartSubtotal >= settings.freeDeliveryThreshold;
  const estimatedDelivery = isEligibleForFreeDelivery ? 0 : settings.deliveryChargeDhaka;
  const estimatedTotal = cartSubtotal + estimatedDelivery;
  const remainingForFreeDelivery = Math.max(0, settings.freeDeliveryThreshold - cartSubtotal);

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
          <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-2">
          আপনার শপিং কার্ট খালি!
        </h2>
        <p className="text-stone-500 text-xs sm:text-sm mb-6 max-w-md mx-auto">
          আপনি এখনও কোনো পণ্য কার্টে যোগ করেননি। পছন্দমতো পণ্য নির্বাচন করে অর্ডার করুন।
        </p>
        <button
          onClick={() => navigateTo('products')}
          className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-6 py-3 rounded-xl text-xs sm:text-sm transition-all inline-flex items-center gap-2 shadow-xs"
          id="cart-empty-shop-btn"
        >
          <span>পণ্যসমূহ ব্রাউজ করুন</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateTo('products')}
            className="text-stone-500 hover:text-stone-800 mr-2 p-1"
            title="কেনাকাটায় ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
            শপিং কার্ট ({cart.length} টি পণ্য)
          </h1>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1 font-medium"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>কার্ট খালি করুন</span>
        </button>
      </div>

      {/* Free Delivery Incentive Bar */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 mb-6 flex items-center justify-between text-xs sm:text-sm text-emerald-900">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
          {isEligibleForFreeDelivery ? (
            <span className="font-bold text-emerald-800">
              অভিনন্দন! আপনি পাচ্ছেন <strong>ফ্রি ডেলিভারি!</strong>
            </span>
          ) : (
            <span>
              আর <strong className="text-emerald-800">৳ {remainingForFreeDelivery.toLocaleString('en-IN')}</strong> টাকার পণ্য যোগ করলেই ফ্রি ডেলিভারি!
            </span>
          )}
        </div>
        <span className="text-[11px] text-emerald-700 font-semibold hidden sm:inline">
          (৳ {settings.freeDeliveryThreshold}+ অর্ডারে)
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-2 space-y-3">
          {cart.map((item) => {
            const itemTotal = item.product.price * item.quantity;

            return (
              <div
                key={item.product.id}
                className="bg-white rounded-2xl border border-stone-200/90 p-3.5 sm:p-4 flex gap-3 sm:gap-4 items-center shadow-2xs"
              >
                {/* Thumbnail */}
                <div
                  onClick={() => navigateTo('product-detail', { productId: item.product.id })}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-50 shrink-0 cursor-pointer border border-stone-200 p-1 flex items-center justify-center"
                >
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.nameBn}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3
                    onClick={() => navigateTo('product-detail', { productId: item.product.id })}
                    className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-2 hover:text-emerald-800 cursor-pointer transition-colors"
                  >
                    {item.product.nameBn}
                  </h3>
                  <div className="text-xs text-stone-500 mt-1">
                    প্রতিটির মূল্য: <span className="font-bold text-emerald-900 price-display">{formatPrice(item.product.price)}</span>
                  </div>

                  {/* Quantity and Subtotal Controls */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                    <div className="flex items-center border border-stone-300 rounded-lg bg-stone-50">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-200 rounded-l-lg transition-colors"
                        aria-label="Decrease"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-stone-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-200 rounded-r-lg disabled:opacity-40 transition-colors"
                        aria-label="Increase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm sm:text-base text-emerald-950 price-display">
                        {formatPrice(itemTotal)}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 transition-colors"
                        title="মুছে ফেলুন"
                        aria-label="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="pt-2">
            <button
              onClick={() => navigateTo('products')}
              className="text-xs sm:text-sm font-semibold text-emerald-800 hover:underline inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>কেনাকাটা চালিয়ে যান (Continue Shopping)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-xs sticky top-24">
          <h2 className="text-base font-bold text-stone-900 mb-4 pb-2 border-b border-stone-200">
            অর্ডারের সংক্ষিপ্ত বিবরণ
          </h2>

          <div className="space-y-2.5 text-xs sm:text-sm text-stone-600 mb-4">
            <div className="flex justify-between">
              <span>পণ্যের উপমোট (Subtotal):</span>
              <span className="font-semibold text-stone-800 price-display">{formatPrice(cartSubtotal)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>ডেলিভারি চার্জ:</span>
              <span className="font-semibold">
                {isEligibleForFreeDelivery ? (
                  <span className="text-emerald-700 font-bold">ফ্রি (৳ ০)</span>
                ) : (
                  <span className="text-stone-800 font-semibold">
                    ৳ {settings.deliveryChargeDhaka} - ৳ {settings.deliveryChargeOutsideDhaka}
                  </span>
                )}
              </span>
            </div>

            <div className="text-[11px] text-stone-400">
              * সঠিক ডেলিভারি চার্জ চেকআউটে ঠিকানা অনুযায়ী নির্ধারিত হবে
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline mb-5">
            <span className="font-bold text-stone-900 text-sm sm:text-base">সর্বমোট (আনুমানিক):</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-900 price-display">
              {formatPrice(estimatedTotal)}
            </span>
          </div>

          {/* Checkout CTA Button */}
          <button
            onClick={() => navigateTo('checkout')}
            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3.5 px-4 rounded-xl text-sm sm:text-base flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all"
            id="proceed-checkout-btn"
          >
            <span>চেকআউট করুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Cash on delivery reassurance */}
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-center gap-1.5 text-xs text-stone-500">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>ক্যাশ অন ডেলিভারিতে নিরাপদ কেনাকাটা</span>
          </div>
        </div>
      </div>
    </div>
  );
};
