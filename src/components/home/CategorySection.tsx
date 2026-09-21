import React from 'react';
import { useShop } from '../../context/ShopContext';
import { ArrowRight, BookOpen, Moon, Apple, Zap, Home, Sparkles } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-5 h-5 text-emerald-800" />,
  Moon: <Moon className="w-5 h-5 text-emerald-800" />,
  Apple: <Apple className="w-5 h-5 text-emerald-800" />,
  Zap: <Zap className="w-5 h-5 text-emerald-800" />,
  Home: <Home className="w-5 h-5 text-emerald-800" />,
};

export const CategorySection: React.FC = () => {
  const { rootCategories, activeCategories, products, navigateTo, getCategoryWithDescendants } = useShop();

  const displayCategories = rootCategories.length > 0 ? rootCategories : activeCategories.slice(0, 6);

  return (
    <section className="py-6 sm:py-8 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 leading-snug">
            জনপ্রিয় ক্যাটাগরি
          </h2>
          <p className="text-stone-500 text-xs mt-0.5">
            প্রয়োজনীয় হালাল পণ্যের সমাহার
          </p>
        </div>

        <button
          onClick={() => navigateTo('products')}
          className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 group py-1"
          id="view-all-categories-btn"
        >
          <span>সব দেখুন</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Mobile: Horizontally Scrollable Chips/Cards | Desktop: Clean Responsive Grid */}
      <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
        {displayCategories.map((category) => {
          const descendantIds = new Set(getCategoryWithDescendants(category.id));
          const count = products.filter(
            (p) =>
              p.isActive &&
              (descendantIds.has(p.categoryId) || p.categoryIds?.some((cid) => descendantIds.has(cid)))
          ).length;

          return (
            <div
              key={category.id}
              onClick={() => navigateTo('products', { categorySlug: category.slug })}
              className="bg-white rounded-xl border border-stone-200/90 p-2.5 sm:p-3 text-center cursor-pointer hover:border-emerald-500 hover:shadow-xs transition-all duration-200 group flex sm:flex-col items-center sm:justify-center gap-2.5 sm:gap-2 shrink-0 min-w-[130px] sm:min-w-0 snap-start"
              id={`category-card-${category.slug}`}
            >
              {category.imageUrl ? (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-stone-50 shrink-0 border border-stone-100 group-hover:scale-105 transition-transform">
                  <img
                    src={category.imageUrl}
                    alt={category.nameBn}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-emerald-50 border border-emerald-100/80 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                  {(category.icon && ICON_MAP[category.icon]) || <Sparkles className="w-5 h-5 text-emerald-800" />}
                </div>
              )}

              <div className="text-left sm:text-center min-w-0">
                <h3 className="font-semibold text-stone-900 text-xs sm:text-sm group-hover:text-emerald-800 transition-colors truncate">
                  {category.nameBn}
                </h3>
                <span className="text-[10px] sm:text-[11px] text-stone-400 block mt-0.5">
                  {count} টি পণ্য
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
