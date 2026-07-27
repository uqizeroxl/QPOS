import { cacheService } from "./cache.service";

export type CachedProduct = {
  id: string;
  barcode: string;
  name: string;
  category: string;
  price: number;
  stock: number;
};

const CACHE_KEY = "/products";
const CACHE_TTL = 10 * 60 * 1000;

export const productCacheService = {
  async setAll(products: CachedProduct[]): Promise<void> {
    await cacheService.set(CACHE_KEY, products, CACHE_TTL);
  },

  async getAll(): Promise<CachedProduct[]> {
    const data = await cacheService.get<CachedProduct[]>(CACHE_KEY);
    return data ?? [];
  },

  async search(keyword: string): Promise<CachedProduct[]> {
    const products = await this.getAll();
    if (!products.length) return [];

    const q = keyword.toLowerCase().trim();

    const barcodeHit = products.filter(
      (p) => p.barcode.toLowerCase() === q,
    );

    if (barcodeHit.length > 0) {
      return barcodeHit;
    }

    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  },
};
