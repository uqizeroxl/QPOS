import {
  CircleCheckBig,
  CircleX,
  PackageMinus,
  TriangleAlert,
} from "lucide-react";

type StockStatus = "safe" | "low" | "empty" | "minus";

type StockStatusConfig = {
  status: StockStatus;
  label: "Aman" | "Hampir Habis" | "Habis" | "Minus";
  message: string;
  icon: typeof CircleCheckBig;
  colorClassName: string;
};

function getStockStatus(
  stock: number,
  minimumStock: number,
): StockStatusConfig {
  if (stock < 0) {
    return {
      status: "minus",
      label: "Minus",
      message: "Minus, stok telah melewati batas.",
      icon: PackageMinus,
      colorClassName: "text-red-900",
    };
  }

  if (stock === 0) {
    return {
      status: "empty",
      label: "Habis",
      message: "Habis.",
      icon: CircleX,
      colorClassName: "text-red-600",
    };
  }

  if (stock <= minimumStock) {
    return {
      status: "low",
      label: "Hampir Habis",
      message: "Hampir Habis, segera restock.",
      icon: TriangleAlert,
      colorClassName: "text-orange-600",
    };
  }

  return {
    status: "safe",
    label: "Aman",
    message: "Aman.",
    icon: CircleCheckBig,
    colorClassName: "text-emerald-600",
  };
}

type StockStatusBadgeProps = {
  stock: number;
  minimumStock: number;
  className?: string;
};

export default function StockStatusBadge({
  stock,
  minimumStock,
  className = "",
}: StockStatusBadgeProps) {
  const status = getStockStatus(stock, minimumStock);
  const Icon = status.icon;
  const tooltip = `Status: ${status.label}\nStok Saat Ini: ${stock}\nMinimum Stock: ${minimumStock}\n${status.message}`;

  return (
    <span
      className={`group relative inline-flex ${status.colorClassName} ${className}`}
      title={tooltip}
      aria-label={tooltip}
      tabIndex={0}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-max max-w-64 -translate-x-1/2 whitespace-pre-line rounded-md bg-gray-900 px-3 py-2 text-left text-xs font-medium leading-5 text-white shadow-lg group-hover:block group-focus:block"
      >
        {tooltip}
      </span>
    </span>
  );
}
