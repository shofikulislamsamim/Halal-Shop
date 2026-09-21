import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { StructuredAddress, OrderItem } from '../../types';
import { SmartAdaptiveAddress } from './SmartAdaptiveAddress';
import {
  formatPrice,
  isValidBdPhone,
  sanitizeBdPhone,
  formatAddress,
} from '../../utils/helpers';
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Edit2,
  Phone,
  User,
  ShoppingBag,
  Banknote,
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

  // Determine items to checkout: either direct item from "Buy Now" or cart items
  const checkoutItems: OrderItem[] = directCheckoutItem
    ? [
        {
          productId: directCheckoutItem.product.id,
          nameBn: directCheckoutItem.product.nameBn,
          price: directCheckoutItem.product.price,
          quantity: directCheckoutItem.quantity,
          total: directCheckoutItem.product.price * directCheckoutItem.quantity,
          imageUrl: directCheckoutItem.product.imageUrl,
        },
      ]
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

  // Customer Contact Fields
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [altMobile, setAltMobile] = useState('');
  const [orderNote, setOrderNote] = useState('');

  // Structured Address State (Landmark strictly omitted)
  const [address, setAddress] = useState<StructuredAddress>({
    locationType: 'urban',
    division: 'ঢাকা বিভাগ',
    district: 'ঢাকা (মেট্রো / সিটি)',
    upazilaThana: 'মিরপুর',
    city: 'ঢাকা',
    area: 'মিরপুর ১০',
    roadBlockSector: '',
    houseFlat: '',
    detailedAddress: '',
    formattedFullAddress: '',
  });

  // Flow State: Form step vs Review/Confirmation step
  const [isReviewingAddress, setIsReviewingAddress] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [addressIncompleteError, setAddressIncompleteError] = useState(false);

  // Delivery charge calculation
  const isDhaka =
    address.district.includes('ঢাকা') ||
    address.city?.includes('ঢাকা') ||
    address.division === 'ঢাকা বিভাগ' && address.locationType === 'urban';

  const isFreeDelivery = itemsSubtotal >= settings.freeDeliveryThreshold;
  const deliveryCharge = isFreeDelivery
    ? 0
    : isDhaka
    ? settings.deliveryChargeDhaka
    : settings.deliveryChargeOutsideDhaka;

  const totalAmount = itemsSubtotal + deliveryCharge;

  // Validate entire checkout payload (Landmark is NOT validated)
  const validateForm = (): boolean => {
    setHasValidated(true);
    let valid = true;

    // Name validation
    if (!customerName.trim() || customerName.trim().length < 2) {
      setNameError('অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন');
      valid = false;
    } else {
      setNameError('');
    }

    // Phone validation
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

    // Smart Address Validation according to location type
    let addressValid = true;

    if (!address.division || !address.district || !address.upazilaThana) {
      addressValid = false;
    }

    if (address.locationType === 'rural') {
      // For rural: Union, Village, Detailed Address required (NO landmark)
      if (
        !address.union?.trim() ||
        !address.village?.trim() ||
        !address.detailedAddress.trim()
      ) {
        addressValid = false;
      }
    } else {
      // For urban: Area/Thana, Road/Block, House/Building, Detailed Address required (NO landmark)
      if (
        !address.area?.trim() ||
        !address.roadBlockSector?.trim() ||
        !address.houseFlat?.trim()
      ) {
        addressValid = false;
      }
    }

    if (!addressValid) {
      setAddressIncompleteError(true);
      valid = false;
    } else {
      setAddressIncompleteError(false);
    }

    return valid;
  };

  // Proceed to Address Confirmation review step
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsReviewingAddress(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Final submit after confirmation
  const handleConfirmFinalOrder = () => {
    if (!validateForm()) {
      setIsReviewingAddress(false);
      return;
    }

    const finalAddress = {
      ...address,
      formattedFullAddress: formatAddress(address),
    };

    placeOrder({
      customerName: customerName.trim(),
      mobile: sanitizeBdPhone(mobile),
      altMobile: altMobile.trim() ? sanitizeBdPhone(altMobile) : undefined,
      address: finalAddress,
      items: checkoutItems,
      subtotal: itemsSubtotal,
      deliveryCharge,
      total: totalAmount,
      orderNote: orderNote.trim() || undefined,
    });
  };

  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto mb-3">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 mb-2">অর্ডার করার জন্য কোনো পণ্য নির্বাচন করা নেই</h2>
        <button
          onClick={() => navigateTo('products')}
          className="bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
        >
          পণ্য দেখুন
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 pb-24">
      {/* 1. Header with Back Button */}
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
            {isReviewingAddress ? 'ডেলিভারি ঠিকানা ও অর্ডার নিশ্চিতকরণ' : 'অর্ডার চেকআউট (সহজ ডেলিভারি)'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            {isReviewingAddress
              ? 'অনুগ্রহ করে ডেলিভারি তথ্য মিলিয়ে দেখে নিশ্চিত করুন'
              : 'রেজিস্ট্রেশন ছাড়াই শুধু প্রয়োজনীয় তথ্য দিয়ে দ্রুত অর্ডার সম্পন্ন করুন'}
          </p>
        </div>
      </div>

      {/* 2. Subtle Checkout Progress Indicator */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 text-xs sm:text-sm font-semibold max-w-md mx-auto py-2 px-3 bg-stone-50 rounded-2xl border border-stone-200/80">
        <div className={`flex items-center gap-1.5 ${!isReviewingAddress ? 'text-emerald-900 font-bold' : 'text-stone-400 font-normal'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${!isReviewingAddress ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-600'}`}>
            ১
          </span>
          <span>তথ্য ও ঠিকানা</span>
        </div>
        <div className="w-6 sm:w-10 h-0.5 bg-stone-300" />
        <div className={`flex items-center gap-1.5 ${isReviewingAddress ? 'text-emerald-900 font-bold' : 'text-stone-400 font-normal'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${isReviewingAddress ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-600'}`}>
            ২
          </span>
          <span>রিভিউ ও কনফার্ম</span>
        </div>
        <div className="w-6 sm:w-10 h-0.5 bg-stone-300" />
        <div className="flex items-center gap-1.5 text-stone-400 font-normal">
          <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center text-[11px] font-bold">
            ৩
          </span>
          <span>সম্পন্ন</span>
        </div>
      </div>

      {/* 3. Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Form OR Address Confirmation Screen */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 2: ADDRESS CONFIRMATION SCREEN */}
          {isReviewingAddress ? (
            <div className="bg-white rounded-3xl border-2 border-emerald-700 p-5 sm:p-7 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4 text-emerald-900 pb-3 border-b border-emerald-100">
                <CheckCircle2 className="w-6 h-6 text-emerald-800" />
                <h2 className="text-lg sm:text-xl font-bold">
                  আপনার ডেলিভারি তথ্য মিলিয়ে নিন
                </h2>
              </div>

              {/* Clean Summary Card */}
              <div className="bg-[#F7F6F0] rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-3 text-xs sm:text-sm text-stone-700 mb-6">
                <div className="flex items-baseline justify-between border-b border-stone-200/80 pb-2">
                  <span className="font-semibold text-stone-500">গ্রাহকের নাম:</span>
                  <span className="font-bold text-stone-900 text-base">{customerName}</span>
                </div>

                <div className="flex items-baseline justify-between border-b border-stone-200/80 pb-2">
                  <span className="font-semibold text-stone-500">মোবাইল নাম্বার:</span>
                  <span className="font-bold text-emerald-900 text-sm price-display">{mobile}</span>
                </div>

                {altMobile && (
                  <div className="flex items-baseline justify-between border-b border-stone-200/80 pb-2">
                    <span className="font-semibold text-stone-500">বিকল্প মোবাইল:</span>
                    <span className="text-stone-800 price-display">{altMobile}</span>
                  </div>
                )}

                <div className="border-b border-stone-200/80 pb-2">
                  <span className="font-semibold text-stone-500 block mb-1">এলাকার ধরন:</span>
                  <span className="font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs">
                    {address.locationType === 'urban' ? 'শহর / মেট্রো' : 'গ্রাম / উপজেলা'}
                  </span>
                </div>

                <div className="border-b border-stone-200/80 pb-2">
                  <span className="font-semibold text-stone-500 block mb-1">প্রশাসনিক অবস্থান:</span>
                  <span className="text-stone-900 font-medium">
                    বিভাগ: {address.division} | জেলা: {address.district} | উপজেলা/থানা: {address.upazilaThana}
                  </span>
                </div>

                {address.locationType === 'rural' ? (
                  <div className="border-b border-stone-200/80 pb-2">
                    <span className="font-semibold text-stone-500 block mb-1">ইউনিয়ন ও গ্রাম:</span>
                    <span className="text-stone-900 font-medium">
                      ইউনিয়ন: {address.union} | গ্রাম/পাড়া: {address.village}
                    </span>
                  </div>
                ) : (
                  <div className="border-b border-stone-200/80 pb-2">
                    <span className="font-semibold text-stone-500 block mb-1">এলাকা ও রোড/বাড়ি:</span>
                    <span className="text-stone-900 font-medium">
                      এলাকা: {address.area} | রোড/ব্লক: {address.roadBlockSector} | বাড়ি/ফ্ল্যাট: {address.houseFlat}
                    </span>
                  </div>
                )}

                <div className="border-b border-stone-200/80 pb-2">
                  <span className="font-semibold text-stone-500 block mb-1">সম্পূর্ণ বিস্তারিত ঠিকানা:</span>
                  <p className="text-stone-900 font-semibold bg-white p-3 rounded-xl border border-stone-200 leading-relaxed">
                    {address.detailedAddress}
                  </p>
                </div>

                {orderNote && (
                  <div>
                    <span className="font-semibold text-stone-500 block mb-1">অর্ডার নোট / বিশেষ নির্দেশনা:</span>
                    <span className="text-stone-700 italic">{orderNote}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons: Edit OR Confirm */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsReviewingAddress(false)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs sm:text-sm hover:bg-stone-100 flex items-center justify-center gap-2 transition-colors order-2 sm:order-1"
                  id="checkout-edit-address-btn"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>তথ্য সংশোধন করুন</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmFinalOrder}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] order-1 sm:order-2"
                  id="checkout-confirm-final-btn"
                >
                  <CheckCircle2 className="w-5 h-5 text-amber-300" />
                  <span>অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)</span>
                </button>
              </div>
            </div>
          ) : (
            /* STEP 1: CUSTOMER FORM & ADAPTIVE ADDRESS ENTRY */
            <form onSubmit={handleProceedToReview} className="space-y-6">
              {/* 1. Customer Personal Information */}
              <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-100">
                  <User className="w-5 h-5 text-emerald-800" />
                  <h2 className="text-base sm:text-lg font-bold text-stone-900">
                    ১. আপনার তথ্য (Customer Information)
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Full Name */}
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
                      className={`w-full bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border ${
                        nameError ? 'border-rose-500 bg-rose-50/40' : 'border-stone-300 focus:border-emerald-700'
                      } focus:outline-hidden shadow-2xs`}
                      id="checkout-name-input"
                    />
                    {nameError && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{nameError}</p>
                    )}
                  </div>

                  {/* Mobile & Alt Mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        মোবাইল নাম্বার (১১ ডিজিট) <span className="text-rose-500">*</span>
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
                          maxLength={11}
                          className={`w-full bg-white text-stone-900 text-xs sm:text-sm pl-10 pr-3 py-2.5 rounded-xl border ${
                            phoneError ? 'border-rose-500 bg-rose-50/40' : 'border-stone-300 focus:border-emerald-700'
                          } focus:outline-hidden shadow-2xs`}
                          id="checkout-phone-input"
                        />
                        <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                      {phoneError ? (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{phoneError}</p>
                      ) : (
                        <p className="text-[10px] text-stone-400 mt-1">
                          ডেলিভারিম্যান এই নাম্বারে কল করে পণ্য পৌঁছে দেবেন
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        বিকল্প মোবাইল নাম্বার (ঐচ্ছিক)
                      </label>
                      <input
                        type="tel"
                        value={altMobile}
                        onChange={(e) => setAltMobile(e.target.value)}
                        placeholder="অন্য কোনো চালু নাম্বার থাকলে দিন"
                        maxLength={11}
                        className="w-full bg-white text-stone-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-700 shadow-2xs"
                        id="checkout-alt-phone-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Smart Adaptive Address Section (Landmark strictly removed) */}
              <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-xs">
                <SmartAdaptiveAddress
                  address={address}
                  onChange={setAddress}
                  showError={hasValidated && addressIncompleteError}
                />

                {addressIncompleteError && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>অনুগ্রহ করে ঠিকানার সবকটি প্রয়োজনীয় ঘর সঠিকভাবে পূরণ করুন।</span>
                  </div>
                )}
              </div>

              {/* 3. Order Note */}
              <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-xs">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  অর্ডার সংক্রান্ত বিশেষ কোনো নির্দেশনা (ঐচ্ছিক)
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

              {/* Proceed to Review CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-base shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                  id="checkout-proceed-btn"
                >
                  <span>ঠিকানা যাচাই ও অর্ডারে এগিয়ে যান →</span>
                </button>
                <p className="text-center text-[11px] text-stone-500 mt-2">
                  পরের ধাপে আপনি আপনার সম্পূর্ণ তথ্য ও অর্ডার রিভিউ করে নিশ্চিত করতে পারবেন।
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Order Summary & Cash on Delivery Card */}
        <div className="space-y-4 sticky top-24">
          {/* Products Mini List */}
          <div className="bg-white rounded-3xl border border-stone-200/90 p-5 shadow-xs">
            <h3 className="font-bold text-stone-900 text-sm sm:text-base mb-3 pb-2 border-b border-stone-100">
              নির্বাচিত পণ্য সমূহ ({checkoutItems.length})
            </h3>

            <div className="divide-y divide-stone-100 max-h-56 overflow-y-auto mb-4 pr-1">
              {checkoutItems.map((item) => (
                <div key={item.productId} className="py-2.5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-stone-50 overflow-hidden shrink-0 border border-stone-200 p-1">
                    <img
                      src={item.imageUrl}
                      alt={item.nameBn}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-stone-900 line-clamp-1">
                      {item.nameBn}
                    </h4>
                    <div className="text-[11px] text-stone-500">
                      {item.quantity} টি x {formatPrice(item.price)}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-stone-900 price-display">
                    {formatPrice(item.total)}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2 text-xs text-stone-600 pt-2 border-t border-stone-200">
              <div className="flex justify-between">
                <span>পণ্য উপমোট (Subtotal):</span>
                <span className="font-semibold text-stone-900 price-display">{formatPrice(itemsSubtotal)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>ডেলিভারি চার্জ:</span>
                <span className="font-semibold text-stone-900">
                  {deliveryCharge === 0 ? (
                    <span className="text-emerald-700 font-bold">ফ্রি (৳ ০)</span>
                  ) : (
                    <span>
                      {formatPrice(deliveryCharge)}
                      <span className="text-[10px] text-stone-400 block text-right font-normal">
                        ({isDhaka ? 'ঢাকা' : 'ঢাকার বাইরে'})
                      </span>
                    </span>
                  )}
                </span>
              </div>

              <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
                <span className="font-bold text-sm text-stone-900">মোট প্রদেয় টাকা:</span>
                <span className="text-xl font-black text-emerald-900 price-display">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Card - Cash on Delivery (COD) Focus (Section 17) */}
          <div className="bg-[#F7F6F0] rounded-3xl border-2 border-emerald-800 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <h4 className="font-bold text-emerald-950 text-sm sm:text-base">
                ক্যাশ অন ডেলিভারি (Cash on Delivery)
              </h4>
            </div>

            <div className="text-xs sm:text-sm font-semibold text-emerald-950 bg-white p-3 rounded-xl border border-emerald-200/80 mb-2.5">
              পণ্য হাতে পেয়ে টাকা পরিশোধ করুন।
            </div>

            {/* Section 17 Highlight points */}
            <div className="text-xs text-stone-700 space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 font-bold" />
                <span className="font-medium">পণ্য হাতে পেয়ে টাকা দিন</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 font-bold" />
                <span className="font-medium">কোনো অগ্রিম পেমেন্ট নেই</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 font-bold" />
                <span className="font-medium">১০০% নিরাপদ ও নির্ভরযোগ্য</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
