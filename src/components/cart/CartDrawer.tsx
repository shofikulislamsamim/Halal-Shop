import React, { useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { formatPrice } from '../../utils/helpers';
import {
  X,
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  Truck,
  ShieldCheck,
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    isCartDrawerOpen,
    closeCartDrawer,
    cart,
    cartCount,
    cartSubtotal,
    updateCartQuantity,
    removeFromCart,
    navigateTo,
    settings,
  } = useShop();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCartDrawer();
    };
    if (isCartDrawerOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Lock body scroll while drawer is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isCartDrawerOpen, closeCartDrawer]);

  if (!isCartDrawerOpen) return null;

  const isEligibleForFreeDelivery = cartSubtotal >= settings.freeDeliveryThreshold;
  const estimatedDelivery = isEligibleForFreeDelivery ? 0 : settings.deliveryChargeDhaka;
  const estimatedTotal = cartSubtotal + estimatedDelivery;
  const remainingForFree = Math.max(0, settings.freeDeliveryThreshold - cartSubtotal);

  const handleGoToCart = () => {
    closeCartDrawer();
    navigateTo('cart');
  };

  const handleGoToCheckout = () => {
    closeCartDrawer();
    navigateTo('checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCartDrawer}
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out"
        aria-hidden="true"
      />

      {/* Drawer Panel: Slide in from right (or full-screen on small mobile) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
                  শপিং কার্ট
                </h2>
                <p className="text-xs text-stone-500 font-medium">
                  {cartCount > 0 ? `${cartCount} টি পণ্য নির্বাচিত` : 'কার্ট খালি'}
                </p>
              </div>
            </div>

            <button
              onClick={closeCartDrawer}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors focus:outline-hidden"
              aria-label="Close cart"
              id="close-cart-drawer-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Incentive Banner */}
          {cart.length > 0 && (
            <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-100/80 flex items-center gap-2 text-xs text-emerald-900">
              <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
              {isEligibleForFreeDelivery ? (
                <span className="font-semibold text-emerald-800">
                  অভিনন্দন! আপনি পাচ্ছেন <strong>ফ্রি ডেলিভারি</strong>
                </span>
              ) : (
                <span>
                  আর <strong>৳ {remainingForFree.toLocaleString('en-IN')}</strong> টাকার পণ্য যোগ করলেই <strong>ফ্রি ডেলিভারি!</strong>
                </span>
              )}
            </div>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-stone-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500">
                <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-stone-800 mb-1">
                  আপনার কার্ট বর্তমানে খালি
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mb-5">
                  পছন্দের পণ্য কার্টে যোগ করে সহজেই অর্ডার সম্পন্ন করুন।
                </p>
                <button
                  onClick={() => {
                    closeCartDrawer();
                    navigateTo('products');
                  }}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-xs"
                >
                  পণ্য ব্রাউজ করুন
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="pt-3 first:pt-0 flex gap-3 sm:gap-4 items-center">
                    {/* Thumbnail */}
                    <div
                      onClick={() => {
                        closeCartDrawer();
                        navigateTo('product-detail', { productId: item.product.id });
                      }}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-stone-50 border border-stone-200 overflow-hidden shrink-0 cursor-pointer p-1"
                    >
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.nameBn}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4
                        onClick={() => {
                          closeCartDrawer();
                          navigateTo('product-detail', { productId: item.product.id });
                        }}
                        className="text-xs sm:text-sm font-semibold text-stone-900 leading-snug line-clamp-1 cursor-pointer hover:text-emerald-800 transition-colors"
                      >
                        {item.product.nameBn}
                      </h4>
                      <div className="text-xs font-bold text-emerald-900 mt-1">
                        {formatPrice(item.variantPrice ?? item.product.price)}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="inline-flex items-center border border-stone-200 rounded-lg bg-white shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, item.variantId)}
                            className="p-1 sm:p-1.5 text-stone-600 hover:bg-stone-100 rounded-l-lg"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-stone-900 min-w-[24px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.variantId)}
                            disabled={item.quantity >= (item.variantId ? (item.product.variants?.find((v) => v.id === item.variantId)?.stock ?? 0) : item.product.stock)}
                            className="p-1 sm:p-1.5 text-stone-600 hover:bg-stone-100 rounded-r-lg disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id, item.variantId)}
                          className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors ml-auto"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Summary & Action Buttons */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-stone-200/90 bg-stone-50/70 space-y-3">
              {/* Pricing breakdown */}
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>সাবটোটাল:</span>
                  <span className="font-semibold text-stone-900">{formatPrice(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>আনুমানিক ডেলিভারি:</span>
                  <span className="font-semibold text-stone-900">
                    {isEligibleForFreeDelivery ? (
                      <span className="text-emerald-700 font-bold">ফ্রি (৳ ০)</span>
                    ) : (
                      <span>৳ {settings.deliveryChargeDhaka} - ৳ {settings.deliveryChargeOutsideDhaka}</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-200 text-sm sm:text-base font-bold text-stone-900">
                  <span>সর্বমোট প্রদেয়:</span>
                  <span className="text-emerald-900">{formatPrice(estimatedTotal)}</span>
                </div>
              </div>

              {/* Action Buttons: [কার্ট দেখুন] & [চেকআউট করুন] */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleGoToCart}
                  className="w-full py-3 px-3 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-800 font-semibold text-xs sm:text-sm text-center transition-colors shadow-2xs"
                  id="drawer-view-cart-btn"
                >
                  কার্ট দেখুন
                </button>

                <button
                  type="button"
                  onClick={handleGoToCheckout}
                  className="w-full py-3 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.99]"
                  id="drawer-checkout-btn"
                >
                  <span>চেকআউট করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* COD Micro-trust */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে টাকা পরিশোধ</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
