import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { Product, Category, Order, OrderStatus, ShopSettings } from '../../types';
import { formatPrice } from '../../utils/helpers';
import {
  Package,
  ShoppingBag,
  Layers,
  Settings,
  Plus,
  Edit2,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Key,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Lock,
  LogOut,
  MapPin,
  Phone,
  Calendar,
  AlertTriangle,
  FileText,
  DollarSign,
  Truck,
  RotateCcw,
  HelpCircle,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    categories,
    orders,
    settings,
    isAdminLoggedIn,
    adminLogin,
    adminLogout,
    verifyAdminLogin,
    resetAdminPinToDefault,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    updateOrderStatus,
    updateSettings,
    showToast,
  } = useShop();

  // Admin tabs: 'orders' | 'products' | 'categories' | 'settings'
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'categories' | 'settings'>('orders');

  // Login form state
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [showForgotHelp, setShowForgotHelp] = useState(false);

  // Lockout Countdown Timer Effect
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if temporarily locked out
    if (lockoutSeconds > 0) {
      setLoginError(`নিরাপত্তার স্বার্থে অ্যাকাউন্ট সাময়িক লক রয়েছে। অনুগ্রহ করে ${lockoutSeconds} সেকেন্ড অপেক্ষা করুন।`);
      return;
    }

    const trimmed = pinInput.trim();
    if (!trimmed) {
      setLoginError('অনুগ্রহ করে অ্যাডমিন পিন বা পাসকোড দিন।');
      return;
    }

    // Verify credentials with context helper
    const check = verifyAdminLogin(trimmed);
    if (check.success) {
      adminLogin(trimmed);
      setLoginError('');
      setPinInput('');
      setFailedAttempts(0);
      setLockoutSeconds(0);
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);

      if (nextAttempts >= 5) {
        setLockoutSeconds(30);
        setLoginError('একটানা ৫ বার ভুল পাসকোড দেওয়া হয়েছে! নিরাপত্তার স্বার্থে ৩০ সেকেন্ডের জন্য চেষ্টা স্থগিত রাখা হলো।');
      } else {
        const remaining = 5 - nextAttempts;
        setLoginError(`${check.message || 'ভুল পাসকোড!'} (ভুল চেষ্টা: ${nextAttempts}/৫, আর ${remaining} বার সুযোগ আছে)`);
      }
    }
  };

  // Handle Emergency Reset to Default PIN
  const handleResetPin = () => {
    resetAdminPinToDefault();
    setPinInput('1234');
    setLoginError('');
    setFailedAttempts(0);
    setLockoutSeconds(0);
    setShowForgotHelp(false);
  };
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Product modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Category modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<ShopSettings>(settings);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  // Filtered Orders
  const filteredOrders = orders.filter((order) => {
    if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) {
      return false;
    }
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase();
      const matchId = order.id.toLowerCase().includes(q);
      const matchName = order.customerName.toLowerCase().includes(q);
      const matchPhone = order.mobile.includes(q);
      return matchId || matchName || matchPhone;
    }
    return true;
  });

  // Calculate order stats
  const totalRevenue = orders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + o.total : sum), 0);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  if (!isAdminLoggedIn) {
    const isLockedOut = lockoutSeconds > 0;

    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 mb-1">
            অ্যাডমিন প্যানেল লগইন
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mb-6">
            দোকানের অর্ডার ও পণ্য পরিচালনা করতে অ্যাডমিন পাসকোড দিন
          </p>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700">
                  অ্যাডমিন পাসকোড / পিন (PIN)
                </label>
                {failedAttempts > 0 && !isLockedOut && (
                  <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    চেষ্টা বাকি: {5 - failedAttempts}/৫
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pinInput}
                  disabled={isLockedOut}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.getModifierState) {
                      setIsCapsLockOn(e.getModifierState('CapsLock'));
                    }
                  }}
                  onKeyUp={(e) => {
                    if (e.getModifierState) {
                      setIsCapsLockOn(e.getModifierState('CapsLock'));
                    }
                  }}
                  placeholder={isLockedOut ? `লক করা আছে (${lockoutSeconds}s)` : 'যেমন: 1234'}
                  className={`w-full bg-white text-stone-900 text-center text-lg font-mono tracking-widest px-10 py-3 rounded-xl border ${
                    loginError ? 'border-rose-300 focus:border-rose-500' : 'border-stone-300 focus:border-emerald-600'
                  } ${
                    isLockedOut ? 'bg-stone-100 cursor-not-allowed opacity-60' : ''
                  } focus:outline-hidden focus:ring-2 focus:ring-emerald-100 transition-all`}
                  id="admin-pin-input"
                  autoFocus={!isLockedOut}
                />
                <button
                  type="button"
                  disabled={isLockedOut}
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 disabled:opacity-50"
                  aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Caps Lock Alert */}
              {isCapsLockOn && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>কীবোর্ডের Caps Lock চালু আছে।</span>
                </div>
              )}

              {/* Lockout Notice */}
              {isLockedOut && (
                <div className="mt-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-700 mb-1">
                    <ShieldAlert className="w-4 h-4" />
                    <span>অ্যাকাউন্ট সাময়িক লক হয়েছে</span>
                  </div>
                  <p className="text-[11px] text-rose-600">
                    নিরাপত্তার স্বার্থে <strong className="font-mono">{lockoutSeconds}</strong> সেকেন্ড পর আবার চেষ্টা করতে পারবেন।
                  </p>
                </div>
              )}

              {/* Error Message */}
              {loginError && !isLockedOut && (
                <div className="flex items-start gap-1.5 text-xs text-rose-600 mt-2 font-medium bg-rose-50 py-2 px-3 rounded-lg border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{loginError}</span>
                </div>
              )}

              {!loginError && !isLockedOut && (
                <p className="text-[11px] text-stone-400 mt-2 text-center">
                  ডিফল্ট পাসকোড: <span className="font-mono font-bold text-stone-700">1234</span> অথবা <span className="font-mono font-bold text-stone-700">admin123</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLockedOut}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              id="admin-login-btn"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isLockedOut ? `লক রয়েছে (${lockoutSeconds}s)` : 'প্রবেশ করুন (Login)'}</span>
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-5 pt-4 border-t border-stone-100">
            <button
              type="button"
              disabled={isLockedOut}
              onClick={() => {
                setPinInput('1234');
                adminLogin('1234');
              }}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-stone-50 hover:bg-emerald-50 disabled:opacity-50 text-stone-700 hover:text-emerald-800 text-xs font-semibold rounded-xl border border-stone-200 hover:border-emerald-300 transition-all cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-emerald-600" />
              <span>এক ক্লিকে ডেমো লগইন (পিন: 1234)</span>
            </button>
          </div>

          {/* Forgot PIN / Emergency Reset Section */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowForgotHelp(!showForgotHelp)}
              className="text-[11px] text-stone-500 hover:text-emerald-700 inline-flex items-center gap-1 font-medium transition-colors"
            >
              <HelpCircle className="w-3 h-3" />
              <span>পাসকোড ভুলে গেছেন বা সমস্যা হচ্ছে?</span>
            </button>

            {showForgotHelp && (
              <div className="mt-2.5 p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-left text-xs space-y-2">
                <p className="text-stone-700 leading-relaxed">
                  যদি আপনি পূর্বে পাসকোড পরিবর্তন করে থাকেন এবং ভুলে গিয়ে থাকেন, নিচের বাটনে ক্লিক করে সাথে সাথে ডিফল্ট পিন <strong>1234</strong>-এ রিসেট করতে পারেন:
                </p>
                <button
                  type="button"
                  onClick={handleResetPin}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-stone-100 text-stone-800 font-bold rounded-lg border border-stone-300 shadow-2xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                  <span>পিন রিসেট করে 1234 করুন</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- SAVE PRODUCT HANDLER ---
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.nameBn || !editingProduct?.price) {
      showToast('পণ্যের নাম ও মূল্য পূরণ করুন');
      return;
    }

    if (editingProduct.id) {
      updateProduct(editingProduct.id, editingProduct);
      showToast('পণ্য সফলভাবে আপডেট করা হয়েছে');
    } else {
      addProduct(editingProduct as any);
      showToast('নতুন পণ্য যোগ করা হয়েছে');
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  // --- SAVE CATEGORY HANDLER ---
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.nameBn || !editingCategory?.slug) {
      showToast('ক্যাটাগরির নাম ও স্ল্যাগ দিন');
      return;
    }

    if (editingCategory.id) {
      updateCategory(editingCategory.id, editingCategory);
      showToast('ক্যাটাগরি আপডেট করা হয়েছে');
    } else {
      addCategory(editingCategory as any);
      showToast('নতুন ক্যাটাগরি তৈরি হয়েছে');
    }
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  // --- SAVE SETTINGS HANDLER ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settingsForm);
    showToast('দোকানের সেটিংস সফলভাবে সংরক্ষিত হয়েছে');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 mb-6 gap-3">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-1">
            <span>অ্যাডমিন ম্যানেজমেন্ট ড্যাশবোর্ড</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900">
            {settings.shopName} - কন্ট্রোল প্যানেল
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={adminLogout}
            className="px-3.5 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লগআউট</span>
          </button>
        </div>
      </div>

      {/* Admin Stats Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] text-stone-500 font-semibold block">মোট অর্ডার</span>
          <span className="text-xl sm:text-2xl font-black text-stone-900">{orders.length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] text-stone-500 font-semibold block">পেন্ডিং অর্ডার</span>
          <span className="text-xl sm:text-2xl font-black text-amber-700">{pendingCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] text-stone-500 font-semibold block">সক্রিয় পণ্য</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-800">
            {products.filter((p) => p.isActive).length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] text-stone-500 font-semibold block">মোট বিক্রি (Revenue)</span>
          <span className="text-lg sm:text-xl font-black text-stone-900">{formatPrice(totalRevenue)}</span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-stone-200 mb-6 overflow-x-auto no-scrollbar gap-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'orders'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>অর্ডার ব্যবস্থাপনা ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'products'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>পণ্য ব্যবস্থাপনা ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'categories'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>ক্যাটাগরি সমূহ ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'settings'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>দোকান সেটিংস</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. ORDERS TAB */}
      {/* ========================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="অর্ডার আইডি, গ্রাহকের নাম বা মোবাইল নাম্বার খুঁজুন..."
                className="w-full bg-stone-50 text-stone-900 text-xs sm:text-sm pl-9 pr-3 py-2 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 whitespace-nowrap">স্ট্যাটাস:</span>
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-stone-50 text-stone-800 text-xs px-3 py-2 rounded-xl border border-stone-300 focus:outline-hidden"
              >
                <option value="all">সকল অর্ডার</option>
                <option value="pending">পেন্ডিং (Pending)</option>
                <option value="confirmed">নিশ্চিত (Confirmed)</option>
                <option value="processing">প্রসেসিং (Processing)</option>
                <option value="shipped">ডেলিভারির পথে (Shipped)</option>
                <option value="delivered">ডেলিভারি সম্পন্ন (Delivered)</option>
                <option value="cancelled">বাতিল (Cancelled)</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                  <tr>
                    <th className="p-3">অর্ডার আইডি</th>
                    <th className="p-3">গ্রাহক ও মোবাইল</th>
                    <th className="p-3">এলাকা / জেলা</th>
                    <th className="p-3">মোট টাকা</th>
                    <th className="p-3">স্ট্যাটাস</th>
                    <th className="p-3 text-right">একশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-stone-50/70">
                        <td className="p-3 font-mono font-bold text-emerald-800">
                          #{order.id}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-stone-900">{order.customerName}</div>
                          <div className="text-xs text-stone-500">{order.mobile}</div>
                        </td>
                        <td className="p-3 text-stone-600">
                          <div>{order.address.district}</div>
                          <div className="text-[11px] text-stone-400">
                            {order.address.locationType === 'urban' ? 'শহর' : 'গ্রাম'} - {order.address.upazilaThana}
                          </div>
                        </td>
                        <td className="p-3 font-bold text-stone-900">
                          {formatPrice(order.total)}
                        </td>
                        <td className="p-3">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              updateOrderStatus(order.id, e.target.value as OrderStatus)
                            }
                            className={`text-xs font-semibold px-2 py-1 rounded-lg border focus:outline-hidden ${
                              order.status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : order.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-amber-50 text-amber-900 border-amber-300'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setViewingOrder(order)}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>বিস্তারিত</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-500">
                        কোনো অর্ডার পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. PRODUCTS TAB */}
      {/* ========================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              সকল পণ্য ({products.length})
            </h2>
            <button
              onClick={() => {
                setEditingProduct({
                  nameBn: '',
                  nameEn: '',
                  price: 0,
                  regularPrice: 0,
                  stock: 10,
                  categoryId: categories[0]?.id || '',
                  imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=60',
                  descriptionBn: '',
                  isActive: true,
                  isFeatured: false,
                  isPopular: false,
                  unit: 'পিস',
                });
                setIsProductModalOpen(true);
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs"
              id="admin-add-product-btn"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন পণ্য যোগ করুন</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                  <tr>
                    <th className="p-3">ছবি ও নাম</th>
                    <th className="p-3">ক্যাটাগরি</th>
                    <th className="p-3">বিক্রয় মূল্য</th>
                    <th className="p-3">স্টক</th>
                    <th className="p-3">স্ট্যাটাস</th>
                    <th className="p-3 text-right">একশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map((prod) => {
                    const cat = categories.find((c) => c.id === prod.categoryId);
                    return (
                      <tr key={prod.id} className="hover:bg-stone-50/70">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={prod.imageUrl}
                              alt={prod.nameBn}
                              className="w-10 h-10 rounded-lg object-cover bg-stone-100"
                            />
                            <div>
                              <div className="font-bold text-stone-900">{prod.nameBn}</div>
                              <div className="text-[11px] text-stone-400">{prod.nameEn}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-stone-600">{cat?.nameBn || 'অনির্দিষ্ট'}</td>
                        <td className="p-3 font-bold text-stone-900">
                          {formatPrice(prod.price)}
                          {prod.regularPrice && (
                            <span className="text-[10px] text-stone-400 line-through block font-normal">
                              {formatPrice(prod.regularPrice)}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-semibold ${
                              prod.stock <= 3 ? 'text-rose-600' : 'text-stone-800'
                            }`}
                          >
                            {prod.stock} {prod.unit || 'টি'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              prod.isActive
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {prod.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setIsProductModalOpen(true);
                            }}
                            className="p-1.5 text-stone-600 hover:text-emerald-700 hover:bg-stone-100 rounded-lg transition-colors"
                            title="এডিট করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`আপনি কি "${prod.nameBn}" পণ্যটি মুছে ফেলতে চান?`)) {
                                deleteProduct(prod.id);
                                showToast('পণ্যটি মুছে ফেলা হয়েছে');
                              }
                            }}
                            className="p-1.5 text-stone-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. CATEGORIES TAB */}
      {/* ========================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              সকল ক্যাটাগরি ({categories.length})
            </h2>
            <button
              onClick={() => {
                setEditingCategory({
                  nameBn: '',
                  nameEn: '',
                  slug: '',
                  icon: 'Moon',
                  isActive: true,
                });
                setIsCategoryModalOpen(true);
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ক্যাটাগরি</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-stone-900 text-sm">{cat.nameBn}</div>
                  <div className="text-xs text-stone-400">
                    {cat.nameEn} ({cat.slug})
                  </div>
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1.5 ${
                      cat.isActive
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {cat.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setIsCategoryModalOpen(true);
                    }}
                    className="p-1.5 text-stone-500 hover:text-emerald-700 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`আপনি কি "${cat.nameBn}" ক্যাটাগরিটি মুছে ফেলতে চান?`)) {
                        deleteCategory(cat.id);
                        showToast('ক্যাটাগরি মুছে ফেলা হয়েছে');
                      }
                    }}
                    className="p-1.5 text-stone-500 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. SETTINGS TAB */}
      {/* ========================================================= */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-6 max-w-3xl">
          <h2 className="text-lg font-bold text-stone-900 pb-2 border-b border-stone-100">
            দোকান ও ডেলিভারি কনফিগারেশন
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                দোকানের নাম (Shop Name)
              </label>
              <input
                type="text"
                value={settingsForm.shopName}
                onChange={(e) => setSettingsForm({ ...settingsForm, shopName: e.target.value })}
                className="w-full bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                হোয়াটসঅ্যাপ নাম্বার (আন্তর্জাতিক ফরম্যাট যেমন 88017XXXXXXXX)
              </label>
              <input
                type="text"
                value={settingsForm.whatsappNumber}
                onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                className="w-full bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                সরাসরি ফোন হেল্পলাইন
              </label>
              <input
                type="text"
                value={settingsForm.contactNumber}
                onChange={(e) => setSettingsForm({ ...settingsForm, contactNumber: e.target.value })}
                className="w-full bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                দোকানের ঠিকানা
              </label>
              <input
                type="text"
                value={settingsForm.shopAddress}
                onChange={(e) => setSettingsForm({ ...settingsForm, shopAddress: e.target.value })}
                className="w-full bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200">
            <h3 className="text-sm font-bold text-stone-900 mb-3">ডেলিভারি চার্জ নির্ধারণ:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ঢাকা শহরের ভেতরে (৳)
                </label>
                <input
                  type="number"
                  value={settingsForm.deliveryChargeDhaka}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      deliveryChargeDhaka: Number(e.target.value),
                    })
                  }
                  className="w-full bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ঢাকার বাইরে সারাদেশে (৳)
                </label>
                <input
                  type="number"
                  value={settingsForm.deliveryChargeOutsideDhaka}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      deliveryChargeOutsideDhaka: Number(e.target.value),
                    })
                  }
                  className="w-full bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ফ্রি ডেলিভারি ন্যূনতম অর্ডার (৳)
                </label>
                <input
                  type="number"
                  value={settingsForm.freeDeliveryThreshold}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      freeDeliveryThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200">
            <h3 className="text-sm font-bold text-stone-900 mb-3">হোম ব্যানার ও ঘোষণা:</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  হিরো টাইটেল
                </label>
                <input
                  type="text"
                  value={settingsForm.heroTitle}
                  onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })}
                  className="w-full bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  হিরো সাবটাইটেল
                </label>
                <input
                  type="text"
                  value={settingsForm.heroSubtitle}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })
                  }
                  className="w-full bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ঘোষণা বার (Announcement Bar)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={settingsForm.announcementText}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, announcementText: e.target.value })
                    }
                    className="flex-1 bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-stone-700 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.isAnnouncementActive}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          isAnnouncementActive: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-emerald-700"
                    />
                    <span>চালু রাখুন</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200">
            <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-700" />
              <span>অ্যাডমিন নিরাপত্তা ও পিন কোড:</span>
            </h3>
            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                অ্যাডমিন পাসকোড / পিন (Admin PIN)
              </label>
              <input
                type="text"
                value={settingsForm.adminPin || '1234'}
                onChange={(e) => setSettingsForm({ ...settingsForm, adminPin: e.target.value })}
                className="w-full bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono tracking-wider"
                placeholder="যেমন: 1234"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                এই পিন দিয়ে অ্যাডমিন প্যানেলে লগইন করবেন। (ডিফল্ট: 1234)
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-6 rounded-xl text-sm transition-colors shadow-xs"
          >
            সেটিংস সংরক্ষণ করুন
          </button>
        </form>
      )}

      {/* ========================================================= */}
      {/* VIEW ORDER DETAILS MODAL */}
      {/* ========================================================= */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-stone-100">
              <h3 className="text-lg font-bold text-stone-900">
                অর্ডার বিস্তারিত: #{viewingOrder.id}
              </h3>
              <button
                onClick={() => setViewingOrder(null)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl text-xs sm:text-sm space-y-2 border border-stone-200">
              <div>
                <strong>গ্রাহক:</strong> {viewingOrder.customerName}
              </div>
              <div>
                <strong>ফোন:</strong> {viewingOrder.mobile}{' '}
                {viewingOrder.altMobile && `(বিকল্প: ${viewingOrder.altMobile})`}
              </div>
              <div>
                <strong>এলাকার ধরন:</strong>{' '}
                {viewingOrder.address.locationType === 'urban'
                  ? 'শহর (Urban)'
                  : 'গ্রাম / উপজেলা (Rural)'}
              </div>
              <div>
                <strong>সম্পূর্ণ ঠিকানা:</strong> {viewingOrder.address.formattedFullAddress}
              </div>
              {viewingOrder.address.landmark && (
                <div className="text-amber-800 font-semibold">
                  <strong>ল্যান্ডমার্ক:</strong> {viewingOrder.address.landmark}
                </div>
              )}
              {viewingOrder.orderNote && (
                <div className="text-stone-600 italic">
                  <strong>নোট:</strong> "{viewingOrder.orderNote}"
                </div>
              )}
            </div>

            <div>
              <h4 className="font-bold text-sm text-stone-900 mb-2">পণ্যের তালিকা:</h4>
              <div className="divide-y divide-stone-100 border rounded-xl overflow-hidden">
                {viewingOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-8 h-8 rounded-md object-cover bg-stone-100"
                      />
                      <span>
                        {item.nameBn} x {item.quantity}
                      </span>
                    </div>
                    <span className="font-bold">{formatPrice(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-bold pt-2">
              <span>সর্বমোট প্রদেয় (ক্যাশ অন ডেলিভারি):</span>
              <span className="text-base text-emerald-800">{formatPrice(viewingOrder.total)}</span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <button
                onClick={() => window.print()}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>ইনভয়েস প্রিন্ট</span>
              </button>

              <button
                onClick={() => setViewingOrder(null)}
                className="bg-emerald-700 text-white text-xs px-4 py-2 rounded-xl font-bold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD / EDIT PRODUCT MODAL */}
      {/* ========================================================= */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <h3 className="text-lg font-bold text-stone-900">
                {editingProduct.id ? 'পণ্য সম্পাদনা করুন' : 'নতুন পণ্য যোগ করুন'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  পণ্যের নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.nameBn || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, nameBn: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  পণ্যের নাম (ইংরেজি)
                </label>
                <input
                  type="text"
                  value={editingProduct.nameEn || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, nameEn: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    বিক্রয় মূল্য (টাকা) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                    }
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    রেগুলার / আগের মূল্য (টাকা)
                  </label>
                  <input
                    type="number"
                    value={editingProduct.regularPrice || 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        regularPrice: Number(e.target.value),
                      })
                    }
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    স্টক পরিমাণ
                  </label>
                  <input
                    type="number"
                    value={editingProduct.stock || 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })
                    }
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    ক্যাটাগরি
                  </label>
                  <select
                    value={editingProduct.categoryId}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, categoryId: e.target.value })
                    }
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameBn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  পণ্যের ছবির লিংক (Image URL)
                </label>
                <input
                  type="url"
                  value={editingProduct.imageUrl || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, imageUrl: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  বিস্তারিত বর্ণনা (বাংলা)
                </label>
                <textarea
                  rows={3}
                  value={editingProduct.descriptionBn || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, descriptionBn: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-300"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isActive ?? true}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, isActive: e.target.checked })
                    }
                    className="w-4 h-4 accent-emerald-700"
                  />
                  <span>সক্রিয় (Active)</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isFeatured ?? false}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })
                    }
                    className="w-4 h-4 accent-emerald-700"
                  />
                  <span>ফিচার্ড (Featured)</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isPopular ?? false}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, isPopular: e.target.checked })
                    }
                    className="w-4 h-4 accent-emerald-700"
                  />
                  <span>জনপ্রিয় (Popular)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD / EDIT CATEGORY MODAL */}
      {/* ========================================================= */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <h3 className="text-lg font-bold text-stone-900">
                {editingCategory.id ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ক্যাটাগরির নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.nameBn || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, nameBn: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ক্যাটাগরির নাম (ইংরেজি)
                </label>
                <input
                  type="text"
                  value={editingCategory.nameEn || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, nameEn: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  স্ল্যাগ (Slug e.g. honey, perfume) *
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.slug || ''}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                    })
                  }
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300"
                />
              </div>

              <div className="flex items-center gap-1.5 pt-2">
                <input
                  type="checkbox"
                  checked={editingCategory.isActive ?? true}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, isActive: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-700"
                />
                <span className="text-xs text-stone-700">সক্রিয় রাখুন</span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
