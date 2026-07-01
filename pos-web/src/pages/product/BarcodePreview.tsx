import Barcode from "react-barcode";

type BarcodePreviewProps = {
  barcode: string;
};

export default function BarcodePreview({ barcode }: BarcodePreviewProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm font-medium text-gray-700">Preview Barcode</p>
      <div className="mt-3 flex min-h-28 items-center justify-center rounded-lg bg-white p-3">
        {barcode.trim() ? (
          <Barcode
            value={barcode}
            format="CODE128"
            width={1.6}
            height={56}
            fontSize={13}
            margin={8}
          />
        ) : (
          <p className="text-sm text-gray-400">Barcode belum diisi</p>
        )}
      </div>
    </div>
  );
}
