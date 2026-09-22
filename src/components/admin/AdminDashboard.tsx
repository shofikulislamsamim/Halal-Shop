import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { Product, Category, Order, OrderStatus, ShopSettings } from '../../types';
import { formatPrice } from '../../utils/helpers';
import { supabaseSendPasswordResetEmail, supabaseUpdatePassword } from '../../lib/supabase';
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
  ShieldAlert,
  AlertCircle,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    categories,
    orders,
    settings,
    isAdminLoggedIn,
    adminLogout,
    verifyAdminLogin,
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
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'inventory' | 'categories' | 'settings'>('orders');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'out' | 'low' | 'in'>('all');
  const [inventorySearch, setInventorySearch] = useState('');

  // Login form state
  const [adminEmail, setAdminEmail] = useState('sk82716102@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [passwordRecoveryToken, setPasswordRecoveryToken] = useState<string | null>(null);
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;

    const params = new URLSearchParams(hash);
    if (params.get('type') === 'recovery' && params.get('access_token')) {
      setPasswordRecoveryToken(params.get('access_token'));
      setShowPasswordRecovery(false);
      setRecoveryMessage('');
      setLoginError('');
    }
  }, []);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordRecoveryToken) return;
    if (newAdminPassword.length < 8) {
      setRecoveryMessage('নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।');
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      setRecoveryMessage('নতুন পাসওয়ার্ড ও নিশ্চিত পাসওয়ার্ড এক নয়।');
      return;
    }

    setIsUpdatingPassword(true);
    setRecoveryMessage('');

    try {
      await supabaseUpdatePassword(passwordRecoveryToken, newAdminPassword);
      setPasswordRecoveryToken(null);
      setNewAdminPassword('');
      setConfirmAdminPassword('');
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      setPasswordResetSuccess(true);
      setRecoveryMessage('');
    } catch {
      setRecoveryMessage('পাসওয়ার্ড পরিবর্তন করা যায়নি। রিসেট লিংকটি মেয়াদোত্তীর্ণ হলে নতুন রিসেট লিংক নিন।');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Lockout Countdown Timer Effect
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Handle Login
  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = adminEmail.trim();

    if (!email) {
      setRecoveryMessage('অ্যাডমিন ইমেইল দিন।');
      return;
    }

    setIsSendingRecovery(true);
    setRecoveryMessage('');

    try {
      const recoveryRedirect = new URL(import.meta.env.BASE_URL || '/Halal-Shop/', window.location.origin).toString();
      await supabaseSendPasswordResetEmail(email, recoveryRedirect);
      setRecoveryMessage('পাসওয়ার্ড রিসেট করার নির্দেশনা আপনার ইমেইলে পাঠানো হয়েছে। ইমেইল না পেলে Spam/Junk ফোল্ডারও দেখুন।');
    } catch {
      // Keep the response neutral so the login screen does not reveal whether an email exists.
      setRecoveryMessage('যদি এই ইমেইলটি অ্যাডমিন অ্যাকাউন্টের সাথে যুক্ত থাকে, তাহলে পাসওয়ার্ড রিসেট করার নির্দেশনা পাঠানো হয়েছে।');
    } finally {
      setIsSendingRecovery(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if temporarily locked out
    if (lockoutSeconds > 0) {
      setLoginError(`নিরাপত্তার স্বার্থে অ্যাকাউন্ট সাময়িক লক রয়েছে। অনুগ্রহ করে ${lockoutSeconds} সেকেন্ড অপেক্ষা করুন।`);
      return;
    }

    if (!adminEmail.trim() || !adminPassword) {
      setLoginError('অ্যাডমিন ইমেইল ও পাসওয়ার্ড দিন।');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');
    const check = await verifyAdminLogin(adminEmail, adminPassword);
    if (check.success) {
      // verifyAdminLogin already stores the authenticated Supabase session.
      setAdminPassword('');
      setFailedAttempts(0);
      setLockoutSeconds(0);
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= 5) {
        setLockoutSeconds(30);
        setLoginError('একটানা ৫ বার ভুল লগইন হয়েছে। ৩০ সেকেন্ড অপেক্ষা করুন।');
      } else {
        setLoginError(check.message || 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।');
      }
    }
    setIsLoggingIn(false);
  };

  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isOrderFilterOpen, setIsOrderFilterOpen] = useState(false);

  // Product modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStockFilter, setProductStockFilter] = useState<'all' | 'out' | 'low' | 'in'>('all');
  const [isProductFilterOpen, setIsProductFilterOpen] = useState(false);

  // Category modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<ShopSettings>(settings);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  // Recursive category helpers — supports unlimited nesting.
  const categoryMatchesSearch = (category: Category): boolean => {
    const q = categorySearchQuery.trim().toLowerCase();
    if (!q) return true;
    const searchable = [category.nameBn, category.nameEn, category.slug].join(' ').toLowerCase();
    if (searchable.includes(q)) return true;
    return categories.some((child) => child.parentId === category.id && categoryMatchesSearch(child));
  };

  const getCategoryChildren = (parentId: string | null) =>
    categories
      .filter((c) => (c.parentId || null) === parentId && categoryMatchesSearch(c))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const getCategoryDepth = (id: string): number => {
    let depth = 0;
    let current = categories.find((c) => c.id === id);
    const visited = new Set<string>();
    while (current?.parentId && !visited.has(current.id)) {
      visited.add(current.id);
      depth += 1;
      current = categories.find((c) => c.id === current?.parentId);
    }
    return depth;
  };

  const getDescendantIds = (id: string): Set<string> => {
    const result = new Set<string>();
    const walk = (parentId: string) => {
      categories
        .filter((c) => c.parentId === parentId)
        .forEach((child) => {
          if (result.has(child.id)) return;
          result.add(child.id);
          walk(child.id);
        });
    };
    if (id) walk(id);
    return result;
  };

  const renderCategoryTree = (parentId: string | null = null): React.ReactNode =>
    getCategoryChildren(parentId).map((cat) => {
      const children = getCategoryChildren(cat.id);
      const depth = getCategoryDepth(cat.id);
      const siblings = getCategoryChildren(cat.parentId || null);
      const siblingIndex = siblings.findIndex((item) => item.id === cat.id);
      const moveCategory = (direction: -1 | 1) => {
        const target = siblings[siblingIndex + direction];
        if (!target) return;
        const currentOrder = cat.order ?? siblingIndex + 1;
        const targetOrder = target.order ?? siblingIndex + direction + 1;
        updateCategory(cat.id, { order: targetOrder });
        updateCategory(target.id, { order: currentOrder });
        showToast('ক্যাটাগরির অবস্থান আপডেট হয়েছে');
      };

      return (
        <React.Fragment key={cat.id}>
          <div className="bg-white rounded-2xl border border-stone-200 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0" style={{ paddingLeft: Math.min(depth, 8) * 18 }}>
              <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-stone-900 text-sm">{cat.nameBn}</span>
                  {depth > 0 && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      সাব-ক্যাটাগরি · স্তর {depth}
                    </span>
                  )}
                </div>
                <div className="text-xs text-stone-400 truncate">
                  {cat.nameEn || '—'} · {cat.slug}
                  {cat.parentId ? ' · Parent: ' + (categories.find((p) => p.id === cat.parentId)?.nameBn || '—') : ' · মূল ক্যাটাগরি'}
                </div>
                <span className={'inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ' + (
                  cat.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-500'
                )}>
                  {cat.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => moveCategory(-1)}
                disabled={siblingIndex <= 0}
                className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-stone-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                title="এক ধাপ উপরে নিন"
                aria-label={cat.nameBn + ' এক ধাপ উপরে নিন'}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => moveCategory(1)}
                disabled={siblingIndex === siblings.length - 1}
                className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-stone-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                title="এক ধাপ নিচে নিন"
                aria-label={cat.nameBn + ' এক ধাপ নিচে নিন'}
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingCategory({
                    nameBn: '',
                    nameEn: '',
                    slug: '',
                    parentId: cat.id,
                    icon: 'Moon',
                    isActive: true,
                    order: getCategoryChildren(cat.id).length + 1,
                  });
                  setIsCategoryModalOpen(true);
                }}
                className="px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
                title={cat.nameBn + '-এর ভিতরে নতুন ক্যাটাগরি'}
              >
                + সাব-ক্যাটাগরি
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(cat);
                  setIsCategoryModalOpen(true);
                }}
                className="p-1.5 text-stone-500 hover:text-emerald-700 rounded-lg"
                title="সম্পাদনা"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('আপনি কি "' + cat.nameBn + '" ক্যাটাগরিটি মুছে ফেলতে চান?')) {
                    deleteCategory(cat.id);
                  }
                }}
                className="p-1.5 text-stone-500 hover:text-rose-600 rounded-lg"
                title="মুছে ফেলুন"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {children.length > 0 && renderCategoryTree(cat.id)}
        </React.Fragment>
      );
    });
  // Filtered Orders
  const filteredOrders = orders.filter((order) => {
    if (orderStatusFilter !== 'all' && order.status !== orderStatusFilter) {
      return false;
    }
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.trim().toLowerCase();
      const searchable = [
        order.id,
        order.customerName,
        order.mobile,
        order.altMobile || '',
        order.orderNote || '',
        order.address?.formattedFullAddress || '',
        order.address?.district || '',
        order.address?.upazilaThana || '',
        order.address?.union || '',
      ].join(' ').toLowerCase();
      return searchable.includes(q);
    }
    return true;
  });

  const filteredProducts = products.filter((product) => {
    if (productStatusFilter === 'active' && !product.isActive) return false;
    if (productStatusFilter === 'inactive' && product.isActive) return false;
    if (productStockFilter === 'out' && product.stock > 0) return false;
    if (productStockFilter === 'low' && (product.stock <= 0 || product.stock > 3)) return false;
    if (productStockFilter === 'in' && product.stock <= 3) return false;
    if (productCategoryFilter !== 'all' && product.categoryId !== productCategoryFilter) return false;

    const q = productSearchQuery.trim().toLowerCase();
    if (!q) return true;
    const category = categories.find((cat) => cat.id === product.categoryId);
    const searchable = [
      product.nameBn, product.nameEn, product.slug || '', product.id, product.unit || '',
      category?.nameBn || '', category?.nameEn || '', category?.slug || '',
    ].join(' ').toLowerCase();
    return searchable.includes(q);
  });



  // Calculate order stats
  const totalRevenue = orders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + o.total : sum), 0);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  if (!isAdminLoggedIn) {
    const isLockedOut = lockoutSeconds > 0;

    if (passwordRecoveryToken) {
      return (
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 mb-1">নতুন পাসওয়ার্ড সেট করুন</h1>
            <p className="text-stone-500 text-xs sm:text-sm mb-6">আপনার অ্যাডমিন অ্যাকাউন্টের জন্য নতুন পাসওয়ার্ড দিন।</p>

            <form onSubmit={handlePasswordUpdate} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">নতুন পাসওয়ার্ড</label>
                <input
                  type="password"
                  value={newAdminPassword}
                  disabled={isUpdatingPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="কমপক্ষে ৮ অক্ষর"
                  className="w-full bg-white text-stone-900 text-sm px-4 py-3 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-100"
                  autoComplete="new-password"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">পাসওয়ার্ড নিশ্চিত করুন</label>
                <input
                  type="password"
                  value={confirmAdminPassword}
                  disabled={isUpdatingPassword}
                  onChange={(e) => setConfirmAdminPassword(e.target.value)}
                  placeholder="আবার পাসওয়ার্ড লিখুন"
                  className="w-full bg-white text-stone-900 text-sm px-4 py-3 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-100"
                  autoComplete="new-password"
                />
              </div>

              {recoveryMessage && (
                <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3 leading-5">
                  {recoveryMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isUpdatingPassword ? 'পাসওয়ার্ড পরিবর্তন হচ্ছে...' : 'নতুন পাসওয়ার্ড সংরক্ষণ করুন'}</span>
              </button>
            </form>
          </div>
        </div>
      );
    }


    if (showPasswordRecovery) {
      return (
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm text-center">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 mb-1">পাসওয়ার্ড রিসেট</h1>
            <p className="text-stone-500 text-xs sm:text-sm mb-6">
              অ্যাডমিন অ্যাকাউন্টের ইমেইলে রিসেট নির্দেশনা পাঠানো হবে।
            </p>

            <form onSubmit={handlePasswordRecovery} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">অ্যাডমিন ইমেইল</label>
                <input
                  type="email"
                  value={adminEmail}
                  disabled={isSendingRecovery}
                  onChange={(e) => {
                    setAdminEmail(e.target.value);
                    if (recoveryMessage) setRecoveryMessage('');
                  }}
                  placeholder="Admin email"
                  className="w-full bg-white text-stone-900 text-sm px-4 py-3 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-100"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              {recoveryMessage && (
                <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3 leading-5">
                  {recoveryMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSendingRecovery}
                className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSendingRecovery ? 'ইমেইল পাঠানো হচ্ছে...' : 'রিসেট লিংক পাঠান'}</span>
              </button>

              <button
                type="button"
                disabled={isSendingRecovery}
                onClick={() => {
                  setShowPasswordRecovery(false);
                  setRecoveryMessage('');
                }}
                className="w-full text-emerald-700 hover:text-emerald-800 font-semibold text-xs py-2"
              >
                ← লগইনে ফিরে যান
              </button>
            </form>
          </div>
        </div>
      );
    }

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
            Supabase Admin account দিয়ে নিরাপদে লগইন করুন
          </p>

          {passwordResetSuccess && (
            <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 leading-5">
              পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে। এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700">
                  অ্যাডমিন ইমেইল ও পাসওয়ার্ড
                </label>
                {failedAttempts > 0 && !isLockedOut && (
                  <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    চেষ্টা বাকি: {5 - failedAttempts}/৫
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <input
                  type="email"
                  value={adminEmail}
                  disabled={isLockedOut || isLoggingIn}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Admin email"
                  className="w-full bg-white text-stone-900 text-sm px-4 py-3 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-100"
                  autoComplete="username"
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    disabled={isLockedOut || isLoggingIn}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    onKeyDown={(e) => setIsCapsLockOn(e.getModifierState('CapsLock'))}
                    onKeyUp={(e) => setIsCapsLockOn(e.getModifierState('CapsLock'))}
                    onBlur={() => setIsCapsLockOn(false)}
                    placeholder={isLockedOut ? `লক করা আছে (${lockoutSeconds}s)` : 'Admin password'}
                    className="w-full bg-white text-stone-900 text-sm px-4 py-3 pr-11 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-100"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 p-1">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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

            </div>

            <button
              type="button"
              disabled={isLockedOut || isLoggingIn}
              onClick={() => {
                setShowPasswordRecovery(true);
                setPasswordResetSuccess(false);
                setLoginError('');
                setRecoveryMessage('');
              }}
              className="w-full text-emerald-700 hover:text-emerald-800 font-semibold text-xs py-1.5"
            >
              পাসওয়ার্ড ভুলে গেছেন?
            </button>

            <button
              type="submit"
              disabled={isLockedOut}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              id="admin-login-btn"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isLoggingIn ? 'লগইন হচ্ছে...' : isLockedOut ? `লক রয়েছে (${lockoutSeconds}s)` : 'প্রবেশ করুন (Login)'}</span>
            </button>
          </form>
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
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'inventory'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>স্টক / ইনভেন্টরি</span>
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
          <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input type="search" value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} placeholder="পণ্যের নাম দিয়ে স্টক খুঁজুন..." className="w-full bg-stone-50 text-stone-900 text-xs sm:text-sm pl-9 pr-9 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600" aria-label="স্টক পণ্য খুঁজুন" />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {inventorySearch && <button type="button" onClick={() => setInventorySearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs p-1" aria-label="স্টক সার্চ পরিষ্কার করুন">✕</button>}
            </div>
            <select value={inventoryFilter} onChange={(e) => setInventoryFilter(e.target.value as typeof inventoryFilter)} className="w-full sm:w-auto bg-stone-50 text-stone-800 text-xs px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden" aria-label="স্টক ফিল্টার">
              <option value="all">সব স্টক</option><option value="out">স্টক শেষ</option><option value="low">কম স্টক (১–৩)</option><option value="in">পর্যাপ্ত স্টক (৪+)</option>
            </select>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600"><tr><th className="p-3">পণ্য</th><th className="p-3">বর্তমান স্টক</th><th className="p-3">স্টক অবস্থা</th><th className="p-3 text-right">দ্রুত সমন্বয়</th></tr></thead>
                <tbody className="divide-y divide-stone-100">
                  {products.filter((prod) => {
                    const q = inventorySearch.trim().toLowerCase();
                    if (q && !prod.nameBn.toLowerCase().includes(q) && !prod.nameEn.toLowerCase().includes(q)) return false;
                    if (inventoryFilter === 'out') return prod.stock <= 0;
                    if (inventoryFilter === 'low') return prod.stock > 0 && prod.stock <= 3;
                    if (inventoryFilter === 'in') return prod.stock > 3;
                    return true;
                  }).map((prod) => {
                    const statusClass = prod.stock <= 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : prod.stock <= 3 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    const statusText = prod.stock <= 0 ? 'স্টক শেষ' : prod.stock <= 3 ? 'কম স্টক' : 'পর্যাপ্ত';
                    return <tr key={prod.id} className="hover:bg-stone-50/70">
                      <td className="p-3"><div className="flex items-center gap-2.5"><img src={prod.imageUrl} alt={prod.nameBn} className="w-10 h-10 rounded-lg object-cover bg-stone-100" /><div className="min-w-0"><div className="font-bold text-stone-900">{prod.nameBn}</div><div className="text-[11px] text-stone-400">{prod.nameEn || '—'}</div></div></div></td>
                      <td className="p-3 font-black text-stone-900">{prod.stock} {prod.unit || 'টি'}</td>
                      <td className="p-3"><span className={'inline-flex px-2 py-1 rounded-full border text-[11px] font-bold ' + statusClass}>{statusText}</span></td>
                      <td className="p-3 text-right"><div className="inline-flex items-center gap-1.5"><button type="button" disabled={prod.stock <= 0} onClick={() => updateProduct(prod.id, { stock: Math.max(0, prod.stock - 1) })} className="w-8 h-8 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold" title="১ কমান">−</button><button type="button" onClick={() => updateProduct(prod.id, { stock: prod.stock + 1 })} className="w-8 h-8 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 font-bold" title="১ বাড়ান">+</button></div></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-stone-100">
              {products.filter((prod) => {
                const q = inventorySearch.trim().toLowerCase();
                if (q && !prod.nameBn.toLowerCase().includes(q) && !prod.nameEn.toLowerCase().includes(q)) return false;
                if (inventoryFilter === 'out') return prod.stock <= 0;
                if (inventoryFilter === 'low') return prod.stock > 0 && prod.stock <= 3;
                if (inventoryFilter === 'in') return prod.stock > 3;
                return true;
              }).map((prod) => {
                const statusText = prod.stock <= 0 ? 'স্টক শেষ' : prod.stock <= 3 ? 'কম স্টক' : 'পর্যাপ্ত';
                const statusClass = prod.stock <= 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : prod.stock <= 3 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200';
                return <div key={prod.id} className="p-3.5 space-y-3">
                  <div className="flex items-center gap-3"><img src={prod.imageUrl} alt={prod.nameBn} className="w-12 h-12 rounded-xl object-cover bg-stone-100 shrink-0" /><div className="min-w-0 flex-1"><div className="font-bold text-stone-900 truncate">{prod.nameBn}</div><div className="text-[11px] text-stone-400 truncate">{prod.nameEn || '—'}</div></div><span className={'shrink-0 px-2 py-1 rounded-lg border text-[10px] font-bold ' + statusClass}>{statusText}</span></div>
                  <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] text-stone-500">বর্তমান স্টক</div><div className="font-black text-stone-900">{prod.stock} {prod.unit || 'টি'}</div></div><div className="flex items-center gap-1.5"><button type="button" disabled={prod.stock <= 0} onClick={() => updateProduct(prod.id, { stock: Math.max(0, prod.stock - 1) })} className="w-9 h-9 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold" aria-label={prod.nameBn + ' থেকে ১ কমান'}>−</button><button type="button" onClick={() => updateProduct(prod.id, { stock: prod.stock + 1 })} className="w-9 h-9 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 font-bold" aria-label={prod.nameBn + ' ১ বাড়ান'}>+</button></div></div>
                </div>;
              })}
            </div>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* 4. CATEGORIES TAB */}
      {/* ========================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                ক্যাটাগরি ম্যানেজমেন্ট ({categories.length})
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                মূল ক্যাটাগরি → সাব-ক্যাটাগরি → আরও সাব-ক্যাটাগরি — যত স্তর প্রয়োজন যোগ করতে পারবেন।
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingCategory({
                  nameBn: '',
                  nameEn: '',
                  slug: '',
                  parentId: null,
                  icon: 'Moon',
                  isActive: true,
                  order: getCategoryChildren(null).length + 1,
                });
                setIsCategoryModalOpen(true);
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>মূল ক্যাটাগরি যোগ করুন</span>
            </button>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200">
            <div className="relative">
              <input
                type="search"
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                placeholder="ক্যাটাগরির নাম, ইংরেজি নাম বা স্লাগ খুঁজুন..."
                className="w-full bg-stone-50 text-stone-900 text-xs sm:text-sm pl-9 pr-9 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
                aria-label="ক্যাটাগরি খুঁজুন"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {categorySearchQuery && (
                <button type="button" onClick={() => setCategorySearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs p-1" aria-label="ক্যাটাগরি সার্চ পরিষ্কার করুন">✕</button>
              )}
            </div>
            {categorySearchQuery && (
              <div className="text-[11px] text-stone-500 mt-2">{categories.filter(categoryMatchesSearch).length}টি মিল পাওয়া গেছে</div>
            )}
          </div>

          <div className="bg-stone-50 rounded-3xl border border-stone-200 p-3 sm:p-4 space-y-2">
            {categories.length > 0 ? (
              renderCategoryTree(null)
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">
                কোনো ক্যাটাগরি নেই। উপরের বাটনে ক্লিক করে প্রথম ক্যাটাগরি তৈরি করুন।
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. SETTINGS TAB */}
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
                onClick={() => {
                  if (!['confirmed', 'processing', 'shipped', 'delivered'].includes(viewingOrder.status)) {
                    showToast('অর্ডার Confirmed হওয়ার পর ইনভয়েস পাওয়া যাবে');
                    return;
                  }
                  window.print();
                }}
                disabled={!['confirmed', 'processing', 'shipped', 'delivered'].includes(viewingOrder.status)}
                className="bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed text-stone-800 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5"
                title={['confirmed', 'processing', 'shipped', 'delivered'].includes(viewingOrder.status) ? 'ইনভয়েস প্রিন্ট/Save as PDF' : 'Confirmed হওয়ার পর ইনভয়েস পাওয়া যাবে'}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>ইনভয়েস</span>
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

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  প্যারেন্ট ক্যাটাগরি
                </label>
                <select
                  value={editingCategory.parentId || ''}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      parentId: e.target.value || null,
                    })
                  }
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300 bg-white"
                >
                  <option value="">— মূল ক্যাটাগরি —</option>
                  {categories
                    .filter((c) => c.id !== editingCategory.id && !getDescendantIds(editingCategory.id || '').has(c.id))
                    .sort((a, b) => {
                      const da = getCategoryDepth(a.id);
                      const db = getCategoryDepth(b.id);
                      return da - db || (a.order ?? 0) - (b.order ?? 0);
                    })
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {'— '.repeat(Math.min(getCategoryDepth(c.id), 8))}{c.nameBn}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-stone-500 mt-1">
                  অন্য ক্যাটাগরির ভিতরে রাখতে চাইলে এখানে সেই ক্যাটাগরি নির্বাচন করুন।
                </p>
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
