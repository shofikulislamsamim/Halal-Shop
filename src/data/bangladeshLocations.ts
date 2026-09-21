export interface BdDivision {
  id: string;
  nameBn: string;
  nameEn: string;
}

export interface BdDistrict {
  id: string;
  divisionId: string;
  nameBn: string;
  nameEn: string;
  isDhakaCity?: boolean;
}

export interface BdUpazilaThana {
  id: string;
  districtId: string;
  nameBn: string;
  nameEn: string;
  isUrban: boolean;
  unions?: string[];
  areas?: string[];
}

export const BD_DIVISIONS: BdDivision[] = [
  { id: 'dhaka', nameBn: 'ঢাকা বিভাগ', nameEn: 'Dhaka' },
  { id: 'chittagong', nameBn: 'চট্টগ্রাম বিভাগ', nameEn: 'Chittagong' },
  { id: 'barishal', nameBn: 'বরিশাল বিভাগ', nameEn: 'Barishal' },
  { id: 'sylhet', nameBn: 'সিলেট বিভাগ', nameEn: 'Sylhet' },
  { id: 'rajshahi', nameBn: 'রাজশাহী বিভাগ', nameEn: 'Rajshahi' },
  { id: 'khulna', nameBn: 'খুলনা বিভাগ', nameEn: 'Khulna' },
  { id: 'rangpur', nameBn: 'রংপুর বিভাগ', nameEn: 'Rangpur' },
  { id: 'mymensingh', nameBn: 'ময়মনসিংহ বিভাগ', nameEn: 'Mymensingh' },
];

export const BD_DISTRICTS: BdDistrict[] = [
  // Dhaka Division
  { id: 'dhaka_city', divisionId: 'dhaka', nameBn: 'ঢাকা (মেট্রো / সিটি)', nameEn: 'Dhaka City', isDhakaCity: true },
  { id: 'dhaka_rural', divisionId: 'dhaka', nameBn: 'ঢাকা (জেলা / সাভার / ধামরাই)', nameEn: 'Dhaka District' },
  { id: 'gazipur', divisionId: 'dhaka', nameBn: 'গাজীপুর', nameEn: 'Gazipur' },
  { id: 'narayanganj', divisionId: 'dhaka', nameBn: 'নারায়ণগঞ্জ', nameEn: 'Narayanganj' },
  { id: 'tangail', divisionId: 'dhaka', nameBn: 'টাঙ্গাইল', nameEn: 'Tangail' },
  { id: 'narsingdi', divisionId: 'dhaka', nameBn: 'নরসিংদী', nameEn: 'Narsingdi' },
  { id: 'faridpur', divisionId: 'dhaka', nameBn: 'ফরিদপুর', nameEn: 'Faridpur' },
  { id: 'kishoreganj', divisionId: 'dhaka', nameBn: 'কিশোরগঞ্জ', nameEn: 'Kishoreganj' },
  { id: 'manikganj', divisionId: 'dhaka', nameBn: 'মানিকগঞ্জ', nameEn: 'Manikganj' },
  { id: 'munshiganj', divisionId: 'dhaka', nameBn: 'মুন্সীগঞ্জ', nameEn: 'Munshiganj' },

  // Barishal Division
  { id: 'bhola', divisionId: 'barishal', nameBn: 'ভোলা', nameEn: 'Bhola' },
  { id: 'barishal_dist', divisionId: 'barishal', nameBn: 'বরিশাল সদর ও জেলা', nameEn: 'Barishal' },
  { id: 'patuakhali', divisionId: 'barishal', nameBn: 'পটুয়াখালী', nameEn: 'Patuakhali' },
  { id: 'pirojpur', divisionId: 'barishal', nameBn: 'পিরোজপুর', nameEn: 'Pirojpur' },
  { id: 'barguna', divisionId: 'barishal', nameBn: 'বরগুনা', nameEn: 'Barguna' },
  { id: 'jhalokathi', divisionId: 'barishal', nameBn: 'ঝালকাঠি', nameEn: 'Jhalokathi' },

  // Chittagong Division
  { id: 'chittagong_city', divisionId: 'chittagong', nameBn: 'চট্টগ্রাম (সিটি কর্পোরেশন)', nameEn: 'Chittagong City' },
  { id: 'chittagong_dist', divisionId: 'chittagong', nameBn: 'চট্টগ্রাম জেলা', nameEn: 'Chittagong District' },
  { id: 'cumilla', divisionId: 'chittagong', nameBn: 'কুমিল্লা', nameEn: 'Cumilla' },
  { id: 'brahmanbaria', divisionId: 'chittagong', nameBn: 'ব্রাহ্মণবাড়িয়া', nameEn: 'Brahmanbaria' },
  { id: 'noakhali', divisionId: 'chittagong', nameBn: 'নোয়াখালী', nameEn: 'Noakhali' },
  { id: 'feni', divisionId: 'chittagong', nameBn: 'ফেনী', nameEn: 'Feni' },
  { id: 'coxsbazar', divisionId: 'chittagong', nameBn: 'কক্সবাজার', nameEn: 'Cox\'s Bazar' },
  { id: 'chandpur', divisionId: 'chittagong', nameBn: 'চাঁদপুর', nameEn: 'Chandpur' },

  // Sylhet Division
  { id: 'sylhet_dist', divisionId: 'sylhet', nameBn: 'সিলেট', nameEn: 'Sylhet' },
  { id: 'moulvibazar', divisionId: 'sylhet', nameBn: 'মৌলভীবাজার', nameEn: 'Moulvibazar' },
  { id: 'habiganj', divisionId: 'sylhet', nameBn: 'হবিগঞ্জ', nameEn: 'Habiganj' },
  { id: 'sunamganj', divisionId: 'sylhet', nameBn: 'সুনামগঞ্জ', nameEn: 'Sunamganj' },

  // Rajshahi Division
  { id: 'rajshahi_dist', divisionId: 'rajshahi', nameBn: 'রাজশাহী', nameEn: 'Rajshahi' },
  { id: 'bogra', divisionId: 'rajshahi', nameBn: 'বগুড়া', nameEn: 'Bogra' },
  { id: 'pabna', divisionId: 'rajshahi', nameBn: 'পাবনা', nameEn: 'Pabna' },
  { id: 'sirajganj', divisionId: 'rajshahi', nameBn: 'সিরাজগঞ্জ', nameEn: 'Sirajganj' },
  { id: 'naogaon', divisionId: 'rajshahi', nameBn: 'নওগাঁ', nameEn: 'Naogaon' },

  // Khulna Division
  { id: 'khulna_dist', divisionId: 'khulna', nameBn: 'খুলনা', nameEn: 'Khulna' },
  { id: 'jessore', divisionId: 'khulna', nameBn: 'যশোর', nameEn: 'Jashore' },
  { id: 'kushtia', divisionId: 'khulna', nameBn: 'কুষ্টিয়া', nameEn: 'Kushtia' },
  { id: 'satkhira', divisionId: 'khulna', nameBn: 'সাতক্ষীরা', nameEn: 'Satkhira' },

  // Rangpur Division
  { id: 'rangpur_dist', divisionId: 'rangpur', nameBn: 'রংপুর', nameEn: 'Rangpur' },
  { id: 'dinajpur', divisionId: 'rangpur', nameBn: 'দিনাজপুর', nameEn: 'Dinajpur' },

  // Mymensingh Division
  { id: 'mymensingh_dist', divisionId: 'mymensingh', nameBn: 'ময়মনসিংহ', nameEn: 'Mymensingh' },
  { id: 'jamalpur', divisionId: 'mymensingh', nameBn: 'জামালপুর', nameEn: 'Jamalpur' },
];

export const BD_UPAZILAS_THANAS: BdUpazilaThana[] = [
  // Dhaka Urban Thanas
  {
    id: 'mirpur',
    districtId: 'dhaka_city',
    nameBn: 'মিরপুর',
    nameEn: 'Mirpur',
    isUrban: true,
    areas: ['মিরপুর ১', 'মিরপুর ২', 'মিরপুর ৬', 'মিরপুর ১০', 'মিরপুর ১১', 'মিরপুর ১২', 'মিরপুর ১৪', 'কালশী', 'পাইকপাড়া'],
  },
  {
    id: 'dhanmondi',
    districtId: 'dhaka_city',
    nameBn: 'ধানমন্ডি',
    nameEn: 'Dhanmondi',
    isUrban: true,
    areas: ['রোড ২/এ', 'রোড ৮/এ', 'রোড ২৭', 'ঝিগাতলা', 'শংকর', 'সোবহানবাগ'],
  },
  {
    id: 'uttara',
    districtId: 'dhaka_city',
    nameBn: 'উত্তরা',
    nameEn: 'Uttara',
    isUrban: true,
    areas: ['সেক্টর ১', 'সেক্টর ৩', 'সেক্টর ৪', 'সেক্টর ৭', 'সেক্টর ৯', 'সেক্টর ১১', 'সেক্টর ১৩', 'আজমপুর', 'আব্দুল্লাহপুর'],
  },
  {
    id: 'gulshan',
    districtId: 'dhaka_city',
    nameBn: 'গুলশান',
    nameEn: 'Gulshan',
    isUrban: true,
    areas: ['গুলশান ১', 'গুলশান ২', 'নিকেতন', 'শাহজাদপুর'],
  },
  {
    id: 'banani',
    districtId: 'dhaka_city',
    nameBn: 'বনানী',
    nameEn: 'Banani',
    isUrban: true,
    areas: ['ব্লক বি', 'ব্লক সি', 'ব্লক ডি', 'বনানী ডিওএইচএস', 'কাকলী'],
  },
  {
    id: 'mohammadpur',
    districtId: 'dhaka_city',
    nameBn: 'মোহাম্মদপুর',
    nameEn: 'Mohammadpur',
    isUrban: true,
    areas: ['নুরজাহান রোড', 'তাজমহল রোড', 'রিজিয়া রোড', 'আসাদগেট', 'বসিলা', 'টোকিও স্কয়ার এলাকা'],
  },
  {
    id: 'badda',
    districtId: 'dhaka_city',
    nameBn: 'বাড্ডা',
    nameEn: 'Badda',
    isUrban: true,
    areas: ['মধ্য বাড্ডা', 'উত্তর বাড্ডা', 'মেরুল বাড্ডা', 'আফতাবনগর'],
  },
  {
    id: 'khilgaon',
    districtId: 'dhaka_city',
    nameBn: 'খিলগাঁও',
    nameEn: 'Khilgaon',
    isUrban: true,
    areas: ['ব্লক এ', 'ব্লক বি', 'তিলপাপাড়া', 'গোড়ান'],
  },
  {
    id: 'motijheel',
    districtId: 'dhaka_city',
    nameBn: 'মতিঝিল',
    nameEn: 'Motijheel',
    isUrban: true,
    areas: ['দিলকুশা', 'কমলাপুর', 'আরামবাগ', 'ফকিরাপুল'],
  },
  {
    id: 'jatrabari',
    districtId: 'dhaka_city',
    nameBn: 'যাত্রাবাড়ী',
    nameEn: 'Jatrabari',
    isUrban: true,
    areas: ['শনির আখড়া', 'কাজলা', 'ধোলাইপাড়', 'রায়েরবাগ'],
  },
  {
    id: 'rampura',
    districtId: 'dhaka_city',
    nameBn: 'রামপুরা',
    nameEn: 'Rampura',
    isUrban: true,
    areas: ['বনশ্রী', 'উলন', 'মালিবাগ চৌধুরীপাড়া'],
  },

  // Dhaka District / Semi-Urban / Rural
  { id: 'savar', districtId: 'dhaka_rural', nameBn: 'সাভার', nameEn: 'Savar', isUrban: false, unions: ['আশুলিয়া', 'বিরুলিয়া', 'ধামসোনা', 'শিমুলিয়া', 'তেঁতুলঝোড়া'] },
  { id: 'dhamrai', districtId: 'dhaka_rural', nameBn: 'ধামরাই', nameEn: 'Dhamrai', isUrban: false, unions: ['আমতা', 'বাইশাকান্দা', 'বালিয়া', 'যাদবপুর'] },
  { id: 'keraniganj', districtId: 'dhaka_rural', nameBn: 'কেরানীগঞ্জ', nameEn: 'Keraniganj', isUrban: false, unions: ['কালিন্দী', 'রোহিতপুর', 'শুভাঢ্যা', 'জিনজিরা'] },

  // Bhola District (Barishal) - explicitly requested in prompt
  {
    id: 'charfasson',
    districtId: 'bhola',
    nameBn: 'চরফ্যাশন',
    nameEn: 'Char Fasson',
    isUrban: false,
    unions: ['আসলামপুর', 'ওমরপুর', 'জিন্নাগড়', 'নুরাবাদ', 'আহমদপুর', 'চর মানিকা', 'কুকরি মুকরি', 'আবদুল্লাহপুর'],
  },
  {
    id: 'bhola_sadar',
    districtId: 'bhola',
    nameBn: 'ভোলা সদর',
    nameEn: 'Bhola Sadar',
    isUrban: false,
    unions: ['ইলিশা', 'শিবপুর', 'আলীনগর', 'ভেলুমিয়া', 'ভেদুরিয়া', 'পশ্চিম ইলিশা'],
  },
  {
    id: 'lalmohan',
    districtId: 'bhola',
    nameBn: 'লালমোহন',
    nameEn: 'Lalmohan',
    isUrban: false,
    unions: ['কালমা', 'ধলীগৌরনগর', 'লর্ডহার্ডিঞ্জ', 'পশ্চিম চরউমেদ', 'ফরাজগঞ্জ'],
  },
  {
    id: 'borhanuddin',
    districtId: 'bhola',
    nameBn: 'বোরহানউদ্দিন',
    nameEn: 'Borhanuddin',
    isUrban: false,
    unions: ['গঙ্গাপুর', 'সাচরা', 'বড় মানিকা', 'পক্ষিয়া'],
  },
  {
    id: 'tazumuddin',
    districtId: 'bhola',
    nameBn: 'তজুমদ্দিন',
    nameEn: 'Tazumuddin',
    isUrban: false,
    unions: ['চাঁদপুর', 'চাচড়া', 'সোনাপুর', 'শম্ভুপুর'],
  },
  {
    id: 'monpura',
    districtId: 'bhola',
    nameBn: 'মনপুরা',
    nameEn: 'Monpura',
    isUrban: false,
    unions: ['মনপুরা সদর', 'হাজীরহাট', 'দক্ষিণ সাকুচিয়া'],
  },

  // Barishal District
  { id: 'barishal_sadar', districtId: 'barishal_dist', nameBn: 'বরিশাল সদর', nameEn: 'Barishal Sadar', isUrban: true, areas: ['চৌমাথা', 'রূপাতলী', 'নথুল্লাবাদ', 'আমতলার মোড়', 'বটতলা'] },
  { id: 'bakerganj', districtId: 'barishal_dist', nameBn: 'বাকেরগঞ্জ', nameEn: 'Bakerganj', isUrban: false, unions: ['দুধল', 'রঙ্গশ্রী', 'গারুড়িয়া'] },

  // Chittagong City & District
  { id: 'panchlaish', districtId: 'chittagong_city', nameBn: 'পাঁচলাইশ', nameEn: 'Panchlaish', isUrban: true, areas: ['জিইসি মোড়', 'মুরাদপুর', '২ নং গেইট', 'হিলভিউ'] },
  { id: 'kotwali_ctg', districtId: 'chittagong_city', nameBn: 'কোতোয়ালী', nameEn: 'Kotwali', isUrban: true, areas: ['আন্দরকিল্লা', 'চকবাজার', 'নিউ মার্কেট', 'লালদীঘি'] },
  { id: 'agrabad', districtId: 'chittagong_city', nameBn: 'আগ্রাবাদ', nameEn: 'Agrabad', isUrban: true, areas: ['সিডিএ আ/এ', 'বাদামতলী মোড়', 'বারিক বিল্ডিং'] },
  { id: 'hathazari', districtId: 'chittagong_dist', nameBn: 'হাটহাজারী', nameEn: 'Hathazari', isUrban: false, unions: ['মির্জাপুর', 'গুমানমর্দ্দন', 'ধলই'] },
  { id: 'sitakunda', districtId: 'chittagong_dist', nameBn: 'সীতাকুণ্ড', nameEn: 'Sitakunda', isUrban: false, unions: ['কুমিরা', 'বাঁশবাড়িয়া', 'বারবকুন্ড'] },

  // Sylhet
  { id: 'sylhet_sadar', districtId: 'sylhet_dist', nameBn: 'সিলেট সদর', nameEn: 'Sylhet Sadar', isUrban: true, areas: ['জিন্দা বাজার', 'উপশহর', 'আম্বরখানা', 'টিলাগড়', 'মেডিকেল রোড'] },
  { id: 'golapganj', districtId: 'sylhet_dist', nameBn: 'গোলাপগঞ্জ', nameEn: 'Golapganj', isUrban: false, unions: ['ফুলবাড়ি', 'লক্ষণাবন্দ', 'ভাদেশ্বর'] },

  // Bogra
  { id: 'bogra_sadar', districtId: 'bogra', nameBn: 'বগুড়া সদর', nameEn: 'Bogra Sadar', isUrban: true, areas: ['সাতমাথা', 'বনানী', 'মালতিনগর', 'ঝাউতলা'] },

  // Gazipur
  { id: 'gazipur_sadar', districtId: 'gazipur', nameBn: 'গাজীপুর সদর / চৌরাস্তা', nameEn: 'Gazipur Sadar', isUrban: true, areas: ['চৌরাস্তা', 'জয়দেবপুর', 'বোর্ড বাজার', 'কোনাবাড়ী'] },
];

/**
 * Search helper for location search auto-suggestion
 */
export function searchLocations(query: string) {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  const results: {
    division: BdDivision;
    district: BdDistrict;
    upazila: BdUpazilaThana;
    matchText: string;
    isUrban: boolean;
  }[] = [];

  for (const upazila of BD_UPAZILAS_THANAS) {
    const district = BD_DISTRICTS.find(d => d.id === upazila.districtId);
    if (!district) continue;
    const division = BD_DIVISIONS.find(v => v.id === district.divisionId);
    if (!division) continue;

    const matchesUpazila = upazila.nameBn.includes(cleanQ) || upazila.nameEn.toLowerCase().includes(cleanQ);
    const matchesDistrict = district.nameBn.includes(cleanQ) || district.nameEn.toLowerCase().includes(cleanQ);
    const matchesDivision = division.nameBn.includes(cleanQ) || division.nameEn.toLowerCase().includes(cleanQ);
    
    // Check inside areas or unions
    const matchedArea = upazila.areas?.find(a => a.toLowerCase().includes(cleanQ));
    const matchedUnion = upazila.unions?.find(u => u.toLowerCase().includes(cleanQ));

    if (matchesUpazila || matchesDistrict || matchesDivision || matchedArea || matchedUnion) {
      let matchText = `${upazila.nameBn}, ${district.nameBn}`;
      if (matchedArea) matchText = `${matchedArea} (${upazila.nameBn})`;
      if (matchedUnion) matchText = `${matchedUnion} ইউনিয়ন (${upazila.nameBn})`;

      results.push({
        division,
        district,
        upazila,
        matchText,
        isUrban: upazila.isUrban,
      });
    }
  }

  return results.slice(0, 8);
}
