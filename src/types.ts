export type LocationType = 'rural' | 'urban';

export interface StructuredAddress {
  locationType: LocationType;
  division: string;
  district: string;
  upazilaThana: string;
  union?: string;
  village?: string;
  city?: string;
  area?: string;
  roadBlockSector?: string;
  houseFlat?: string;
  landmark?: string;
  detailedAddress: string;
  formattedFullAddress: string;
}

export interface Specification {
  label: string;
  value: string;
}

export interface Category {
  id: string;
  nameBn: string;
  nameEn: string;
  slug: string;
  parentId?: string | null;
  description?: string;
  icon?: string;
  imageUrl?: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price: number;
  regularPrice?: number;
  stock: number;
  unit?: string;
}

export interface Product {
  id: string;
  nameBn: string;
  nameEn: string;
  slug?: string;
  sku?: string;
  categoryId: string;
  categoryIds?: string[];
  tags?: string[];
  brand?: string;
  manufacturer?: string;
  originCountry?: string;
  price: number;
  regularPrice?: number;
  stock: number;
  lowStockThreshold?: number;
  unit?: string;
  weight?: number;
  dimensions?: string;
  minOrderQty?: number;
  maxOrderQty?: number;
  imageUrl: string;
  galleryUrls?: string[];
  shortDescription?: string;
  descriptionBn: string;
  descriptionEn?: string;
  specifications: Specification[];
  variants?: ProductVariant[];
  relatedProductIds?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  isFeatured: boolean;
  isPopular?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isSpecialOffer?: boolean;
  isLimitedStock?: boolean;
  isDraft?: boolean;
  isActive: boolean;
  whatsappEnabled?: boolean;
}

export interface ProductStockMovement {
  id: string;
  productId: string;
  previousStock: number;
  delta: number;
  newStock: number;
  reason: string;
  note?: string;
  changedBy?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  nameBn: string;
  price: number;
  quantity: number;
  total: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  mobile: string;
  altMobile?: string;
  address: StructuredAddress;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: 'cash_on_delivery';
  status: OrderStatus;
  orderNote?: string;
}

export interface WebsiteSettings {
  shopName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl?: string;
  email?: string;
  whatsappNumber: string;
  contactNumber: string;
  facebookPage: string;
  instagramPage?: string;
  youtubeChannel?: string;
  tiktokPage?: string;
  messengerUrl?: string;
  shopAddress: string;
  mapUrl?: string;
  businessHours?: string;
  isStoreOpen?: boolean;
  storeStatus?: 'open' | 'closed' | 'maintenance';
  storeClosedMessage?: string;
  maintenanceMessage?: string;
  deliveryChargeDhaka: number;
  deliveryChargeOutsideDhaka: number;
  freeDeliveryThreshold: number;
  minimumOrderAmount?: number;
  estimatedDeliveryDhaka?: string;
  estimatedDeliveryOutsideDhaka?: string;
  deliveryCoverage?: string;
  sameDayDelivery?: boolean;
  cashOnDeliveryEnabled?: boolean;
  codMinimumOrder?: number;
  codMaximumOrder?: number;
  codInstructions?: string;
  orderAutoConfirm?: boolean;
  customerCancellationMinutes?: number;
  orderConfirmationMessage?: string;
  outOfStockVisible?: boolean;
  stockQuantityVisible?: boolean;
  skuVisible?: boolean;
  lowStockWarningVisible?: boolean;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl?: string;
  heroButtonText?: string;
  heroButtonLink?: string;
  featuredProductsCount?: number;
  popularProductsCount?: number;
  newArrivalProductsCount?: number;
  bestSellerProductsCount?: number;
  categorySectionEnabled?: boolean;
  footerNotice: string;
  announcementText?: string;
  isAnnouncementActive?: boolean;
  announcementStartAt?: string;
  announcementEndAt?: string;
  announcementLink?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  googleSiteVerification?: string;
  facebookPixelId?: string;
  googleAnalyticsId?: string;
  invoicePrefix?: string;
  invoiceFooter?: string;
  returnPolicy?: string;
  termsAndConditions?: string;
  supportHours?: string;
  floatingWhatsappEnabled?: boolean;
}

export type ShopSettings = WebsiteSettings;

export type AppView =
  | 'home'
  | 'products'
  | 'categories'
  | 'product-detail'
  | 'cart'
  | 'checkout'
  | 'order-confirmation'
  | 'track'
  | 'contact'
  | 'about'
  | 'admin';
