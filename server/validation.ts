export const UAE_EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
] as const;

export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 160;
}

export function isValidUaePhone(phone: unknown): phone is string {
  if (typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^(?:(?:\+|00)?971|0)(?:5[024568]\d{7}|[234679]\d{7})$/.test(cleaned);
}

export function isValidUaeTrn(trn: unknown): boolean {
  if (trn === undefined || trn === null || trn === '') return true;
  return typeof trn === 'string' && /^\d{15}$/.test(trn.trim());
}

export function isValidEmirate(emirate: unknown): emirate is string {
  return typeof emirate === 'string' && (UAE_EMIRATES as readonly string[]).includes(emirate);
}

export function isSafeImageUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim()) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/assets/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function cleanText(val: unknown, maxLen = 500): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}
