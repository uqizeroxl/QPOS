import { Printer } from "lucide-react";
import { useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Input, Select } from "../../components/ui/Input";
import type { BarcodeLabelSize, BarcodePrintSettings } from "../../types";

type BarcodePrintPanelProps = {
  settings: BarcodePrintSettings;
  onSettingsChange: (settings: BarcodePrintSettings) => void;
  onPrint: () => void;
  disabled: boolean;
};

const labelSizeOptions: Array<{ value: BarcodeLabelSize; label: string }> = [
  { value: "small", label: "Kecil" },
  { value: "medium", label: "Sedang" },
  { value: "large", label: "Besar" },
];

export default function BarcodePrintPanel({
  settings,
  onSettingsChange,
  onPrint,
  disabled,
}: BarcodePrintPanelProps) {
  const [quantityInput, setQuantityInput] = useState(() =>
    settings.quantity.toString(),
  );

  return (
    <Card className="p-4 shadow-none">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Cetak Barcode
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Atur label barcode produk.
          </p>
        </div>
        <Printer className="h-5 w-5 text-blue-600" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">
            Ukuran Label
          </span>
          <Select
            value={settings.labelSize}
            onChange={(event) =>
              onSettingsChange({
                ...settings,
                labelSize: event.target.value as BarcodeLabelSize,
              })
            }
          >
            {labelSizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">
            Jumlah Cetakan
          </span>
          <Input
            min={1}
            type="number"
            value={quantityInput}
            onChange={(event) => {
              setQuantityInput(event.target.value);

              if (!event.target.value) {
                return;
              }

              onSettingsChange({
                ...settings,
                quantity: Math.max(Number(event.target.value) || 1, 1),
              });
            }}
          />
        </label>
      </div>

      <label className="mt-4 flex items-center gap-2">
        <Input
          type="checkbox"
          checked={settings.showPrice}
          onChange={(event) =>
            onSettingsChange({
              ...settings,
              showPrice: event.target.checked,
            })
          }
          className="h-4 w-4 rounded border-gray-300 p-0"
        />
        <span className="text-sm font-medium text-gray-700">
          Tampilkan harga jual
        </span>
      </label>

      <Button
        onClick={onPrint}
        disabled={disabled}
        className="mt-4 w-full"
      >
        <Printer className="h-4 w-4" />
        Cetak Barcode
      </Button>
    </Card>
  );
}
