import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { Product, Category, Order, OrderStatus, ShopSettings, ProductStockMovement } from '../../types';
import type { OrderStatusHistoryEntry } from '../../context/ShopContext';
import { formatPrice } from '../../utils/helpers';
import { supabaseSendPasswordResetEmail, supabaseUpdatePassword } from '../../lib/supabase';
import { ProductFormModal } from './ProductFormModal';
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
  MessageCircle,
  Calendar,
  AlertTriangle,
  FileText,
  DollarSign,
  Truck,
  ShieldAlert,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    categories,
    orders,
    orderStats,
    settings,
    isAdminLoggedIn,
    adminLogout,
    verifyAdminLogin,
    addProduct,
    updateProduct,
    adjustProductStock,
    getProductStockHistory,
    deleteProduct,
    permanentlyDeleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategory,
    updateOrderStatus,
    updateOrderAmount,
    updateOrderDelivery,
    refreshOrders,
    getOrderStatusHistory,
    updateSettings,
    showToast,
  } = useShop();

  // Admin tabs: 'orders' | 'products' | 'categories' | 'settings'
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'inventory' | 'categories' | 'settings'>('orders');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'out' | 'low' | 'in'>('all');
  const [inventorySearch, setInventorySearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [stockEditorProductId, setStockEditorProductId] = useState<string | null>(null);
  const [stockAdjustmentAmount, setStockAdjustmentAmount] = useState('1');
  const [stockAdjustmentMode, setStockAdjustmentMode] = useState<'add' | 'remove'>('add');
  const [stockAdjustmentReason, setStockAdjustmentReason] = useState('manual_adjustment');
  const [stockAdjustmentNote, setStockAdjustmentNote] = useState('');
  const [stockHistory, setStockHistory] = useState<ProductStockMovement[]>([]);
  const [isStockHistoryLoading, setIsStockHistoryLoading] = useState(false);
  const [isStockSaving, setIsStockSaving] = useState(false);

  const stockEditorProduct = products.find((product) => product.id === stockEditorProductId) || null;

  useEffect(() => {
    if (!stockEditorProductId) { setStockHistory([]); return; }
    let cancelled = false;
    setIsStockHistoryLoading(true);
    void getProductStockHistory(stockEditorProductId, 30).then((rows) => {
      if (!cancelled) setStockHistory(rows);
    }).finally(() => {
      if (!cancelled) setIsStockHistoryLoading(false);
    });
    return () => { cancelled = true; };
  }, [stockEditorProductId]);
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
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Use the exact same website logo shown in the main Header.
  const invoiceLogoSrc = '/Halal-Shop/halal-shop-logo.jpg';

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
  const [orderDateFilter, setOrderDateFilter] = useState<'all' | 'today' | 'yesterday' | '7days' | '30days'>('all');
  const [orderSort, setOrderSort] = useState<'newest' | 'oldest' | 'pending'>('newest');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [viewingOrderHistory, setViewingOrderHistory] = useState<OrderStatusHistoryEntry[]>([]);
  const [isLoadingOrderHistory, setIsLoadingOrderHistory] = useState(false);
  const [isOrderFilterOpen, setIsOrderFilterOpen] = useState(false);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [editingOrderAmountId, setEditingOrderAmountId] = useState<string | null>(null);
  const [editingOrderAmount, setEditingOrderAmount] = useState('');
  const [isSavingOrderAmount, setIsSavingOrderAmount] = useState(false);
  const [editingDeliveryOrderId, setEditingDeliveryOrderId] = useState<string | null>(null);
  const [editingDeliveryCharge, setEditingDeliveryCharge] = useState('');
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const ORDERS_PER_PAGE = 20;
  const [debouncedOrderSearchQuery, setDebouncedOrderSearchQuery] = useState('');
  const [isLoadingMoreOrders, setIsLoadingMoreOrders] = useState(false);

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

  // Keep the open order-details modal synchronized with the authoritative
  // order list. This prevents stale status/customer/order data when the list
  // is refreshed or another session changes the same order.
  useEffect(() => {
    if (!viewingOrder) return;
    const latestOrder = orders.find((order) => order.id === viewingOrder.id);
    if (!latestOrder) {
      setViewingOrder(null);
      return;
    }

    setViewingOrder((current) => {
      if (!current || current.id !== latestOrder.id) return current;
      return current === latestOrder ? current : latestOrder;
    });
  }, [orders, viewingOrder?.id]);

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
        if (direction === -1 && siblingIndex <= 0) return;
        if (direction === 1 && siblingIndex >= siblings.length - 1) return;
        reorderCategory(cat.id, direction === -1 ? 'up' : 'down');
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
  // Orders are filtered, sorted, counted and paginated on the server.
  const paginatedOrders = orders;
  const hasMoreOrders = orders.length < orderStats.total;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedOrderSearchQuery(orderSearchQuery);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [orderSearchQuery]);

  useEffect(() => {
    if (!isAdminLoggedIn) return;

    setIsRefreshingOrders(true);
    void refreshOrders({
      status: orderStatusFilter,
      search: debouncedOrderSearchQuery,
      date: orderDateFilter,
      sort: orderSort,
      limit: ORDERS_PER_PAGE,
      offset: 0,
    }).finally(() => setIsRefreshingOrders(false));
  }, [isAdminLoggedIn, orderStatusFilter, debouncedOrderSearchQuery, orderDateFilter, orderSort]);

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };
  const toggleAllVisibleProducts = () => {
    const ids = filteredProducts.map((p) => p.id);
    setSelectedProductIds((prev) => ids.every((id) => prev.includes(id)) ? prev.filter((id) => !ids.includes(id)) : Array.from(new Set([...prev, ...ids])));
  };
  const bulkSetProductStatus = async (active: boolean) => {
    if (!selectedProductIds.length) return;
    const count = selectedProductIds.length;
    for (const id of selectedProductIds) await updateProduct(id, { isActive: active, isDraft: false });
    setSelectedProductIds([]);
    showToast(count + 'টি পণ্যের স্ট্যাটাস আপডেট হয়েছে।');
  };
  const exportProductsCsv = () => {
    const headers = ['id','nameBn','nameEn','sku','slug','categoryId','price','regularPrice','stock','unit','brand','manufacturer','originCountry','tags','descriptionBn','descriptionEn','isFeatured','isPopular','isNewArrival','isBestSeller','isSpecialOffer','isLimitedStock','isActive','isDraft'];
    const rows = products.map((p) => headers.map((h) => JSON.stringify(Array.isArray((p as any)[h]) ? (p as any)[h].join('|') : (p as any)[h] ?? '')).join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'halal-shop-products.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const importProductsCsv = async (file: File) => {
    try {
      const text = await file.text(); const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) throw new Error('CSV is empty.');
      const parse = (line: string) => { const out: string[]=[]; let cur=''; let q=false; for(let i=0;i<line.length;i++){const ch=line[i]; if(ch==='"'){if(q&&line[i+1]==='"'){cur+='"';i++;}else q=!q;}else if(ch===','&&!q){out.push(cur);cur='';}else cur+=ch;} out.push(cur); return out; };
      const headers = parse(lines[0]).map(h=>h.trim()); let count=0;
      for (const line of lines.slice(1)) {
        const vals=parse(line); const row: Record<string,string>={}; headers.forEach((h,i)=>row[h]=vals[i]||'');
        if(!row.nameBn?.trim()) continue;
        const ok=await addProduct({
          nameBn:row.nameBn.trim(), nameEn:row.nameEn||'', sku:row.sku||undefined, slug:row.slug||undefined, categoryId:row.categoryId||categories[0]?.id||'', categoryIds:[],
          tags:(row.tags||'').split('|').filter(Boolean), price:Number(row.price||0), regularPrice:row.regularPrice?Number(row.regularPrice):undefined, stock:Number(row.stock||0), unit:row.unit||'',
          brand:row.brand||'', manufacturer:row.manufacturer||'', originCountry:row.originCountry||'', imageUrl:'', galleryUrls:[], shortDescription:'', descriptionBn:row.descriptionBn||'', descriptionEn:row.descriptionEn||'',
          specifications:[], variants:[], relatedProductIds:[], seoTitle:'', seoDescription:'', seoKeywords:[], isFeatured:row.isFeatured==='true', isPopular:row.isPopular==='true',
          isNewArrival:row.isNewArrival==='true', isBestSeller:row.isBestSeller==='true', isSpecialOffer:row.isSpecialOffer==='true', isLimitedStock:row.isLimitedStock==='true',
          isActive:row.isActive!=='false', isDraft:row.isDraft==='true', whatsappEnabled:true, lowStockThreshold:3, minOrderQty:1
        }); if(ok) count++;
      }
      showToast(count+'টি পণ্য CSV থেকে যোগ করা হয়েছে।');
    } catch(error){ console.error(error); showToast('CSV import করা যায়নি। Header ও format পরীক্ষা করুন।'); }
  };

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



  const orderStatusLabels: Record<OrderStatus, string> = {
    pending: 'পেন্ডিং',
    confirmed: 'কনফার্মড',
    processing: 'প্রসেসিং',
    shipped: 'শিপড',
    delivered: 'ডেলিভারড',
    cancelled: 'বাতিল',
  };

  const getNextOrderStatuses = (status: OrderStatus): OrderStatus[] => {
    switch (status) {
      case 'pending':
        return ['confirmed', 'cancelled'];
      case 'confirmed':
        return ['processing', 'cancelled'];
      case 'processing':
        return ['shipped', 'cancelled'];
      case 'shipped':
        return ['delivered'];
      default:
        return [];
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    if (updatingOrderId) return;
    setUpdatingOrderId(orderId);
    try {
      const updatedStatus = await updateOrderStatus(orderId, status);
      if (updatedStatus) {
        setViewingOrder((current) =>
          current?.id === orderId ? { ...current, status: updatedStatus } : current
        );
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDeliveryEditStart = (order: Order) => {
    if (order.status === 'cancelled') {
      showToast('বাতিল অর্ডারের ডেলিভারি চার্জ পরিবর্তন করা যাবে না।');
      return;
    }
    setEditingDeliveryOrderId(order.id);
    setEditingDeliveryCharge(String(order.deliveryCharge || 0));
  };

  const handleDeliverySave = async () => {
    if (!viewingOrder || isSavingDelivery) return;
    const delivery = Number(editingDeliveryCharge);
    if (!Number.isFinite(delivery) || delivery < 0) {
      showToast('সঠিক ডেলিভারি চার্জ দিন।');
      return;
    }
    setIsSavingDelivery(true);
    try {
      const result = await updateOrderDelivery(viewingOrder.id, delivery);
      if (result) {
        setViewingOrder((current) => current?.id === viewingOrder.id
          ? { ...current, deliveryCharge: result.delivery, total: result.total }
          : current
        );
        setEditingDeliveryOrderId(null);
        setEditingDeliveryCharge('');
      }
    } finally {
      setIsSavingDelivery(false);
    }
  };

  const handleOrderAmountEditStart = (order: Order) => {
    if (order.status === 'cancelled') {
      showToast('বাতিল অর্ডারের অ্যামাউন্ট পরিবর্তন করা যাবে না।');
      return;
    }
    setEditingOrderAmountId(order.id);
    setEditingOrderAmount(String(order.total));
  };

  const handleOrderAmountSave = async () => {
    if (!viewingOrder || isSavingOrderAmount) return;
    const amount = Number(editingOrderAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      showToast('সঠিক অ্যামাউন্ট দিন।');
      return;
    }

    setIsSavingOrderAmount(true);
    try {
      const updatedTotal = await updateOrderAmount(viewingOrder.id, amount);
      if (updatedTotal !== null) {
        setViewingOrder((current) =>
          current?.id === viewingOrder.id ? { ...current, total: updatedTotal } : current
        );
        setEditingOrderAmountId(null);
        setEditingOrderAmount('');
      }
    } finally {
      setIsSavingOrderAmount(false);
    }
  };

  const handleRefreshOrders = async () => {
    if (isRefreshingOrders) return;
    setIsRefreshingOrders(true);
    try {
      await refreshOrders({
        status: orderStatusFilter,
        search: debouncedOrderSearchQuery,
        date: orderDateFilter,
        sort: orderSort,
        limit: ORDERS_PER_PAGE,
        offset: 0,
      });
    } finally {
      setIsRefreshingOrders(false);
    }
  };

  const handleLoadMoreOrders = async () => {
    if (isRefreshingOrders || isLoadingMoreOrders || !hasMoreOrders) return;
    setIsLoadingMoreOrders(true);
    try {
      const loaded = await refreshOrders({
        status: orderStatusFilter,
        search: debouncedOrderSearchQuery,
        date: orderDateFilter,
        sort: orderSort,
        limit: ORDERS_PER_PAGE,
        offset: orders.length,
      }, true);
      void loaded;
    } finally {
      setIsLoadingMoreOrders(false);
    }
  };

  // Dashboard statistics are returned from the same authoritative server query.
  const todayOrders = orderStats.todayOrders;
  const todayRevenue = orderStats.todayRevenue;
  const totalRevenue = orderStats.totalRevenue;
  const pendingCount = orderStats.pendingCount;
  const processingCount = orderStats.processingCount;
  const deliveredCount = orderStats.deliveredCount;
  const cancelledCount = orderStats.cancelledCount;

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
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.nameBn || editingProduct.price == null || Number(editingProduct.price) < 0) {
      showToast('পণ্যের নাম ও সঠিক মূল্য দিন');
      return;
    }

    const success = editingProduct.id
      ? await updateProduct(editingProduct.id, editingProduct)
      : await addProduct(editingProduct as any);

    if (!success) return;
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  // --- SAVE CATEGORY HANDLER ---
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.nameBn?.trim() || !editingCategory?.slug?.trim()) {
      showToast('ক্যাটাগরির নাম ও স্ল্যাগ দিন');
      return;
    }

    const result = editingCategory.id
      ? await updateCategory(editingCategory.id, editingCategory)
      : await addCategory(editingCategory as any);

    if (!result.success) return;
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  // --- SAVE SETTINGS HANDLER ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(settingsForm);
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          ['মোট অর্ডার', orders.length, 'text-stone-900'],
          ['আজকের অর্ডার', todayOrders, 'text-sky-700'],
          ['পেন্ডিং', pendingCount, 'text-amber-700'],
          ['প্রসেসিং', processingCount, 'text-indigo-700'],
          ['ডেলিভারড', deliveredCount, 'text-emerald-700'],
          ['বাতিল', cancelledCount, 'text-rose-700'],
        ].map(([label, value, tone]) => (
          <div key={String(label)} className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] text-stone-500 font-semibold block">{label}</span>
            <span className={'text-xl sm:text-2xl font-black ' + String(tone)}>{value}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] text-stone-500 font-semibold block">আজকের বিক্রি</span>
          <span className="text-xl font-black text-emerald-800">{formatPrice(todayRevenue)}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[11px] text-stone-500 font-semibold block">মোট বিক্রি (Revenue)</span>
          <span className="text-xl font-black text-stone-900">{formatPrice(totalRevenue)}</span>
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
          <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="search"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="অর্ডার নম্বর, নাম, ফোন বা ঠিকানা দিয়ে খুঁজুন..."
                className="w-full bg-stone-50 text-stone-900 text-xs sm:text-sm pl-9 pr-9 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
                aria-label="অর্ডার খুঁজুন"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {orderSearchQuery && (
                <button type="button" onClick={() => setOrderSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1" aria-label="অর্ডার সার্চ পরিষ্কার করুন">✕</button>
              )}
            </div>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="w-full sm:w-auto bg-stone-50 text-stone-800 text-xs px-3 py-2.5 rounded-xl border border-stone-300"
              aria-label="অর্ডার স্ট্যাটাস ফিল্টার"
            >
              <option value="all">সব স্ট্যাটাস</option>
              <option value="pending">পেন্ডিং</option>
              <option value="confirmed">কনফার্মড</option>
              <option value="processing">প্রসেসিং</option>
              <option value="shipped">শিপড</option>
              <option value="delivered">ডেলিভারড</option>
              <option value="cancelled">বাতিল</option>
            </select>
            <select value={orderDateFilter} onChange={(e) => setOrderDateFilter(e.target.value as typeof orderDateFilter)}
              className="w-full sm:w-auto bg-stone-50 text-stone-800 text-xs px-3 py-2.5 rounded-xl border border-stone-300" aria-label="তারিখ ফিল্টার">
              <option value="all">সব তারিখ</option>
              <option value="today">আজ</option>
              <option value="yesterday">গতকাল</option>
              <option value="7days">শেষ ৭ দিন</option>
              <option value="30days">শেষ ৩০ দিন</option>
            </select>
            <select value={orderSort} onChange={(e) => setOrderSort(e.target.value as typeof orderSort)}
              className="w-full sm:w-auto bg-stone-50 text-stone-800 text-xs px-3 py-2.5 rounded-xl border border-stone-300" aria-label="অর্ডার সাজান">
              <option value="newest">নতুন আগে</option>
              <option value="oldest">পুরোনো আগে</option>
              <option value="pending">Pending আগে</option>
            </select>
            <button type="button" onClick={() => void handleRefreshOrders()} disabled={isRefreshingOrders} className="w-full sm:w-auto px-3 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-stone-700 flex items-center justify-center gap-1.5">
              <RefreshCw className={'w-3.5 h-3.5 ' + (isRefreshingOrders ? 'animate-spin' : '')} />
              {isRefreshingOrders ? 'লোড হচ্ছে...' : 'রিফ্রেশ'}
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">
              এই ফিল্টারে কোনো অর্ডার পাওয়া যায়নি।
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedOrders.map((order) => {
                const nextStatuses = getNextOrderStatuses(order.status);
                const statusClass =
                  order.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                  order.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  order.status === 'delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  'bg-sky-50 text-sky-800 border-sky-200';

                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-stone-900">#{order.id}</span>
                          <span className={'px-2 py-1 rounded-full border text-[10px] font-bold ' + statusClass}>
                            {orderStatusLabels[order.status]}
                          </span>
                        </div>
                        <div className="text-xs text-stone-600 mt-1">{order.customerName} · {order.mobile}</div>
                        <div className="text-[11px] text-stone-500 mt-1 truncate">📍 {[order.address?.district, order.address?.upazilaThana, order.address?.area || order.address?.union].filter(Boolean).join(' → ') || order.address?.formattedFullAddress}</div>
                        <div className="text-[11px] text-stone-400 mt-1">
                          {new Date(order.createdAt).toLocaleString('bn-BD')} · {order.items.length}টি আইটেম
                        </div>
                      </div>

                      <div className="flex items-center justify-between lg:justify-end gap-3">
                        <div className="text-right">
                          <div className="text-[10px] text-stone-500">মোট</div>
                          <div className="font-black text-emerald-800">{formatPrice(order.total)}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setViewingOrder(order);
                            setViewingOrderHistory([]);
                            setIsLoadingOrderHistory(true);
                            void getOrderStatusHistory(order.id).then(setViewingOrderHistory).finally(() => setIsLoadingOrderHistory(false));
                          }}
                          className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> বিস্তারিত
                        </button>
                      </div>
                    </div>

                    {nextStatuses.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="text-[11px] font-semibold text-stone-500">পরবর্তী স্ট্যাটাস:</span>
                        <div className="flex flex-wrap gap-2">
                          {nextStatuses.map((nextStatus) => (
                            <button
                              key={nextStatus}
                              type="button"
                              onClick={() => {
                                if (nextStatus === 'cancelled' && !window.confirm('এই অর্ডারটি বাতিল করলে সংশ্লিষ্ট পণ্যের স্টক পুনরায় যোগ হবে। আপনি কি নিশ্চিত?')) return;
                                void handleOrderStatusChange(order.id, nextStatus);
                              }}
                              disabled={Boolean(updatingOrderId)}
                              className={'px-3 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-50 disabled:cursor-not-allowed ' + (
                                nextStatus === 'cancelled'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              )}
                            >
                              → {orderStatusLabels[nextStatus]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {hasMoreOrders && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => void handleLoadMoreOrders()}
                disabled={isLoadingMoreOrders}
                className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-stone-700"
              >
                {isLoadingMoreOrders ? 'অর্ডার লোড হচ্ছে...' : 'আরও অর্ডার দেখুন · ' + orders.length + '/' + orderStats.total}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. PRODUCTS TAB */}
      {/* ========================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-stone-900">পণ্য ব্যবস্থাপনা</h2>
              <p className="text-xs text-stone-500 mt-0.5">এখান থেকে নতুন পণ্য যোগ, সম্পাদনা ও আর্কাইভ করতে পারবেন।</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={exportProductsCsv} className="px-3 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-700 text-xs font-bold">Export CSV</button>
              <label className="px-3 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-700 text-xs font-bold cursor-pointer">Import CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)void importProductsCsv(file);e.currentTarget.value='';}}/></label>
              <button type="button" onClick={() => {
                setEditingProduct({
                  nameBn:'',nameEn:'',categoryId:categories[0]?.id||'',categoryIds:[],tags:[],price:0,regularPrice:0,stock:0,imageUrl:'',galleryUrls:[],shortDescription:'',descriptionBn:'',descriptionEn:'',specifications:[],variants:[],relatedProductIds:[],seoTitle:'',seoDescription:'',seoKeywords:[],isFeatured:false,isPopular:false,isNewArrival:false,isBestSeller:false,isSpecialOffer:false,isLimitedStock:false,isDraft:false,isActive:true,whatsappEnabled:true,lowStockThreshold:3,minOrderQty:1,unit:''
                });
                setIsProductModalOpen(true);
              }} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm"><Plus className="w-4 h-4"/> নতুন পণ্য যোগ করুন</button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="search"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="পণ্যের নাম, স্লাগ বা ক্যাটাগরি দিয়ে খুঁজুন..."
                  className="w-full bg-stone-50 text-stone-900 text-xs sm:text-sm pl-9 pr-9 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
                  aria-label="পণ্য খুঁজুন"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                {productSearchQuery && (
                  <button type="button" onClick={() => setProductSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1" aria-label="পণ্য সার্চ পরিষ্কার করুন">✕</button>
                )}
              </div>
              <select
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value as typeof productStatusFilter)}
                className="w-full sm:w-auto bg-stone-50 text-stone-800 text-xs px-3 py-2.5 rounded-xl border border-stone-300"
                aria-label="পণ্য স্ট্যাটাস ফিল্টার"
              >
                <option value="all">সব পণ্য</option>
                <option value="active">সক্রিয়</option>
                <option value="inactive">আর্কাইভ করা</option>
              </select>
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="w-full sm:w-auto bg-stone-50 text-stone-800 text-xs px-3 py-2.5 rounded-xl border border-stone-300"
                aria-label="পণ্য ক্যাটাগরি ফিল্টার"
              >
                <option value="all">সব ক্যাটাগরি</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.nameBn}</option>)}
              </select>
            </div>
            {filteredProducts.length > 0 && (
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={filteredProducts.every(p=>selectedProductIds.includes(p.id))} onChange={toggleAllVisibleProducts} className="w-4 h-4 accent-emerald-700"/>
                <span>দৃশ্যমান সব নির্বাচন</span>
              </div>
            )}
            {selectedProductIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-900">{selectedProductIds.length}টি নির্বাচিত</span>
                <button type="button" onClick={()=>void bulkSetProductStatus(true)} className="px-2.5 py-1.5 rounded-lg bg-white border text-xs font-bold">Active</button>
                <button type="button" onClick={()=>void bulkSetProductStatus(false)} className="px-2.5 py-1.5 rounded-lg bg-white border text-xs font-bold">Archive</button>
                <button type="button" onClick={()=>setSelectedProductIds([])} className="px-2.5 py-1.5 rounded-lg bg-white border text-xs font-bold">Clear</button>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
              <span>মোট: {products.length}</span>
              <span>·</span>
              <span>সক্রিয়: {products.filter((p) => p.isActive).length}</span>
              <span>·</span>
              <span>আর্কাইভ: {products.filter((p) => !p.isActive).length}</span>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">
              এই ফিল্টারে কোনো পণ্য পাওয়া যায়নি।
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProducts.map((product) => {
                const category = categories.find((cat) => cat.id === product.categoryId);
                return (
                  <div key={product.id} className={'bg-white rounded-2xl border p-3 shadow-2xs ' + (product.isActive ? 'border-stone-200' : 'border-amber-200 bg-amber-50/30')}>
                    <div className="flex gap-3">
                      <img src={product.imageUrl} alt={product.nameBn} className="w-20 h-20 rounded-xl object-cover bg-stone-100 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-bold text-stone-900 text-sm truncate">{product.nameBn}</h3>
                            <p className="text-[11px] text-stone-400 truncate">{product.nameEn || '—'}</p>
                          </div>
                          <span className={'shrink-0 px-2 py-1 rounded-full text-[10px] font-bold ' + (product.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
                            {product.isActive ? 'সক্রিয়' : 'আর্কাইভ'}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-stone-500">{category?.nameBn || 'ক্যাটাগরি নেই'} · স্টক {product.stock}</div>
                        <div className="mt-1 font-black text-emerald-800">{formatPrice(product.price)}</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setEditingProduct(product); setIsProductModalOpen(true); }}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-bold flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> সম্পাদনা
                      </button>
                      {product.isActive ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('এই পণ্যটি আর্কাইভ করলে এটি কাস্টমারদের কাছে আর দেখাবে না। পুরোনো অর্ডার ইতিহাস অক্ষুণ্ণ থাকবে। চালিয়ে যাবেন?')) {
                              void deleteProduct(product.id);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold flex items-center gap-1"
                        >
                          <EyeOff className="w-3.5 h-3.5" /> আর্কাইভ
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('এই পণ্যটি আবার সক্রিয় করে কাস্টমারদের জন্য প্রকাশ করবেন?')) {
                              void (async () => {
                                const success = await updateProduct(product.id, { isActive: true });
                                if (success) showToast('পণ্যটি আবার সক্রিয় করা হয়েছে।');
                              })();
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> পুনরায় চালু
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. INVENTORY TAB */}
      {/* ========================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input type="search" value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} placeholder="পণ্যের নাম দিয়ে স্টক খুঁজুন..." className="w-full bg-stone-50 text-stone-900 text-xs sm:text-sm pl-9 pr-9 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600" aria-label="স্টক পণ্য খুঁজুন" />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {inventorySearch && <button type="button" onClick={() => setInventorySearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs p-1" aria-label="স্টক সার্চ পরিষ্কার করুন">✕</button>}
            </div>
            <select value={inventoryFilter} onChange={(e) => setInventoryFilter(e.target.value as typeof inventoryFilter)} className="w-full sm:w-auto bg-stone-50 text-stone-800 text-xs px-3 py-2.5 rounded-xl border border-stone-300" aria-label="স্টক ফিল্টার">
              <option value="all">সব স্টক</option><option value="out">স্টক শেষ</option><option value="low">কম স্টক (নির্ধারিত সীমা অনুযায়ী)</option><option value="in">পর্যাপ্ত স্টক</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              ['মোট পণ্য', products.length, 'text-stone-900'],
              ['স্টক শেষ', products.filter(p => p.stock <= 0).length, 'text-rose-700'],
              ['কম স্টক', products.filter(p => p.stock > 0 && p.stock <= Math.max(1, p.lowStockThreshold ?? 3)).length, 'text-amber-700'],
            ].map(([label, value, cls]) => <div key={String(label)} className="bg-white rounded-2xl border border-stone-200 p-3"><div className="text-[10px] text-stone-500">{label}</div><div className={'text-lg sm:text-xl font-black ' + cls}>{value}</div></div>)}
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600"><tr><th className="p-3">পণ্য</th><th className="p-3">বর্তমান স্টক</th><th className="p-3">স্টক অবস্থা</th><th className="p-3 text-right">দ্রুত সমন্বয়</th></tr></thead>
                <tbody className="divide-y divide-stone-100">
                  {products.filter((prod) => {
                    const q = inventorySearch.trim().toLowerCase();
                    const threshold = Math.max(1, prod.lowStockThreshold ?? 3);
                    if (q && !prod.nameBn.toLowerCase().includes(q) && !prod.nameEn.toLowerCase().includes(q)) return false;
                    if (inventoryFilter === 'out') return prod.stock <= 0;
                    if (inventoryFilter === 'low') return prod.stock > 0 && prod.stock <= threshold;
                    if (inventoryFilter === 'in') return prod.stock > threshold;
                    return true;
                  }).map((prod) => {
                    const threshold = Math.max(1, prod.lowStockThreshold ?? 3);
                    const statusClass = prod.stock <= 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : prod.stock <= threshold ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    const statusText = prod.stock <= 0 ? 'স্টক শেষ' : prod.stock <= threshold ? `কম স্টক (≤${threshold})` : 'পর্যাপ্ত';
                    return <tr key={prod.id} className="hover:bg-stone-50/70">
                      <td className="p-3"><div className="flex items-center gap-2.5"><img src={prod.imageUrl} alt={prod.nameBn} className="w-10 h-10 rounded-lg object-cover bg-stone-100" /><div className="min-w-0"><div className="font-bold text-stone-900">{prod.nameBn}</div><div className="text-[11px] text-stone-400">{prod.nameEn || '—'}</div></div></div></td>
                      <td className="p-3 font-black text-stone-900">{prod.stock} {prod.unit || 'টি'}</td>
                      <td className="p-3"><span className={'inline-flex px-2 py-1 rounded-full border text-[11px] font-bold ' + statusClass}>{statusText}</span></td>
                      <td className="p-3 text-right"><div className="inline-flex items-center gap-1.5"><button type="button" disabled={prod.stock <= 0} onClick={() => { setStockEditorProductId(prod.id); setStockAdjustmentMode('remove'); setStockAdjustmentAmount('1'); setStockAdjustmentReason('manual_adjustment'); setStockAdjustmentNote(''); }} className="w-8 h-8 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold" title="১ কমান">−</button><button type="button" onClick={() => { setStockEditorProductId(prod.id); setStockAdjustmentMode('add'); setStockAdjustmentAmount('1'); setStockAdjustmentReason('restock'); setStockAdjustmentNote(''); }} className="w-8 h-8 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 font-bold" title="১ বাড়ান">+</button></div></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-stone-100">
              {products.filter((prod) => {
                const q = inventorySearch.trim().toLowerCase();
                if (q && !prod.nameBn.toLowerCase().includes(q) && !prod.nameEn.toLowerCase().includes(q)) return false;
                const threshold = Math.max(1, prod.lowStockThreshold ?? 3);
                if (inventoryFilter === 'out') return prod.stock <= 0;
                if (inventoryFilter === 'low') return prod.stock > 0 && prod.stock <= threshold;
                if (inventoryFilter === 'in') return prod.stock > threshold;
                return true;
              }).map((prod) => {
                const threshold = Math.max(1, prod.lowStockThreshold ?? 3);
                const statusText = prod.stock <= 0 ? 'স্টক শেষ' : prod.stock <= threshold ? `কম স্টক (≤${threshold})` : 'পর্যাপ্ত';
                const statusClass = prod.stock <= 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : prod.stock <= threshold ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200';
                return <div key={prod.id} className="p-3.5 space-y-3">
                  <div className="flex items-center gap-3"><img src={prod.imageUrl} alt={prod.nameBn} className="w-12 h-12 rounded-xl object-cover bg-stone-100 shrink-0" /><div className="min-w-0 flex-1"><div className="font-bold text-stone-900 truncate">{prod.nameBn}</div><div className="text-[11px] text-stone-400 truncate">{prod.nameEn || '—'}</div></div><span className={'shrink-0 px-2 py-1 rounded-lg border text-[10px] font-bold ' + statusClass}>{statusText}</span></div>
                  <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] text-stone-500">বর্তমান স্টক</div><div className="font-black text-stone-900">{prod.stock} {prod.unit || 'টি'}</div></div><div className="flex items-center gap-1.5"><button type="button" disabled={prod.stock <= 0} onClick={() => void adjustProductStock(prod.id, -1)} className="w-9 h-9 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold" aria-label={prod.nameBn + ' থেকে ১ কমান'}>−</button><button type="button" onClick={() => void adjustProductStock(prod.id, 1)} className="w-9 h-9 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 font-bold" aria-label={prod.nameBn + ' ১ বাড়ান'}>+</button></div></div>
                </div>;
              })}
            </div>
          </div>
        </div>
      )}

      {stockEditorProduct && (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="stock-editor-title">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-stone-200">
            <div className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 sm:px-5 py-4 flex items-center justify-between gap-3">
              <div className="min-w-0"><h3 id="stock-editor-title" className="font-black text-stone-900">স্টক সমন্বয়</h3><p className="text-xs text-stone-500 truncate">{stockEditorProduct.nameBn} · বর্তমান {stockEditorProduct.stock} {stockEditorProduct.unit || 'টি'}</p></div>
              <button type="button" onClick={() => setStockEditorProductId(null)} className="w-9 h-9 rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50" aria-label="স্টক সমন্বয় বন্ধ করুন">✕</button>
            </div>
            <div className="p-4 sm:p-5 space-y-5">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setStockAdjustmentMode('add')} className={'rounded-xl border px-3 py-2.5 text-sm font-bold ' + (stockAdjustmentMode === 'add' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-stone-700 border-stone-300')}>স্টক বাড়ান</button>
                <button type="button" onClick={() => setStockAdjustmentMode('remove')} className={'rounded-xl border px-3 py-2.5 text-sm font-bold ' + (stockAdjustmentMode === 'remove' ? 'bg-rose-700 text-white border-rose-700' : 'bg-white text-stone-700 border-stone-300')}>স্টক কমান</button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block"><span className="text-xs font-bold text-stone-700">পরিমাণ</span><input type="number" min="1" step="1" value={stockAdjustmentAmount} onChange={(e) => setStockAdjustmentAmount(e.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-bold focus:outline-hidden focus:border-emerald-600" /></label>
                <label className="block"><span className="text-xs font-bold text-stone-700">কারণ</span><select value={stockAdjustmentReason} onChange={(e) => setStockAdjustmentReason(e.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm"><option value="restock">নতুন স্টক এসেছে</option><option value="manual_adjustment">ম্যানুয়াল সমন্বয়</option><option value="damaged">নষ্ট/ক্ষতিগ্রস্ত</option><option value="correction">স্টক সংশোধন</option><option value="returned">রিটার্ন</option></select></label>
              </div>
              <label className="block"><span className="text-xs font-bold text-stone-700">নোট (ঐচ্ছিক)</span><textarea value={stockAdjustmentNote} onChange={(e) => setStockAdjustmentNote(e.target.value.slice(0, 300))} rows={2} placeholder="যেমন: আজকের নতুন চালান, ইনভয়েস নম্বর..." className="mt-1.5 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm resize-none focus:outline-hidden focus:border-emerald-600" /></label>
              <div className="rounded-xl bg-stone-50 border border-stone-200 p-3"><div className="flex items-center justify-between gap-3"><span className="text-stone-500">পরবর্তী স্টক</span><strong className="text-lg text-stone-900">{Math.max(0, stockEditorProduct.stock + (stockAdjustmentMode === 'add' ? 1 : -1) * Math.max(0, Math.floor(Number(stockAdjustmentAmount) || 0)))} {stockEditorProduct.unit || 'টি'}</strong></div></div>
              <button type="button" disabled={isStockSaving || !Number.isInteger(Number(stockAdjustmentAmount)) || Number(stockAdjustmentAmount) < 1 || (stockAdjustmentMode === 'remove' && Number(stockAdjustmentAmount) > stockEditorProduct.stock)} onClick={() => { const amount = Math.floor(Number(stockAdjustmentAmount)); if (!Number.isInteger(amount) || amount < 1) return; const delta = stockAdjustmentMode === 'add' ? amount : -amount; void (async () => { setIsStockSaving(true); const success = await adjustProductStock(stockEditorProduct.id, delta, stockAdjustmentReason, stockAdjustmentNote); setIsStockSaving(false); if (success) setStockHistory(await getProductStockHistory(stockEditorProduct.id, 30)); })(); }} className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3">{isStockSaving ? 'সংরক্ষণ হচ্ছে...' : stockAdjustmentMode === 'add' ? 'স্টক বাড়িয়ে সংরক্ষণ করুন' : 'স্টক কমিয়ে সংরক্ষণ করুন'}</button>
              <div><div className="flex items-center justify-between gap-3 mb-2"><h4 className="text-sm font-black text-stone-900">সাম্প্রতিক স্টক ইতিহাস</h4><span className="text-[10px] text-stone-400">সর্বশেষ ৩০টি</span></div>
                {isStockHistoryLoading ? <div className="py-6 text-center text-xs text-stone-500">ইতিহাস লোড হচ্ছে...</div> : stockHistory.length === 0 ? <div className="py-6 text-center text-xs text-stone-500 border border-dashed border-stone-200 rounded-xl">এখনও কোনো স্টক পরিবর্তনের ইতিহাস নেই।</div> : <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">{stockHistory.map((movement) => <div key={movement.id} className="p-3 flex items-center justify-between gap-3"><div className="min-w-0"><div className="text-xs font-bold text-stone-800">{movement.reason === 'restock' ? 'নতুন স্টক' : movement.reason === 'damaged' ? 'নষ্ট/ক্ষতিগ্রস্ত' : movement.reason === 'correction' ? 'স্টক সংশোধন' : movement.reason === 'returned' ? 'রিটার্ন' : 'ম্যানুয়াল সমন্বয়'}</div><div className="text-[10px] text-stone-400 truncate">{movement.note || 'কোনো নোট নেই'} · {new Date(movement.createdAt).toLocaleString('bn-BD')}</div></div><div className="text-right shrink-0"><div className={'font-black ' + (movement.delta > 0 ? 'text-emerald-700' : 'text-rose-700')}>{movement.delta > 0 ? '+' : ''}{movement.delta}</div><div className="text-[10px] text-stone-400">{movement.previousStock} → {movement.newStock}</div></div></div>)}</div>}
              </div>
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
        <form
          onSubmit={handleSaveSettings}
          className="bg-white p-4 sm:p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-7 max-w-5xl"
        >
          <div>
            <h2 className="text-lg font-black text-stone-900">দোকানের পূর্ণাঙ্গ সেটিংস</h2>
            <p className="text-xs text-stone-500 mt-1">দোকান, ডেলিভারি, COD, অর্ডার, হোমপেজ, SEO ও স্টোর স্ট্যাটাস এক জায়গা থেকে নিয়ন্ত্রণ করুন।</p>
          </div>

          {/* General + contact */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-stone-900 border-b border-stone-100 pb-2">১. সাধারণ ও যোগাযোগ</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['দোকানের নাম', 'shopName', 'text'],
                ['ট্যাগলাইন', 'tagline', 'text'],
                ['লোগো URL', 'logoUrl', 'url'],
                ['Favicon URL', 'faviconUrl', 'url'],
                ['ইমেইল', 'email', 'email'],
                ['WhatsApp (8801XXXXXXXXX)', 'whatsappNumber', 'text'],
                ['ফোন/হেল্পলাইন', 'contactNumber', 'text'],
                ['Google Maps URL', 'mapUrl', 'url'],
                ['ব্যবসার সময়', 'businessHours', 'text'],
                ['Support Hours', 'supportHours', 'text'],
              ].map(([label, key, type]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">{label}</label>
                  <input
                    type={type}
                    value={String((settingsForm as any)[key] ?? '')}
                    onChange={(e) => setSettingsForm({ ...settingsForm, [key]: e.target.value } as any)}
                    className="w-full bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300"
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">দোকানের ঠিকানা</label>
                <input type="text" value={settingsForm.shopAddress || ''} onChange={(e) => setSettingsForm({ ...settingsForm, shopAddress: e.target.value })} className="w-full bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">Facebook Page</label>
                <input type="url" value={settingsForm.facebookPage || ''} onChange={(e) => setSettingsForm({ ...settingsForm, facebookPage: e.target.value })} className="w-full bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300" />
              </div>
            </div>
          </section>

          {/* Delivery */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-stone-900 border-b border-stone-100 pb-2">২. ডেলিভারি কনফিগারেশন</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                ['ঢাকা চার্জ (৳)', 'deliveryChargeDhaka'],
                ['ঢাকার বাইরে চার্জ (৳)', 'deliveryChargeOutsideDhaka'],
                ['ফ্রি ডেলিভারি থ্রেশহোল্ড (৳)', 'freeDeliveryThreshold'],
                ['ন্যূনতম অর্ডার (৳)', 'minimumOrderAmount'],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">{label}</label>
                  <input type="number" min="0" value={Number((settingsForm as any)[key] ?? 0)} onChange={(e) => setSettingsForm({ ...settingsForm, [key]: Number(e.target.value) } as any)} className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">ঢাকায় আনুমানিক সময়</label>
                <input value={settingsForm.estimatedDeliveryDhaka || ''} onChange={(e) => setSettingsForm({ ...settingsForm, estimatedDeliveryDhaka: e.target.value })} className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">সারাদেশে আনুমানিক সময়</label>
                <input value={settingsForm.estimatedDeliveryOutsideDhaka || ''} onChange={(e) => setSettingsForm({ ...settingsForm, estimatedDeliveryOutsideDhaka: e.target.value })} className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-stone-700 mb-1">ডেলিভারি কভারেজ</label>
                <input value={settingsForm.deliveryCoverage || ''} onChange={(e) => setSettingsForm({ ...settingsForm, deliveryCoverage: e.target.value })} className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300" />
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <label className="flex items-center gap-2"><input type="checkbox" checked={settingsForm.sameDayDelivery === true} onChange={(e) => setSettingsForm({ ...settingsForm, sameDayDelivery: e.target.checked })} className="w-4 h-4 accent-emerald-700" /> Same-day delivery</label>
            </div>
          </section>

          {/* COD only */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-stone-900 border-b border-stone-100 pb-2">৩. পেমেন্ট — শুধু Cash on Delivery</h3>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black">৳</div>
                <div>
                  <div className="font-bold text-sm text-stone-900">Cash on Delivery</div>
                  <div className="text-xs text-stone-600">bKash, Nagad, Rocket, Bank ও Card Payment এখানে রাখা হবে না।</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">COD সর্বনিম্ন অর্ডার (৳)</label>
                  <input type="number" min="0" value={Number(settingsForm.codMinimumOrder ?? 0)} onChange={(e) => setSettingsForm({ ...settingsForm, codMinimumOrder: Number(e.target.value), cashOnDeliveryEnabled: true })} className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">COD সর্বোচ্চ অর্ডার (৳, 0 = সীমা নেই)</label>
                  <input type="number" min="0" value={Number(settingsForm.codMaximumOrder ?? 0)} onChange={(e) => setSettingsForm({ ...settingsForm, codMaximumOrder: Number(e.target.value), cashOnDeliveryEnabled: true })} className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300" />
                </div>
                <div className="flex items-end">
                  <div className="w-full rounded-xl bg-white border border-emerald-200 px-3 py-2.5 text-xs font-bold text-emerald-800">✓ Cash on Delivery সক্রিয়</div>
                </div>
              </div>
              <textarea value={settingsForm.codInstructions || ''} onChange={(e) => setSettingsForm({ ...settingsForm, codInstructions: e.target.value })} placeholder="COD নির্দেশনা" className="w-full mt-3 min-h-20 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300" />
            </div>
          </section>

          {/* Orders */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-stone-900 border-b border-stone-100 pb-2">৪. অর্ডার সেটিংস</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Cancellation Window (মিনিট)</label>
                <input type="number" min="0" value={Number(settingsForm.customerCancellationMinutes ?? 30)} onChange={(e) => setSettingsForm({ ...settingsForm, customerCancellationMinutes: Number(e.target.value) })} className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold pt-6"><input type="checkbox" checked={settingsForm.orderAutoConfirm === true} onChange={(e) => setSettingsForm({ ...settingsForm, orderAutoConfirm: e.target.checked })} className="w-4 h-4 accent-emerald-700" /> অটো Confirm</label>
            </div>
            <textarea value={settingsForm.orderConfirmationMessage || ''} onChange={(e) => setSettingsForm({ ...settingsForm, orderConfirmationMessage: e.target.value })} placeholder="অর্ডার কনফার্মেশন মেসেজ" className="w-full min-h-20 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300" />
          </section>

          {/* Product display */}
          <section className="space-y-3">
            <h3 className="text-sm font-black text-stone-900 border-b border-stone-100 pb-2">৫. পণ্য প্রদর্শন</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                ['outOfStockVisible', 'Out-of-stock পণ্য দেখান'],
                ['stockQuantityVisible', 'স্টক সংখ্যা দেখান'],
                ['skuVisible', 'SKU দেখান'],
                ['lowStockWarningVisible', 'Low-stock warning দেখান'],
                ['productReviewsEnabled', 'Product reviews চালু'],
                ['wishlistEnabled', 'Wishlist চালু'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={(settingsForm as any)[key] === true} onChange={(e) => setSettingsForm({ ...settingsForm, [key]: e.target.checked } as any)} className="w-4 h-4 accent-emerald-700" /> {label}</label>
              ))}
            </div>
          </section>

          {/* Homepage */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-stone-900 border-b border-stone-100 pb-2">৬. হোমপেজ</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['হিরো টাইটেল', 'heroTitle'], ['হিরো সাবটাইটেল', 'heroSubtitle'],
                ['Hero Image URL', 'heroImageUrl'], ['Hero Button Text', 'heroButtonText'], ['Hero Button Link', 'heroButtonLink'],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">{label}</label>
                  <input value={String((settingsForm as any)[key] ?? '')} onChange={(e) => setSettingsForm({ ...settingsForm, [key]: e.target.value } as any)} className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300" />
                </div>
              ))}
              <label className="flex items-center gap-2 text-xs font-semibold pt-6"><input type="checkbox" checked={settingsForm.categorySectionEnabled !== false} onChange={(e) => setSettingsForm({ ...settingsForm, categorySectionEnabled: e.target.checked })} className="w-4 h-4 accent-emerald-700" /> Category section চালু</label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['Featured', 'featuredProductsCount'], ['Popular', 'popularProductsCount'], ['New Arrival', 'newArrivalProductsCount'], ['Best Seller', 'bestSellerProductsCount'],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold mb-1">{label} কতটি</label>
                  <input type="number" min="0" value={Number((settingsForm as any)[key] ?? 8)} onChange={(e) => setSettingsForm({ ...settingsForm, [key]: Number(e.target.value) } as any)} className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300" />
                </div>
              ))}
            </div>
          </section>

          {/* Announcement + social */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-stone-900 border-b border-stone-100 pb-2">৭. Announcement ও Social</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Announcement text" value={settingsForm.announcementText || ''} onChange={(e) => setSettingsForm({ ...settingsForm, announcementText: e.target.value })} className="text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
              <input placeholder="Announcement link" value={settingsForm.announcementLink || ''} onChange={(e) => setSettingsForm({ ...settingsForm, announcementLink: e.target.value })} className="text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
              <input placeholder="Instagram URL" value={settingsForm.instagramPage || ''} onChange={(e) => setSettingsForm({ ...settingsForm, instagramPage: e.target.value })} className="text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
              <input placeholder="YouTube URL" value={settingsForm.youtubeChannel || ''} onChange={(e) => setSettingsForm({ ...settingsForm, youtubeChannel: e.target.value })} className="text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
              <input placeholder="TikTok URL" value={settingsForm.tiktokPage || ''} onChange={(e) => setSettingsForm({ ...settingsForm, tiktokPage: e.target.value })} className="text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
              <input placeholder="Messenger URL" value={settingsForm.messengerUrl || ''} onChange={(e) => setSettingsForm({ ...settingsForm, messengerUrl: e.target.value })} className="text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
              <input type="datetime-local" value={settingsForm.announcementStartAt || ''} onChange={(e) => setSettingsForm({ ...settingsForm, announcementStartAt: e.target.value })} className="text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
              <input type="datetime-local" value={settingsForm.announcementEndAt || ''} onChange={(e) => setSettingsForm({ ...settingsForm, announcementEndAt: e.target.value })} className="text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <label className="flex items-center gap-2"><input type="checkbox" checked={settingsForm.isAnnouncementActive === true} onChange={(e) => setSettingsForm({ ...settingsForm, isAnnouncementActive: e.target.checked })} className="w-4 h-4 accent-emerald-700" /> Announcement চালু</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={settingsForm.floatingWhatsappEnabled !== false} onChange={(e) => setSettingsForm({ ...settingsForm, floatingWhatsappEnabled: e.target.checked })} className="w-4 h-4 accent-emerald-700" /> Floating WhatsApp</label>
            </div>
          </section>

          {/* SEO */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-stone-900 border-b border-stone-100 pb-2">৮. SEO ও Analytics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="SEO Title" value={settingsForm.seoTitle || ''} onChange={(e) => setSettingsForm({ ...settingsForm, seoTitle: e.target.value })} className="text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
              <input placeholder="Canonical URL" value={settingsForm.canonicalUrl || ''} onChange={(e) => setSettingsForm({ ...settingsForm, canonicalUrl: e.target.value })} className="text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
              <input placeholder="OG Title" value={settingsForm.ogTitle || ''} onChange={(e) => setSettingsForm({ ...settingsForm, ogTitle: e.target.value })} className="text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
              <input placeholder="OG Image URL" value={settingsForm.ogImageUrl || ''} onChange={(e) => setSettingsForm({ ...settingsForm, ogImageUrl: e.target.value })} className="text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
              <input placeholder="Google Site Verification" value={settingsForm.googleSiteVerification || ''} onChange={(e) => setSettingsForm({ ...settingsForm, googleSiteVerification: e.target.value })} className="text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
              <input placeholder="Google Analytics ID (G-XXXXXXXXXX)" value={settingsForm.googleAnalyticsId || ''} onChange={(e) => setSettingsForm({ ...settingsForm, googleAnalyticsId: e.target.value })} className="text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
              <input placeholder="Facebook Pixel ID" value={settingsForm.facebookPixelId || ''} onChange={(e) => setSettingsForm({ ...settingsForm, facebookPixelId: e.target.value })} className="text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
            </div>
            <textarea placeholder="SEO Description" value={settingsForm.seoDescription || ''} onChange={(e) => setSettingsForm({ ...settingsForm, seoDescription: e.target.value })} className="w-full min-h-20 text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
            <input placeholder="SEO Keywords — comma separated" value={(settingsForm.seoKeywords || []).join(', ')} onChange={(e) => setSettingsForm({ ...settingsForm, seoKeywords: e.target.value.split(',').map(v => v.trim()).filter(Boolean) })} className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
          </section>

          {/* Invoice + policy */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-stone-900 border-b border-stone-100 pb-2">৯. Invoice ও Policy</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Invoice Prefix" value={settingsForm.invoicePrefix || ''} onChange={(e) => setSettingsForm({ ...settingsForm, invoicePrefix: e.target.value })} className="text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
              <input placeholder="Invoice Footer" value={settingsForm.invoiceFooter || ''} onChange={(e) => setSettingsForm({ ...settingsForm, invoiceFooter: e.target.value })} className="text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
            </div>
            <textarea placeholder="Return Policy" value={settingsForm.returnPolicy || ''} onChange={(e) => setSettingsForm({ ...settingsForm, returnPolicy: e.target.value })} className="w-full min-h-20 text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
            <textarea placeholder="Terms & Conditions" value={settingsForm.termsAndConditions || ''} onChange={(e) => setSettingsForm({ ...settingsForm, termsAndConditions: e.target.value })} className="w-full min-h-20 text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
            <textarea placeholder="Footer Notice" value={settingsForm.footerNotice || ''} onChange={(e) => setSettingsForm({ ...settingsForm, footerNotice: e.target.value })} className="w-full min-h-20 text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
          </section>

          {/* Store status */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-stone-900 border-b border-stone-100 pb-2">১০. Store Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                ['open', '🟢 Open — অর্ডার চালু'],
                ['closed', '🟠 Closed — অর্ডার বন্ধ'],
                ['maintenance', '🔴 Maintenance — অর্ডার বন্ধ'],
              ].map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 rounded-xl border border-stone-200 p-3 text-xs font-bold cursor-pointer">
                  <input type="radio" name="storeStatus" value={value} checked={(settingsForm.storeStatus || 'open') === value} onChange={() => setSettingsForm({ ...settingsForm, storeStatus: value as any, isStoreOpen: value === 'open' })} className="accent-emerald-700" />
                  {label}
                </label>
              ))}
            </div>
            <textarea placeholder="Closed message" value={settingsForm.storeClosedMessage || ''} onChange={(e) => setSettingsForm({ ...settingsForm, storeClosedMessage: e.target.value })} className="w-full min-h-16 text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
            <textarea placeholder="Maintenance message" value={settingsForm.maintenanceMessage || ''} onChange={(e) => setSettingsForm({ ...settingsForm, maintenanceMessage: e.target.value })} className="w-full min-h-16 text-xs px-3.5 py-2.5 rounded-xl border border-stone-300" />
          </section>

          <button
            type="submit"
            className="sticky bottom-3 w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-black py-3 px-7 rounded-xl text-sm transition-colors shadow-lg"
          >
            সব সেটিংস সংরক্ষণ করুন
          </button>
        </form>
      )}

      {/* ========================================================= */}
      {/* VIEW ORDER DETAILS MODAL */}
      {/* ========================================================= */}
      {viewingOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-order-details-title"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setViewingOrder(null); }}
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-5 sm:px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <div className="min-w-0">
                <h3 id="admin-order-details-title" className="text-lg font-black text-stone-900 truncate">
                  অর্ডার #{viewingOrder.id}
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {new Date(viewingOrder.createdAt).toLocaleString('bn-BD')} · {orderStatusLabels[viewingOrder.status]}
                </p>
              </div>
              <button type="button" onClick={() => setViewingOrder(null)} className="text-stone-400 hover:text-stone-700 p-2 rounded-xl hover:bg-stone-100" aria-label="অর্ডার বন্ধ করুন">✕</button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center"><Phone className="w-4 h-4" /></div>
                    <div>
                      <p className="text-[10px] text-stone-500 font-semibold">গ্রাহক</p>
                      <p className="text-sm font-black text-stone-900">{viewingOrder.customerName}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={'tel:' + viewingOrder.mobile} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 text-white text-[11px] font-bold">
                      <Phone className="w-3.5 h-3.5" /> কল
                    </a>
                    <a
                      href={'https://wa.me/' + viewingOrder.mobile.replace(/\D/g, '')}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 text-white text-[11px] font-bold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  </div>
                  {viewingOrder.altMobile && <p className="text-[11px] text-stone-500 mt-3">বিকল্প নম্বর: {viewingOrder.altMobile}</p>}
                </div>

                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <p className="text-[10px] text-stone-500 font-semibold mb-1">পেমেন্ট</p>
                  <p className="text-sm font-black text-stone-900">Cash on Delivery</p>
                  <p className="text-[11px] text-stone-500 mt-2">পেমেন্ট স্ট্যাটাস: অর্ডার ডেলিভারি অনুযায়ী পরিচালিত হবে</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h4 className="font-black text-sm text-stone-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-700" /> ডেলিভারি ঠিকানা</h4>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-stone-100 text-stone-600">{viewingOrder.address.locationType === 'urban' ? 'শহর' : 'গ্রাম'}</span>
                </div>
                <div className="text-xs text-stone-700 leading-6">
                  <p><strong>বিভাগ:</strong> {viewingOrder.address.division || '—'}</p>
                  <p><strong>জেলা:</strong> {viewingOrder.address.district || '—'}</p>
                  <p><strong>উপজেলা/থানা:</strong> {viewingOrder.address.upazilaThana || '—'}</p>
                  {(viewingOrder.address.area || viewingOrder.address.union || viewingOrder.address.village) && (
                    <p><strong>এলাকা:</strong> {[viewingOrder.address.area, viewingOrder.address.union, viewingOrder.address.village].filter(Boolean).join(' · ')}</p>
                  )}
                  <p><strong>বিস্তারিত:</strong> {viewingOrder.address.detailedAddress || viewingOrder.address.formattedFullAddress || '—'}</p>
                </div>
              </div>

              {viewingOrder.orderNote && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-amber-800 mb-1">📝 Customer Note</p>
                  <p className="text-xs text-amber-900 leading-5">{viewingOrder.orderNote}</p>
                </div>
              )}

              <div>
                <h4 className="font-black text-sm text-stone-900 mb-2">পণ্যের তালিকা ({viewingOrder.items.length})</h4>
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden">
                  {viewingOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={item.imageUrl} alt="" className="w-11 h-11 rounded-xl object-cover bg-stone-100 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-stone-900 truncate">{item.nameBn}</p>
                          <p className="text-[11px] text-stone-500">{formatPrice(item.price)} × {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-black text-stone-900 shrink-0">{formatPrice(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-stone-500">পণ্যের মোট</span><strong>{formatPrice(viewingOrder.subtotal)}</strong></div>
                <div className="flex justify-between items-center gap-3">
                  <span className="text-stone-500">ডেলিভারি চার্জ</span>
                  {editingDeliveryOrderId === viewingOrder.id ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 text-xs">৳</span>
                        <input
                          type="number" min="0" step="0.01" autoFocus
                          value={editingDeliveryCharge}
                          onChange={(e) => setEditingDeliveryCharge(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void handleDeliverySave();
                            if (e.key === 'Escape') { setEditingDeliveryOrderId(null); setEditingDeliveryCharge(''); }
                          }}
                          disabled={isSavingDelivery}
                          className="w-28 pl-6 pr-2 py-1.5 rounded-lg border border-emerald-300 bg-white text-right font-bold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                        />
                      </div>
                      <button type="button" onClick={() => void handleDeliverySave()} disabled={isSavingDelivery} className="px-2.5 py-1.5 rounded-lg bg-emerald-700 text-white text-[11px] font-bold disabled:opacity-50">{isSavingDelivery ? 'সংরক্ষণ...' : 'সংরক্ষণ'}</button>
                      <button type="button" onClick={() => { setEditingDeliveryOrderId(null); setEditingDeliveryCharge(''); }} disabled={isSavingDelivery} className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-600 text-[11px] font-bold disabled:opacity-50">বাতিল</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <strong>{formatPrice(viewingOrder.deliveryCharge)}</strong>
                      {viewingOrder.status !== 'cancelled' && (
                        <button type="button" onClick={() => handleDeliveryEditStart(viewingOrder)} className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-100" title="ডেলিভারি চার্জ এডিট করুন" aria-label="ডেলিভারি চার্জ এডিট করুন">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-stone-200 text-sm gap-3">
                  <span className="font-bold">সর্বমোট</span>
                  {editingOrderAmountId === viewingOrder.id ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 text-xs">৳</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingOrderAmount}
                          onChange={(e) => setEditingOrderAmount(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void handleOrderAmountSave();
                            if (e.key === 'Escape') { setEditingOrderAmountId(null); setEditingOrderAmount(''); }
                          }}
                          disabled={isSavingOrderAmount}
                          autoFocus
                          className="w-32 pl-6 pr-2 py-1.5 rounded-lg border border-emerald-300 bg-white text-right font-black text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleOrderAmountSave()}
                        disabled={isSavingOrderAmount}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-700 text-white text-[11px] font-bold disabled:opacity-50"
                      >
                        {isSavingOrderAmount ? 'সংরক্ষণ...' : 'সংরক্ষণ'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingOrderAmountId(null); setEditingOrderAmount(''); }}
                        disabled={isSavingOrderAmount}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-600 text-[11px] font-bold disabled:opacity-50"
                      >
                        বাতিল
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <strong className="text-emerald-800">{formatPrice(viewingOrder.total)}</strong>
                      {viewingOrder.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => handleOrderAmountEditStart(viewingOrder)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-100"
                          title="অর্ডারের মোট অ্যামাউন্ট এডিট করুন"
                          aria-label="অর্ডারের মোট অ্যামাউন্ট এডিট করুন"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-stone-400 pt-1">প্রয়োজনে সর্বমোট অ্যামাউন্ট পরিবর্তন করে সংরক্ষণ করতে পারবেন।</p>
              </div>

              <div className="border border-stone-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-black text-sm text-stone-900 flex items-center gap-2"><Truck className="w-4 h-4 text-emerald-700" /> ট্র্যাকিং টাইমলাইন</h4>
                  {isLoadingOrderHistory && <span className="text-[10px] text-stone-400">লোড হচ্ছে...</span>}
                </div>
                {viewingOrderHistory.length > 0 ? (
                  <div className="space-y-3">
                    {viewingOrderHistory.map((entry, index) => {
                      const isLast = index === viewingOrderHistory.length - 1;
                      return (
                        <div key={entry.changedAt + entry.status} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={'w-8 h-8 rounded-full flex items-center justify-center ' + (isLast ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700')}>
                              {entry.status === 'shipped' ? <Truck className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </div>
                            {!isLast && <div className="w-px h-6 bg-stone-200 mt-1" />}
                          </div>
                          <div className="pb-1">
                            <p className="text-xs font-bold text-stone-900">{orderStatusLabels[entry.status]}</p>
                            <p className="text-[11px] text-stone-500 mt-0.5">{new Date(entry.changedAt).toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500">{isLoadingOrderHistory ? 'অর্ডারের ট্র্যাকিং ইতিহাস আনা হচ্ছে...' : 'কোনো ট্র্যাকিং ইতিহাস পাওয়া যায়নি।'}</p>
                )}
              </div>

              <div className="border border-stone-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-black text-sm text-stone-900">অর্ডার স্ট্যাটাস</h4>
                  <span className="text-[10px] font-bold text-stone-500">বর্তমান: {orderStatusLabels[viewingOrder.status]}</span>
                </div>
                {getNextOrderStatuses(viewingOrder.status).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {getNextOrderStatuses(viewingOrder.status).map((nextStatus) => (
                      <button
                        key={nextStatus}
                        type="button"
                        disabled={Boolean(updatingOrderId)}
                        onClick={() => {
                          if (nextStatus === 'cancelled' && !window.confirm('এই অর্ডারটি বাতিল করলে সংশ্লিষ্ট পণ্যের স্টক পুনরায় যোগ হবে। আপনি কি নিশ্চিত?')) return;
                          void handleOrderStatusChange(viewingOrder.id, nextStatus);
                        }}
                        className={'px-3 py-2 rounded-xl text-[11px] font-bold border disabled:opacity-50 disabled:cursor-not-allowed ' + (
                          nextStatus === 'cancelled'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        )}
                      >
                        {updatingOrderId === viewingOrder.id ? 'আপডেট হচ্ছে...' : '→ ' + orderStatusLabels[nextStatus]}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500">এই অর্ডারের জন্য আর কোনো status transition নেই।</p>
                )}
              </div>

              <div className="flex flex-wrap justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!['confirmed', 'processing', 'shipped', 'delivered'].includes(viewingOrder.status)) {
                      showToast('অর্ডার Confirmed হওয়ার পর ইনভয়েস পাওয়া যাবে');
                      return;
                    }
                    setInvoiceOrder(viewingOrder);
                  }}
                  disabled={!['confirmed', 'processing', 'shipped', 'delivered'].includes(viewingOrder.status)}
                  className="bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed text-stone-800 text-xs px-3 py-2 rounded-xl flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> ইনভয়েস দেখুন
                </button>
                <button type="button" onClick={() => setViewingOrder(null)} className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-4 py-2 rounded-xl font-bold">
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {invoiceOrder && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-stone-100 rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-stone-200 bg-white shrink-0">
              <div>
                <h3 className="font-black text-stone-900">Professional Invoice</h3>
                <p className="text-[11px] text-stone-500">অর্ডারের সম্পূর্ণ ইনভয়েস</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => {
                  const invoice = document.getElementById('halal-shop-print-invoice');
                  if (!invoice) return;
                  const printWindow = window.open('', '_blank', 'width=900,height=1000');
                  if (!printWindow) { showToast('Print window খুলতে পারেনি। Browser popup allow করুন।'); return; }
                  printWindow.document.write('<!doctype html><html><head><title>Invoice - ' + invoiceOrder.id + '</title><style>\n*{box-sizing:border-box}body{margin:0;background:#f5f5f4;font-family:Arial,"Noto Sans Bengali",sans-serif;color:#292524}.sheet{width:210mm;min-height:297mm;margin:20px auto;background:#fff;padding:18mm 16mm;box-shadow:0 2px 18px rgba(0,0,0,.08)}.top{display:flex;justify-content:space-between;gap:30px;border-bottom:3px solid #047857;padding-bottom:18px}.brand{display:flex;gap:14px;align-items:center}.logo{width:62px;height:62px;object-fit:contain;border-radius:12px}.shop{font-size:22px;font-weight:800}.muted{color:#78716c;font-size:12px;line-height:1.6}.invoice-title{text-align:right}.invoice-title h1{margin:0;font-size:30px;letter-spacing:2px}.invoice-title div{font-size:12px;color:#78716c;margin-top:5px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin:25px 0}.label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#a8a29e;font-weight:700;margin-bottom:5px}.value{font-size:13px;font-weight:700}.address{font-size:12px;line-height:1.7;color:#57534e}.items{width:100%;border-collapse:collapse;margin-top:8px}.items th{background:#064e3b;color:#fff;text-align:left;padding:10px;font-size:11px}.items td{padding:10px;border-bottom:1px solid #e7e5e4;font-size:12px}.items th:last-child,.items td:last-child{text-align:right}.items th:nth-child(3),.items td:nth-child(3),.items th:nth-child(4),.items td:nth-child(4){text-align:right}.summary{margin-left:auto;width:280px;margin-top:20px}.row{display:flex;justify-content:space-between;padding:6px 0;font-size:12px}.total{margin-top:6px;padding:12px 0;border-top:2px solid #064e3b;font-size:18px;font-weight:800}.total strong{color:#047857}.footer{margin-top:45px;padding-top:15px;border-top:1px solid #e7e5e4;text-align:center;font-size:11px;color:#78716c}@media print{body{background:#fff}.sheet{margin:0;box-shadow:none;width:210mm;min-height:297mm}}\n</style></head><body>' + invoice.outerHTML + '</body></html>');
                  printWindow.document.close();
                  printWindow.focus();
                  const printImages = Array.from(printWindow.document.images);
                  Promise.all(printImages.map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => {
                    image.addEventListener('load', () => resolve(), { once: true });
                    image.addEventListener('error', () => resolve(), { once: true });
                  }))).then(() => {
                    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
                  });
                }} className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"><FileText className="w-4 h-4" /> Print / PDF</button>
                <button type="button" onClick={() => setInvoiceOrder(null)} className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold">✕</button>
              </div>
            </div>
            <div className="overflow-y-auto p-3 sm:p-6">
              <div id="halal-shop-print-invoice" className="sheet bg-white max-w-[210mm] min-h-[297mm] mx-auto p-6 sm:p-10 shadow-xl text-stone-800">
                <div className="top flex justify-between gap-6 border-b-[3px] border-emerald-700 pb-5">
                  <div className="brand flex items-center gap-4">
                    <img src={invoiceLogoSrc} alt={settings.shopName} className="logo w-16 h-16 object-contain rounded-xl" />
                    <div><div className="shop text-xl sm:text-2xl font-black">{settings.shopName}</div><div className="muted text-xs mt-1">{settings.tagline}</div><div className="muted text-xs mt-1">{settings.shopAddress}</div><div className="muted text-xs">{settings.contactNumber}</div></div>
                  </div>
                  <div className="invoice-title text-right shrink-0"><h1 className="text-3xl font-black tracking-widest text-stone-900">INVOICE</h1><div className="text-xs text-stone-500 mt-1">#{invoiceOrder.id}</div><div className="text-xs text-stone-500 mt-1">{new Date(invoiceOrder.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</div></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-7">
                  <div><div className="label text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Bill To</div><div className="value font-bold">{invoiceOrder.customerName}</div><div className="muted text-xs mt-1">{invoiceOrder.mobile}{invoiceOrder.altMobile ? ' / '+invoiceOrder.altMobile : ''}</div><div className="address text-xs text-stone-600 mt-2">{invoiceOrder.address.formattedFullAddress || invoiceOrder.address.detailedAddress}</div></div>
                  <div className="sm:text-right"><div className="label text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Payment</div><div className="value font-bold">Cash on Delivery</div><div className="muted text-xs mt-1">Order Date: {new Date(invoiceOrder.createdAt).toLocaleString('en-GB')}</div></div>
                </div>
                <table className="items w-full border-collapse text-xs"><thead><tr className="bg-emerald-800 text-white"><th className="text-left p-3">Item</th><th className="text-center p-3">Qty</th><th className="text-right p-3">Unit Price</th><th className="text-right p-3">Amount</th></tr></thead><tbody>{invoiceOrder.items.map((item,index)=><tr key={item.productId+'-'+index} className="border-b border-stone-200"><td className="p-3 font-semibold">{item.nameBn}</td><td className="p-3 text-center">{item.quantity}</td><td className="p-3 text-right">{formatPrice(item.price)}</td><td className="p-3 text-right font-bold">{formatPrice(item.total)}</td></tr>)}</tbody></table>
                <div className="summary ml-auto w-full sm:w-72 mt-6"><div className="row flex justify-between py-1.5 text-xs"><span>Subtotal</span><strong>{formatPrice(invoiceOrder.subtotal)}</strong></div><div className="row flex justify-between py-1.5 text-xs"><span>Delivery Charge</span><strong>{formatPrice(invoiceOrder.deliveryCharge)}</strong></div><div className="total flex justify-between border-t-2 border-emerald-800 mt-2 pt-3 text-lg font-black"><span>Total Due</span><strong className="text-emerald-700">{formatPrice(invoiceOrder.total)}</strong></div></div>
                {invoiceOrder.orderNote && <div className="mt-7 p-4 rounded-xl bg-stone-50 border border-stone-200"><div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Order Note</div><div className="text-xs text-stone-700">{invoiceOrder.orderNote}</div></div>}
                <div className="footer mt-12 pt-4 border-t border-stone-200 text-center text-xs text-stone-500"><div className="font-bold text-stone-700">Thank you for shopping with {settings.shopName}.</div><div className="mt-1">{settings.footerNotice || 'We appreciate your business.'}</div></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD / EDIT PRODUCT MODAL */}
      {isProductModalOpen && editingProduct && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onClose={() => { setIsProductModalOpen(false); setEditingProduct(null); }}
          onSaved={() => { setIsProductModalOpen(false); setEditingProduct(null); }}
        />
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
