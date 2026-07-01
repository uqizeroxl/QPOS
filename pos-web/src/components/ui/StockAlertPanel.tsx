import Card from "./Card";

type StockItem = {
  id: number;
  name: string;
  category: string;
  stock: number;
  minStock: number;
};

type StockAlertPanelProps = {
  items: StockItem[];
};

export default function StockAlertPanel({ items }: StockAlertPanelProps) {
  return (
    <Card as="section" className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Produk Stok Menipis
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Produk yang perlu segera ditambah stoknya.
          </p>
        </div>

        <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
          {items.length} item
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500">{item.category}</p>
              </div>

              <div className="text-right">
                <p className="font-semibold text-red-600">{item.stock} pcs</p>
                <p className="text-xs text-gray-500">Min. {item.minStock}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-6 text-center text-sm font-medium text-gray-500">
            Belum ada data.
          </p>
        )}
      </div>
    </Card>
  );
}
