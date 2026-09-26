export type LocationType = 'rural' | 'urban';

export interface StructuredAddress {
  locationType: LocationType;
  division: string;
  district: string;
  upazilaThana: string;
  // Rural specific
  union?: string;
  village?: string;
  // Urban specific
  city?: string;
  area?: string;
  roadBlockSector?: string;
  houseFlat?: string;
  landmark?: string;
  // Shared
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
  parentId?: string | null; // self-referencing relationship: null for Root Category
  description?: string;
  icon?: string;
  imageUrl?: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  nameBn: string;
  nameEn: string;
  slug?: string;
  categoryId: string; // Primary category id
  categoryIds?: string[]; // Optional secondary category ids
  price: number;
  regularPrice?: number;
  stock: number;
  imageUrl: string;
  descriptionBn: string;
  specifications: Specification[];
  isFeatured: boolean;
  isPopular?: boolean;
  isActive: boolean;
  unit?: string;
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
  whatsappNumber: string; // digits only e.g. 8801700000000
  contactNumber: string;
  facebookPage: string;
  deliveryChargeDhaka: number;
  deliveryChargeOutsideDhaka: number;
  freeDeliveryThreshold: number;
  heroTitle: string;
  heroSubtitle: string;
  footerNotice: string;
  shopAddress: string;
  announcementText?: string;
  isAnnouncementActive?: boolean;
  adminPin?: string;
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
