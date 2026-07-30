import { Save } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { Textarea } from "../../components/ui/Input";

type SystemSettingsTabProps = {
  receiptFooter: string;
  isSavingReceiptFooter: boolean;
  onReceiptFooterChange: (value: string) => void;
  onSaveReceiptFooter: () => void | Promise<void>;
};

export default function SystemSettingsTab({
  receiptFooter,
  isSavingReceiptFooter,
  onReceiptFooterChange,
  onSaveReceiptFooter,
}: SystemSettingsTabProps) {
  return (
    <div className="space-y-6">
      <Card as="section" className="p-5">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Pengaturan Struk
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Atur teks yang tampil pada bagian paling bawah struk.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Footer Struk
            </span>
            <Textarea
              rows={5}
              maxLength={250}
              value={receiptFooter}
              onChange={(event) => {
                const value = event.target.value.replace(/\r\n?/g, "\n");
                if (value.split("\n").length <= 5) {
                  onReceiptFooterChange(value);
                }
              }}
              placeholder="Terima kasih"
            />
          </label>

          <div className="flex justify-between text-xs text-gray-500">
            <span>{receiptFooter.split("\n").length}/5 baris</span>
            <span>{receiptFooter.length}/250 karakter</span>
          </div>

          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Preview
            </p>
            <p className="mt-3 whitespace-pre-line text-center text-sm font-semibold text-gray-800">
              {receiptFooter.trim() || "Terima kasih"}
            </p>
          </div>

          <div className="flex justify-end border-t border-gray-200 pt-5">
            <Button
              onClick={() => void onSaveReceiptFooter()}
              disabled={isSavingReceiptFooter}
            >
              <Save className="h-4 w-4" />
              {isSavingReceiptFooter ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
