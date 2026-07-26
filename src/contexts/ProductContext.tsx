import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ProductApiError, productService } from "../services/productService";
import { ProductContext } from "./productContextValue";
import type { Product, ProductFormValues } from "../types";
import type { ProductStockAdjustment } from "./productContextValue";

type ProductProviderProps = {
  children: ReactNode;
};

export function ProductProvider({ children }: ProductProviderProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchProducts = useCallback(async (
    params: Parameters<typeof productService.getProducts>[0] = {},
  ) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await productService.getProducts(params);
      setProducts(result.products);
      setTotalProducts(result.total);
    } catch (error) {
      setErrorMessage(
        error instanceof ProductApiError
          ? error.message
          : "Terjadi kesalahan pada server.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (values: ProductFormValues) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      return await productService.createProduct(values);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProduct = useCallback(
    async (productId: string, values: ProductFormValues) => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        return await productService.updateProduct(productId, values);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        return await productService.deleteProduct(productId);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const bulkDeleteProducts = useCallback(async (productIds: string[]) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await productService.bulkDeleteProducts(productIds);
      return result.deletedCount;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulkUpdateProducts = useCallback(
    async (updates: Parameters<typeof productService.bulkUpdateProducts>[0]) => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const result = await productService.bulkUpdateProducts(updates);
        return result.updatedCount;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const adjustStock = useCallback(
    async (
      productId: string,
      payload: Parameters<typeof productService.adjustStock>[1],
    ) => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await productService.adjustStock(productId, payload);
        return result.product;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const getStockHistory = useCallback(async (productId: string) => {
    return productService.getStockHistory(productId);
  }, []);

  const decreaseProductStock = useCallback(
    (adjustments: ProductStockAdjustment[]) => {
      const stockChangeByProductId = adjustments.reduce<Record<string, number>>(
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
        const currentProduct = products.find(
          (product) => product.id === productId,
        );

        if (!currentProduct) {
          return { ok: false as const, message: "Produk tidak ditemukan." };
        }

        if (quantity <= 0) {
          return {
            ok: false as const,
            message: "Jumlah produk tidak valid.",
          };
        }

        if (currentProduct.stock < quantity) {
          return {
            ok: false as const,
            message: `Stok ${currentProduct.name} tidak mencukupi.`,
          };
        }
      }

      setProducts(
        products.map((product) => ({
          ...product,
          stock: product.stock - (stockChangeByProductId[product.id] ?? 0),
        })),
      );

      return { ok: true as const };
    },
    [products],
  );

  const renameProductCategory = useCallback(
    (oldCategory: string, newCategory: string) => {
      if (oldCategory === newCategory) {
        return;
      }

      setProducts(
        products.map((product) =>
          product.category === oldCategory
            ? { ...product, category: newCategory }
            : product,
        ),
      );
    },
    [products],
  );

  const value = useMemo(
    () => ({
      products,
      totalProducts,
      isLoading,
      errorMessage,
      fetchProducts,
      createProduct,
      updateProduct,
      deleteProduct,
      bulkDeleteProducts,
      bulkUpdateProducts,
      adjustStock,
      getStockHistory,
      decreaseProductStock,
      renameProductCategory,
    }),
    [
      products,
      totalProducts,
      isLoading,
      errorMessage,
      fetchProducts,
      createProduct,
      updateProduct,
      deleteProduct,
      bulkDeleteProducts,
      bulkUpdateProducts,
      adjustStock,
      getStockHistory,
      decreaseProductStock,
      renameProductCategory,
    ],
  );

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
}
