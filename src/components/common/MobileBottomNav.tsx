import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import {
  Home,
  LayoutGrid,
  ShoppingBag,
  PackageCheck,
  Menu,
  X,
  Phone,
  MessageCircle,
  Info,
  Truck,
} from 'lucide-react';
import { getWhatsAppUrl, getGeneralWhatsAppMessage } from '../../utils/helpers';

export const MobileBottomNav: React.FC = () => {
  const {
    currentView,
    navigateTo,
    cartCount,
    openCartDrawer,
    settings,
  } = useShop();

  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);

  // Hide on admin view to provide maximum screen estate for management
  if (currentView === 'admin') {
    return null;
  }

  const whatsAppUrl = getWhatsAppUrl(
    settings.whatsappNumber,
    getGeneralWhatsAppMessage(settings.shopName)
  );

  return (
    <>
      {/* Fixed Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-safe transition-transform duration-200"
        aria-label="Mobile Navigation"
        id="mobile-bottom-nav"
      >
        <div className="grid grid-cols-5 h-15 items-center px-1">
          {/* 1. Home */}
          <button
            onClick={() => {
              setMenuDrawerOpen(false);
              navigateTo('home');
            }}
            className={`flex flex-col items-center justify-center py-1 px-1 transition-colors ${
              currentView === 'home'
                ? 'text-emerald-800 font-bold'
                : 'text-stone-500 hover:text-stone-900 font-medium'
            }`}
            id="mobile-nav-home"
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">হোম</span>
          </button>

          {/* 2. Categories */}
          <button
            onClick={() => {
              setMenuDrawerOpen(false);
              navigateTo('products');
            }}
            className={`flex flex-col items-center justify-center py-1 px-1 transition-colors ${
              currentView === 'products'
                ? 'text-emerald-800 font-bold'
                : 'text-stone-500 hover:text-stone-900 font-medium'
            }`}
            id="mobile-nav-categories"
          >
            <LayoutGrid className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">ক্যাটাগরি</span>
          </button>

          {/* 3. Cart with Live Badge */}
          <button
            onClick={() => {
              setMenuDrawerOpen(false);
              openCartDrawer();
            }}
            className={`flex flex-col items-center justify-center py-1 px-1 transition-colors relative ${
              currentView === 'cart'
                ? 'text-emerald-800 font-bold'
                : 'text-stone-600 hover:text-stone-900 font-medium'
            }`}
            id="mobile-nav-cart"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 mb-0.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-amber-500 text-stone-900 font-extrabold text-[10px] min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-2xs">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-tight">কার্ট</span>
          </button>

          {/* 4. Orders / Tracking */}
          <button
            onClick={() => {
              setMenuDrawerOpen(false);
              navigateTo('track');
            }}
            className={`flex flex-col items-center justify-center py-1 px-1 transition-colors ${
              currentView === 'track'
                ? 'text-emerald-800 font-bold'
                : 'text-stone-500 hover:text-stone-900 font-medium'
            }`}
            id="mobile-nav-orders"
          >
            <PackageCheck className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">অর্ডার</span>
          </button>

          {/* 5. Menu / More */}
          <button
            onClick={() => setMenuDrawerOpen(!menuDrawerOpen)}
            className={`flex flex-col items-center justify-center py-1 px-1 transition-colors ${
              menuDrawerOpen
                ? 'text-emerald-800 font-bold'
                : 'text-stone-500 hover:text-stone-900 font-medium'
            }`}
            id="mobile-nav-menu"
          >
            {menuDrawerOpen ? <X className="w-5 h-5 mb-0.5" /> : <Menu className="w-5 h-5 mb-0.5" />}
            <span className="text-[10px] leading-tight">মেনু</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Sheet */}
      {menuDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setMenuDrawerOpen(false)}
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Sheet Drawer */}
          <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl p-5 pb-8 border-t border-stone-200 z-10 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center font-bold">
                  হ
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm leading-tight">
                    {settings.shopName}
                  </h3>
                  <span className="text-[11px] text-stone-500 font-normal">
                    {settings.tagline}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMenuDrawerOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-4 text-xs font-medium">
              <button
                onClick={() => {
                  navigateTo('home');
                  setMenuDrawerOpen(false);
                }}
                className="p-3 rounded-xl bg-stone-50 hover:bg-emerald-50 text-stone-800 text-left flex items-center gap-2 border border-stone-200/70"
              >
                <Home className="w-4 h-4 text-emerald-700" />
                <span>হোম পেজ</span>
              </button>

              <button
                onClick={() => {
                  navigateTo('products');
                  setMenuDrawerOpen(false);
                }}
                className="p-3 rounded-xl bg-stone-50 hover:bg-emerald-50 text-stone-800 text-left flex items-center gap-2 border border-stone-200/70"
              >
                <LayoutGrid className="w-4 h-4 text-emerald-700" />
                <span>সকল পণ্য</span>
              </button>

              <button
                onClick={() => {
                  navigateTo('track');
                  setMenuDrawerOpen(false);
                }}
                className="p-3 rounded-xl bg-stone-50 hover:bg-emerald-50 text-stone-800 text-left flex items-center gap-2 border border-stone-200/70"
              >
                <Truck className="w-4 h-4 text-emerald-700" />
                <span>অর্ডার ট্র্যাকিং</span>
              </button>

              <button
                onClick={() => {
                  navigateTo('contact');
                  setMenuDrawerOpen(false);
                }}
                className="p-3 rounded-xl bg-stone-50 hover:bg-emerald-50 text-stone-800 text-left flex items-center gap-2 border border-stone-200/70"
              >
                <Phone className="w-4 h-4 text-emerald-700" />
                <span>যোগাযোগ ও সহায়তা</span>
              </button>

              <button
                onClick={() => {
                  navigateTo('about');
                  setMenuDrawerOpen(false);
                }}
                className="p-3 rounded-xl bg-stone-50 hover:bg-emerald-50 text-stone-800 text-left flex items-center gap-2 border border-stone-200/70"
              >
                <Info className="w-4 h-4 text-emerald-700" />
                <span>আমাদের সম্পর্কে</span>
              </button>

            </div>

            {/* Direct WhatsApp Callout */}
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <MessageCircle className="w-4 h-4 text-amber-300" />
              <span>হোয়াটসঅ্যাপে সরাসরি কথা বলুন ({settings.contactNumber})</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
};
