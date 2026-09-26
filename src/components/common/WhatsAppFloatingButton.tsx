import React from 'react';
import { useShop } from '../../context/ShopContext';
import { MessageCircle } from 'lucide-react';
import { getWhatsAppUrl, getGeneralWhatsAppMessage } from '../../utils/helpers';

export const WhatsAppFloatingButton: React.FC = () => {
  const { settings, currentView } = useShop();

  // Hide in sensitive views or when the admin disables floating support.
  if (
    settings.floatingWhatsappEnabled === false ||
    !settings.whatsappNumber ||
    currentView === 'checkout' ||
    currentView === 'admin' ||
    currentView === 'order-confirmation' ||
    currentView === 'product-detail'
  ) {
    return null;
  }

  const url = getWhatsAppUrl(settings.whatsappNumber, getGeneralWhatsAppMessage(settings.shopName));

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-30 bg-emerald-800 hover:bg-emerald-900 text-white p-3 sm:p-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 group focus:outline-hidden"
      aria-label="WhatsApp Support"
      id="floating-whatsapp-btn"
    >
      <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-amber-300" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs sm:text-sm font-semibold pr-1">
        হোয়াটসঅ্যাপ সহায়তা
      </span>
    </a>
  );
};
