import Barcode from "react-barcode";
import type { BarcodeLabelSize, BarcodePrintPayload } from "./ProductTypes";

type BarcodePrintAreaProps = {
  payload: BarcodePrintPayload | null;
};

const labelSizeClass: Record<BarcodeLabelSize, string> = {
  small: "barcode-label-small",
  medium: "barcode-label-medium",
  large: "barcode-label-large",
};

export default function BarcodePrintArea({ payload }: BarcodePrintAreaProps) {
  if (!payload) {
    return null;
  }

  return (
    <div className="barcode-print-root">
      {Array.from({ length: payload.quantity }).map((_, index) => (
        <div
          key={`${payload.barcode}-${index}`}
          className={`barcode-print-label ${labelSizeClass[payload.labelSize]}`}
        >
          <p className="barcode-print-name">{payload.productName}</p>
          <Barcode
            value={payload.barcode}
            format="CODE128"
            width={1.4}
            height={44}
            fontSize={12}
            margin={0}
          />
          <p className="barcode-print-number">{payload.barcode}</p>
          {payload.showPrice ? (
            <p className="barcode-print-price">{payload.priceLabel}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
