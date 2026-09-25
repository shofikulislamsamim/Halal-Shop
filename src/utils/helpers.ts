import { StructuredAddress } from '../types';

/**
 * Format price in Bangladeshi Taka (৳)
 * Clean spacing for readability: e.g. "৳ 1,250"
 */
export function formatPrice(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '৳ 0';
  }
  return `৳ ${amount.toLocaleString('en-IN')}`;
}

/**
 * Convert English digits to Bengali digits (optional visual touch)
 */
export function toBengaliNumber(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, d => bengaliDigits[parseInt(d, 10)]);
}

/**
 * Validate Bangladeshi Mobile Number
 * Valid prefixes: 013, 014, 015, 016, 017, 018, 019
 * Total 11 digits (e.g., 01712345678)
 */
export function isValidBdPhone(phone: string): boolean {
  // Keep each removable character in its own expression so the hyphen
  // can never be interpreted as a character-class range.
  const cleanPhone = phone
    .replace(/\s/g, '')
    .replace(/\+/g, '')
    .replace(/-/g, '');

  // Matches 01XXXXXXXXX (11 digits) or with 8801XXXXXXXXX (13 digits)
  const bdPhoneRegex = /^(?:88)?01[3-9]\d{8}$/;
  return bdPhoneRegex.test(cleanPhone);
}

/**
 * Clean phone number to standard 11-digit 01XXXXXXXXX
 */
export function sanitizeBdPhone(phone: string): string {
  let clean = phone
    .replace(/\s/g, '')
    .replace(/\+/g, '')
    .replace(/-/g, '');

  if (clean.startsWith('8801')) {
    clean = clean.substring(2);
  }
  return clean;
}

/**
 * Build WhatsApp link with automatic text
 */
export function getWhatsAppUrl(whatsappNumber: string, message: string): string {
  // Ensure country code 88
  let cleanNum = whatsappNumber
    .replace(/\s/g, '')
    .replace(/\+/g, '')
    .replace(/-/g, '');

  if (cleanNum.startsWith('01')) {
    cleanNum = '88' + cleanNum;
  }
  return `https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`;
}

/**
 * Build product WhatsApp message
 */
export function getProductWhatsAppMessage(shopName: string, productName: string, price: number, productUrl?: string): string {
  const currentUrl = productUrl || window.location.href;
  return `আসসালামু আলাইকুম। আমি ${shopName} থেকে "${productName}" (মূল্য: ৳${price}) অর্ডার করতে আগ্রহী। লিংক: ${currentUrl}`;
}

/**
 * Build general WhatsApp support message
 */
export function getGeneralWhatsAppMessage(shopName: string): string {
  return `আসসালামু আলাইকুম। আমি ${shopName} থেকে পণ্য অর্ডার করার বিষয়ে কিছু জানতে চাই।`;
}

/**
 * Format structured address into human-readable string
 */
export function formatAddress(addr: Partial<StructuredAddress>): string {
  if (!addr) return '';
  const parts: string[] = [];

  if (addr.locationType === 'urban') {
    if (addr.houseFlat) parts.push(addr.houseFlat);
    if (addr.roadBlockSector) parts.push(addr.roadBlockSector);
    if (addr.area) parts.push(addr.area);
    if (addr.upazilaThana) parts.push(addr.upazilaThana);
    if (addr.district) parts.push(addr.district);
  } else {
    // Rural
    if (addr.village) parts.push(`গ্রাম: ${addr.village}`);
    if (addr.union) parts.push(`ইউনিয়ন: ${addr.union}`);
    if (addr.upazilaThana) parts.push(`উপজেলা/থানা: ${addr.upazilaThana}`);
    if (addr.district) parts.push(`জেলা: ${addr.district}`);
    if (addr.division) parts.push(addr.division);
  }

  if (addr.detailedAddress) {
    parts.push(addr.detailedAddress);
  }

  let result = parts.filter(Boolean).join(', ');
  if (addr.landmark) {
    result += ` (ল্যান্ডমার্ক / পরিচিত স্থান: ${addr.landmark})`;
  }

  return result;
}

/**
 * Tolerant Bengali search normalization
 * Matches variations like 'চারজার' & 'চার্জার', 'মধূ' & 'মধু'
 */
export function normalizeBengaliText(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[্ঁংঃ]/g, '') // remove hasant, candrabindu, etc. for flexible fuzzy match
    .replace(/ূ/g, 'ু')
    .replace(/ী/g, 'ি')
    .replace(/ণ/g, 'ন')
    .replace(/শ/g, 'স')
    .replace(/ষ/g, 'স')
    .replace(/ঢ়/g, 'ড়');
}

export function matchesQuery(targetText: string, searchQuery: string): boolean {
  if (!searchQuery.trim()) return true;
  const rawTarget = targetText.toLowerCase();
  const rawQuery = searchQuery.toLowerCase().trim();

  // Direct match
  if (rawTarget.includes(rawQuery)) return true;

  // Normalized Bengali match
  const normTarget = normalizeBengaliText(targetText);
  const normQuery = normalizeBengaliText(searchQuery);
  return normTarget.includes(normQuery);
}
