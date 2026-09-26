import React from 'react';
import { Product } from '../../types';
import { useShop } from '../../context/ShopContext';
import { formatPrice, getWhatsAppUrl, getProductWhatsAppMessage } from '../../utils/helpers';
import { ShoppingCart, MessageCircle, ArrowRight, Zap, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, buyNow, navigateTo, settings, categories } = useShop();

  const isOutOfStock = product.stock <= 0;
  const stockThreshold = Math.max(1, product.lowStockThreshold ?? 3);
  const isLowStock = product.stock > 0 && product.stock <= stockThreshold;
  const discountPercent = product.regularPrice
    ? Math.round(((product.regularPrice - product.price) / product.regularPrice) * 100)
    : 0;

  const category = categories.find((c) => c.id === product.categoryId);

  const whatsAppMsg = getProductWhatsAppMessage(
    settings.shopName,
    product.nameBn,
    product.price
  );
  const whatsAppUrl = getWhatsAppUrl(settings.whatsappNumber, whatsAppMsg);

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group h-full">
      {/* 1. Product Image Area (Consistent 1:1 Aspect Ratio) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigateTo('product-detail', { productId: product.id })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigateTo('product-detail', { productId: product.id });
          }
        }}
        className="relative aspect-square w-full bg-stone-50/80 p-2.5 sm:p-3.5 flex items-center justify-center overflow-hidden cursor-pointer select-none"
      >
        <img
          src={product.imageUrl}
          alt={product.nameBn}
          loading="lazy"
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
        />

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-2 left-2 bg-rose-600 text-white font-bold text-[10px] sm:text-xs px-2 py-0.5 rounded-md shadow-xs">
            -{discountPercent}% ছাড়
          </span>
        )}

        {/* Stock Status Badge */}
        {settings.outOfStockVisible !== false || settings.lowStockWarningVisible !== false ? (
          <div className="absolute top-2 right-2">
          {isOutOfStock && settings.outOfStockVisible !== false ? (
            <span className="bg-stone-800 text-white font-semibold text-[10px] px-2 py-0.5 rounded-md">
              স্টক শেষ
            </span>
          ) : isLowStock && settings.lowStockWarningVisible !== false ? (
            <span className="bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[10px] px-1.5 py-0.5 rounded-md">
              মাত্র {product.stock} টি
            </span>
          ) : null}
          </div>
        ) : null}
      </div>

      {/* 2. Product Meta & Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Pill / Tag */}
          {category && (
            <span className="text-[11px] font-semibold text-emerald-800 tracking-wide block mb-1">
              {category.nameBn}
            </span>
          )}

          {/* Product Name */}
          <h3
            onClick={() => navigateTo('product-detail', { productId: product.id })}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigateTo('product-detail', { productId: product.id });
              }
            }}
            className="font-semibold text-stone-900 text-xs sm:text-sm leading-snug line-clamp-2 hover:text-emerald-800 cursor-pointer transition-colors min-h-[34px] sm:min-h-[38px]"
            title={product.nameBn}
          >
            {product.nameBn}
          </h3>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1.5 mb-3">
            <span className="text-base sm:text-lg font-bold text-emerald-900 price-display">
              {formatPrice(product.price)}
            </span>
            {settings.skuVisible && product.sku && (
              <span className="text-[10px] text-stone-400 block mb-1">SKU: {product.sku}</span>
            )}
            {product.regularPrice && product.regularPrice > product.price && (
              <span className="text-xs text-stone-400 line-through price-display">
                {formatPrice(product.regularPrice)}
              </span>
            )}
          </div>
        </div>

        {/* 3. Action Buttons Row (The main CTA visually dominates) */}
        <div className="pt-2 border-t border-stone-100 flex items-center gap-1.5 sm:gap-2">
          {/* Main Dominant CTA: [কার্টে নিন] */}
          <button
            onClick={() => addToCart(product)}
            disabled={isOutOfStock}
            className={`flex-1 min-h-[40px] sm:min-h-[42px] px-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs ${
              isOutOfStock
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-emerald-800 hover:bg-emerald-900 text-white active:scale-[0.98]'
            }`}
            id={`add-cart-btn-${product.id}`}
            title="কার্টে যোগ করুন"
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span>কার্টে নিন</span>
          </button>

          {/* Secondary Action: Compact WhatsApp Inquiry */}
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[40px] min-w-[40px] sm:min-h-[42px] sm:min-w-[42px] rounded-xl border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50 text-stone-600 hover:text-emerald-800 flex items-center justify-center transition-colors shadow-2xs"
            title="হোয়াটসঅ্যাপে সরাসরি প্রশ্ন করুন"
            id={`whatsapp-btn-${product.id}`}
            aria-label="Ask on WhatsApp"
          >
            <MessageCircle className="w-4 h-4 text-emerald-700" />
          </a>

          {/* Quick Buy Icon/Action */}
          <button
            onClick={() => buyNow(product)}
            disabled={isOutOfStock}
            className="hidden xs:flex min-h-[40px] min-w-[40px] sm:min-h-[42px] sm:min-w-[42px] rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 items-center justify-center transition-colors shadow-2xs disabled:opacity-40"
            title="এখনই অর্ডার করুন"
            id={`quick-buy-btn-${product.id}`}
            aria-label="Buy Now"
          >
            <Zap className="w-4 h-4 fill-current text-amber-700" />
          </button>
        </div>
      </div>
    </div>
  );
};
