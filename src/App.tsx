import React from 'react';
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
  const { currentView } = useShop();

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
  return (
    <ShopProvider>
      <AppContent />
    </ShopProvider>
  );
}
