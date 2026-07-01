import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getStoredProducts, storeProducts } from "../utils/productStorage";
import { ProductContext } from "./productContextValue";
import type { Product, ProductFormValues } from "../pages/product/ProductTypes";
import type { ProductStockAdjustment } from "./productContextValue";

type ProductProviderProps = {
  children: ReactNode;
};

function getInitialProducts() {
  return getStoredProducts();
}

export function ProductProvider({ children }: ProductProviderProps) {
  const [products, setProducts] = useState<Product[]>(getInitialProducts);

  const commitProducts = useCallback((nextProducts: Product[]) => {
    setProducts(nextProducts);
    storeProducts(nextProducts);
  }, []);

  const addProduct = useCallback(
    (values: ProductFormValues) => {
      const product = { ...values, id: Date.now() };

      setProducts((currentProducts) => {
        const nextProducts = [product, ...currentProducts];
        storeProducts(nextProducts);
        return nextProducts;
      });

      return product;
    },
    [],
  );

  const updateProduct = useCallback(
    (productId: number, values: ProductFormValues) => {
      const currentProduct = products.find((product) => product.id === productId);

      if (!currentProduct) {
        return null;
      }

      const updatedProduct = { ...values, id: currentProduct.id };
      commitProducts(
        products.map((product) =>
          product.id === productId ? updatedProduct : product,
        ),
      );

      return updatedProduct;
    },
    [commitProducts, products],
  );

  const deleteProduct = useCallback(
    (productId: number) => {
      const deletedProduct = products.find((product) => product.id === productId);

      if (!deletedProduct) {
        return null;
      }

      commitProducts(products.filter((product) => product.id !== productId));

      return deletedProduct;
    },
    [commitProducts, products],
  );

  const decreaseProductStock = useCallback(
    (adjustments: ProductStockAdjustment[]) => {
      const stockChangeByProductId = adjustments.reduce<Record<number, number>>(
        (changes, adjustment) => {
          changes[adjustment.productId] =
            (changes[adjustment.productId] ?? 0) + adjustment.quantity;
          return changes;
        },
        {},
      );

      for (const [productId, quantity] of Object.entries(
        stockChangeByProductId,
      )) {
        const product = products.find(
          (currentProduct) => currentProduct.id === Number(productId),
        );

        if (!product) {
          return { ok: false as const, message: "Produk tidak ditemukan." };
        }

        if (quantity <= 0) {
          return {
            ok: false as const,
            message: "Jumlah produk tidak valid.",
          };
        }

        if (product.stock < quantity) {
          return {
            ok: false as const,
            message: `Stok ${product.name} tidak mencukupi.`,
          };
        }
      }

      commitProducts(
        products.map((product) => ({
          ...product,
          stock:
            product.stock - (stockChangeByProductId[product.id] ?? 0),
        })),
      );

      return { ok: true as const };
    },
    [commitProducts, products],
  );

  const renameProductCategory = useCallback(
    (oldCategory: string, newCategory: string) => {
      if (oldCategory === newCategory) {
        return;
      }

      commitProducts(
        products.map((product) =>
          product.category === oldCategory
            ? { ...product, category: newCategory }
            : product,
        ),
      );
    },
    [commitProducts, products],
  );

  const value = useMemo(
    () => ({
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      decreaseProductStock,
      renameProductCategory,
    }),
    [
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      decreaseProductStock,
      renameProductCategory,
    ],
  );

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
}
