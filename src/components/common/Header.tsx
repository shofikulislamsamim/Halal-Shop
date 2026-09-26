import React, { useState, useRef, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import {
  ShoppingBag,
  Search,
  Truck,
  MessageCircle,
  X,
  ArrowRight,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { getWhatsAppUrl, getGeneralWhatsAppMessage, matchesQuery, formatPrice } from '../../utils/helpers';

export const Header: React.FC = () => {
  const {
    currentView,
    navigateTo,
    cartCount,
    openCartDrawer,
    settings,
    searchQuery,
    setSearchQuery,
    products,
    categories,
    activeCategories,
    rootCategories,
    getChildCategories,
  } = useShop();

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [isFocused, setIsFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Filter matching suggestions (max 5)
  const searchSuggestions = React.useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    return products
      .filter((p) => p.isActive)
      .filter((p) => {
        const nameBnMatch = matchesQuery(p.nameBn, searchQuery);
        const nameEnMatch = matchesQuery(p.nameEn, searchQuery);
        const cat = categories.find((c) => c.id === p.categoryId);
        const catMatch = cat ? matchesQuery(cat.nameBn, searchQuery) : false;
        return nameBnMatch || nameEnMatch || catMatch;
      })
      .slice(0, 5);
  }, [products, categories, searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsFocused(false);
      navigateTo('products', { query: searchQuery.trim() });
    }
  };

  const whatsAppUrl = getWhatsAppUrl(
    settings.whatsappNumber,
    getGeneralWhatsAppMessage(settings.shopName)
  );

  const now = Date.now();
  const announcementStart = settings.announcementStartAt ? Date.parse(settings.announcementStartAt) : NaN;
  const announcementEnd = settings.announcementEndAt ? Date.parse(settings.announcementEndAt) : NaN;
  const announcementVisible =
    settings.isAnnouncementActive !== false &&
    Boolean(settings.announcementText?.trim()) &&
    (!Number.isFinite(announcementStart) || now >= announcementStart) &&
    (!Number.isFinite(announcementEnd) || now <= announcementEnd);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-stone-200/90 shadow-2xs">
      {/* 1. Top Announcement Bar */}
      {announcementVisible && (
        <div className="bg-emerald-900 text-emerald-100 text-xs py-1.5 px-3 sm:px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a
              href={settings.announcementLink || '#'}
              onClick={(e) => { if (!settings.announcementLink) e.preventDefault(); }}
              className="w-full text-center font-semibold hover:text-amber-200 transition-colors"
            >
              {settings.announcementText}
            </a>
          </div>
        </div>
      )}
      <div className="bg-emerald-900 text-emerald-100 text-xs py-1.5 px-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-50">
              <Truck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>সারাদেশে {settings.cashOnDeliveryEnabled === false ? 'অনলাইন অর্ডার' : 'ক্যাশ অন ডেলিভারি'}</span>
            </span>
            <span className="hidden sm:inline text-emerald-600">|</span>
            <span className="hidden sm:inline text-emerald-200">
              {settings.freeDeliveryThreshold > 0 ? `৳ ${settings.freeDeliveryThreshold} টাকার অর্ডারে ফ্রি ডেলিভারি` : 'ডেলিভারি চার্জ প্রযোজ্য'}
              {settings.businessHours ? ` • ${settings.businessHours}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 transition-colors font-medium text-[11px] sm:text-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">সহায়তা:</span>
              <span>{settings.contactNumber}</span>
            </a>

          </div>
        </div>
      </div>

      {/* 2. Main Header Bar */}
      <div className="max-w-6xl mx-auto px-4 py-2.5 sm:py-3.5">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Logo */}
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2.5 text-left group shrink-0 focus:outline-hidden"
            id="site-logo-btn"
            aria-label={settings.shopName}
          >
            <img
              src={settings.logoUrl || "/Halal-Shop/halal-shop-logo.jpg"}
              alt={settings.shopName}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover bg-stone-50 border border-stone-200 shadow-xs group-hover:shadow-sm transition-shadow"
            />
            <div>
              <span className="text-lg sm:text-2xl font-black tracking-tight text-emerald-950 block leading-tight">
                {settings.shopName}
              </span>
              <span className="text-[10px] sm:text-[11px] text-stone-500 font-medium hidden sm:block">
                {settings.tagline}
              </span>
            </div>
          </button>

          {/* Center Search Bar (Desktop) */}
          <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-lg mx-2 relative">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="পণ্য বা বইয়ের নাম লিখে খুঁজুন (যেমন: মধু, জায়নামাজ, চার্জার)..."
                className="w-full bg-stone-50 text-stone-900 placeholder-stone-400 pl-4 pr-10 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-emerald-700 focus:bg-white text-sm transition-all shadow-2xs"
                id="desktop-search-input"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-9 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-900 transition-colors"
                aria-label="Search"
                id="desktop-search-btn"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Suggestions Dropdown (Desktop) */}
            {isFocused && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-stone-100">
                <div className="px-3 py-1.5 bg-stone-50 text-[11px] font-semibold text-stone-500">
                  পণ্য পরামর্শ (ক্লিক করে সরাসরি দেখুন):
                </div>
                {searchSuggestions.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      setIsFocused(false);
                      navigateTo('product-detail', { productId: prod.id });
                    }}
                    className="p-2.5 px-3.5 hover:bg-emerald-50/70 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.imageUrl}
                        alt={prod.nameBn}
                        className="w-8 h-8 rounded-lg object-contain bg-stone-50 border border-stone-200"
                      />
                      <span className="text-xs font-semibold text-stone-900 line-clamp-1">
                        {prod.nameBn}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 shrink-0 ml-2">
                      {formatPrice(prod.price)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Action Icons: Track, WhatsApp & Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Order Tracking (Desktop) */}
            <button
              onClick={() => navigateTo('track')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                currentView === 'track'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
              id="desktop-track-btn"
            >
              <Truck className="w-4 h-4 text-emerald-700" />
              <span>আমার অর্ডার</span>
            </button>

            {/* Cart Trigger Button */}
            <button
              onClick={openCartDrawer}
              className="relative p-2.5 sm:px-4 sm:py-2.5 rounded-xl flex items-center gap-2 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200/90 font-semibold transition-all shadow-2xs active:scale-[0.98]"
              id="header-cart-btn"
              aria-label="Shopping Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-emerald-800" />
                {cartCount > 0 && (
                  <span className="absolute -top-2.5 -right-2.5 bg-amber-500 text-stone-900 font-extrabold text-[11px] min-w-[19px] h-[19px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-xs sm:text-sm font-bold text-emerald-950">কার্ট</span>
            </button>
          </div>
        </div>

        {/* Mobile Large, Accessible Search Field */}
        <div className="md:hidden mt-2.5 relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="পণ্য বা ক্যাটাগরি খুঁজুন (যেমন: মধু, জায়নামাজ)..."
              className="w-full bg-stone-50 text-stone-900 placeholder-stone-400 pl-9 pr-9 py-2.5 rounded-xl border border-stone-200 focus:outline-hidden focus:border-emerald-700 focus:bg-white text-xs sm:text-sm shadow-2xs"
              id="mobile-search-input"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </form>

          {/* Suggestions Dropdown (Mobile) */}
          {isFocused && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-stone-100">
              {searchSuggestions.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    setIsFocused(false);
                    navigateTo('product-detail', { productId: prod.id });
                  }}
                  className="p-2.5 px-3 hover:bg-emerald-50 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={prod.imageUrl}
                      alt={prod.nameBn}
                      className="w-7 h-7 rounded object-contain bg-stone-50 shrink-0"
                    />
                    <span className="text-xs font-semibold text-stone-800 line-clamp-1">
                      {prod.nameBn}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 shrink-0 ml-2">
                    {formatPrice(prod.price)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Secondary Navigation Bar (Desktop) */}
      <div className="hidden md:block bg-stone-50/90 border-t border-stone-200/70 text-xs font-semibold text-stone-700 relative">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between py-2">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => navigateTo('home')}
              className={`hover:text-emerald-800 transition-colors ${
                currentView === 'home' ? 'text-emerald-800 font-bold border-b-2 border-emerald-800 pb-0.5' : ''
              }`}
            >
              হোম
            </button>
            <button
              onClick={() => navigateTo('products')}
              className={`hover:text-emerald-800 transition-colors ${
                currentView === 'products' ? 'text-emerald-800 font-bold border-b-2 border-emerald-800 pb-0.5' : ''
              }`}
            >
              সকল পণ্য
            </button>

            {/* Hierarchical category links */}
            {(rootCategories.length > 0 ? rootCategories.slice(0, 5) : activeCategories.slice(0, 5)).map((cat) => {
              const children = getChildCategories(cat.id, true);
              const hasChildren = children.length > 0;
              const isOpen = openDropdownId === cat.id;

              return (
                <div
                  key={cat.id}
                  className="relative group py-1"
                  onMouseEnter={() => setOpenDropdownId(cat.id)}
                  onMouseLeave={() => setOpenDropdownId(null)}
                >
                  <button
                    onClick={() => {
                      setOpenDropdownId(null);
                      navigateTo('products', { categorySlug: cat.slug });
                    }}
                    className="hover:text-emerald-800 transition-colors text-stone-700 font-medium inline-flex items-center gap-1"
                  >
                    <span>{cat.nameBn}</span>
                    {hasChildren && (
                      <ChevronDown className="w-3 h-3 text-stone-400 group-hover:text-emerald-700 transition-transform group-hover:rotate-180" />
                    )}
                  </button>

                  {/* Dropdown Menu for Categories with Children */}
                  {hasChildren && isOpen && (
                    <div className="absolute top-full left-0 mt-1 min-w-[240px] bg-white border border-stone-200 rounded-xl shadow-xl z-50 p-2 py-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-2.5 py-1 mb-1 border-b border-stone-100">
                        {cat.nameBn} উপ-বিভাগ
                      </div>
                      <div className="space-y-1">
                        {children.map((child) => {
                          const grandChildren = getChildCategories(child.id, true);
                          return (
                            <div key={child.id} className="group/child">
                              <button
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  navigateTo('products', { categorySlug: child.slug });
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 hover:text-emerald-900 text-stone-700 text-xs font-semibold flex items-center justify-between transition-colors"
                              >
                                <span>{child.nameBn}</span>
                                {grandChildren.length > 0 && (
                                  <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.2 rounded">
                                    {grandChildren.length}
                                  </span>
                                )}
                              </button>
                              {/* If grandchild exists, show concise sub-chips */}
                              {grandChildren.length > 0 && (
                                <div className="pl-4 pr-1 py-1 flex flex-wrap gap-1">
                                  {grandChildren.slice(0, 4).map((gc) => (
                                    <button
                                      key={gc.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDropdownId(null);
                                        navigateTo('products', { categorySlug: gc.slug });
                                      }}
                                      className="text-[11px] text-stone-500 hover:text-emerald-800 hover:bg-stone-100 px-1.5 py-0.5 rounded transition-colors"
                                    >
                                      • {gc.nameBn}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <button
              onClick={() => navigateTo('about')}
              className="hover:text-emerald-800 transition-colors text-stone-600 font-medium"
            >
              আমাদের সম্পর্কে
            </button>
            <button
              onClick={() => navigateTo('contact')}
              className="hover:text-emerald-800 transition-colors text-stone-600 font-medium"
            >
              যোগাযোগ
            </button>
          </div>

          <div className="flex items-center gap-4 text-stone-500 font-normal">
            <span>১০০% ইসলামিক অনুশাসনসম্মত ও হালাল ট্রেডিং</span>
          </div>
        </div>
      </div>
    </header>
  );
};
