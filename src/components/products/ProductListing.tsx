import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { ProductCard } from './ProductCard';
import {
  Search,
  ArrowUpDown,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Layers,
  FolderOpen,
} from 'lucide-react';
import { matchesQuery } from '../../utils/helpers';
import { getCategoryPath } from '../../utils/categoryHelpers';

export const ProductListing: React.FC = () => {
  const {
    products,
    categories,
    activeCategories,
    rootCategories,
    getChildCategories,
    getCategoryWithDescendants,
    selectedCategorySlug,
    navigateTo,
  } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'discount'>('default');

  const currentCategory = activeCategories.find((c) => c.slug === selectedCategorySlug);
  const breadcrumbPath = currentCategory ? getCategoryPath(currentCategory.id, categories) : [];
  const parentCategory = currentCategory?.parentId
    ? categories.find((c) => c.id === currentCategory.parentId)
    : null;

  // Immediate child categories for the currently active category (or root categories if viewing all)
  const childCategories = currentCategory
    ? getChildCategories(currentCategory.id, true)
    : [];

  // Filter products
  let filteredProducts = products.filter((p) => p.isActive);

  // Filter by category hierarchically (includes all descendants)
  if (currentCategory) {
    const descendantIds = new Set(getCategoryWithDescendants(currentCategory.id));
    filteredProducts = filteredProducts.filter((p) => {
      const matchPrimary = descendantIds.has(p.categoryId);
      const matchSecondary = p.categoryIds?.some((cid) => descendantIds.has(cid));
      return matchPrimary || matchSecondary;
    });
  }

  // Filter by search query with Bengali normalization
  if (searchQuery.trim()) {
    filteredProducts = filteredProducts.filter((p) => {
      const matchName = matchesQuery(p.nameBn, searchQuery) || (p.nameEn && matchesQuery(p.nameEn, searchQuery));
      const matchDesc = matchesQuery(p.descriptionBn, searchQuery);
      return matchName || matchDesc;
    });
  }

  // Sort
  if (sortBy === 'price_asc') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price_desc') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  } else if (sortBy === 'discount') {
    filteredProducts = [...filteredProducts].sort((a, b) => {
      const discA = a.regularPrice ? a.regularPrice - a.price : 0;
      const discB = b.regularPrice ? b.regularPrice - b.price : 0;
      return discB - discA;
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 pb-24">
      {/* 1. Breadcrumbs Navigation */}
      <nav className="flex items-center flex-wrap gap-1.5 text-xs text-stone-500 mb-4 pb-2 border-b border-stone-100">
        <button
          onClick={() => navigateTo('home')}
          className="hover:text-emerald-800 transition-colors font-medium"
        >
          হোম
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
        <button
          onClick={() => navigateTo('products', { categorySlug: undefined })}
          className={`hover:text-emerald-800 transition-colors font-medium ${
            !currentCategory ? 'text-emerald-800 font-bold' : ''
          }`}
        >
          সকল পণ্য
        </button>

        {breadcrumbPath.map((crumb, index) => {
          const isLast = index === breadcrumbPath.length - 1;
          return (
            <React.Fragment key={crumb.id}>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              {isLast ? (
                <span className="text-emerald-950 font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md">
                  {crumb.nameBn}
                </span>
              ) : (
                <button
                  onClick={() => navigateTo('products', { categorySlug: crumb.slug })}
                  className="hover:text-emerald-800 transition-colors font-medium"
                >
                  {crumb.nameBn}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* 2. Category Header / Back to parent navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            {parentCategory && (
              <button
                onClick={() => navigateTo('products', { categorySlug: parentCategory.slug })}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
                title={`${parentCategory.nameBn}-এ ফিরে যান`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{parentCategory.nameBn}</span>
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 leading-tight">
              {currentCategory ? currentCategory.nameBn : 'সকল পণ্য সম্ভার'}
            </h1>
          </div>

          {currentCategory?.description && (
            <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-2xl">
              {currentCategory.description}
            </p>
          )}

          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            {filteredProducts.length} টি পণ্য পাওয়া গেছে
            {currentCategory && childCategories.length > 0 && (
              <span className="ml-1 text-stone-400">
                (উপ-ক্যাটাগরি সহ)
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="পণ্য খুঁজুন..."
              className="w-full bg-white text-stone-900 text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-800 shadow-2xs"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-stone-700 text-xs focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="default">সাজান: সাধারণ</option>
              <option value="price_asc">দাম: কম থেকে বেশি</option>
              <option value="price_desc">দাম: বেশি থেকে কম</option>
              <option value="discount">সর্বোচ্চ ছাড়</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Folder-style Child Category Navigation (When inside a category with sub-categories) */}
      {childCategories.length > 0 && (
        <div className="mb-6 bg-stone-50/80 rounded-2xl p-3.5 sm:p-4 border border-stone-200/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-emerald-800" />
              <span>উপ-ক্যাটাগরি সমূহ ({childCategories.length})</span>
            </span>
            <span className="text-[11px] text-stone-500">
              নির্দিষ্ট শাখায় যেতে ট্যাপ করুন
            </span>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-2.5">
            {childCategories.map((child) => {
              const childDescendants = new Set(getCategoryWithDescendants(child.id));
              const childProductCount = products.filter(
                (p) =>
                  p.isActive &&
                  (childDescendants.has(p.categoryId) || p.categoryIds?.some((cid) => childDescendants.has(cid)))
              ).length;

              return (
                <button
                  key={child.id}
                  onClick={() => navigateTo('products', { categorySlug: child.slug })}
                  className="bg-white hover:bg-emerald-50/80 hover:border-emerald-600 border border-stone-200/90 rounded-xl px-3 py-2 text-left transition-all duration-200 shadow-2xs group flex items-center gap-2 text-xs font-semibold text-stone-800"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-emerald-800 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>{child.nameBn}</span>
                  <span className="text-[10px] text-stone-400 bg-stone-100 group-hover:bg-emerald-100 group-hover:text-emerald-800 px-1.5 py-0.5 rounded-full font-normal">
                    {childProductCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Top-level categories strip when viewing all products */}
      {!currentCategory && (
        <div className="mb-6 overflow-x-auto pb-2 flex items-center gap-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => navigateTo('products', { categorySlug: undefined })}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap bg-emerald-800 text-white shadow-xs"
          >
            সকল ক্যাটাগরি ({filteredProducts.length})
          </button>

          {(rootCategories.length > 0 ? rootCategories : activeCategories).map((cat) => {
            const descendantIds = new Set(getCategoryWithDescendants(cat.id));
            const catCount = products.filter(
              (p) =>
                p.isActive &&
                (descendantIds.has(p.categoryId) || p.categoryIds?.some((cid) => descendantIds.has(cid)))
            ).length;

            return (
              <button
                key={cat.id}
                onClick={() => navigateTo('products', { categorySlug: cat.slug })}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap bg-white text-stone-700 hover:bg-stone-100 border border-stone-200 transition-all flex items-center gap-1.5"
              >
                <span>{cat.nameBn}</span>
                <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full font-normal">
                  {catCount}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 5. Products Grid: 2-columns on mobile, 3-4 on desktop */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
          {filteredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center my-6">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-stone-900 mb-1">
            কোনো পণ্য পাওয়া যায়নি!
          </h3>
          <p className="text-stone-500 text-xs sm:text-sm mb-4">
            অনুগ্রহ করে অন্য শব্দ দিয়ে খুঁজে দেখুন অথবা সব ক্যাটাগরি ব্রাউজ করুন।
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              navigateTo('products', { categorySlug: undefined });
            }}
            className="bg-emerald-800 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-emerald-900 transition-colors shadow-xs"
          >
            সব পণ্য দেখুন
          </button>
        </div>
      )}
    </div>
  );
};
