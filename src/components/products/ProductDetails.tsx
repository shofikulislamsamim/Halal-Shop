import React, { useEffect, useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { formatPrice, getWhatsAppUrl, getProductWhatsAppMessage } from '../../utils/helpers';
import { getCategoryPath } from '../../utils/categoryHelpers';
import {
  ShoppingCart,
  Zap,
  MessageCircle,
  ArrowLeft,
  CheckCircle,
  Truck,
  ShieldCheck,
  RotateCcw,
  Minus,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { ProductCard } from './ProductCard';

export const ProductDetails: React.FC = () => {
  const {
    selectedProductId,
    products,
    categories,
    addToCart,
    buyNow,
    navigateTo,
    settings,
  } = useShop();

  const [quantity, setQuantity] = useState(1);

  const product = products.find((p) => p.id === selectedProductId);

  useEffect(() => {
    setQuantity(1);
  }, [selectedProductId]);

  const category = categories.find((c) => c.id === product?.categoryId);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-stone-600 mb-4">পণ্যটি খুঁজে পাওয়া যায়নি।</p>
        <button
          onClick={() => navigateTo('products')}
          className="bg-emerald-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
        >
          সকল পণ্য দেখুন
        </button>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const discountAmount = product.regularPrice ? product.regularPrice - product.price : 0;
  const discountPercent = product.regularPrice
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : 0;

  const whatsAppUrl = getWhatsAppUrl(
    settings.whatsappNumber,
    getProductWhatsAppMessage(settings.shopName, product.nameBn, product.price)
  );

  const relatedProducts = products
    .filter((p) => {
      if (!p.isActive || p.id === product.id) return false;
      return p.categoryId === product.categoryId || p.categoryIds?.includes(product.categoryId);
    })
    .slice(0, 4);

  const handleQtyDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleQtyIncrease = () => {
    if (quantity < product.stock) setQuantity(quantity + 1);
  };

  const breadcrumbs = category ? getCategoryPath(category.id, categories) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 pb-32 md:pb-16">
      {/* Breadcrumb Navigation */}
      <nav className="mb-4 flex items-center flex-wrap gap-1.5 text-xs text-stone-500 pb-2 border-b border-stone-100">
        <button
          onClick={() => navigateTo('home')}
          className="hover:text-emerald-800 transition-colors font-medium"
        >
          হোম
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <button
          onClick={() => navigateTo('products')}
          className="hover:text-emerald-800 transition-colors font-medium"
        >
          সকল পণ্য
        </button>

        {breadcrumbs.map((crumb) => (
          <React.Fragment key={crumb.id}>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <button
              onClick={() => navigateTo('products', { categorySlug: crumb.slug })}
              className="hover:text-emerald-800 transition-colors font-medium"
            >
              {crumb.nameBn}
            </button>
          </React.Fragment>
        ))}

        <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <span className="text-stone-800 font-semibold truncate max-w-[180px] sm:max-w-xs">
          {product.nameBn}
        </span>
      </nav>

      {/* Main Details Grid: Desktop Left Image, Right Info | Mobile Image First */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden p-4 sm:p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start">
          {/* Left Column: Image (Square aspect ratio, object-contain to prevent clipping) */}
          <div className="relative rounded-2xl overflow-hidden bg-stone-50/80 aspect-square border border-stone-200/80 p-4 sm:p-8 flex items-center justify-center">
            <img
              src={product.imageUrl}
              alt={product.nameBn}
              className="w-full h-full object-contain mix-blend-multiply"
            />
            {discountPercent > 0 && (
              <span className="absolute top-3 left-3 bg-rose-600 text-white font-bold text-xs px-2.5 py-1 rounded-md shadow-xs">
                -{discountPercent}% ছাড়
              </span>
            )}
          </div>

          {/* Right Column: Information & Actions */}
          <div className="flex flex-col justify-between h-full">
            <div>
              {/* Category tag */}
              {category && (
                <span className="text-xs font-semibold text-emerald-800 tracking-wider uppercase mb-1 block">
                  {category.nameBn}
                </span>
              )}

              {/* Title */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-stone-900 leading-snug mb-3">
                {product.nameBn}
              </h1>

              {/* Price & Savings */}
              <div className="flex flex-wrap items-baseline gap-2.5 sm:gap-3 mb-4 p-3.5 bg-[#F7F6F0] rounded-2xl border border-stone-200/80">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-900 price-display">
                  {formatPrice(product.price)}
                </span>
                {product.regularPrice && product.regularPrice > product.price && (
                  <>
                    <span className="text-sm sm:text-base text-stone-400 line-through font-medium price-display">
                      {formatPrice(product.regularPrice)}
                    </span>
                    <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      সাশ্রয় ৳ {discountAmount.toLocaleString('en-IN')}
                    </span>
                  </>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-5 flex items-center gap-2">
                <span className="text-xs font-medium text-stone-500">স্টক অবস্থা:</span>
                {isOutOfStock ? (
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                    স্টক শেষ
                  </span>
                ) : isLowStock ? (
                  <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                    সীমিত স্টক (মাত্র {product.stock} টি অবশিষ্ট)
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    স্টকে আছে (রেডি টু ডেলিভারি)
                  </span>
                )}
              </div>

              {/* Quantity Selector */}
              {!isOutOfStock && (
                <div className="mb-6 flex items-center gap-4">
                  <span className="text-xs sm:text-sm font-semibold text-stone-700">পরিমাণ:</span>
                  <div className="flex items-center border border-stone-300 rounded-xl bg-stone-50 p-1">
                    <button
                      onClick={handleQtyDecrease}
                      disabled={quantity <= 1}
                      className="w-8 h-8 rounded-lg bg-white text-stone-700 flex items-center justify-center shadow-xs hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Decrease Quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-bold text-stone-900 text-sm">
                      {quantity}
                    </span>
                    <button
                      onClick={handleQtyIncrease}
                      disabled={quantity >= product.stock}
                      className="w-8 h-8 rounded-lg bg-white text-stone-700 flex items-center justify-center shadow-xs hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Increase Quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-stone-400">
                    (স্টক: {product.stock} টি)
                  </span>
                </div>
              )}

              {/* Action Buttons (Desktop / Inline) */}
              <div className="space-y-2.5 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Buy Now (Primary direct checkout) */}
                  <button
                    onClick={() => buyNow(product, quantity)}
                    disabled={isOutOfStock}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
                      isOutOfStock
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                    }`}
                    id="detail-buy-now-btn"
                  >
                    <Zap className="w-4 h-4 fill-current text-amber-300" />
                    <span>এখনই অর্ডার করুন</span>
                  </button>

                  {/* Add to Cart */}
                  <button
                    onClick={() => addToCart(product, quantity)}
                    disabled={isOutOfStock}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 border-2 transition-all active:scale-[0.98] ${
                      isOutOfStock
                        ? 'border-stone-200 text-stone-400 cursor-not-allowed'
                        : 'border-emerald-800 text-emerald-900 bg-emerald-50/70 hover:bg-emerald-100'
                    }`}
                    id="detail-add-cart-btn"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>কার্টে নিন</span>
                  </button>
                </div>

                {/* Secondary: WhatsApp contact */}
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-50 hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-stone-200/90 transition-colors"
                  id="detail-whatsapp-btn"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-700" />
                  <span>হোয়াটসঅ্যাপে অর্ডার বা তথ্য জানুন</span>
                </a>
              </div>

              {/* Fast Delivery & Trust Highlights */}
              <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-stone-200 text-center">
                <div className="p-1 sm:p-2">
                  <Truck className="w-4 h-4 text-emerald-800 mx-auto mb-1" />
                  <span className="text-[11px] font-semibold text-stone-800 block">ক্যাশ অন ডেলিভারি</span>
                  <span className="text-[10px] text-stone-400">হাতে পেয়ে পেমেন্ট</span>
                </div>
                <div className="p-1 sm:p-2 border-l border-r border-stone-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-800 mx-auto mb-1" />
                  <span className="text-[11px] font-semibold text-stone-800 block">১০০% আসল পণ্য</span>
                  <span className="text-[10px] text-stone-400">শরীয়াহসম্মত ট্রেডিং</span>
                </div>
                <div className="p-1 sm:p-2">
                  <RotateCcw className="w-4 h-4 text-emerald-800 mx-auto mb-1" />
                  <span className="text-[11px] font-semibold text-stone-800 block">চেক করে নিন</span>
                  <span className="text-[10px] text-stone-400">ডেলিভারির সময়</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details & Description Section */}
        <div className="mt-8 pt-6 border-t border-stone-200">
          <h2 className="text-lg font-bold text-stone-900 mb-3">
            পণ্যের বিবরণ ও বৈশিষ্ট্য
          </h2>
          <div className="prose prose-stone max-w-none text-xs sm:text-sm text-stone-700 leading-relaxed space-y-3">
            <p>{product.descriptionBn}</p>
          </div>

          {/* Specifications list if available */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {product.specifications.map((spec, idx) => (
                <div key={idx} className="flex justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                  <span className="font-semibold text-stone-600">{spec.label}:</span>
                  <span className="text-stone-900 font-medium">{spec.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 mb-4">
            সম্পর্কিত পণ্যসমূহ
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Sticky Bottom Bar on Mobile: [কার্টে নিন] [এখনই কিনুন] */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 p-2.5 px-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] pb-safe flex items-center justify-between gap-2.5">
        <div className="shrink-0 min-w-[90px]">
          <span className="text-[10px] text-stone-500 block">মোট মূল্য:</span>
          <span className="text-base font-bold text-emerald-900 price-display">
            {formatPrice(product.price * quantity)}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-[270px]">
          <button
            onClick={() => addToCart(product, quantity)}
            disabled={isOutOfStock}
            className="flex-1 py-2.5 rounded-xl border border-emerald-800 bg-emerald-50 text-emerald-900 font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-40"
            id="mobile-sticky-cart-btn"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>কার্টে নিন</span>
          </button>

          <button
            onClick={() => buyNow(product, quantity)}
            disabled={isOutOfStock}
            className="flex-1 py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs active:scale-[0.98] disabled:opacity-40"
            id="mobile-sticky-buy-btn"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            <span>এখনই কিনুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
