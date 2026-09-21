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
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => { success: boolean; category?: Category; message?: string };
  updateCategory: (id: string, category: Partial<Category>) => { success: boolean; message?: string };
  deleteCategory: (id: string) => { success: boolean; message?: string };
  moveCategory: (id: string, newParentId: string | null) => { success: boolean; message?: string };
  reorderCategory: (id: string, direction: 'up' | 'down') => void;
  toggleCategoryStatus: (id: string) => void;

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
  }) => Order;
  getOrderByIdAndPhone: (orderId: string, phone: string) => Order | undefined;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  // Settings
  settings: WebsiteSettings;
  updateSettings: (newSettings: Partial<WebsiteSettings>) => void;

  // Admin Auth
  isAdminAuthenticated: boolean;
  isAdminLoggedIn: boolean;
  loginAdmin: (password: string) => boolean;
  adminLogin: (password: string) => boolean;
  verifyAdminLogin: (password: string) => { success: boolean; message?: string };
  logoutAdmin: () => void;
  adminLogout: () => void;

  // Toast / notification
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CART: 'halalshop_cart_v1',
  PRODUCTS: 'halalshop_products_v1',
  CATEGORIES: 'halalshop_categories_v1',
  ORDERS: 'halalshop_orders_v1',
  SETTINGS: 'halalshop_settings_v1',
  ADMIN_AUTH: 'halalshop_admin_auth_v1',
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
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_PRODUCTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (saved) {
      try {
        const parsed: Category[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasParentProperty = parsed.some((c) => 'parentId' in c);
          if (!hasParentProperty || parsed.length <= 5) {
            const merged = [...INITIAL_CATEGORIES];
            for (const item of parsed) {
              const idx = merged.findIndex((m) => m.id === item.id);
              if (idx >= 0) {
                merged[idx] = {
                  ...merged[idx],
                  ...item,
                  parentId: item.parentId !== undefined ? item.parentId : merged[idx].parentId,
                };
              } else {
                merged.push({ ...item, parentId: item.parentId || null });
              }
            }
            return merged;
          }
          return parsed.map((c) => ({
            ...c,
            parentId: c.parentId !== undefined ? c.parentId : null,
          }));
        }
      } catch (e) {
        console.error('Failed to parse categories from storage', e);
      }
    }
    return INITIAL_CATEGORIES;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CART);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_ORDERS;
  });

  const [settings, setSettings] = useState<WebsiteSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
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

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return (
      sessionStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true'
    );
  });

  // Save to LocalStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
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
    if (product.stock <= 0) {
      showToast('দুঃখিত, এই পণ্যটি স্টকে নেই!');
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = Math.min(updated[existingIndex].quantity + quantity, product.stock);
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return updated;
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock) }];
    });

    showToast(`"${product.nameBn}" কার্টে যোগ করা হয়েছে!`);
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
  const placeOrder = (orderData: {
    customerName: string;
    mobile: string;
    altMobile?: string;
    address: Order['address'];
    items: Order['items'];
    subtotal: number;
    deliveryCharge: number;
    total: number;
    orderNote?: string;
  }): Order => {
    // Generate a readable, collision-resistant order ID.
    // Keep checking against existing orders so a duplicate ID is not created.
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let newId = '';
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const candidate = `HS-${datePart}-${randomPart}`;
      if (!orders.some((existingOrder) => existingOrder.id === candidate)) {
        newId = candidate;
        break;
      }
    }

    // Extremely unlikely fallback if all generated candidates collide.
    if (!newId) {
      newId = `HS-${datePart}-${Date.now().toString().slice(-6)}`;
    }

    const newOrder: Order = {
      id: newId,
      createdAt: new Date().toISOString(),
      customerName: orderData.customerName,
      mobile: orderData.mobile,
      altMobile: orderData.altMobile,
      address: orderData.address,
      items: orderData.items,
      subtotal: orderData.subtotal,
      deliveryCharge: orderData.deliveryCharge,
      total: orderData.total,
      paymentMethod: 'cash_on_delivery',
      status: 'pending',
      orderNote: orderData.orderNote,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setLastCreatedOrder(newOrder);

    // Reduce product stock accordingly
    setProducts((prev) =>
      prev.map((prod) => {
        const orderedItem = orderData.items.find((i) => i.productId === prod.id);
        if (orderedItem) {
          return { ...prod, stock: Math.max(0, prod.stock - orderedItem.quantity) };
        }
        return prod;
      })
    );

    // If checkout was from cart, clear cart
    if (!directCheckoutItem) {
      clearCart();
    } else {
      setDirectCheckoutItem(null);
    }

    navigateTo('order-confirmation');
    return newOrder;
  };

  // Order tracking search
  const getOrderByIdAndPhone = (orderId: string, phone: string): Order | undefined => {
    const cleanId = orderId.trim().toUpperCase();
    const cleanPhone = phone.replace(/[\s\-+]/g, '');

    return orders.find((o) => {
      const matchId = o.id.toUpperCase() === cleanId;
      const oPhoneClean = o.mobile.replace(/[\s\-+]/g, '');
      const matchPhone = oPhoneClean.endsWith(cleanPhone) || cleanPhone.endsWith(oPhoneClean);
      return matchId && matchPhone;
    });
  };

  // Admin order status update
  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status } : order))
    );
    showToast(`অর্ডার #${orderId} এর স্ট্যাটাস পরিবর্তন করা হয়েছে`);
  };

  // Product CRUD
  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [newProduct, ...prev]);
    showToast('নতুন পণ্য সফলভাবে যুক্ত করা হয়েছে');
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
    showToast('পণ্যের তথ্য আপডেট করা হয়েছে');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('পণ্যটি মুছে ফেলা হয়েছে');
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

  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    const parentId = categoryData.parentId ? categoryData.parentId : null;

    // Check duplicate name under same parent
    const duplicate = categories.some(
      (c) =>
        (c.parentId || null) === parentId &&
        c.nameBn.trim().toLowerCase() === categoryData.nameBn.trim().toLowerCase()
    );
    if (duplicate) {
      showToast('একই প্যারেন্টের অধীনে এই নামের ক্যাটাগরি ইতিমধ্যে রয়েছে');
      return { success: false, message: 'একই প্যারেন্টের অধীনে এই নামের ক্যাটাগরি ইতিমধ্যে রয়েছে' };
    }

    // Auto-generate or sanitize slug
    const cleanSlug = generateCategorySlug(
      categoryData.slug?.trim() || categoryData.nameEn || categoryData.nameBn,
      categories
    );

    // Calculate sort order if not given
    const siblings = categories.filter((c) => (c.parentId || null) === parentId);
    const maxOrder = siblings.reduce((max, c) => Math.max(max, c.order ?? 0), 0);
    const sortOrder = categoryData.order ?? (maxOrder + 1);

    const now = new Date().toISOString();
    const newCategory: Category = {
      ...categoryData,
      id: `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      parentId,
      slug: cleanSlug,
      order: sortOrder,
      isActive: categoryData.isActive !== false,
      createdAt: now,
      updatedAt: now,
    };

    setCategories((prev) => [...prev, newCategory]);
    showToast(`"${newCategory.nameBn}" ক্যাটাগরি সফলভাবে তৈরি করা হয়েছে`);
    return { success: true, category: newCategory };
  };

  const updateCategory = (id: string, updated: Partial<Category>) => {
    // 1. Circular parent validation
    if (updated.parentId !== undefined) {
      const targetParentId = updated.parentId ? updated.parentId : null;
      if (targetParentId) {
        if (targetParentId === id || isDescendantOrSelf(targetParentId, id, categories)) {
          showToast('ভুল প্যারেন্ট: কোনো ক্যাটাগরিকে নিজের বা নিজের সাব-ক্যাটাগরির অধীনে নেওয়া যাবে না');
          return { success: false, message: 'সার্কুলার রিলেশনশিপ অনুমোদিত নয়' };
        }
      }
    }

    // 2. Slug uniqueness check
    if (updated.slug) {
      const slugDuplicate = categories.some(
        (c) => c.id !== id && c.slug.toLowerCase() === updated.slug?.trim().toLowerCase()
      );
      if (slugDuplicate) {
        showToast('এই স্লাগটি ইতিমধ্যে অন্য ক্যাটাগরিতে ব্যবহৃত হয়েছে');
        return { success: false, message: 'স্লাগটি ইতিমধ্যে বিদ্যমান' };
      }
    }

    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            ...updated,
            parentId: updated.parentId !== undefined ? (updated.parentId || null) : c.parentId,
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      })
    );

    showToast('ক্যাটাগরি তথ্য সফলভাবে আপডেট করা হয়েছে');
    return { success: true };
  };

  const deleteCategory = (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target) return { success: false, message: 'ক্যাটাগরি পাওয়া যায়নি' };

    const check = canDeleteCategory(id, categories, products, orders);
    if (!check.canDelete) {
      showToast(check.reason || 'এই ক্যাটাগরি মুছে ফেলা সম্ভব নয়');
      return { success: false, message: check.reason };
    }

    setCategories((prev) => prev.filter((c) => c.id !== id));
    showToast(`"${target.nameBn}" ক্যাটাগরি মুছে ফেলা হয়েছে`);
    return { success: true };
  };

  const moveCategory = (id: string, newParentId: string | null) => {
    return updateCategory(id, { parentId: newParentId });
  };

  const reorderCategory = (id: string, direction: 'up' | 'down') => {
    const target = categories.find((c) => c.id === id);
    if (!target) return;

    const parentId = target.parentId || null;
    const siblings = categories
      .filter((c) => (c.parentId || null) === parentId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const currentIndex = siblings.findIndex((c) => c.id === id);
    if (currentIndex === -1) return;

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= siblings.length) return;

    const neighbor = siblings[swapIndex];
    const targetOrder = target.order ?? currentIndex;
    const neighborOrder = neighbor.order ?? swapIndex;

    const newTargetOrder = targetOrder === neighborOrder ? (direction === 'up' ? targetOrder - 1 : targetOrder + 1) : neighborOrder;
    const newNeighborOrder = targetOrder;

    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === target.id) return { ...c, order: newTargetOrder };
        if (c.id === neighbor.id) return { ...c, order: newNeighborOrder };
        return c;
      })
    );
  };

  const toggleCategoryStatus = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const newStatus = !c.isActive;
          showToast(`"${c.nameBn}" ক্যাটাগরি ${newStatus ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`);
          return { ...c, isActive: newStatus, updatedAt: new Date().toISOString() };
        }
        return c;
      })
    );
  };

  // Settings update
  const updateSettings = (newSettings: Partial<WebsiteSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('ওয়েবসাইটের সেটিংস আপডেট করা হয়েছে');
  };

  // Admin Auth Normalization & Validation Helper
  const normalizeInput = (raw: string): string => {
    if (!raw) return '';
    // Strip zero-width, non-breaking, and invisible characters
    let clean = raw.replace(/[\u200B-\u200D\uFEFF\u00A0\r\n\t]/g, '').trim();
    // Normalize Bengali digits (০-৯) to English digits (0-9)
    const bnToEn: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
    };
    clean = clean.replace(/[০-৯]/g, (d) => bnToEn[d] || d);
    return clean;
  };

  // Verify Admin Login Credentials
  const verifyAdminLogin = (password: string): { success: boolean; message?: string } => {
    if (!password || !password.trim()) {
      return { success: false, message: 'অনুগ্রহ করে অ্যাডমিন পাসকোড প্রদান করুন।' };
    }

    const configuredPin = String(settings.adminPin || '').trim();
    if (!configuredPin) {
      return {
        success: false,
        message: 'অ্যাডমিন পাসকোড কনফিগার করা নেই। সেটিংস থেকে একটি পাসকোড নির্ধারণ করুন।',
      };
    }

    if (password.trim() !== configuredPin) {
      return { success: false, message: 'ভুল অ্যাডমিন পাসকোড।' };
    }

    return { success: true };
  };

  // Admin Login Handler
  const loginAdmin = (password: string): boolean => {
    const result = verifyAdminLogin(password);
    if (result.success) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
      showToast('অ্যাডমিন লগইন সফল হয়েছে! স্বাগতম।');
      return true;
    }
    showToast(result.message || 'অ্যাডমিন লগইন ব্যর্থ হয়েছে।');
    return false;
  };

  const adminLogin = loginAdmin;

const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    showToast('অ্যাডমিন প্যানেল থেকে লগআউট করা হয়েছে');
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
        resetAdminPinToDefault,

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
