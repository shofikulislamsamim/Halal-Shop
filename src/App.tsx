import React, { useEffect } from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { ToastContainer } from './components/common/Toast';
import { WhatsAppFloatingButton } from './components/common/WhatsAppFloatingButton';
import { CartDrawer } from './components/cart/CartDrawer';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { HomeView } from './components/home/HomeView';
import { ProductListing } from './components/products/ProductListing';
import { ProductDetails } from './components/products/ProductDetails';
import { CartView } from './components/cart/CartView';
import { CheckoutView } from './components/checkout/CheckoutView';
import { OrderConfirmationView } from './components/order/OrderConfirmationView';
import { OrderTrackingView } from './components/order/OrderTrackingView';
import { ContactAboutView } from './components/info/ContactAboutView';
import { AdminDashboard } from './components/admin/AdminDashboard';

const AppContent: React.FC = () => {
  const { currentView, selectedProductId, products, settings } = useShop();

  useEffect(() => {
    if (settings.faviconUrl) {
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = settings.faviconUrl;
    }
  }, [settings.faviconUrl]);

  useEffect(() => {
    const product = selectedProductId ? products.find((p) => p.id === selectedProductId) : null;
    const titles: Record<string, string> = {
      home: settings.shopName,
      products: `সকল পণ্য | ${settings.shopName}`,
      cart: `শপিং কার্ট | ${settings.shopName}`,
      checkout: `চেকআউট | ${settings.shopName}`,
      track: `অর্ডার ট্র্যাকিং | ${settings.shopName}`,
      contact: `যোগাযোগ | ${settings.shopName}`,
      about: `আমাদের সম্পর্কে | ${settings.shopName}`,
      admin: `এডমিন | ${settings.shopName}`,
    };

    document.title = product
      ? `${product.nameBn} | ${settings.shopName}`
      : (currentView === 'home'
        ? (settings.seoTitle || settings.shopName)
        : (titles[currentView] || settings.seoTitle || settings.shopName));

    const description = product?.descriptionBn || settings.seoDescription || settings.heroSubtitle || 'বিশ্বস্ত হালাল পণ্যের অনলাইন শপ। সহজ অর্ডার ও ক্যাশ অন ডেলিভারি সুবিধা।';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description.slice(0, 160));

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = settings.canonicalUrl || window.location.href.split('#')[0];

    const keywords = settings.seoKeywords?.filter(Boolean).join(', ');
    let keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (keywords) {
      if (!keywordsMeta) {
        keywordsMeta = document.createElement('meta');
        keywordsMeta.setAttribute('name', 'keywords');
        document.head.appendChild(keywordsMeta);
      }
      keywordsMeta.setAttribute('content', keywords);
    } else if (keywordsMeta) {
      keywordsMeta.remove();
    }

    if (settings.googleSiteVerification) {
      let verification = document.querySelector('meta[name="google-site-verification"]');
      if (!verification) {
        verification = document.createElement('meta');
        verification.setAttribute('name', 'google-site-verification');
        document.head.appendChild(verification);
      }
      verification.setAttribute('content', settings.googleSiteVerification);
    }
    const og = [
      ['og:title', settings.ogTitle || settings.seoTitle || settings.shopName],
      ['og:description', settings.ogDescription || description.slice(0, 160)],
      ['og:image', settings.ogImageUrl || settings.logoUrl],
    ];
    og.forEach(([name, content]) => {
      if (!content) return;
      let tag = document.querySelector(`meta[property="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    });
  }, [currentView, selectedProductId, products, settings.shopName, settings.heroSubtitle, settings.seoTitle, settings.seoDescription, settings.seoKeywords, settings.canonicalUrl, settings.googleSiteVerification, settings.ogTitle, settings.ogDescription, settings.ogImageUrl, settings.logoUrl]);

  useEffect(() => {
    const id = settings.googleAnalyticsId?.trim();
    if (!id) return;
    const scriptId = 'halal-shop-google-analytics';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      document.head.appendChild(script);
    }
    const w = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
    w.dataLayer = w.dataLayer || [];
    w.gtag = w.gtag || function(...args: unknown[]) { w.dataLayer?.push(args); };
    w.gtag('js', new Date());
    w.gtag('config', id);
    return () => {
      // Keep the script for the session, but stop sending events if the setting is cleared.
      if (!settings.googleAnalyticsId?.trim()) script?.remove();
    };
  }, [settings.googleAnalyticsId]);

  useEffect(() => {
    const pixelId = settings.facebookPixelId?.trim();
    if (!pixelId) return;
    const existing = document.getElementById('halal-shop-facebook-pixel');
    if (existing) return;
    const script = document.createElement('script');
    script.id = 'halal-shop-facebook-pixel';
    script.text = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
      (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init','${pixelId}');fbq('track','PageView');
    `;
    document.head.appendChild(script);
  }, [settings.facebookPixelId]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF7] text-stone-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Global Header & Navigation */}
      <Header />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'home' && <HomeView />}
        {currentView === 'products' && <ProductListing />}
        {currentView === 'product-detail' && <ProductDetails />}
        {currentView === 'cart' && <CartView />}
        {currentView === 'checkout' && <CheckoutView />}
        {currentView === 'order-confirmation' && <OrderConfirmationView />}
        {currentView === 'track' && <OrderTrackingView />}
        {currentView === 'contact' && <ContactAboutView initialTab="contact" />}
        {currentView === 'about' && <ContactAboutView initialTab="about" />}
        {currentView === 'admin' && <AdminDashboard />}
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Mini-Cart Slide-over Drawer */}
      <CartDrawer />

      {/* Mobile-Only Bottom Navigation */}
      <MobileBottomNav />

      {/* Floating Elements */}
      <WhatsAppFloatingButton />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  useEffect(() => {
    // Remove the static startup fallback only after React has successfully
    // mounted the application. This prevents render-time failures from
    // turning the page into a completely blank screen.
    document.getElementById('app-startup-fallback')?.remove();
  }, []);

  return (
    <ShopProvider>
      <AppContent />
    </ShopProvider>
  );
}
