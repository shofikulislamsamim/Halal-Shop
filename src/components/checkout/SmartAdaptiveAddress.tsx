import React, { useEffect, useState } from 'react';
import { StructuredAddress } from '../../types';
import {
  BD_DIVISIONS,
  BD_DISTRICTS,
  BD_UPAZILAS_THANAS,
  searchLocations,
} from '../../data/bangladeshLocations';
import { Search, MapPin, AlertCircle } from 'lucide-react';
import { formatAddress } from '../../utils/helpers';

interface SmartAdaptiveAddressProps {
  address: StructuredAddress;
  onChange: (updated: StructuredAddress) => void;
  showError?: boolean;
}

export const SmartAdaptiveAddress: React.FC<SmartAdaptiveAddressProps> = ({
  address,
  onChange,
  showError,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ReturnType<typeof searchLocations>>([]);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);

  const currentDistrictObj = BD_DISTRICTS.find((d) => d.nameBn === address.district);
  const availableUpazilas = currentDistrictObj
    ? BD_UPAZILAS_THANAS.filter((u) => u.districtId === currentDistrictObj.id)
    : [];

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResultsDropdown(false);
      return;
    }

    if (searchQuery.trim().length >= 2) {
      setSearchResults(searchLocations(searchQuery).slice(0, 8));
      setShowResultsDropdown(true);
    }
  }, [searchQuery]);

  const updateAddress = (changes: Partial<StructuredAddress>) => {
    const updated: StructuredAddress = {
      ...address,
      ...changes,
    };
    updated.formattedFullAddress = formatAddress(updated);
    onChange(updated);
  };

  const handleSelectSuggestedLocation = (item: (typeof searchResults)[0]) => {
    const district = item.district.nameBn;
    const division = item.division.nameBn;
    const upazila = item.upazila.nameBn;
    const suggestedArea = item.isUrban
      ? item.upazila.areas?.[0] || ''
      : item.upazila.unions?.[0] || '';

    updateAddress({
      division,
      district,
      upazilaThana: upazila,
      area: suggestedArea,
      city: item.isUrban
        ? item.district.isDhakaCity
          ? 'ঢাকা'
          : item.district.nameBn
        : undefined,
      locationType: item.isUrban ? 'urban' : 'rural',
      union: !item.isUrban ? suggestedArea : '',
      village: '',
      roadBlockSector: '',
      houseFlat: '',
    });

    setSearchQuery('');
    setSearchResults([]);
    setShowResultsDropdown(false);
  };

  const handleDistrictChange = (districtName: string) => {
    const district = BD_DISTRICTS.find((d) => d.nameBn === districtName);
    const division = district
      ? BD_DIVISIONS.find((d) => d.id === district.divisionId)?.nameBn || address.division
      : address.division;
    const upazilas = district
      ? BD_UPAZILAS_THANAS.filter((u) => u.districtId === district.id)
      : [];

    updateAddress({
      division,
      district: districtName,
      upazilaThana: '',
      area: '',
      union: '',
      village: '',
      roadBlockSector: '',
      houseFlat: '',
      city: district?.isDhakaCity ? 'ঢাকা' : districtName,
      locationType: district?.isDhakaCity ? 'urban' : 'rural',
    });
  };

  const handleUpazilaChange = (value: string) => {
    const upazila = availableUpazilas.find((u) => u.nameBn === value);
    updateAddress({
      upazilaThana: value,
      area: '',
      union: '',
      village: '',
      roadBlockSector: '',
      houseFlat: '',
      locationType: address.locationType,
    });

    if (upazila) {
      const firstArea = upazila.areas?.[0] || '';
      const firstUnion = upazila.unions?.[0] || '';
      if (address.locationType === 'urban' && firstArea) {
        updateAddress({ area: firstArea });
      } else if (address.locationType === 'rural' && firstUnion) {
        updateAddress({ area: firstUnion, union: firstUnion });
      }
    }
  };

  const isDhakaCity = Boolean(currentDistrictObj?.isDhakaCity);

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 sm:p-4">
        <label className="block text-xs font-bold text-emerald-900 mb-1.5 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-emerald-700" />
          <span>দ্রুত ঠিকানা খুঁজুন <span className="font-normal text-emerald-700">(ঐচ্ছিক)</span></span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResultsDropdown(true)}
            placeholder="থানা, উপজেলা, এলাকা বা শহরের নাম লিখুন..."
            className="w-full bg-white text-stone-900 text-xs sm:text-sm pl-9 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600 shadow-2xs"
            id="location-search-input"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />

          {showResultsDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-stone-200 rounded-xl shadow-xl z-30 overflow-hidden">
              {searchResults.length > 0 ? (
                <>
                  <div className="px-3 py-1.5 bg-stone-50 text-[11px] font-semibold text-stone-500">
                    একটি ঠিকানা নির্বাচন করুন
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-stone-100">
                    {searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestedLocation(item)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 flex items-center gap-2 text-xs transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="font-semibold text-stone-800">{item.matchText}</span>
                        <span className="text-[10px] text-stone-500 ml-auto">
                          {item.division.nameBn}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="px-3.5 py-3 text-xs text-stone-500">
                  মিল পাওয়া যায়নি। নিচের ঘরগুলোতে ঠিকানা লিখুন।
                </div>
              )}
            </div>
          )}
        </div>
        <p className="text-[10px] text-emerald-700 mt-1.5">
          ঠিকানা খুঁজে পেলে জেলা ও থানা/উপজেলা স্বয়ংক্রিয়ভাবে পূরণ হবে।
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            জেলা <span className="text-rose-500">*</span>
          </label>
          <select
            value={address.district}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
            id="address-district-select"
          >
            <option value="">জেলা নির্বাচন করুন</option>
            {BD_DISTRICTS.map((district) => (
              <option key={district.id} value={district.nameBn}>
                {district.nameBn}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            থানা / উপজেলা <span className="text-rose-500">*</span>
          </label>
          {availableUpazilas.length > 0 ? (
            <select
              value={address.upazilaThana}
              onChange={(e) => handleUpazilaChange(e.target.value)}
              className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
              id="address-upazila-thana-select"
            >
              <option value="">থানা / উপজেলা নির্বাচন করুন</option>
              {availableUpazilas.map((u) => (
                <option key={u.id} value={u.nameBn}>
                  {u.nameBn}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={address.upazilaThana || ''}
              onChange={(e) => updateAddress({ upazilaThana: e.target.value })}
              placeholder="থানা / উপজেলার নাম লিখুন"
              className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
              id="address-upazila-thana-input"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            এলাকা / ইউনিয়ন / বাজার / মহল্লা <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={address.area || ''}
            onChange={(e) => updateAddress({ area: e.target.value, union: e.target.value })}
            placeholder={isDhakaCity ? 'যেমন: মিরপুর ১০, সেনপাড়া, পল্লবী' : 'যেমন: বাজার, ইউনিয়ন, গ্রাম বা এলাকার নাম'}
            className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
            id="address-area-input"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            বিস্তারিত ঠিকানা <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={address.detailedAddress || ''}
            onChange={(e) => updateAddress({ detailedAddress: e.target.value })}
            placeholder="বাড়ি/ফ্ল্যাট, রোড/লেন, নিকটস্থ পরিচিত স্থানসহ বিস্তারিত ঠিকানা লিখুন"
            className="w-full bg-white text-stone-800 text-xs sm:text-sm p-3 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600 resize-none"
            id="address-detailed-input"
          />
        </div>
      </div>

      {showError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-bold">অনুগ্রহ করে জেলা, থানা/উপজেলা, এলাকা এবং বিস্তারিত ঠিকানা পূরণ করুন।</span>
        </div>
      )}
    </div>
  );
};
