import { useContext } from "react";
import { ProductContext } from "../contexts/productContextValue";

export function useProducts() {
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error("useProducts must be used within ProductProvider.");
  }

  return context;
}
