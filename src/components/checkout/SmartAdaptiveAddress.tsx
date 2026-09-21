import React, { useState, useEffect } from 'react';
import { StructuredAddress, LocationType } from '../../types';
import {
  BD_DIVISIONS,
  BD_DISTRICTS,
  BD_UPAZILAS_THANAS,
  searchLocations,
} from '../../data/bangladeshLocations';
import { Search, MapPin, Building2, Trees, Check, AlertCircle } from 'lucide-react';
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
  // Autocomplete search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ReturnType<typeof searchLocations>>([]);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);

  // Available districts for current division
  const currentDivisionObj = BD_DIVISIONS.find((d) => d.nameBn === address.division);
  const availableDistricts = currentDivisionObj
    ? BD_DISTRICTS.filter((d) => d.divisionId === currentDivisionObj.id)
    : BD_DISTRICTS;

  // Available Upazilas/Thanas for current district
  const currentDistrictObj = BD_DISTRICTS.find((d) => d.nameBn === address.district);
  const availableUpazilas = currentDistrictObj
    ? BD_UPAZILAS_THANAS.filter((u) => u.districtId === currentDistrictObj.id)
    : [];

  const currentUpazilaObj = availableUpazilas.find((u) => u.nameBn === address.upazilaThana);

  // Handle location search typing
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      const results = searchLocations(query);
      setSearchResults(results);
      setShowResultsDropdown(true);
    } else {
      setSearchResults([]);
      setShowResultsDropdown(false);
    }
  };

  // Quick select from auto-suggestions
  const handleSelectSuggestedLocation = (item: (typeof searchResults)[0]) => {
    const isUrban = item.isUrban;
    const newAddress: StructuredAddress = {
      ...address,
      locationType: isUrban ? 'urban' : 'rural',
      division: item.division.nameBn,
      district: item.district.nameBn,
      upazilaThana: item.upazila.nameBn,
      city: isUrban ? (item.district.isDhakaCity ? 'ঢাকা' : item.district.nameBn) : undefined,
      area: isUrban && item.upazila.areas ? item.upazila.areas[0] : '',
      union: !isUrban && item.upazila.unions ? item.upazila.unions[0] : '',
    };
    newAddress.formattedFullAddress = formatAddress(newAddress);
    onChange(newAddress);
    setSearchQuery('');
    setShowResultsDropdown(false);
  };

  // Field change handler
  const handleFieldChange = (field: keyof StructuredAddress, value: any) => {
    const updated = { ...address, [field]: value };

    // Auto-update formatting
    updated.formattedFullAddress = formatAddress(updated);
    onChange(updated);
  };

  // Handle manual division change
  const handleDivisionChange = (divName: string) => {
    const divObj = BD_DIVISIONS.find((d) => d.nameBn === divName);
    const districts = divObj ? BD_DISTRICTS.filter((d) => d.divisionId === divObj.id) : [];
    const firstDistrict = districts[0]?.nameBn || '';

    const updated: StructuredAddress = {
      ...address,
      division: divName,
      district: firstDistrict,
      upazilaThana: '',
      area: '',
      union: '',
      village: '',
    };
    updated.formattedFullAddress = formatAddress(updated);
    onChange(updated);
  };

  // Handle manual district change
  const handleDistrictChange = (districtName: string) => {
    const distObj = BD_DISTRICTS.find((d) => d.nameBn === districtName);
    const isUrbanDefault = distObj?.isDhakaCity || distObj?.nameEn.includes('City');
    const upazilas = distObj ? BD_UPAZILAS_THANAS.filter((u) => u.districtId === distObj.id) : [];
    const firstUpazila = upazilas[0]?.nameBn || '';

    const updated: StructuredAddress = {
      ...address,
      district: districtName,
      locationType: isUrbanDefault ? 'urban' : address.locationType,
      city: isUrbanDefault ? distObj?.nameBn : address.city,
      upazilaThana: firstUpazila,
      area: '',
      union: '',
      village: '',
    };
    updated.formattedFullAddress = formatAddress(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* 1. Fast Location Search with Auto-Suggestion */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 sm:p-4">
        <label className="block text-xs font-bold text-emerald-900 mb-1.5 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-emerald-700" />
          <span>দ্রুত ঠিকানা খুঁজুন (Auto-Suggestion):</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setShowResultsDropdown(true);
            }}
            placeholder="থানা, উপজেলা বা শহরের নাম লিখুন (যেমন: মিরপুর, চরফ্যাশন, ভোলা, ধানমন্ডি)..."
            className="w-full bg-white text-stone-900 text-xs sm:text-sm pl-9 pr-4 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600 shadow-2xs"
            id="location-search-input"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />

          {/* Autocomplete Dropdown */}
          {showResultsDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-stone-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-stone-100 max-h-60 overflow-y-auto">
              <div className="px-3 py-1.5 bg-stone-50 text-[11px] font-semibold text-stone-500">
                পরামর্শ তালিকা (ক্লিক করলে স্বয়ংক্রিয়ভাবে পূরণ হবে):
              </div>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestedLocation(item)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <div>
                      <span className="font-bold text-stone-800">{item.matchText}</span>
                      <span className="text-[11px] text-stone-500 block">
                        বিভাগ: {item.division.nameBn}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      item.isUrban
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {item.isUrban ? 'শহর' : 'গ্রাম/উপজেলা'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Adaptive Location Type Switcher */}
      <div>
        <label className="block text-xs font-bold text-stone-700 mb-2">
          আপনার ডেলিভারি এলাকার ধরন নির্বাচন করুন:
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleFieldChange('locationType', 'urban')}
            className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              address.locationType === 'urban'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
            }`}
            id="location-type-urban-btn"
          >
            <Building2 className="w-4 h-4" />
            <span>শহর / মেট্রো এলাকা (Urban)</span>
          </button>

          <button
            type="button"
            onClick={() => handleFieldChange('locationType', 'rural')}
            className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              address.locationType === 'rural'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
            }`}
            id="location-type-rural-btn"
          >
            <Trees className="w-4 h-4" />
            <span>গ্রাম / মফস্বল / উপজেলা (Rural)</span>
          </button>
        </div>
      </div>

      {/* 3. Base Hierarchy: Division & District */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Division */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            বিভাগ <span className="text-rose-500">*</span>
          </label>
          <select
            value={address.division}
            onChange={(e) => handleDivisionChange(e.target.value)}
            className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
            id="address-division-select"
          >
            {BD_DIVISIONS.map((div) => (
              <option key={div.id} value={div.nameBn}>
                {div.nameBn}
              </option>
            ))}
          </select>
        </div>

        {/* District */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            জেলা / শহর <span className="text-rose-500">*</span>
          </label>
          <select
            value={address.district}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
            id="address-district-select"
          >
            {availableDistricts.map((dist) => (
              <option key={dist.id} value={dist.nameBn}>
                {dist.nameBn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. DYNAMIC ADAPTIVE FIELDS BASED ON LOCATION TYPE */}
      {address.locationType === 'rural' ? (
        /* RURAL ADDRESS FLOW:
           Division -> District -> Upazila/Thana -> Union -> Village/Locality -> House Details -> Landmark */
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Upazila / Thana */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                উপজেলা / থানা <span className="text-rose-500">*</span>
              </label>
              {availableUpazilas.length > 0 ? (
                <select
                  value={address.upazilaThana}
                  onChange={(e) => handleFieldChange('upazilaThana', e.target.value)}
                  className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
                  id="address-rural-upazila-select"
                >
                  <option value="">উপজেলা নির্বাচন করুন</option>
                  {availableUpazilas.map((u) => (
                    <option key={u.id} value={u.nameBn}>
                      {u.nameBn}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={address.upazilaThana}
                  onChange={(e) => handleFieldChange('upazilaThana', e.target.value)}
                  placeholder="উপজেলা / থানার নাম লিখুন"
                  className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
                />
              )}
            </div>

            {/* Union */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                ইউনিয়ন <span className="text-rose-500">*</span>
              </label>
              {currentUpazilaObj?.unions && currentUpazilaObj.unions.length > 0 ? (
                <div className="space-y-1">
                  <select
                    value={address.union || ''}
                    onChange={(e) => handleFieldChange('union', e.target.value)}
                    className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
                    id="address-rural-union-select"
                  >
                    <option value="">ইউনিয়ন নির্বাচন করুন</option>
                    {currentUpazilaObj.unions.map((u, i) => (
                      <option key={i} value={u}>
                        {u} ইউনিয়ন
                      </option>
                    ))}
                    <option value="other">অন্যান্য (নিচে লিখুন)</option>
                  </select>
                  {address.union === 'other' && (
                    <input
                      type="text"
                      onChange={(e) => handleFieldChange('union', e.target.value)}
                      placeholder="ইউনিয়নের নাম লিখুন"
                      className="w-full bg-white text-stone-800 text-xs px-3 py-2 rounded-lg border border-stone-300"
                    />
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={address.union || ''}
                  onChange={(e) => handleFieldChange('union', e.target.value)}
                  placeholder="ইউনিয়নের নাম লিখুন (যেমন: আসলামপুর ইউনিয়ন)"
                  className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
                  id="address-rural-union-input"
                />
              )}
            </div>
          </div>

          {/* Village / Locality */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              গ্রাম / পাড়া / এলাকা <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={address.village || ''}
              onChange={(e) => handleFieldChange('village', e.target.value)}
              placeholder="গ্রামের নাম ও ওয়ার্ড নং (যেমন: পূর্ব আসলামপুর, ৩ নং ওয়ার্ড)"
              className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
              id="address-rural-village-input"
            />
          </div>

          {/* House / Road Details */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              বাড়ির নাম বা সুনির্দিষ্ট ঠিকানা <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={address.detailedAddress}
              onChange={(e) => handleFieldChange('detailedAddress', e.target.value)}
              placeholder="যেমন: মৌলভী বাড়ি, পোস্ট অফিস রোড"
              className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
              id="address-rural-detailed-input"
            />
          </div>
        </div>
      ) : (
        /* URBAN ADDRESS FLOW:
           City -> Area/Thana -> Road/Block/Sector/Mahalla -> House/Building/Flat -> Detailed Address -> Landmark */
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Area / Thana */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                থানা / প্রধান এলাকা <span className="text-rose-500">*</span>
              </label>
              {availableUpazilas.length > 0 ? (
                <select
                  value={address.upazilaThana}
                  onChange={(e) => handleFieldChange('upazilaThana', e.target.value)}
                  className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
                  id="address-urban-thana-select"
                >
                  <option value="">থানা নির্বাচন করুন</option>
                  {availableUpazilas.map((u) => (
                    <option key={u.id} value={u.nameBn}>
                      {u.nameBn}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={address.upazilaThana}
                  onChange={(e) => handleFieldChange('upazilaThana', e.target.value)}
                  placeholder="যেমন: মিরপুর, ধানমন্ডি, গুলশান"
                  className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
                />
              )}
            </div>

            {/* Sub-area / Sector / Block */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                সাব-এরিয়া / সেকশন <span className="text-rose-500">*</span>
              </label>
              {currentUpazilaObj?.areas && currentUpazilaObj.areas.length > 0 ? (
                <div className="space-y-1">
                  <select
                    value={address.area || ''}
                    onChange={(e) => handleFieldChange('area', e.target.value)}
                    className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
                    id="address-urban-area-select"
                  >
                    <option value="">এলাকা নির্বাচন করুন</option>
                    {currentUpazilaObj.areas.map((a, i) => (
                      <option key={i} value={a}>
                        {a}
                      </option>
                    ))}
                    <option value="other">অন্যান্য (নিচে লিখুন)</option>
                  </select>
                  {address.area === 'other' && (
                    <input
                      type="text"
                      onChange={(e) => handleFieldChange('area', e.target.value)}
                      placeholder="এলাকার নাম লিখুন"
                      className="w-full bg-white text-stone-800 text-xs px-3 py-2 rounded-lg border border-stone-300"
                    />
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={address.area || ''}
                  onChange={(e) => handleFieldChange('area', e.target.value)}
                  placeholder="যেমন: মিরপুর ১০, সেক্টর ৭, সেনপাড়া"
                  className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
                  id="address-urban-area-input"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Road / Block / Sector */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                রোড / ব্লক / লেন <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={address.roadBlockSector || ''}
                onChange={(e) => handleFieldChange('roadBlockSector', e.target.value)}
                placeholder="যেমন: রোড ৫, ব্লক সি"
                className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
                id="address-urban-road-input"
              />
            </div>

            {/* House / Flat / Building */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                বাড়ি নং / ফ্ল্যাট / তলা <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={address.houseFlat || ''}
                onChange={(e) => handleFieldChange('houseFlat', e.target.value)}
                placeholder="যেমন: বাড়ি ২৫, ৩য় তলা (ফ্ল্যাট ৩বি)"
                className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
                id="address-urban-house-input"
              />
            </div>
          </div>

          {/* Detailed Address */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              বিস্তারিত ঠিকানা <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={address.detailedAddress}
              onChange={(e) => handleFieldChange('detailedAddress', e.target.value)}
              placeholder="রাস্তা বা বাড়ির বিশেষ কোনো নির্দেশনা (ঐচ্ছিক/প্রয়োজনীয়)"
              className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
              id="address-urban-detailed-input"
            />
          </div>
        </div>
      )}

      {/* Incomplete Address Warning (Section 15: "আপনার ডেলিভারি ঠিকানা অসম্পূর্ণ। অনুগ্রহ করে প্রয়োজনীয় তথ্য দিন।") */}
      {showError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-bold">
            আপনার ডেলিভারি ঠিকানা অসম্পূর্ণ। অনুগ্রহ করে প্রয়োজনীয় তথ্য দিন।
          </span>
        </div>
      )}
    </div>
  );
};
