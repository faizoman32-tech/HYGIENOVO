const BASE = import.meta.env.BASE_URL || '/';
const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) || '').replace(/\/$/, '');
const IS_STATIC = import.meta.env.VITE_STATIC === 'true' && !API_URL;

/** Prefix root-relative asset URLs with the deploy base path (e.g. /HYGIENOVO/). */
export function withBase(url: string): string {
  if (!url || !url.startsWith('/') || url.startsWith('//')) return url;
  if (API_URL && url.startsWith('/uploads/')) return API_URL + url;
  if (BASE === '/' || url.startsWith(BASE)) return url;
  return BASE.replace(/\/$/, '') + url;
}

let staticProducts: Promise<any[]> | null = null;
async function staticJson<T>(file: string): Promise<T> {
  const res = await fetch(`${BASE}api/${file}.json`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

async function staticFetch(url: string, options: RequestInit): Promise<any> {
  const method = (options.method || 'GET').toUpperCase();
  const [pathname, query = ''] = url.split('?');
  const params = new URLSearchParams(query);
  if (method === 'GET') {
    if (pathname === '/api/categories') return staticJson('categories');
    if (pathname === '/api/store-config') return staticJson('store-config');
    if (pathname.startsWith('/api/products')) {
      staticProducts ||= staticJson<any[]>('products');
      const all = await staticProducts;
      const slug = pathname.split('/')[3];
      if (slug) {
        const product = all.find((p) => p.slug === decodeURIComponent(slug) || String(p.id) === slug);
        if (!product) throw new Error('Product not found');
        const related = all
          .filter((p) => p.id !== product.id)
          .sort((a, b) => Number(b.categorySlug === product.categorySlug) - Number(a.categorySlug === product.categorySlug))
          .slice(0, 3);
        return { product, related };
      }
      let list = [...all];
      if (params.get('featured') === 'true') list = list.filter((p) => p.featured);
      const sort = params.get('sort');
      if (sort === 'price-asc') list.sort((a, b) => a.priceAed - b.priceAed);
      else if (sort === 'price-desc') list.sort((a, b) => b.priceAed - a.priceAed);
      return list;
    }
  }
  throw new Error('This feature needs the store backend, which is not available on this static preview.');
}

export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  bearerToken?: string | null
): Promise<T> {
  if (IS_STATIC) return staticFetch(url, options) as Promise<T>;
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (bearerToken) {
    headers.set('Authorization', `Bearer ${bearerToken}`);
  }

  const res = await fetch(API_URL && url.startsWith('/api') ? API_URL + url : url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data && typeof data.error === 'string' && data.error) || `Request failed (${res.status})`);
  }
  return data as T;
}
