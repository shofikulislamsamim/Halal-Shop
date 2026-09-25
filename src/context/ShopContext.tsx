import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Category,
  CartItem,
  Order,
  OrderStatus,
  WebsiteSettings,
  AppView,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_SETTINGS,
  INITIAL_ORDERS,
} from '../data/initialData';
import {
  getAllCategoryAndDescendantIds,
  isDescendantOrSelf,
  canDeleteCategory,
  generateCategorySlug,
} from '../utils/categoryHelpers';
import {
  getSupabaseAccessToken,
  isSupabaseConfigured,
  supabaseFetch,
  supabaseSignIn,
  supabaseIsAdmin,
  supabaseSignOut,
  setSupabaseSession,
  clearSupabaseSession,
} from '../lib/supabase';

interface ShopContextType {
  // Navigation & View
  currentView: AppView;
  selectedProductId: string | null;
  selectedCategorySlug: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  navigateTo: (view: AppView, params?: { productId?: string; categorySlug?: string; query?: string }) => void;

  // Catalog
  products: Product[];
  categories: Category[];
  activeCategories: Category[];
  rootCategories: Category[];
  getChildCategories: (parentId: string | null, onlyActive?: boolean) => Category[];
  getCategoryWithDescendants: (categoryId: string) => string[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<{ success: boolean; category?: Category; message?: string }>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<{ success: boolean; message?: string }>;
  deleteCategory: (id: string) => Promise<{ success: boolean; message?: string }>;
  moveCategory: (id: string, newParentId: string | null) => Promise<{ success: boolean; message?: string }>;
  reorderCategory: (id: string, direction: 'up' | 'down') => Promise<boolean>;
  toggleCategoryStatus: (id: string) => Promise<boolean>;

  // Cart
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  addToCart: (product: Product, quantity?: number) => void;
  buyNow: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Buy Now direct item
  directCheckoutItem: CartItem | null;
  setDirectCheckoutItem: (item: CartItem | null) => void;

  // Orders
  orders: Order[];
  lastCreatedOrder: Order | null;
  placeOrder: (orderData: {
    customerName: string;
    mobile: string;
    altMobile?: string;
    address: Order['address'];
    items: Order['items'];
    subtotal: number;
    deliveryCharge: number;
    total: number;
    orderNote?: string;
  }) => Promise<Order>;
  getOrderByIdAndPhone: (orderId: string, phone: string) => Promise<Order | undefined>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<boolean>;

  // Settings
  settings: WebsiteSettings;
  updateSettings: (newSettings: Partial<WebsiteSettings>) => Promise<boolean>;

  // Admin Auth
  isAdminAuthenticated: boolean;
  isAdminLoggedIn: boolean;
  loginAdmin: (email: string, password: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  verifyAdminLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logoutAdmin: () => void;
  adminLogout: () => void;

  // Toast / notification
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const generateProductSlug = (name: string, existingProducts: Product[], excludeId?: string): string => {
  let baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!baseSlug) {
    baseSlug = `product-${Date.now().toString(36)}`;
  }

  let finalSlug = baseSlug;
  let counter = 1;
  while (existingProducts.some((product) => product.id !== excludeId && product.slug === finalSlug)) {
    finalSlug = `${baseSlug}-${counter++}`;
  }
  return finalSlug;
};

const STORAGE_KEYS = {
  CART: 'halalshop_cart_v1',
  PRODUCTS: 'halalshop_products_v1',
  CATEGORIES: 'halalshop_categories_v1',
  ORDERS: 'halalshop_orders_v1',
  SETTINGS: 'halalshop_settings_v1',
  ADMIN_AUTH: 'halalshop_admin_auth_v1',
};

const safeStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Failed to read local storage', key, error);
    return null;
  }
};

const safeStorageSet = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error('Failed to persist local storage', key, error);
  }
};

const safeStorageRemove = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove local storage', key, error);
  }
};

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation State
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [directCheckoutItem, setDirectCheckoutItem] = useState<CartItem | null>(null);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  const openCartDrawer = () => setIsCartDrawerOpen(true);
  const closeCartDrawer = () => setIsCartDrawerOpen(false);

  // Persistence State
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = safeStorageGet(STORAGE_KEYS.PRODUCTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_PRODUCTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = safeStorageGet(STORAGE_KEYS.CATEGORIES);
    if (saved) {
      try {
        const parsed: Category[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Stored categories are the source of truth. Do not merge initial
          // categories back in after an admin intentionally deletes one.
          const validIds = new Set(parsed.map((category) => category.id));
          const normalized = parsed
            .filter((category) => Boolean(category?.id && category?.nameBn))
            .map((category, index) => ({
              ...category,
              parentId:
                category.parentId && validIds.has(category.parentId)
                  ? category.parentId
                  : null,
              order: Number.isFinite(category.order) ? category.order : index,
              isActive: category.isActive !== false,
              slug: String(category.slug || category.nameEn || category.nameBn).trim(),
            }));

          return normalized.map((category) => ({
            ...category,
            parentId: category.parentId === category.id ? null : category.parentId,
          }));
        }
      } catch (e) {
        console.error('Failed to parse categories from storage', e);
      }
    }
    return INITIAL_CATEGORIES;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = safeStorageGet(STORAGE_KEYS.CART);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item): item is CartItem =>
              Boolean(item?.product?.id) &&
              Number.isFinite(item?.quantity) &&
              item.quantity > 0
          );
        }
      } catch (e) {
        console.error('Failed to parse cart from storage', e);
      }
    }
    return [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = safeStorageGet(STORAGE_KEYS.ORDERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_ORDERS;
  });

  const [settings, setSettings] = useState<WebsiteSettings>(() => {
    const saved = safeStorageGet(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_SETTINGS,
          ...parsed,
          adminPin: String(parsed.adminPin || INITIAL_SETTINGS.adminPin || '').trim(),
        };
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_SETTINGS;
  });

  // Hydrate the public storefront from Supabase when configured.
  // Local storage remains a fallback so the development build still opens
  // even before deployment secrets are added.
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let cancelled = false;

    const loadRemoteCatalog = async () => {
      try {
        const [remoteCategories, remoteProducts, remoteSettings] = await Promise.all([
          supabaseFetch<any[]>('/rest/v1/halal_categories?select=*&order=sort_order.asc'),
          supabaseFetch<any[]>('/rest/v1/halal_products?select=*&order=created_at.desc'),
          supabaseFetch<any[]>('/rest/v1/halal_store_settings?select=*&id=eq.true&limit=1'),
        ]);

        if (cancelled) return;

        if (Array.isArray(remoteCategories) && remoteCategories.length > 0) {
          setCategories(remoteCategories.map((cat) => ({
            id: cat.id,
            nameBn: cat.name_bn,
            nameEn: cat.name_en || '',
            slug: cat.slug,
            parentId: cat.parent_id,
            icon: cat.icon || undefined,
            isActive: cat.is_active !== false,
            order: Number(cat.sort_order || 0),
            createdAt: cat.created_at,
            updatedAt: cat.updated_at,
          })));
        }

        // Treat Supabase as the source of truth only when it actually has catalog rows.
        // An empty remote catalog must not wipe a valid local fallback during setup/migration.
        if (Array.isArray(remoteProducts) && remoteProducts.length > 0) {
          setProducts(remoteProducts.map((product) => ({
            id: product.id,
            nameBn: product.name_bn,
            slug: product.slug || undefined,
            nameEn: product.name_en || '',
            categoryId: product.category_id || '',
            categoryIds: Array.isArray(product.category_ids) ? product.category_ids : [],
            price: Number(product.price || 0),
            regularPrice: product.compare_at_price == null ? undefined : Number(product.compare_at_price),
            stock: Number(product.stock || 0),
            imageUrl: product.image_url || '',
            descriptionBn: product.description || '',
            specifications: Object.entries(product.specs || {}).map(([label, value]) => ({
              label,
              value: String(value ?? ''),
            })),
            isFeatured: product.is_featured === true,
            isPopular: product.is_popular === true,
            isActive: product.is_active !== false,
          })));
        }

        const remote = remoteSettings?.[0];
        if (remote) {
          setSettings((prev) => ({
            ...prev,
            shopName: remote.store_name || prev.shopName,
            logoUrl: remote.logo_url || prev.logoUrl,
            contactNumber: remote.phone || prev.contactNumber,
            whatsappNumber: remote.whatsapp || prev.whatsappNumber,
            footerNotice: remote.about || prev.footerNotice,
            ...(remote.delivery_settings || {}),
          }));
        }
      } catch (error) {
        console.error('Supabase catalog load failed; keeping local fallback.', error);
      }
    };

    void loadRemoteCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const restoreAdminSession = async () => {
      const token = getSupabaseAccessToken();
      if (!token || !isSupabaseConfigured) return;
      try {
        const allowed = await supabaseIsAdmin(token);
        if (!cancelled && allowed) {
          setIsAdminAuthenticated(true);
          sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
        } else if (!allowed) {
          clearSupabaseSession();
          sessionStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
        }
      } catch {
        clearSupabaseSession();
        sessionStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
      }
    };
    void restoreAdminSession();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isAdminAuthenticated || !isSupabaseConfigured) return;

    let cancelled = false;
    const loadRemoteOrders = async () => {
      try {
        const token = getSupabaseAccessToken();
        if (!token) return;
        const remoteOrders = await supabaseFetch<any[]>(
          '/rest/v1/halal_orders?select=*,halal_order_items(*)&order=created_at.desc',
          { token }
        );
        if (!cancelled && Array.isArray(remoteOrders)) {
          setOrders(remoteOrders.map(mapRemoteOrder));
        }
      } catch (error) {
        console.error('Supabase orders load failed; keeping local fallback.', error);
      }
    };

    void loadRemoteOrders();
    return () => { cancelled = true; };
  }, [isAdminAuthenticated]);

  // Save to LocalStorage on change
  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Toast auto-clear
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Navigation Helper
  const navigateTo = (view: AppView, params?: { productId?: string; categorySlug?: string; query?: string }) => {
    if (params?.productId) setSelectedProductId(params.productId);
    if (params?.categorySlug !== undefined) setSelectedCategorySlug(params.categorySlug);
    if (params?.query !== undefined) setSearchQuery(params.query);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    const currentProduct = products.find((p) => p.id === product.id) || product;
    const requestedQuantity = Math.max(1, Math.floor(quantity));

    if (!currentProduct.isActive || currentProduct.stock <= 0) {
      showToast('দুঃখিত, এই পণ্যটি বর্তমানে স্টকে নেই।');
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === currentProduct.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = Math.min(
          updated[existingIndex].quantity + requestedQuantity,
          currentProduct.stock
        );
        updated[existingIndex] = { product: currentProduct, quantity: newQty };
        return updated;
      }
      return [...prev, { product: currentProduct, quantity: Math.min(requestedQuantity, currentProduct.stock) }];
    });

    showToast(`"${currentProduct.nameBn}" কার্টে যোগ করা হয়েছে!`);
  };

  const buyNow = (product: Product, quantity = 1) => {
    if (product.stock <= 0) {
      showToast('দুঃখিত, এই পণ্যটি স্টকে নেই!');
      return;
    }
    // Set direct checkout item so user can buy this immediately
    setDirectCheckoutItem({ product, quantity });
    navigateTo('checkout');
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const clampedQty = Math.min(quantity, item.product.stock);
          return { ...item, quantity: clampedQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('পণ্যটি কার্ট থেকে সরানো হয়েছে');
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Place Order
  const mapRemoteOrder = (remote: any): Order => {
    // The order-creation RPC returns its items under `items`, while the
    // admin REST query returns them as `halal_order_items`. Support both
    // shapes so the confirmation/tracking views never lose the item list.
    const remoteItems = Array.isArray(remote.halal_order_items)
      ? remote.halal_order_items
      : Array.isArray(remote.items)
        ? remote.items
        : [];

    return {
      id: remote.order_code,
      createdAt: remote.created_at,
      customerName: remote.customer_name,
      mobile: remote.mobile,
      altMobile: remote.alt_mobile || undefined,
      address: remote.address as Order['address'],
      items: remoteItems.map((item: any) => ({
        productId: item.product_id,
        nameBn: item.product_name,
        price: Number(item.unit_price || 0),
        quantity: Number(item.quantity || 0),
        total: Number(item.subtotal || 0),
        imageUrl: item.image_url || '',
      })),
      subtotal: Number(remote.subtotal || 0),
      deliveryCharge: Number(remote.delivery_fee || 0),
      total: Number(remote.total || 0),
      paymentMethod: 'cash_on_delivery',
      status: remote.status as OrderStatus,
      orderNote: remote.order_note || undefined,
    };
  };

  const placeOrder = async (orderData: {
    customerName: string;
    mobile: string;
    altMobile?: string;
    address: Order['address'];
    items: Order['items'];
    subtotal: number;
    deliveryCharge: number;
    total: number;
    orderNote?: string;
  }): Promise<Order> => {
    if (!isSupabaseConfigured) {
      throw new Error('অর্ডার নেওয়ার জন্য Supabase সংযোগ প্রয়োজন।');
    }

    const payload = {
      customerName: orderData.customerName.trim(),
      mobile: orderData.mobile,
      altMobile: orderData.altMobile,
      address: orderData.address,
      items: orderData.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      // Pricing and delivery are recalculated securely by the database function.
      orderNote: orderData.orderNote,
    };

    try {
      const remote = await supabaseFetch<any>('/rest/v1/rpc/create_halal_order', {
        method: 'POST',
        body: { payload },
      });

      const remoteOrder = mapRemoteOrder(remote);
      setOrders((prev) => [remoteOrder, ...prev.filter((order) => order.id !== remoteOrder.id)]);
      setLastCreatedOrder(remoteOrder);

      const stockByProduct = new Map<string, number>();
      for (const item of orderData.items) {
        stockByProduct.set(item.productId, (stockByProduct.get(item.productId) || 0) + Math.max(1, Math.floor(item.quantity)));
      }
      setProducts((prev) =>
        prev.map((product) => {
          const quantity = stockByProduct.get(product.id);
          return quantity ? { ...product, stock: Math.max(0, product.stock - quantity) } : product;
        })
      );

      if (!directCheckoutItem) clearCart();
      else setDirectCheckoutItem(null);

      navigateTo('order-confirmation');
      return remoteOrder;
    } catch (error) {
      console.error('Order creation failed:', error);
      const message = error instanceof Error ? error.message : '';
      if (/insufficient stock|unavailable/i.test(message)) {
        throw new Error('দুঃখিত, নির্বাচিত কোনো পণ্যের স্টক পরিবর্তিত হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
      throw new Error('অর্ডার সংরক্ষণ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  // Order tracking search
  const getOrderByIdAndPhone = async (orderId: string, phone: string): Promise<Order | undefined> => {
    if (!isSupabaseConfigured) {
      const cleanPhone = phone.replace(/[\\s\\-+]/g, '');
      return orders.find(
        (order) =>
          order.id.toUpperCase() === orderId.trim().toUpperCase() &&
          order.mobile.replace(/[\\s\\-+]/g, '') === cleanPhone
      );
    }

    try {
      const cleanPhone = phone.replace(/[\s\-+]/g, '');
      const remote = await supabaseFetch<any>('/rest/v1/rpc/get_halal_order_by_code_phone', {
        method: 'POST',
        body: {
          p_order_code: orderId.trim().toUpperCase(),
          p_mobile: cleanPhone,
        },
      });
      if (!remote) return undefined;
      return mapRemoteOrder(remote);
    } catch (error) {
      console.error('Order tracking lookup failed:', error);
      return undefined;
    }
  };

  // Admin order status update
  const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<boolean> => {
    const current = orders.find((order) => order.id === orderId);
    if (!current || current.status === status) return false;

    try {
      const token = getSupabaseAccessToken();
      if (!token || !isSupabaseConfigured) throw new Error('Admin session is not available.');
      const remote = await supabaseFetch<any>('/rest/v1/rpc/admin_update_halal_order_status', {
        method: 'POST',
        token,
        body: { p_order_code: orderId, p_status: status },
      });
      const updatedStatus = remote?.status as OrderStatus | undefined;
      setOrders((prev) => prev.map((order) => (
        order.id === orderId
          ? { ...order, status: updatedStatus || status }
          : order
      )));
      if (status === 'cancelled') {
        const cancelledItems = current.items || [];
        const restoreByProduct = new Map<string, number>();
        cancelledItems.forEach((item) => {
          restoreByProduct.set(item.productId, (restoreByProduct.get(item.productId) || 0) + Math.max(0, Math.floor(item.quantity)));
        });
        setProducts((prev) => prev.map((product) => {
          const restore = restoreByProduct.get(product.id);
          return restore ? { ...product, stock: product.stock + restore } : product;
        }));
      }
      showToast(`অর্ডার #${orderId} এর স্ট্যাটাস পরিবর্তন করা হয়েছে`);
      return true;
    } catch (error) {
      console.error('Order status update failed:', error);
      showToast('অর্ডারের স্ট্যাটাস সংরক্ষণ করা যায়নি। পরিবর্তনটি রাখা হয়নি।');
      return false;
    }
  };

  // Product CRUD
  const addProduct = async (productData: Omit<Product, 'id'>): Promise<boolean> => {
    const newProduct: Product = {
      ...productData,
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      slug: generateProductSlug(productData.nameEn || productData.nameBn, products),
      price: Math.max(0, Number(productData.price) || 0),
      regularPrice: productData.regularPrice == null ? undefined : Math.max(0, Number(productData.regularPrice) || 0),
      stock: Math.max(0, Math.floor(Number(productData.stock) || 0)),
    };

    try {
      const token = getSupabaseAccessToken();
      if (!token || !isSupabaseConfigured) throw new Error('Admin session is not available.');
      const remote = await supabaseFetch<any[]>('/rest/v1/halal_products', {
        method: 'POST',
        token,
        headers: { Prefer: 'return=representation' },
        body: {
          id: newProduct.id,
          name_bn: newProduct.nameBn,
          name_en: newProduct.nameEn || null,
          slug: newProduct.slug,
          category_id: newProduct.categoryId || null,
          category_ids: newProduct.categoryIds || [],
          price: newProduct.price,
          compare_at_price: newProduct.regularPrice ?? null,
          stock: newProduct.stock,
          image_url: newProduct.imageUrl || null,
          description: newProduct.descriptionBn || null,
          specs: Object.fromEntries((newProduct.specifications || []).map((spec) => [spec.label, spec.value])),
          is_active: newProduct.isActive !== false,
          is_featured: newProduct.isFeatured === true,
          is_popular: newProduct.isPopular === true,
        },
      });
      if (!Array.isArray(remote) || remote.length !== 1) throw new Error('Product create affected no row.');
      setProducts((prev) => [newProduct, ...prev.filter((product) => product.id !== newProduct.id)]);
      showToast('নতুন পণ্য সফলভাবে যুক্ত করা হয়েছে');
      return true;
    } catch (error) {
      console.error('Product create failed:', error);
      showToast('পণ্য সংরক্ষণ করা যায়নি। পরিবর্তনটি যোগ করা হয়নি।');
      return false;
    }
  };

  const updateProduct = async (id: string, updated: Partial<Product>): Promise<boolean> => {
    const currentProduct = products.find((product) => product.id === id);
    if (!currentProduct) return false;
    const nextProduct: Product = {
      ...currentProduct,
      ...updated,
      price: Math.max(0, Number(updated.price ?? currentProduct.price) || 0),
      regularPrice: updated.regularPrice == null && currentProduct.regularPrice == null
        ? undefined
        : Math.max(0, Number(updated.regularPrice ?? currentProduct.regularPrice ?? 0) || 0),
      stock: Math.max(0, Math.floor(Number(updated.stock ?? currentProduct.stock) || 0)),
    };

    try {
      const token = getSupabaseAccessToken();
      if (!token || !isSupabaseConfigured) throw new Error('Admin session is not available.');
      const remote = await supabaseFetch<any[]>(`/rest/v1/halal_products?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        token,
        headers: { Prefer: 'return=representation' },
        body: {
          name_bn: nextProduct.nameBn,
          name_en: nextProduct.nameEn || null,
          category_id: nextProduct.categoryId || null,
          category_ids: nextProduct.categoryIds || [],
          price: nextProduct.price,
          compare_at_price: nextProduct.regularPrice ?? null,
          stock: nextProduct.stock,
          image_url: nextProduct.imageUrl || null,
          description: nextProduct.descriptionBn || null,
          specs: Object.fromEntries((nextProduct.specifications || []).map((spec) => [spec.label, spec.value])),
          is_active: nextProduct.isActive !== false,
          is_featured: nextProduct.isFeatured === true,
          is_popular: nextProduct.isPopular === true,
        },
      });
      if (!Array.isArray(remote) || remote.length !== 1) throw new Error('Product update affected no row.');
      setProducts((prev) => prev.map((product) => (product.id === id ? nextProduct : product)));
      showToast('পণ্যের তথ্য আপডেট করা হয়েছে');
      return true;
    } catch (error) {
      console.error('Product update failed:', error);
      showToast('পণ্যের তথ্য সংরক্ষণ করা যায়নি। পরিবর্তনটি রাখা হয়নি।');
      return false;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    const target = products.find((product) => product.id === id);
    if (!target) return false;
    try {
      const token = getSupabaseAccessToken();
      if (!token || !isSupabaseConfigured) throw new Error('Admin session is not available.');
      const remote = await supabaseFetch<any[]>(`/rest/v1/halal_products?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        token,
        headers: { Prefer: 'return=representation' },
      });
      if (!Array.isArray(remote) || remote.length !== 1) throw new Error('Product delete affected no row.');
      setProducts((prev) => prev.filter((product) => product.id !== id));
      showToast('পণ্যটি মুছে ফেলা হয়েছে');
      return true;
    } catch (error) {
      console.error('Product delete failed:', error);
      showToast('পণ্যটি মুছে ফেলা যায়নি। পরিবর্তনটি রাখা হয়নি।');
      return false;
    }
  };

  // Category Hierarchical Helpers & Actions
  const activeCategories = categories
    .filter((c) => c.isActive)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const rootCategories = categories
    .filter((c) => !c.parentId && c.isActive)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const getChildCategories = (parentId: string | null, onlyActive: boolean = true): Category[] => {
    return categories
      .filter((c) => {
        const matchesParent = parentId === null ? !c.parentId : c.parentId === parentId;
        return matchesParent && (onlyActive ? c.isActive : true);
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  };

  const getCategoryWithDescendants = (categoryId: string): string[] => {
    return getAllCategoryAndDescendantIds(categoryId, categories);
  };

  const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    const parentId = categoryData.parentId ? categoryData.parentId : null;
    const duplicate = categories.some(
      (cat) => (cat.parentId || null) === parentId && cat.nameBn.trim().toLowerCase() === categoryData.nameBn.trim().toLowerCase()
    );
    if (duplicate) {
      showToast('একই প্যারেন্টের অধীনে এই নামের ক্যাটাগরি ইতিমধ্যে রয়েছে');
      return { success: false, message: 'একই প্যারেন্টের অধীনে এই নামের ক্যাটাগরি ইতিমধ্যে রয়েছে' };
    }
    const cleanSlug = generateCategorySlug(categoryData.slug?.trim() || categoryData.nameEn || categoryData.nameBn, categories);
    const siblings = categories.filter((cat) => (cat.parentId || null) === parentId);
    const maxOrder = siblings.reduce((max, cat) => Math.max(max, cat.order ?? 0), 0);
    const now = new Date().toISOString();
    const newCategory: Category = {
      ...categoryData,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      parentId,
      slug: cleanSlug,
      order: categoryData.order ?? maxOrder + 1,
      isActive: categoryData.isActive !== false,
      createdAt: now,
      updatedAt: now,
    };
    try {
      const token = getSupabaseAccessToken();
      if (!token || !isSupabaseConfigured) throw new Error('Admin session is not available.');
      const remote = await supabaseFetch<any[]>('/rest/v1/halal_categories', {
        method: 'POST', token, headers: { Prefer: 'return=representation' },
        body: {
          id: newCategory.id, parent_id: newCategory.parentId, name_bn: newCategory.nameBn,
          name_en: newCategory.nameEn || null, slug: newCategory.slug, icon: newCategory.icon || null,
          sort_order: newCategory.order ?? 0, is_active: newCategory.isActive,
          created_at: newCategory.createdAt, updated_at: newCategory.updatedAt,
        },
      });
      if (!Array.isArray(remote) || remote.length !== 1) throw new Error('Category create affected no row.');
      setCategories((prev) => [...prev, newCategory]);
      showToast(`"${newCategory.nameBn}" ক্যাটাগরি সফলভাবে তৈরি করা হয়েছে`);
      return { success: true, category: newCategory };
    } catch (error) {
      console.error('Category create failed:', error);
      showToast('ক্যাটাগরি সংরক্ষণ করা যায়নি। পরিবর্তনটি যোগ করা হয়নি।');
      return { success: false, message: 'ক্যাটাগরি সংরক্ষণ করা যায়নি' };
    }
  };

  const updateCategory = async (id: string, updated: Partial<Category>) => {
    if (updated.parentId !== undefined) {
      const targetParentId = updated.parentId ? updated.parentId : null;
      if (targetParentId && (targetParentId === id || isDescendantOrSelf(targetParentId, id, categories))) {
        showToast('ভুল প্যারেন্ট: কোনো ক্যাটাগরিকে নিজের বা নিজের সাব-ক্যাটাগরির অধীনে নেওয়া যাবে না');
        return { success: false, message: 'সার্কুলার রিলেশনশিপ অনুমোদিত নয়' };
      }
    }
    if (updated.parentId && !categories.some((cat) => cat.id === updated.parentId)) {
      showToast('নির্বাচিত প্যারেন্ট ক্যাটাগরি পাওয়া যায়নি');
      return { success: false, message: 'প্যারেন্ট ক্যাটাগরি পাওয়া যায়নি' };
    }
    const currentCategory = categories.find((cat) => cat.id === id);
    if (!currentCategory) return { success: false, message: 'ক্যাটাগরি পাওয়া যায়নি' };
    const targetName = (updated.nameBn ?? currentCategory.nameBn).trim().toLowerCase();
    const targetParentId = updated.parentId !== undefined ? (updated.parentId || null) : (currentCategory.parentId || null);
    if (categories.some((cat) => cat.id !== id && (cat.parentId || null) === targetParentId && cat.nameBn.trim().toLowerCase() === targetName)) {
      showToast('একই প্যারেন্টের অধীনে এই নামে আরেকটি ক্যাটাগরি আছে');
      return { success: false, message: 'একই প্যারেন্টের অধীনে নামটি ইতিমধ্যে ব্যবহৃত হয়েছে' };
    }
    if (updated.slug) {
      const slug = updated.slug.trim().toLowerCase();
      if (categories.some((cat) => cat.id !== id && cat.slug.toLowerCase() === slug)) {
        showToast('এই স্লাগটি ইতিমধ্যে অন্য ক্যাটাগরিতে ব্যবহৃত হয়েছে');
        return { success: false, message: 'স্লাগটি ইতিমধ্যে বিদ্যমান' };
      }
    }
    const nextCategory: Category = {
      ...currentCategory, ...updated,
      parentId: updated.parentId !== undefined ? (updated.parentId || null) : currentCategory.parentId,
      slug: String(updated.slug ?? currentCategory.slug).trim(),
      updatedAt: new Date().toISOString(),
    };
    try {
      const token = getSupabaseAccessToken();
      if (!token || !isSupabaseConfigured) throw new Error('Admin session is not available.');
      const remote = await supabaseFetch<any[]>(`/rest/v1/halal_categories?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH', token, headers: { Prefer: 'return=representation' },
        body: {
          parent_id: nextCategory.parentId, name_bn: nextCategory.nameBn, name_en: nextCategory.nameEn || null,
          slug: nextCategory.slug, icon: nextCategory.icon || null, sort_order: nextCategory.order ?? 0,
          is_active: nextCategory.isActive, updated_at: nextCategory.updatedAt,
        },
      });
      if (!Array.isArray(remote) || remote.length !== 1) throw new Error('Category update affected no row.');
      setCategories((prev) => prev.map((cat) => cat.id === id ? nextCategory : cat));
      showToast('ক্যাটাগরি তথ্য সফলভাবে আপডেট করা হয়েছে');
      return { success: true };
    } catch (error) {
      console.error('Category update failed:', error);
      showToast('ক্যাটাগরি সংরক্ষণ করা যায়নি। পরিবর্তনটি রাখা হয়নি।');
      return { success: false, message: 'ক্যাটাগরি সংরক্ষণ করা যায়নি' };
    }
  };

  const deleteCategory = async (id: string) => {
    const target = categories.find((cat) => cat.id === id);
    if (!target) return { success: false, message: 'ক্যাটাগরি পাওয়া যায়নি' };
    const check = canDeleteCategory(id, categories, products, orders);
    if (!check.canDelete) {
      showToast(check.reason || 'এই ক্যাটাগরি মুছে ফেলা সম্ভব নয়');
      return { success: false, message: check.reason };
    }
    try {
      const token = getSupabaseAccessToken();
      if (!token || !isSupabaseConfigured) throw new Error('Admin session is not available.');
      const remote = await supabaseFetch<any[]>(`/rest/v1/halal_categories?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE', token, headers: { Prefer: 'return=representation' },
      });
      if (!Array.isArray(remote) || remote.length !== 1) throw new Error('Category delete affected no row.');
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      showToast(`"${target.nameBn}" ক্যাটাগরি মুছে ফেলা হয়েছে`);
      return { success: true };
    } catch (error) {
      console.error('Category delete failed:', error);
      showToast('ক্যাটাগরি মুছে ফেলা যায়নি। পরিবর্তনটি রাখা হয়নি।');
      return { success: false, message: 'ক্যাটাগরি মুছে ফেলা যায়নি' };
    }
  };

  const moveCategory = async (id: string, newParentId: string | null) => {
    const target = categories.find((category) => category.id === id);
    if (!target) return { success: false, message: 'ক্যাটাগরি পাওয়া যায়নি' };

    const normalizedParentId = newParentId || null;
    if (normalizedParentId === id || (normalizedParentId && isDescendantOrSelf(normalizedParentId, id, categories))) {
      showToast('ভুল প্যারেন্ট: কোনো ক্যাটাগরিকে নিজের বা নিজের সাব-ক্যাটাগরির অধীনে নেওয়া যাবে না');
      return { success: false, message: 'সার্কুলার রিলেশনশিপ অনুমোদিত নয়' };
    }

    if (normalizedParentId && !categories.some((category) => category.id === normalizedParentId)) {
      return { success: false, message: 'প্যারেন্ট ক্যাটাগরি পাওয়া যায়নি' };
    }

    // A moved category should join the end of its new sibling group rather
    // than keeping an order number from its previous parent.
    const siblingOrders = categories
      .filter((category) => (category.parentId || null) === normalizedParentId && category.id !== id)
      .map((category) => Number(category.order ?? 0));
    const nextOrder = siblingOrders.length ? Math.max(...siblingOrders) + 1 : 1;

    return updateCategory(id, {
      parentId: normalizedParentId,
      order: nextOrder,
    });
  };

  const reorderCategory = async (id: string, direction: 'up' | 'down'): Promise<boolean> => {
    const target = categories.find((category) => category.id === id);
    if (!target) return false;
    try {
      const token = getSupabaseAccessToken();
      if (!token || !isSupabaseConfigured) throw new Error('Admin session is not available.');
      await supabaseFetch('/rest/v1/rpc/admin_reorder_halal_categories', {
        method: 'POST', token,
        body: { p_category_id: id, p_direction: direction },
      });
      const remoteCategories = await supabaseFetch<any[]>('/rest/v1/halal_categories?select=*&order=sort_order.asc', { token });
      if (!Array.isArray(remoteCategories)) throw new Error('Category reload failed.');
      setCategories(remoteCategories.map((cat) => ({
        id: cat.id, nameBn: cat.name_bn, nameEn: cat.name_en || '', slug: cat.slug,
        parentId: cat.parent_id, icon: cat.icon || undefined, isActive: cat.is_active !== false,
        order: Number(cat.sort_order || 0), createdAt: cat.created_at, updatedAt: cat.updated_at,
      })));
      showToast('ক্যাটাগরির ক্রম সংরক্ষণ করা হয়েছে');
      return true;
    } catch (error) {
      console.error('Category reorder failed:', error);
      showToast('ক্যাটাগরির ক্রম সংরক্ষণ করা যায়নি।');
      return false;
    }
  };

  const toggleCategoryStatus = async (id: string): Promise<boolean> => {
    const currentCategory = categories.find((c) => c.id === id);
    if (!currentCategory) return false;
    const newStatus = !currentCategory.isActive;
    const updatedAt = new Date().toISOString();
    const nextCategory = { ...currentCategory, isActive: newStatus, updatedAt };

    try {
      const token = getSupabaseAccessToken();
      if (!token || !isSupabaseConfigured) throw new Error('Admin session is not available.');
      const remote = await supabaseFetch<any[]>(
        `/rest/v1/halal_categories?id=eq.${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          token,
          headers: { Prefer: 'return=representation' },
          body: { is_active: newStatus, updated_at: updatedAt },
        }
      );
      if (!Array.isArray(remote) || remote.length !== 1) {
        throw new Error('Category status update affected no row.');
      }
      setCategories((prev) => prev.map((c) => (c.id === id ? nextCategory : c)));
      showToast(`"${currentCategory.nameBn}" ক্যাটাগরি ${newStatus ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`);
      return true;
    } catch (error) {
      console.error('Category status update failed:', error);
      showToast('ক্যাটাগরির স্ট্যাটাস সংরক্ষণ করা যায়নি। পরিবর্তনটি রাখা হয়নি।');
      return false;
    }
  };

  // Settings update
  const updateSettings = async (newSettings: Partial<WebsiteSettings>): Promise<boolean> => {
    const nextSettings: WebsiteSettings = {
      ...settings,
      ...newSettings,
      shopName: String(newSettings.shopName ?? settings.shopName ?? '').trim(),
      contactNumber: String(newSettings.contactNumber ?? settings.contactNumber ?? '').trim(),
      whatsappNumber: String(newSettings.whatsappNumber ?? settings.whatsappNumber ?? '').trim(),
      shopAddress: String(newSettings.shopAddress ?? settings.shopAddress ?? '').trim(),
      deliveryChargeDhaka: Math.max(0, Number(newSettings.deliveryChargeDhaka ?? settings.deliveryChargeDhaka ?? 0) || 0),
      deliveryChargeOutsideDhaka: Math.max(0, Number(newSettings.deliveryChargeOutsideDhaka ?? settings.deliveryChargeOutsideDhaka ?? 0) || 0),
      freeDeliveryThreshold: Math.max(0, Number(newSettings.freeDeliveryThreshold ?? settings.freeDeliveryThreshold ?? 0) || 0),
    };

    if (!nextSettings.shopName) {
      showToast('দোকানের নাম খালি রাখা যাবে না।');
      return false;
    }

    try {
      const token = getSupabaseAccessToken();
      if (!token || !isSupabaseConfigured) {
        throw new Error('Admin session is not available.');
      }

      const deliverySettings = {
        deliveryChargeDhaka: nextSettings.deliveryChargeDhaka,
        deliveryChargeOutsideDhaka: nextSettings.deliveryChargeOutsideDhaka,
        freeDeliveryThreshold: nextSettings.freeDeliveryThreshold,
        heroTitle: nextSettings.heroTitle,
        heroSubtitle: nextSettings.heroSubtitle,
        announcementText: nextSettings.announcementText || '',
        isAnnouncementActive: nextSettings.isAnnouncementActive !== false,
        tagline: nextSettings.tagline,
        facebookPage: nextSettings.facebookPage,
        shopAddress: nextSettings.shopAddress,
      };

      const remoteSettings = await supabaseFetch<any[]>('/rest/v1/halal_store_settings?id=eq.true', {
        method: 'PATCH',
        token,
        headers: { Prefer: 'return=representation' },
        body: {
          store_name: nextSettings.shopName,
          logo_url: nextSettings.logoUrl || null,
          phone: nextSettings.contactNumber || null,
          whatsapp: nextSettings.whatsappNumber || null,
          about: nextSettings.footerNotice || null,
          delivery_settings: deliverySettings,
          updated_at: new Date().toISOString(),
        },
      });
      if (!Array.isArray(remoteSettings) || remoteSettings.length !== 1) {
        throw new Error('Settings update affected no row.');
      }

      // Commit local state only after the database write succeeds. This avoids
      // showing a saved value locally when the remote update actually failed.
      setSettings(nextSettings);
      showToast('ওয়েবসাইটের সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে।');
      return true;
    } catch (error) {
      console.error('Settings update failed:', error);
      showToast('সেটিংস সংরক্ষণ করা যায়নি। পরিবর্তনগুলো রাখা হয়নি।');
      return false;
    }
  };
  // Supabase Admin Authentication
  const verifyAdminLogin = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    if (!isSupabaseConfigured) return { success: false, message: 'Supabase সংযোগ কনফিগার করা নেই।' };
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) return { success: false, message: 'ইমেইল ও পাসওয়ার্ড দিন।' };

    try {
      const auth = await supabaseSignIn(normalizedEmail, password);
      const allowed = await supabaseIsAdmin(auth.access_token);
      if (!allowed) {
        await supabaseSignOut(auth.access_token);
        return { success: false, message: 'এই অ্যাকাউন্টের অ্যাডমিন অনুমতি নেই।' };
      }
      setSupabaseSession(auth.access_token, auth.refresh_token);
      setIsAdminAuthenticated(true);
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (/invalid login credentials/i.test(message)) {
        return { success: false, message: 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।' };
      }
      return { success: false, message: 'অ্যাডমিন লগইন করা যায়নি। আবার চেষ্টা করুন।' };
    }
  };

  const loginAdmin = async (email: string, password: string): Promise<boolean> => {
    const result = await verifyAdminLogin(email, password);
    if (!result.success) {
      showToast(result.message || 'অ্যাডমিন লগইন ব্যর্থ হয়েছে।');
      return false;
    }
    setIsAdminAuthenticated(true);
    sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
    showToast('অ্যাডমিন লগইন সফল হয়েছে! স্বাগতম।');
    return true;
  };

  const adminLogin = loginAdmin;

  const logoutAdmin = async () => {
    await supabaseSignOut(getSupabaseAccessToken());
    clearSupabaseSession();
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    showToast('অ্যাডমিন প্যানেল থেকে লগআউট করা হয়েছে');
    navigateTo('home');
  };

  return (
    <ShopContext.Provider
      value={{
        currentView,
        selectedProductId,
        selectedCategorySlug,
        searchQuery,
        setSearchQuery,
        navigateTo,

        products,
        categories,
        activeCategories,
        rootCategories,
        getChildCategories,
        getCategoryWithDescendants,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        moveCategory,
        reorderCategory,
        toggleCategoryStatus,

        cart,
        cartCount,
        cartSubtotal,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        openCartDrawer,
        closeCartDrawer,
        addToCart,
        buyNow,
        updateCartQuantity,
        removeFromCart,
        clearCart,

        directCheckoutItem,
        setDirectCheckoutItem,

        orders,
        lastCreatedOrder,
        placeOrder,
        getOrderByIdAndPhone,
        updateOrderStatus,

        settings,
        updateSettings,

        isAdminAuthenticated,
        isAdminLoggedIn: isAdminAuthenticated,
        loginAdmin,
        adminLogin: loginAdmin,
        verifyAdminLogin,
        logoutAdmin,
        adminLogout: logoutAdmin,

        toastMessage,
        showToast,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
