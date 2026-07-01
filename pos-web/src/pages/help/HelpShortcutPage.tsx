import {
  CircleHelp,
  Info,
  Keyboard,
  Lightbulb,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Waypoints,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Card from "../../components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "../../components/ui/Table";
import MainLayout from "../../layouts/MainLayout";

type ShortcutItem = {
  keys: string[];
  action: string;
};

type ShortcutSection = {
  title: string;
  description: string;
  icon: LucideIcon;
  shortcuts: ShortcutItem[];
};

const shortcutSections: ShortcutSection[] = [
  {
    title: "Navigasi",
    description: "Pindah antar area aplikasi menggunakan fokus keyboard.",
    icon: Waypoints,
    shortcuts: [
      {
        keys: ["Tab"],
        action: "Pindah ke tombol, input, menu, atau kontrol berikutnya.",
      },
      {
        keys: ["Shift", "Tab"],
        action: "Kembali ke tombol, input, menu, atau kontrol sebelumnya.",
      },
      {
        keys: ["Enter"],
        action: "Menjalankan tombol atau menu yang sedang fokus.",
      },
      {
        keys: ["Esc"],
        action: "Menutup dropdown atau dialog yang sedang terbuka.",
      },
    ],
  },
  {
    title: "Kasir",
    description: "Shortcut utama untuk mencari barang dan menyelesaikan transaksi.",
    icon: ShoppingCart,
    shortcuts: [
      {
        keys: ["Arrow Down"],
        action: "Memilih hasil produk berikutnya pada autocomplete.",
      },
      {
        keys: ["Arrow Up"],
        action: "Memilih hasil produk sebelumnya pada autocomplete.",
      },
      {
        keys: ["Enter"],
        action: "Menambahkan produk yang dipilih atau memproses input barang.",
      },
      {
        keys: ["Esc"],
        action: "Menutup dropdown pencarian produk.",
      },
      {
        keys: ["F9"],
        action: "Fokus ke kolom pembayaran.",
      },
      {
        keys: ["Ctrl", "P"],
        action: "Fokus ke kolom pembayaran pada halaman Kasir.",
      },
      {
        keys: ["Enter"],
        action: "Memproses pembayaran saat fokus berada di kolom Uang Dibayar.",
      },
      {
        keys: ["Enter"],
        action: "Mencetak struk saat dialog Cetak struk? terbuka.",
      },
      {
        keys: ["Tab"],
        action: "Berpindah dari tombol Ya ke tombol Tidak pada dialog cetak.",
      },
      {
        keys: ["Esc"],
        action: "Menutup dialog cetak tanpa mencetak struk.",
      },
    ],
  },
  {
    title: "Produk",
    description: "Pengoperasian form dan tombol pada halaman produk.",
    icon: Package,
    shortcuts: [
      {
        keys: ["Tab"],
        action: "Pindah ke field atau tombol berikutnya pada form produk.",
      },
      {
        keys: ["Shift", "Tab"],
        action: "Kembali ke field atau tombol sebelumnya pada form produk.",
      },
      {
        keys: ["Enter"],
        action: "Menjalankan tombol yang sedang fokus, termasuk Simpan Produk.",
      },
    ],
  },
  {
    title: "Riwayat Transaksi",
    description: "Akses pencarian, filter, detail, dan cetak ulang transaksi.",
    icon: ReceiptText,
    shortcuts: [
      {
        keys: ["Tab"],
        action: "Pindah ke pencarian, filter, pagination, atau tombol aksi.",
      },
      {
        keys: ["Shift", "Tab"],
        action: "Kembali ke kontrol sebelumnya pada halaman riwayat.",
      },
      {
        keys: ["Enter"],
        action: "Membuka detail atau mencetak ulang struk saat tombol terkait fokus.",
      },
    ],
  },
  {
    title: "Pengaturan",
    description: "Kelola input informasi toko dan tema aplikasi.",
    icon: Settings,
    shortcuts: [
      {
        keys: ["Tab"],
        action: "Pindah antar field pengaturan dan tombol aksi.",
      },
      {
        keys: ["Shift", "Tab"],
        action: "Kembali ke field atau tombol sebelumnya.",
      },
      {
        keys: ["Enter"],
        action: "Menjalankan tombol yang sedang fokus, termasuk Simpan.",
      },
    ],
  },
];

const usageTips = [
  "Mulai transaksi dari halaman Kasir; input barang akan otomatis fokus saat halaman dibuka.",
  "Gunakan F9 ketika keranjang siap dibayar agar tangan tetap berada di keyboard.",
  "Pada dialog cetak, tekan Enter untuk mencetak atau Esc untuk langsung lanjut transaksi berikutnya.",
];

function Keycap({ value }: { value: string }) {
  return (
    <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-md border border-gray-300 bg-gray-50 px-2.5 py-1 font-mono text-xs font-bold text-gray-700 shadow-sm transition-colors duration-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
      {value}
    </span>
  );
}

function ShortcutKeys({ keys }: { keys: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {keys.map((key, index) => (
        <span key={`${key}-${index}`} className="inline-flex items-center gap-2">
          {index > 0 ? (
            <span className="text-xs font-semibold text-gray-400 dark:text-slate-500">
              +
            </span>
          ) : null}
          <Keycap value={key} />
        </span>
      ))}
    </div>
  );
}

function ShortcutSectionCard({ section }: { section: ShortcutSection }) {
  const Icon = section.icon;

  return (
    <Card as="section" className="overflow-hidden">
      <div className="flex items-start gap-3 border-b border-gray-200 p-5 transition-colors duration-300 dark:border-slate-700">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 transition-colors duration-300 dark:bg-cyan-500/10 dark:text-cyan-300">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            {section.title}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            {section.description}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
              <TableHeadCell className="w-64">Shortcut</TableHeadCell>
              <TableHeadCell>Fungsi</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {section.shortcuts.map((shortcut, index) => (
              <TableRow key={`${section.title}-${index}`}>
                <TableCell className="align-top">
                  <ShortcutKeys keys={shortcut.keys} />
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-slate-300">
                  {shortcut.action}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

export default function HelpShortcutPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-cyan-300">
              Panduan Operasional
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100 sm:text-3xl">
              Bantuan & Shortcut
            </h1>
            <p className="mt-1 max-w-2xl text-gray-500 dark:text-slate-400">
              Daftar shortcut keyboard yang aktif di QPOS untuk membantu proses
              kerja kasir dan pengelolaan data.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-blue-700 transition-colors duration-300 dark:bg-cyan-500/10 dark:text-cyan-300">
            <Keyboard className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">Keyboard Ready</p>
              <p className="text-xs">Kasir lebih cepat</p>
            </div>
          </div>
        </Card>

        <Card className="border-blue-100 bg-blue-50/70 p-5 transition-colors duration-300 dark:border-cyan-500/20 dark:bg-cyan-500/10">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm transition-colors duration-300 dark:bg-slate-900 dark:text-cyan-300">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                Shortcut mempercepat pekerjaan kasir.
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-slate-300">
                Gunakan shortcut untuk mencari barang, berpindah ke pembayaran,
                mencetak struk, dan menutup dialog tanpa terlalu sering memakai
                mouse.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          {shortcutSections.map((section) => (
            <ShortcutSectionCard key={section.title} section={section} />
          ))}
        </div>

        <Card as="section" className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 transition-colors duration-300 dark:bg-amber-500/10 dark:text-amber-300">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                Tips Penggunaan
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Kebiasaan kecil yang membuat transaksi harian terasa lebih
                ringan.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {usageTips.map((tip, index) => (
              <div
                key={tip}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white dark:bg-cyan-500 dark:text-slate-950">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-gray-600 dark:text-slate-300">
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4 text-sm text-gray-600 dark:text-slate-300">
          <CircleHelp className="h-5 w-5 shrink-0 text-blue-600 dark:text-cyan-300" />
          <span>
            Daftar ini mengikuti shortcut yang tersedia di aplikasi saat ini dan
            dapat diperbarui ketika shortcut baru ditambahkan.
          </span>
        </Card>
      </div>
    </MainLayout>
  );
}
