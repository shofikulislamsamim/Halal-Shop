import React, { useRef, useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StructuredAddress, OrderItem } from '../../types';
import { SmartAdaptiveAddress } from './SmartAdaptiveAddress';
import { formatPrice, isValidBdPhone, sanitizeBdPhone, formatAddress } from '../../utils/helpers';
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Edit2,
  Phone,
  User,
  ShoppingBag,
  Check,
} from 'lucide-react';

export const CheckoutView: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    directCheckoutItem,
    placeOrder,
    navigateTo,
    settings,
  } = useShop();

  const checkoutItems: OrderItem[] = directCheckoutItem
    ? [{
        productId: directCheckoutItem.product.id,
        nameBn: directCheckoutItem.product.nameBn,
        price: directCheckoutItem.product.price,
        quantity: directCheckoutItem.quantity,
        total: directCheckoutItem.product.price * directCheckoutItem.quantity,
        imageUrl: directCheckoutItem.product.imageUrl,
      }]
    : cart.map((i) => ({
        productId: i.product.id,
        nameBn: i.product.nameBn,
        price: i.product.price,
        quantity: i.quantity,
        total: i.product.price * i.quantity,
        imageUrl: i.product.imageUrl,
      }));

  const itemsSubtotal = directCheckoutItem
    ? directCheckoutItem.product.price * directCheckoutItem.quantity
    : cartSubtotal;

  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [altMobile, setAltMobile] = useState('');
  const [orderNote, setOrderNote] = useState('');

  const [address, setAddress] = useState<StructuredAddress>({
    locationType: 'urban',
    division: 'ঢাকা বিভাগ',
    district: 'ঢাকা',
    upazilaThana: '',
    city: 'ঢাকা',
    area: '',
    roadBlockSector: '',
    houseFlat: '',
    detailedAddress: '',
    formattedFullAddress: '',
  });

  const [isReviewingAddress, setIsReviewingAddress] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [altPhoneError, setAltPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [addressIncompleteError, setAddressIncompleteError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const orderIdempotencyKeyRef = useRef<string | null>(null);
  const [submitError, setSubmitError] = useState('');

  const isDhaka =
    address.district === 'ঢাকা';

  const isFreeDelivery = itemsSubtotal >= settings.freeDeliveryThreshold;
  const deliveryCharge = isFreeDelivery
    ? 0
    : isDhaka
    ? settings.deliveryChargeDhaka
    : settings.deliveryChargeOutsideDhaka;
  const totalAmount = itemsSubtotal + deliveryCharge;

  const validateForm = (): boolean => {
    setHasValidated(true);
    let valid = true;

    if (!customerName.trim() || customerName.trim().length < 2) {
      setNameError('অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন');
      valid = false;
    } else {
      setNameError('');
    }

    const cleanPhone = sanitizeBdPhone(mobile);
    if (!cleanPhone) {
      setPhoneError('মোবাইল নাম্বার আবশ্যক');
      valid = false;
    } else if (!isValidBdPhone(cleanPhone)) {
      setPhoneError('সঠিক ১১ ডিজিটের মোবাইল নাম্বার লিখুন (যেমন: 01712345678)');
      valid = false;
    } else {
      setPhoneError('');
    }

    const cleanAltPhone = sanitizeBdPhone(altMobile);
    if (altMobile.trim() && !isValidBdPhone(cleanAltPhone)) {
      setAltPhoneError('বিকল্প নাম্বারটি সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন');
      valid = false;
    } else {
      setAltPhoneError('');
    }

    const minimumOrder = Math.max(0, Number(settings.minimumOrderAmount ?? 0) || 0);
    if (minimumOrder > 0 && itemsSubtotal < minimumOrder) {
      setSubmitError(`এই দোকানে ন্যূনতম অর্ডার ${formatPrice(minimumOrder)}।`);
      valid = false;
    }

    const codMinimum = Math.max(0, Number(settings.codMinimumOrder ?? 0) || 0);
    const codMaximum = Math.max(0, Number(settings.codMaximumOrder ?? 0) || 0);
    if (settings.cashOnDeliveryEnabled !== false) {
      if (itemsSubtotal < codMinimum) {
        setSubmitError(`Cash on Delivery-এর জন্য ন্যূনতম পণ্য মূল্য ${formatPrice(codMinimum)}।`);
        valid = false;
      } else if (codMaximum > 0 && itemsSubtotal > codMaximum) {
        setSubmitError(`Cash on Delivery-এর সর্বোচ্চ পণ্য মূল্য ${formatPrice(codMaximum)}।`);
        valid = false;
      }
    } else {
      setSubmitError('বর্তমানে Cash on Delivery সক্রিয় নেই।');
      valid = false;
    }

    const addressValid =
      Boolean(address.district?.trim()) &&
      Boolean(address.upazilaThana?.trim()) &&
      Boolean(address.area?.trim()) &&
      Boolean(address.detailedAddress?.trim());

    setAddressIncompleteError(!addressValid);
    if (!addressValid) valid = false;

    return valid;
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsReviewingAddress(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmFinalOrder = async () => {
    if (isSubmitting) return;

    if (!validateForm()) {
      setIsReviewingAddress(false);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    if (!orderIdempotencyKeyRef.current) {
      orderIdempotencyKeyRef.current =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `order-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }

    const finalAddress: StructuredAddress = {
      ...address,
      formattedFullAddress: formatAddress(address),
    };

    try {
      await placeOrder({
        customerName: customerName.trim(),
        mobile: sanitizeBdPhone(mobile),
        altMobile: altMobile.trim() ? sanitizeBdPhone(altMobile) : undefined,
        address: finalAddress,
        items: checkoutItems,
        subtotal: itemsSubtotal,
        deliveryCharge,
        total: totalAmount,
        orderNote: orderNote.trim() || undefined,
        idempotencyKey: orderIdempotencyKeyRef.current || undefined,
      });
      orderIdempotencyKeyRef.current = null;
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'অর্ডার সংরক্ষণ করা যায়নি।');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (settings.storeStatus && settings.storeStatus !== 'open') {
    const maintenance = settings.storeStatus === 'maintenance';
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-stone-100 text-stone-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          {maintenance ? '🔧' : '⏸️'}
        </div>
        <h2 className="text-xl font-black text-stone-900 mb-2">
          {maintenance ? 'ওয়েবসাইট সাময়িক রক্ষণাবেক্ষণে' : 'এই মুহূর্তে অর্ডার নেওয়া হচ্ছে না'}
        </h2>
        <p className="text-sm text-stone-600 leading-6">
          {maintenance
            ? (settings.maintenanceMessage || 'ওয়েবসাইট বর্তমানে রক্ষণাবেক্ষণে আছে।')
            : (settings.storeClosedMessage || 'বর্তমানে দোকান বন্ধ। অনুগ্রহ করে পরে আবার চেষ্টা করুন।')}
        </p>
        <button onClick={() => navigateTo('products')} className="mt-5 bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm">
          পণ্য দেখুন
        </button>
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto mb-3">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 mb-2">অর্ডার করার জন্য কোনো পণ্য নির্বাচন করা নেই</h2>
        <button onClick={() => navigateTo('products')} className="bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm">
          পণ্য দেখুন
        </button>
      </div>
    );
  }

  const compactAddressParts = [
    address.district,
    address.upazilaThana,
    address.area,
    address.detailedAddress,
  ].filter((value) => value?.trim());

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 pb-24">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-stone-200">
        <button
          onClick={() => navigateTo(directCheckoutItem ? 'product-detail' : 'cart')}
          className="p-1 text-stone-500 hover:text-stone-800"
          title="ফিরে যান"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
            {isReviewingAddress ? 'অর্ডার নিশ্চিতকরণ' : 'সহজ চেকআউট'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            {isReviewingAddress
              ? 'অর্ডার দেওয়ার আগে আপনার তথ্য একবার মিলিয়ে নিন'
              : 'শুধু প্রয়োজনীয় তথ্য দিয়ে দ্রুত অর্ডার করুন'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 text-xs sm:text-sm font-semibold max-w-md mx-auto py-2 px-3 bg-stone-50 rounded-2xl border border-stone-200/80">
        <div className={`flex items-center gap-1.5 ${!isReviewingAddress ? 'text-emerald-900 font-bold' : 'text-stone-400'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${!isReviewingAddress ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-600'}`}>১</span>
          <span>তথ্য</span>
        </div>
        <div className="w-6 sm:w-10 h-0.5 bg-stone-300" />
        <div className={`flex items-center gap-1.5 ${isReviewingAddress ? 'text-emerald-900 font-bold' : 'text-stone-400'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${isReviewingAddress ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-600'}`}>২</span>
          <span>রিভিউ</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {isReviewingAddress ? (
            <div className="bg-white rounded-3xl border-2 border-emerald-700 p-5 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4 text-emerald-900 pb-3 border-b border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
                <h2 className="text-lg sm:text-xl font-bold">আপনার অর্ডারটি মিলিয়ে নিন</h2>
              </div>

              <div className="bg-[#F7F6F0] rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-3 text-xs sm:text-sm text-stone-700 mb-6">
                <div className="flex items-center justify-between gap-4 border-b border-stone-200/80 pb-2">
                  <span className="font-semibold text-stone-500">নাম</span>
                  <span className="font-bold text-stone-900 text-right">{customerName}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-stone-200/80 pb-2">
                  <span className="font-semibold text-stone-500">মোবাইল</span>
                  <span className="font-bold text-emerald-900 price-display">{sanitizeBdPhone(mobile)}</span>
                </div>
                {altMobile.trim() && (
                  <div className="flex items-center justify-between gap-4 border-b border-stone-200/80 pb-2">
                    <span className="font-semibold text-stone-500">বিকল্প মোবাইল</span>
                    <span className="text-stone-800 price-display">{sanitizeBdPhone(altMobile)}</span>
                  </div>
                )}
                <div className="border-b border-stone-200/80 pb-2">
                  <span className="font-semibold text-stone-500 block mb-1">ডেলিভারি ঠিকানা</span>
                  <p className="text-stone-900 font-semibold bg-white p-3 rounded-xl border border-stone-200 leading-relaxed">
                    {compactAddressParts.join(' — ')}
                  </p>
                </div>
                {orderNote.trim() && (
                  <div>
                    <span className="font-semibold text-stone-500 block mb-1">অর্ডার নোট</span>
                    <span className="text-stone-700 italic">{orderNote.trim()}</span>
                  </div>
                )}
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 mb-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-stone-600">পণ্য</span>
                  <span className="font-semibold price-display">{formatPrice(itemsSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-stone-600">ডেলিভারি</span>
                  <span className="font-semibold price-display">
                    {deliveryCharge === 0 ? 'ফ্রি' : formatPrice(deliveryCharge)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-stone-200 pt-2">
                  <span className="font-bold text-stone-900">মোট</span>
                  <span className="font-black text-lg text-emerald-900 price-display">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIsReviewingAddress(false)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-stone-300 text-stone-700 font-semibold text-sm hover:bg-stone-100 flex items-center justify-center gap-2 order-2 sm:order-1"
                  id="checkout-edit-address-btn"
                >
                  <Edit2 className="w-4 h-4" />
                  তথ্য সংশোধন করুন
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFinalOrder}
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md active:scale-[0.99] disabled:opacity-60"
                  id="checkout-confirm-final-btn"
                >
                  <CheckCircle2 className="w-5 h-5 text-amber-300" />
                  {isSubmitting ? 'অর্ডার সংরক্ষণ হচ্ছে...' : 'অর্ডার কনফার্ম করুন'}
                </button>
              </div>
              {submitError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {submitError}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleProceedToReview} className="space-y-6">
              <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-100">
                  <User className="w-5 h-5 text-emerald-800" />
                  <h2 className="text-base sm:text-lg font-bold text-stone-900">১. আপনার তথ্য</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      আপনার পূর্ণ নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (nameError) setNameError('');
                      }}
                      placeholder="আপনার নাম লিখুন"
                      className={`w-full bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border ${nameError ? 'border-rose-500 bg-rose-50/40' : 'border-stone-300 focus:border-emerald-700'} focus:outline-hidden shadow-2xs`}
                      id="checkout-name-input"
                    />
                    {nameError && <p className="text-[11px] text-rose-600 mt-1 font-medium">{nameError}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        মোবাইল নাম্বার <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={mobile}
                          onChange={(e) => {
                            setMobile(e.target.value);
                            if (phoneError) setPhoneError('');
                          }}
                          placeholder="01712345678"
                          inputMode="numeric"
                          maxLength={14}
                          className={`w-full bg-white text-stone-900 text-xs sm:text-sm pl-10 pr-3 py-2.5 rounded-xl border ${phoneError ? 'border-rose-500 bg-rose-50/40' : 'border-stone-300 focus:border-emerald-700'} focus:outline-hidden shadow-2xs`}
                          id="checkout-phone-input"
                        />
                        <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                      {phoneError && <p className="text-[11px] text-rose-600 mt-1 font-medium">{phoneError}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        বিকল্প মোবাইল <span className="text-stone-400">(ঐচ্ছিক)</span>
                      </label>
                      <input
                        type="tel"
                        value={altMobile}
                        onChange={(e) => {
                          setAltMobile(e.target.value);
                          if (altPhoneError) setAltPhoneError('');
                        }}
                        placeholder="অন্য চালু নাম্বার থাকলে দিন"
                        inputMode="numeric"
                        maxLength={14}
                        className={`w-full bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border ${altPhoneError ? 'border-rose-500 bg-rose-50/40' : 'border-stone-300 focus:border-emerald-700'} focus:outline-hidden shadow-2xs`}
                        id="checkout-alt-phone-input"
                      />
                      {altPhoneError && <p className="text-[11px] text-rose-600 mt-1 font-medium">{altPhoneError}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-100">
                  <MapPinIcon />
                  <h2 className="text-base sm:text-lg font-bold text-stone-900">২. ডেলিভারি ঠিকানা</h2>
                </div>
                <SmartAdaptiveAddress
                  address={address}
                  onChange={setAddress}
                  showError={hasValidated && addressIncompleteError}
                />
              </div>

              <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-xs">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  অর্ডার সংক্রান্ত বিশেষ কোনো নির্দেশনা <span className="text-stone-400">(ঐচ্ছিক)</span>
                </label>
                <textarea
                  rows={2}
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="যেমন: সন্ধ্যার পরে ডেলিভারি দিলে ভালো হয়..."
                  className="w-full bg-white text-stone-900 text-xs sm:text-sm p-3 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-700 shadow-2xs resize-none"
                  id="checkout-note-input"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 px-6 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-base shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                id="checkout-proceed-btn"
              >
                <span>তথ্য যাচাই ও রিভিউ করুন →</span>
              </button>
            </form>
          )}
        </div>

        <div className="space-y-4 sticky top-24">
          <div className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-xs">
            <h3 className="font-bold text-stone-900 text-sm sm:text-base mb-3 pb-2 border-b border-stone-100">
              নির্বাচিত পণ্য ({checkoutItems.length})
            </h3>
            <div className="divide-y divide-stone-100 max-h-56 overflow-y-auto mb-4 pr-1">
              {checkoutItems.map((item) => (
                <div key={item.productId} className="py-2.5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-stone-50 overflow-hidden shrink-0 border border-stone-200 p-1">
                    <img src={item.imageUrl} alt={item.nameBn} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-stone-900 line-clamp-1">{item.nameBn}</h4>
                    <div className="text-[11px] text-stone-500">{item.quantity} টি × {formatPrice(item.price)}</div>
                  </div>
                  <div className="text-xs font-bold text-stone-900 price-display">{formatPrice(item.total)}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs text-stone-600 pt-2 border-t border-stone-200">
              <div className="flex justify-between">
                <span>পণ্য</span>
                <span className="font-semibold text-stone-900 price-display">{formatPrice(itemsSubtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>ডেলিভারি চার্জ</span>
                <span className="font-semibold text-stone-900">
                  {deliveryCharge === 0 ? (
                    <span className="text-emerald-700 font-bold">ফ্রি</span>
                  ) : (
                    <span>
                      {formatPrice(deliveryCharge)}
                      <span className="text-[10px] text-stone-400 block text-right font-normal">
                        {isDhaka ? 'ঢাকা' : 'ঢাকার বাইরে'}
                      </span>
                    </span>
                  )}
                </span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
                <span className="font-bold text-sm text-stone-900">মোট</span>
                <span className="text-xl font-black text-emerald-900 price-display">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#F7F6F0] rounded-3xl border-2 border-emerald-800 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-bold">✓</div>
              <h4 className="font-bold text-emerald-950 text-sm sm:text-base">ক্যাশ অন ডেলিভারি</h4>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-emerald-950 bg-white p-3 rounded-xl border border-emerald-200/80 mb-2.5">
              পণ্য হাতে পেয়ে টাকা পরিশোধ করুন।
            </div>
            <div className="text-xs text-stone-700 space-y-1.5 pt-1">
              <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" /><span>পণ্য হাতে পেয়ে টাকা দিন</span></div>
              <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" /><span>কোনো অগ্রিম পেমেন্ট নেই</span></div>
              <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" /><span>ডেলিভারি চার্জ সিস্টেম অনুযায়ী</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function MapPinIcon() {
  return (
    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
      <span className="text-xs">⌖</span>
    </span>
  );
}
