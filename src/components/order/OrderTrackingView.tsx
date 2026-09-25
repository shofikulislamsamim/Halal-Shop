import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { Order, OrderStatus } from '../../types';
import type { OrderStatusHistoryEntry } from '../../context/ShopContext';
import { formatPrice, getWhatsAppUrl } from '../../utils/helpers';
import {
  Truck,
  Search,
  CheckCircle2,
  Clock,
  Package,
  Check,
  XCircle,
  MessageCircle,
  MapPin,
  Calendar,
} from 'lucide-react';

const STATUS_STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'pending', label: 'Order Placed', desc: 'অর্ডার সফলভাবে গ্রহণ করা হয়েছে' },
  { key: 'confirmed', label: 'Confirmed', desc: 'আমাদের টিম অর্ডারটি নিশ্চিত করেছে' },
  { key: 'processing', label: 'Processing', desc: 'প্যাকেজিং ও প্রস্তুতি সম্পন্ন হচ্ছে' },
  { key: 'shipped', label: 'Shipped', desc: 'কুরিয়ারে ডেলিভারির উদ্দেশ্যে পাঠানো হয়েছে' },
  { key: 'delivered', label: 'Delivered', desc: 'পণ্য সফলভাবে গ্রাহকের হাতে পৌঁছেছে' },
];

export const OrderTrackingView: React.FC = () => {
  const { getOrderByIdAndPhone, getOrderStatusHistory, lastCreatedOrder, settings } = useShop();

  const [orderId, setOrderId] = useState(lastCreatedOrder?.id || '');
  const [mobile, setMobile] = useState(lastCreatedOrder?.mobile || '');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(lastCreatedOrder || null);
  const [hasSearched, setHasSearched] = useState(Boolean(lastCreatedOrder));
  const [errorMessage, setErrorMessage] = useState('');

  const [isSearching, setIsSearching] = useState(false);
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistoryEntry[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!orderId.trim() || !mobile.trim()) {
      setErrorMessage('অনুগ্রহ করে অর্ডার আইডি এবং মোবাইল নাম্বার দুটিই দিন');
      return;
    }

    setIsSearching(true);
    const found = await getOrderByIdAndPhone(orderId.trim(), mobile.trim());
    setSearchedOrder(found || null);
    setHasSearched(true);
    if (found) {
      setStatusHistory(await getOrderStatusHistory(found.id, found.mobile));
    } else {
      setStatusHistory([]);
    }
    setIsSearching(false);

    if (!found) {
      setErrorMessage('প্রদত্ত তথ্য অনুযায়ী কোনো অর্ডার পাওয়া যায়নি। অনুগ্রহ করে সঠিক তথ্য দিয়ে পুনরায় চেষ্টা করুন।');
    }
  };

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 0;
      case 'confirmed': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const currentStepIndex = searchedOrder ? getStepIndex(searchedOrder.status) : 0;

  React.useEffect(() => {
    if (!searchedOrder) return;
    void getOrderStatusHistory(searchedOrder.id, searchedOrder.mobile).then(setStatusHistory);
  }, [searchedOrder?.id, searchedOrder?.mobile]);
  const isCancelled = searchedOrder?.status === 'cancelled';

  const whatsAppUrl = searchedOrder
    ? getWhatsAppUrl(
        settings.whatsappNumber,
        `আসসালামু আলাইকুম। আমার অর্ডার #${searchedOrder.id} এর সর্বশেষ স্ট্যাটাস সম্পর্কে জানতে চাই।`
      )
    : getWhatsAppUrl(settings.whatsappNumber, 'আসসালামু আলাইকুম। অর্ডার ট্র্যাকিং বিষয়ে জানতে চাই।');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-20">
      <div className="text-center max-w-xl mx-auto mb-8">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-100">
          <Truck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 leading-snug">
          অর্ডার ট্র্যাকিং (Order Tracking)
        </h1>
        <p className="text-stone-600 text-xs sm:text-sm mt-1">
          আপনার অর্ডার আইডি এবং মোবাইল নাম্বার দিয়ে যেকোনো সময় অর্ডারের অবস্থা জানুন
        </p>
      </div>

      {/* Tracking Form */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs mb-8">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              অর্ডার আইডি (যেমন: HS-1082) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="HS-XXXX"
              className="w-full bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600 font-mono"
              id="track-order-id-input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              মোবাইল নাম্বার <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="017XXXXXXXX"
              className="w-full bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
              id="track-phone-input"
            />
          </div>

          <div className="sm:col-span-1 flex items-end">
            <button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              id="track-search-btn"
              disabled={isSearching}
            >
              <Search className="w-4 h-4" />
              <span>{isSearching ? 'খোঁজা হচ্ছে...' : 'ট্র্যাক করুন'}</span>
            </button>
          </div>
        </form>

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Searched Order Result */}
      {searchedOrder && (
        <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-8 shadow-xs space-y-8 animate-fade-in">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-100 gap-4">
            <div>
              <span className="text-xs text-stone-500 block">অর্ডার আইডি:</span>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-mono">
                #{searchedOrder.id}
              </h2>
              <span className="text-xs text-stone-400 mt-0.5 block flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  তারিখ: {new Date(searchedOrder.createdAt).toLocaleDateString('bn-BD', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                  isCancelled
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : searchedOrder.status === 'delivered'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                }`}
              >
                {isCancelled
                  ? 'অর্ডার বাতিল (Cancelled)'
                  : searchedOrder.status === 'delivered'
                  ? 'ডেলিভারি সম্পন্ন (Delivered)'
                  : searchedOrder.status === 'shipped'
                  ? 'ডেলিভারির পথে (Shipped)'
                  : searchedOrder.status === 'processing'
                  ? 'প্রসেসিং হচ্ছে (Processing)'
                  : searchedOrder.status === 'confirmed'
                  ? 'অর্ডার নিশ্চিত (Confirmed)'
                  : 'অর্ডার গৃহীত (Order Placed)'}
              </span>

              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>সাহায্য চান</span>
              </a>
            </div>
          </div>

          {/* Timeline Status Steps */}
          {isCancelled ? (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-center text-rose-800 text-sm">
              এই অর্ডারটি বাতিল করা হয়েছে। বিস্তারিত তথ্যের জন্য আমাদের হোয়াটসঅ্যাপে যোগাযোগ করুন।
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-bold text-stone-900 mb-6">
                ডেলিভারি অগ্রগতি (Delivery Progress):
              </h3>

              {/* Progress Steps UI */}
              <div className="relative">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
                  {STATUS_STEPS.map((step, idx) => {
                    const isDone = currentStepIndex >= idx;
                    const isCurrent = currentStepIndex === idx;

                    return (
                      <div
                        key={step.key}
                        className={`flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 p-3 rounded-2xl transition-all ${
                          isCurrent
                            ? 'bg-emerald-50 border border-emerald-300'
                            : isDone
                            ? 'bg-stone-50/80'
                            : 'opacity-50'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                            isDone
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                        </div>

                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                            {step.label}
                          </h4>
                          <p className="text-[11px] text-stone-500 leading-tight mt-0.5">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tracking history */}
          {statusHistory.length > 0 && (
            <div className="border-t border-stone-100 pt-6">
              <h3 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                অর্ডার ট্র্যাকিং ইতিহাস
              </h3>
              <div className="space-y-3">
                {statusHistory.map((entry, index) => {
                  const isLast = index === statusHistory.length - 1;
                  const label = entry.status === 'pending' ? 'অর্ডার গ্রহণ করা হয়েছে'
                    : entry.status === 'confirmed' ? 'অর্ডার নিশ্চিত করা হয়েছে'
                    : entry.status === 'processing' ? 'অর্ডার প্রসেসিং শুরু হয়েছে'
                    : entry.status === 'shipped' ? 'অর্ডার ডেলিভারির জন্য পাঠানো হয়েছে'
                    : entry.status === 'delivered' ? 'অর্ডার ডেলিভারি সম্পন্ন হয়েছে'
                    : 'অর্ডার বাতিল করা হয়েছে';
                  return (
                    <div key={entry.changedAt + entry.status} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={'w-8 h-8 rounded-full flex items-center justify-center ' + (isLast ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700')}>
                          {entry.status === 'shipped' ? <Truck className="w-4 h-4" /> : entry.status === 'delivered' ? <CheckCircle2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </div>
                        {index < statusHistory.length - 1 && <div className="w-px flex-1 bg-stone-200 mt-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-xs font-bold text-stone-900">{label}</p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {new Date(entry.changedAt).toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Details breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-100 text-xs sm:text-sm">
            {/* Delivery address */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
              <h4 className="font-bold text-stone-900 mb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>ডেলিভারি গন্তব্য</span>
              </h4>
              <p className="text-stone-700 mb-1">
                <strong>গ্রাহক:</strong> {searchedOrder.customerName}
              </p>
              <p className="text-stone-700 mb-1">
                <strong>ফোন:</strong> {searchedOrder.mobile}
              </p>
              <p className="text-stone-700 leading-relaxed">
                <strong>ঠিকানা:</strong> {searchedOrder.address.formattedFullAddress}
              </p>
            </div>

            {/* Order Items */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
              <h4 className="font-bold text-stone-900 mb-2 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-700" />
                <span>অর্ডারের পণ্যসমূহ ({searchedOrder.items.length})</span>
              </h4>
              <div className="divide-y divide-stone-200 mb-3">
                {searchedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between">
                    <span className="line-clamp-1">{item.nameBn} x {item.quantity}</span>
                    <span className="font-semibold text-stone-900">{formatPrice(item.total)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-stone-900">
                <span>সর্বমোট (ক্যাশ অন ডেলিভারি):</span>
                <span className="text-emerald-800 font-black">{formatPrice(searchedOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
