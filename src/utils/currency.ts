type FormatRupiahOptions = {
  prefix?: boolean;
  fallback?: string;
};

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

export function parseRupiah(value: string) {
  const numericValue = value.replace(/[^\d-]/g, "");

  if (!numericValue || numericValue === "-") {
    return 0;
  }

  return Number(numericValue);
}

export function formatRupiah(
  value: number | string,
  options: FormatRupiahOptions = {},
) {
  const numericValue =
    typeof value === "number" ? value : parseRupiah(value.toString());

  if (!Number.isFinite(numericValue)) {
    return options.fallback ?? "0";
  }

  const formattedValue = rupiahFormatter.format(numericValue);

  return options.prefix ? `Rp ${formattedValue}` : formattedValue;
}
