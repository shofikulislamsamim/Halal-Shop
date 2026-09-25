import React, { useEffect, useMemo, useState } from 'react';
import { StructuredAddress } from '../../types';
import {
  BD_DIVISIONS,
  BD_DISTRICTS,
  BD_UPAZILAS_THANAS,
  loadCompleteBangladeshLocations,
} from '../../data/bangladeshLocations';
import { Search, MapPin, AlertCircle, Loader2 } from 'lucide-react';
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
  const [divisions, setDivisions] = useState(BD_DIVISIONS);
  const [districts, setDistricts] = useState(BD_DISTRICTS);
  const [upazilas, setUpazilas] = useState(BD_UPAZILAS_THANAS);
  const [locationDataReady, setLocationDataReady] = useState(false);
  const [locationDataError, setLocationDataError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadCompleteBangladeshLocations()
      .then((complete) => {
        if (cancelled) return;
        setDivisions(complete.divisions);
        setDistricts(complete.districts);
        setUpazilas(complete.upazilas);
        setLocationDataReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setLocationDataError(true);
          setLocationDataReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const currentDistrictObj = districts.find((d) => d.nameBn === address.district);
  const availableUpazilas = useMemo(
    () => (currentDistrictObj
      ? upazilas.filter((u) => u.districtId === currentDistrictObj.id)
      : []),
    [currentDistrictObj, upazilas]
  );

  const currentUpazilaObj = availableUpazilas.find(
    (u) => u.nameBn === address.upazilaThana
  );

  const availableAreas = useMemo(() => {
    if (!currentUpazilaObj) return [];
    return [...new Set([
      ...(currentUpazilaObj.areas || []),
      ...(currentUpazilaObj.unions || []),
    ])].filter(Boolean);
  }, [currentUpazilaObj]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) return [];

    const results: {
      division: typeof divisions[number];
      district: typeof districts[number];
      upazila: typeof upazilas[number];
      matchText: string;
    }[] = [];

    for (const upazila of upazilas) {
      const district = districts.find((d) => d.id === upazila.districtId);
      if (!district) continue;
      const division = divisions.find((d) => d.id === district.divisionId);
      if (!division) continue;

      const areaMatch = (upazila.areas || []).find((a) =>
        a.toLowerCase().includes(query)
      );
      const unionMatch = (upazila.unions || []).find((u) =>
        u.toLowerCase().includes(query)
      );

      const matches =
        upazila.nameBn.toLowerCase().includes(query) ||
        upazila.nameEn.toLowerCase().includes(query) ||
        district.nameBn.toLowerCase().includes(query) ||
        district.nameEn.toLowerCase().includes(query) ||
        division.nameBn.toLowerCase().includes(query) ||
        division.nameEn.toLowerCase().includes(query) ||
        Boolean(areaMatch) ||
        Boolean(unionMatch);

      if (matches) {
        results.push({
          division,
          district,
          upazila,
          matchText: areaMatch
            ? `${areaMatch} (${upazila.nameBn})`
            : unionMatch
            ? `${unionMatch} (${upazila.nameBn})`
            : `${upazila.nameBn}, ${district.nameBn}`,
        });
      }

      if (results.length >= 8) break;
    }

    return results;
  }, [searchQuery, divisions, districts, upazilas]);

  const updateAddress = (changes: Partial<StructuredAddress>) => {
    const updated: StructuredAddress = {
      ...address,
      ...changes,
    };
    updated.formattedFullAddress = formatAddress(updated);
    onChange(updated);
  };

  const handleSelectSuggestedLocation = (item: (typeof searchResults)[number]) => {
    const suggestedArea = item.upazila.areas?.[0] || item.upazila.unions?.[0] || '';

    updateAddress({
      division: item.division.nameBn,
      district: item.district.nameBn,
      upazilaThana: item.upazila.nameBn,
      area: suggestedArea,
      union: suggestedArea,
      city: item.district.isDhakaCity ? 'ঢাকা' : item.district.nameBn,
      locationType: item.upazila.isUrban ? 'urban' : 'rural',
      village: '',
      roadBlockSector: '',
      houseFlat: '',
    });

    setSearchQuery('');
    setShowResultsDropdown(false);
  };

  const handleDistrictChange = (districtName: string) => {
    const district = districts.find((d) => d.nameBn === districtName);
    const division = district
      ? divisions.find((d) => d.id === district.divisionId)?.nameBn || ''
      : '';

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

    // IMPORTANT: update the upazila and its first area in ONE state update.
    // The previous implementation used two updates and the second one could
    // overwrite the selected upazila with stale state.
    const firstArea = upazila?.areas?.[0] || upazila?.unions?.[0] || '';

    updateAddress({
      upazilaThana: value,
      area: '',
      union: '',
      village: '',
      roadBlockSector: '',
      houseFlat: '',
      locationType: upazila?.isUrban ? 'urban' : 'rural',
    });

    if (firstArea) {
      // Keep the area empty so the customer explicitly chooses the correct
      // union/area instead of accidentally receiving the first item.
    }
  };

  const handleAreaChange = (value: string) => {
    updateAddress({
      area: value,
      union: value,
    });
  };

  const isDhakaDistrict = Boolean(currentDistrictObj?.isDhakaCity);

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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResultsDropdown(e.target.value.trim().length >= 2);
            }}
            onFocus={() => searchResults.length > 0 && setShowResultsDropdown(true)}
            placeholder="জেলা, থানা, উপজেলা, ইউনিয়ন বা এলাকার নাম লিখুন..."
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
                        key={`${item.district.id}-${item.upazila.id}-${idx}`}
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
                  মিল পাওয়া যায়নি। নিচের তালিকা থেকে ঠিকানা নির্বাচন করুন।
                </div>
              )}
            </div>
          )}
        </div>
        <div className="text-[10px] text-emerald-700 mt-1.5 flex items-center gap-1.5">
          {!locationDataReady && <Loader2 className="w-3 h-3 animate-spin" />}
          <span>
            {locationDataError
              ? 'সম্পূর্ণ লোকেশন ডেটা লোড হয়নি—প্রয়োজনে ঠিকানা লিখে দিতে পারবেন।'
              : locationDataReady
              ? 'বাংলাদেশের সম্পূর্ণ জেলা, উপজেলা ও ইউনিয়ন তালিকা প্রস্তুত।'
              : 'সম্পূর্ণ জেলা, উপজেলা ও ইউনিয়নের তথ্য লোড হচ্ছে...'}
          </span>
        </div>
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
            {districts.map((district) => (
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
              disabled={!address.district}
              className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600 disabled:bg-stone-100 disabled:text-stone-400"
              id="address-upazila-thana-select"
            >
              <option value="">
                {address.district ? 'থানা / উপজেলা নির্বাচন করুন' : 'আগে জেলা নির্বাচন করুন'}
              </option>
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
              disabled={!address.district}
              placeholder="থানা / উপজেলার নাম লিখুন"
              className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600 disabled:bg-stone-100"
              id="address-upazila-thana-input"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            এলাকা / ইউনিয়ন / বাজার / মহল্লা <span className="text-rose-500">*</span>
          </label>

          {availableAreas.length > 0 ? (
            <select
              value={address.area || ''}
              onChange={(e) => handleAreaChange(e.target.value)}
              disabled={!address.upazilaThana}
              className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600 disabled:bg-stone-100 disabled:text-stone-400"
              id="address-area-select"
            >
              <option value="">
                {address.upazilaThana ? 'এলাকা / ইউনিয়ন নির্বাচন করুন' : 'আগে থানা / উপজেলা নির্বাচন করুন'}
              </option>
              {availableAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
              <option value="__other__">অন্যান্য / তালিকায় নেই</option>
            </select>
          ) : (
            <input
              type="text"
              value={address.area || ''}
              onChange={(e) => handleAreaChange(e.target.value)}
              disabled={!address.upazilaThana}
              placeholder={isDhakaDistrict ? 'যেমন: মিরপুর ১০, সেনপাড়া, পল্লবী' : 'এলাকা, ইউনিয়ন, বাজার বা মহল্লার নাম লিখুন'}
              className="w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600 disabled:bg-stone-100"
              id="address-area-input"
            />
          )}

          {address.area === '__other__' && (
            <input
              type="text"
              value=""
              onChange={(e) => handleAreaChange(e.target.value)}
              placeholder="আপনার এলাকার নাম লিখুন"
              className="mt-2 w-full bg-white text-stone-800 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-hidden focus:border-emerald-600"
              autoFocus
            />
          )}
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
