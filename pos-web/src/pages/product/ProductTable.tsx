import Card from "../../components/ui/Card";
import TablePagination from "../../components/ui/TablePagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "../../components/ui/Table";
import ProductRow from "./ProductRow";
import type { BulkProductDraft, Product } from "./ProductTypes";

type ProductTableProps = {
  products: Product[];
  isLoading?: boolean;
  currentPage: number;
  rowsPerPage: number;
  totalProducts: number;
  onPageChange: (page: number) => void;
  pageSizeOptions: readonly number[];
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (product: Product) => void;
  selectedProductIds: ReadonlySet<string>;
  isDeleteMode: boolean;
  onSelectionChange: (product: Product, selected: boolean) => void;
  onSelectPage: (products: Product[], selected: boolean) => void;
  onAdjustStock: (product: Product) => void;
  onShowStockHistory: (product: Product) => void;
  editDrafts: ReadonlyMap<string, BulkProductDraft>;
  onDraftChange: (productId: string, changes: Partial<BulkProductDraft>) => void;
};

export default function ProductTable({
  products,
  isLoading = false,
  currentPage,
  rowsPerPage,
  totalProducts,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  onEdit,
  selectedProductIds,
  isDeleteMode,
  onSelectionChange,
  onSelectPage,
  onAdjustStock,
  onShowStockHistory,
  editDrafts,
  onDraftChange,
}: ProductTableProps) {
  const isPageSelected =
    products.length > 0 && products.every((product) => selectedProductIds.has(product.id));

  return (
    <Card as="section" className="overflow-hidden">
      <div className="app-scrollbar max-h-[480px] overflow-auto scroll-smooth">
        <Table>
          <TableHead className="sticky top-0 z-[1]">
            <TableRow className="hover:bg-transparent">
              {isDeleteMode ? (
                <TableHeadCell className="w-12">
                  <input
                    type="checkbox"
                    checked={isPageSelected}
                    onChange={(event) => onSelectPage(products, event.target.checked)}
                    aria-label="Pilih semua produk di halaman ini"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </TableHeadCell>
              ) : null}
              <TableHeadCell>Barcode</TableHeadCell>
              <TableHeadCell>Nama Produk</TableHeadCell>
              <TableHeadCell>Kategori</TableHeadCell>
              <TableHeadCell>Harga Beli</TableHeadCell>
              <TableHeadCell>Harga Jual</TableHeadCell>
              <TableHeadCell>Stok</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell className="text-right">Aksi</TableHeadCell>
            </TableRow>
          </TableHead>

          <TableBody className="bg-white">
            {isLoading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={isDeleteMode ? 9 : 8} className="py-12 text-center">
                  <p className="font-semibold text-gray-700">
                    Memuat data produk...
                  </p>
                </TableCell>
              </TableRow>
            ) : products.length > 0 ? (
              products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  isSelected={selectedProductIds.has(product.id)}
                  isDeleteMode={isDeleteMode}
                  onSelectionChange={onSelectionChange}
                  onEdit={onEdit}
                  onAdjustStock={onAdjustStock}
                  onShowStockHistory={onShowStockHistory}
                  editDraft={editDrafts.get(product.id)}
                  onDraftChange={onDraftChange}
                />
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={isDeleteMode ? 9 : 8} className="py-12 text-center">
                  <p className="font-semibold text-gray-700">
                    Belum ada data.
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Tambahkan produk untuk mulai mengelola data barang.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={currentPage}
        pageSize={rowsPerPage}
        total={totalProducts}
        pageSizeOptions={pageSizeOptions}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        itemLabel="produk"
      />
    </Card>
  );
}
