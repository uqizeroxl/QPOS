import { useContext } from "react";
import { SupplierContext } from "../contexts/supplierContextValue";

export function useSuppliers() {
  const context = useContext(SupplierContext);

  if (!context) {
    throw new Error("useSuppliers must be used within SupplierProvider.");
  }

  return context;
}
