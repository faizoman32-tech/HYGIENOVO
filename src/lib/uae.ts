export const UAE_EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
] as const;

export type UAEEmirate = (typeof UAE_EMIRATES)[number];

export const UAE_CITIES_BY_EMIRATE: Record<UAEEmirate, string[]> = {
  Dubai: [
    'Business Bay',
    'Downtown Dubai',
    'Dubai Marina',
    'JLT (Jumeirah Lakes Towers)',
    'Al Quoz Industrial',
    'Deira',
    'Bur Dubai',
    'DIFC',
    'Dubai Silicon Oasis',
    'Jebel Ali',
    'Al Barsha',
    'Dubai Investment Park (DIP)',
    'Palm Jumeirah',
    'Jumeirah',
  ],
  'Abu Dhabi': [
    'Abu Dhabi City',
    'Al Maryah Island',
    'Mussafah Industrial',
    'Khalifa City',
    'Al Reem Island',
    'Yas Island',
    'Al Ain',
  ],
  Sharjah: [
    'Sharjah City',
    'Al Majaz',
    'Industrial Area 1–18',
    'Muwaileh',
    'SAIF Zone',
    'Al Nahda',
  ],
  Ajman: ['Ajman City', 'Al Jurf Industrial', 'Al Nuaimiya', 'Ajman Free Zone'],
  'Umm Al Quwain': ['Umm Al Quwain City', 'Al Salamah', 'Umm Al Thuoub Industrial'],
  'Ras Al Khaimah': ['Ras Al Khaimah City', 'Al Nakheel', 'Al Hamra', 'RAKEZ Industrial'],
  Fujairah: ['Fujairah City', 'Dibba Al-Fujairah', 'Fujairah Free Zone'],
};

export function formatAed(amount: number): string {
  return `AED ${amount.toLocaleString('en-AE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function normalizeUaePhone(raw: string): string {
  return raw.replace(/[\s\-()]/g, '');
}

export function isValidUaePhone(raw: string): boolean {
  const cleaned = normalizeUaePhone(raw);
  // Accepts +9715XXXXXXXX, 009715XXXXXXXX, 9715XXXXXXXX, 05XXXXXXXX, or UAE landline +9714XXXXXXX / 04XXXXXXX
  return /^(?:(?:\+|00)?971|0)(?:5[024568]\d{7}|[234679]\d{7})$/.test(cleaned);
}

export function isValidUaeTrn(raw: string): boolean {
  if (!raw.trim()) return true;
  return /^\d{15}$/.test(raw.trim());
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, '') || '97140000000';
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
