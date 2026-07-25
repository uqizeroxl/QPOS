import "dotenv/config";
import bcrypt from "bcryptjs";
import db, { schema } from "./db";

const [existing] = await db
  .select({ id: schema.users.id })
  .from(schema.users)
  .limit(1);

if (existing) {
  console.log("Database sudah memiliki data. Seed dilewati.");
  process.exit(0);
}

const hashedPassword = await bcrypt.hash("demo", 10);

// ── Accounts ──────────────────────────────────────────────
await db.insert(schema.users).values([
  { username: "admin", password: hashedPassword, name: "Admin Utama", role: "admin" },
  { username: "manager", password: hashedPassword, name: "Manajer Toko", role: "manager" },
  { username: "cashier", password: hashedPassword, name: "Kasir Utama", role: "cashier" },
  { username: "kasir1", password: hashedPassword, name: "Siti Nurhaliza", role: "cashier" },
  { username: "kasir2", password: hashedPassword, name: "Budi Santoso", role: "cashier" },
  { username: "mgr2", password: hashedPassword, name: "Rina Wulandari", role: "manager" },
]);

// ── Categories ────────────────────────────────────────────
await db.insert(schema.categories).values([
  { name: "Makanan Ringan", description: "Cemilan dan snack ringan", status: "Aktif" },
  { name: "Minuman", description: "Minuman ringan dan kemasan", status: "Aktif" },
  { name: "Sembako", description: "Sembilan bahan pokok", status: "Aktif" },
  { name: "Alat Tulis", description: "ATK dan perlengkapan kantor", status: "Aktif" },
  { name: "Rokok", description: "Produk tembakau dan rokok", status: "Aktif" },
  { name: "Kebutuhan Bayi", description: "Popok, susu, dan perlengkapan bayi", status: "Aktif" },
  { name: "Perlengkapan Mandi", description: "Sabun, sampo, dan kebersihan tubuh", status: "Aktif" },
  { name: "Obat-obatan", description: "Obat ringan dan vitamin", status: "Nonaktif" },
]);

// ── Suppliers ─────────────────────────────────────────────
await db.insert(schema.suppliers).values([
  { name: "PT Indofood Sukses Makmur Tbk", phone: "021-12345678", address: "Jl. Jend. Sudirman Kav. 76-78, Jakarta", notes: "Supplier makanan ringan" },
  { name: "PT Coca-Cola Indonesia", phone: "021-87654321", address: "Jl. HR. Rasuna Said, Jakarta", notes: "Supplier minuman" },
  { name: "UD Sembako Sejahtera", phone: "08123456789", address: "Pasar Induk Kramat Jati, Jakarta", notes: "Supplier sembako" },
  { name: "PT Djarum Super", phone: "021-5551234", address: "Jl. Diponegoro No. 21, Jakarta", notes: "Supplier rokok" },
  { name: "PT Unilever Indonesia Tbk", phone: "021-80865555", address: "BSD Green Office Park, Tangerang", notes: "Supplier perlengkapan mandi dan kebutuhan rumah tangga" },
  { name: "PT Surya Pemenang Makmur", phone: "085612345678", address: "Jl. Raya Bogor Km 30, Jakarta Timur", notes: "Supplier snack dan minuman" },
  { name: "PT Bayi Sehat Indonesia", phone: "021-7778889", address: "Jl. Perempatan Sudirman No. 10, Jakarta", notes: "Supplier kebutuhan bayi" },
]);

// ── Products: Makanan Ringan ──────────────────────────────
await db.insert(schema.products).values([
  { barcode: "8991001100111", name: "Chitato Sapi Panggang 68g", category: "Makanan Ringan", purchasePrice: 8000, sellingPrice: 10500, stock: 48, status: "Aktif" },
  { barcode: "8991001200226", name: "Lays Classic 68g", category: "Makanan Ringan", purchasePrice: 8500, sellingPrice: 11000, stock: 35, status: "Aktif" },
  { barcode: "8991001300333", name: "Qtela Balado 68g", category: "Makanan Ringan", purchasePrice: 7500, sellingPrice: 10000, stock: 20, status: "Aktif" },
  { barcode: "8991001400444", name: "Taro Net Seaweed 60g", category: "Makanan Ringan", purchasePrice: 6500, sellingPrice: 9000, stock: 40, status: "Aktif" },
  { barcode: "8991001500555", name: "Kusuka Singkong Balado 60g", category: "Makanan Ringan", purchasePrice: 7000, sellingPrice: 9500, stock: 30, status: "Aktif" },
  { barcode: "8991001600666", name: "Cheetos Keju 68g", category: "Makanan Ringan", purchasePrice: 8000, sellingPrice: 10500, stock: 25, status: "Aktif" },
  { barcode: "8991001700777", name: "Pop Mie Cup Besar", category: "Makanan Ringan", purchasePrice: 5000, sellingPrice: 7000, stock: 50, status: "Aktif" },
  { barcode: "8991001800888", name: "Indomie Goreng 85g", category: "Makanan Ringan", purchasePrice: 2800, sellingPrice: 4000, stock: 120, status: "Aktif" },
  { barcode: "8991001900999", name: "Indomie Kuah Soto 85g", category: "Makanan Ringan", purchasePrice: 2800, sellingPrice: 4000, stock: 110, status: "Aktif" },
  { barcode: "8991001A00AAA", name: "Oreo Original 137g", category: "Makanan Ringan", purchasePrice: 8500, sellingPrice: 11000, stock: 45, status: "Aktif" },
  { barcode: "8991001B00BBB", name: "Roma Malkist Crackers 130g", category: "Makanan Ringan", purchasePrice: 7000, sellingPrice: 9500, stock: 35, status: "Aktif" },
  { barcode: "8991001C00CCC", name: "Nextar Brownies Cokelat 27g", category: "Makanan Ringan", purchasePrice: 2000, sellingPrice: 3500, stock: 60, status: "Aktif" },
  { barcode: "8991001D00DDD", name: "Nabati Richeese Keju 32g", category: "Makanan Ringan", purchasePrice: 1500, sellingPrice: 2500, stock: 80, status: "Aktif" },
  { barcode: "8991001E00EEE", name: "SilverQueen Cashew Nut 100g", category: "Makanan Ringan", purchasePrice: 22000, sellingPrice: 28000, stock: 15, status: "Aktif" },
  { barcode: "8991001F00FFF", name: "Garuda Ricip Ricip Pedas 60g", category: "Makanan Ringan", purchasePrice: 6000, sellingPrice: 8500, stock: 28, status: "Aktif" },
]);

// ── Products: Minuman ─────────────────────────────────────
await db.insert(schema.products).values([
  { barcode: "8992002100111", name: "Coca-Cola 250ml Kaleng", category: "Minuman", purchasePrice: 4000, sellingPrice: 6000, stock: 3, status: "Aktif" },
  { barcode: "8992002200222", name: "Sprite 250ml Kaleng", category: "Minuman", purchasePrice: 4000, sellingPrice: 6000, stock: 60, status: "Aktif" },
  { barcode: "8992002300333", name: "Fanta Strawberry 250ml Kaleng", category: "Minuman", purchasePrice: 4000, sellingPrice: 6000, stock: 2, status: "Aktif" },
  { barcode: "8992002400444", name: "Aqua Mineral 600ml", category: "Minuman", purchasePrice: 3500, sellingPrice: 5000, stock: 90, status: "Aktif" },
  { barcode: "8992002500555", name: "Teh Pucuk Harum 450ml", category: "Minuman", purchasePrice: 3500, sellingPrice: 5500, stock: 70, status: "Aktif" },
  { barcode: "8992002600666", name: "Pocari Sweat 500ml", category: "Minuman", purchasePrice: 5000, sellingPrice: 7500, stock: 45, status: "Aktif" },
  { barcode: "8992002700777", name: "Indomilk Cokelat 250ml", category: "Minuman", purchasePrice: 4000, sellingPrice: 6500, stock: 30, status: "Aktif" },
  { barcode: "8992002800888", name: "Coca-Cola 1.5L", category: "Minuman", purchasePrice: 10000, sellingPrice: 14500, stock: 25, status: "Aktif" },
  { barcode: "8992002900999", name: "Le Minerale 600ml", category: "Minuman", purchasePrice: 3500, sellingPrice: 5000, stock: 80, status: "Aktif" },
  { barcode: "8992002A00AAA", name: "You C1000 Lemon 140ml", category: "Minuman", purchasePrice: 7000, sellingPrice: 10000, stock: 20, status: "Aktif" },
  { barcode: "8992002B00BBB", name: "Floridina Orange 450ml", category: "Minuman", purchasePrice: 4500, sellingPrice: 7000, stock: 35, status: "Aktif" },
  { barcode: "8992002C00CCC", name: "Kopi ABC Susu 200ml", category: "Minuman", purchasePrice: 4000, sellingPrice: 6000, stock: 55, status: "Aktif" },
  { barcode: "8992002D00DDD", name: "Extra Joss Active 500ml", category: "Minuman", purchasePrice: 4000, sellingPrice: 6000, stock: 40, status: "Aktif" },
  { barcode: "8992002E00EEE", name: "Mizone Isotonic 500ml", category: "Minuman", purchasePrice: 5000, sellingPrice: 7500, stock: 28, status: "Aktif" },
]);

// ── Products: Sembako ─────────────────────────────────────
await db.insert(schema.products).values([
  { barcode: "8993003100111", name: "Beras Ramos 5kg", category: "Sembako", purchasePrice: 55000, sellingPrice: 65000, stock: 25, status: "Aktif" },
  { barcode: "8993003200222", name: "Gula Pasir Gulaku 1kg", category: "Sembako", purchasePrice: 14000, sellingPrice: 17500, stock: 30, status: "Aktif" },
  { barcode: "8993003300333", name: "Minyak Goreng Filma 2L", category: "Sembako", purchasePrice: 30000, sellingPrice: 38000, stock: 4, status: "Aktif" },
  { barcode: "8993003400444", name: "Telur Ayam 1kg (10 butir)", category: "Sembako", purchasePrice: 22000, sellingPrice: 28000, stock: 50, status: "Aktif" },
  { barcode: "8993003500555", name: "Garam Dapur Refina 500g", category: "Sembako", purchasePrice: 4000, sellingPrice: 6500, stock: 40, status: "Aktif" },
  { barcode: "8993003600666", name: "Kecap Manis Bango 600ml", category: "Sembako", purchasePrice: 18000, sellingPrice: 24000, stock: 20, status: "Aktif" },
  { barcode: "8993003700777", name: "Tepung Terigu Segitiga Biru 1kg", category: "Sembako", purchasePrice: 10000, sellingPrice: 14000, stock: 35, status: "Aktif" },
  { barcode: "8993003800888", name: "Saori Saus Tiram 275ml", category: "Sembako", purchasePrice: 8000, sellingPrice: 12000, stock: 22, status: "Aktif" },
  { barcode: "8993003900999", name: "Indomie Kuah Soto Mie 5pack", category: "Sembako", purchasePrice: 13000, sellingPrice: 17000, stock: 40, status: "Aktif" },
  { barcode: "8993003A00AAA", name: "Susu Bendera Kental Manis 370g", category: "Sembako", purchasePrice: 10000, sellingPrice: 13500, stock: 30, status: "Aktif" },
  { barcode: "8993003B00BBB", name: "Bawang Merah 500g", category: "Sembako", purchasePrice: 15000, sellingPrice: 20000, stock: 18, status: "Aktif" },
  { barcode: "8993003C00CCC", name: "Bawang Putih 500g", category: "Sembako", purchasePrice: 12000, sellingPrice: 16000, stock: 20, status: "Aktif" },
  { barcode: "8993003D00DDD", name: "Cabe Merah Keriting 500g", category: "Sembako", purchasePrice: 20000, sellingPrice: 28000, stock: 10, status: "Aktif" },
  { barcode: "8993003E00EEE", name: "Daging Ayam Broiler 1kg", category: "Sembako", purchasePrice: 32000, sellingPrice: 42000, stock: 15, status: "Aktif" },
]);

// ── Products: Alat Tulis ──────────────────────────────────
await db.insert(schema.products).values([
  { barcode: "8994004100111", name: "Pulpen Joyko Standard", category: "Alat Tulis", purchasePrice: 2000, sellingPrice: 3500, stock: 100, status: "Aktif" },
  { barcode: "8994004200222", name: "Pensil 2B Staedtler", category: "Alat Tulis", purchasePrice: 3000, sellingPrice: 5000, stock: 80, status: "Aktif" },
  { barcode: "8994004300333", name: "Buku Tulis Siaga 32 hal", category: "Alat Tulis", purchasePrice: 2500, sellingPrice: 4500, stock: 150, status: "Aktif" },
  { barcode: "8994004400444", name: "Penghapus Joyko", category: "Alat Tulis", purchasePrice: 1500, sellingPrice: 3000, stock: 60, status: "Aktif" },
  { barcode: "8994004500555", name: "Ruler 30cm Joyko", category: "Alat Tulis", purchasePrice: 3000, sellingPrice: 5500, stock: 45, status: "Aktif" },
  { barcode: "8994004600666", name: "Spidol Snowman Boardmarker", category: "Alat Tulis", purchasePrice: 4000, sellingPrice: 7000, stock: 35, status: "Aktif" },
  { barcode: "8994004700777", name: "Tip-Ex Joyko 18ml", category: "Alat Tulis", purchasePrice: 4500, sellingPrice: 7500, stock: 30, status: "Aktif" },
  { barcode: "8994004800888", name: "Map Kertas Folio", category: "Alat Tulis", purchasePrice: 1000, sellingPrice: 2000, stock: 200, status: "Aktif" },
  { barcode: "8994004900999", name: "Kertas HVS A4 500 lembar", category: "Alat Tulis", purchasePrice: 38000, sellingPrice: 50000, stock: 25, status: "Aktif" },
]);

// ── Products: Rokok ───────────────────────────────────────
await db.insert(schema.products).values([
  { barcode: "8995005100111", name: "Gudang Garam Surya 12", category: "Rokok", purchasePrice: 18000, sellingPrice: 20000, stock: 50, status: "Aktif" },
  { barcode: "8995005200222", name: "Djarum Super 12", category: "Rokok", purchasePrice: 17000, sellingPrice: 19000, stock: 45, status: "Aktif" },
  { barcode: "8995005300333", name: "Sampoerna A Mild 16", category: "Rokok", purchasePrice: 22000, sellingPrice: 25000, stock: 40, status: "Aktif" },
  { barcode: "8995005400444", name: "Marlboro Ice Blast 16", category: "Rokok", purchasePrice: 25000, sellingPrice: 28000, stock: 30, status: "Aktif" },
  { barcode: "8995005500555", name: "Surya 16", category: "Rokok", purchasePrice: 19000, sellingPrice: 22000, stock: 55, status: "Aktif" },
  { barcode: "8995005600666", name: "Djarum 76 16", category: "Rokok", purchasePrice: 16000, sellingPrice: 18000, stock: 35, status: "Aktif" },
  { barcode: "8995005700777", name: "LA Lights Classic 16", category: "Rokok", purchasePrice: 18000, sellingPrice: 20000, stock: 28, status: "Aktif" },
  { barcode: "8995005800888", name: "Lucky Strike 12", category: "Rokok", purchasePrice: 20000, sellingPrice: 23000, stock: 20, status: "Aktif" },
]);

// ── Products: Kebutuhan Bayi ──────────────────────────────
await db.insert(schema.products).values([
  { barcode: "8996006100111", name: "MamyPoko Pants Standar S34", category: "Kebutuhan Bayi", purchasePrice: 48000, sellingPrice: 58000, stock: 15, status: "Aktif" },
  { barcode: "8996006200222", name: "MamyPoko Pants Standar M28", category: "Kebutuhan Bayi", purchasePrice: 48000, sellingPrice: 58000, stock: 12, status: "Aktif" },
  { barcode: "8996006300333", name: "MamyPoko Pants Standar L22", category: "Kebutuhan Bayi", purchasePrice: 48000, sellingPrice: 58000, stock: 10, status: "Aktif" },
  { barcode: "8996006400444", name: "Susu Formula Enfamil A+ 400g", category: "Kebutuhan Bayi", purchasePrice: 135000, sellingPrice: 165000, stock: 8, status: "Aktif" },
  { barcode: "8996006500555", name: "Popok Bayi Sweety Gold M30", category: "Kebutuhan Bayi", purchasePrice: 42000, sellingPrice: 52000, stock: 14, status: "Aktif" },
  { barcode: "8996006600666", name: "Tisu Basah My Baby 50 sheet", category: "Kebutuhan Bayi", purchasePrice: 8000, sellingPrice: 12000, stock: 25, status: "Aktif" },
  { barcode: "8996006700777", name: "Botol Susu Pigeon 250ml", category: "Kebutuhan Bayi", purchasePrice: 35000, sellingPrice: 45000, stock: 10, status: "Aktif" },
]);

// ── Products: Perlengkapan Mandi ──────────────────────────
await db.insert(schema.products).values([
  { barcode: "8997007100111", name: "Pantene Shampo Anti Ketombe 160ml", category: "Perlengkapan Mandi", purchasePrice: 18000, sellingPrice: 24000, stock: 20, status: "Aktif" },
  { barcode: "8997007200222", name: "Rexona Roll On Men 50ml", category: "Perlengkapan Mandi", purchasePrice: 15000, sellingPrice: 21000, stock: 18, status: "Aktif" },
  { barcode: "8997007300333", name: "Lifebuoy Sabun Mandi Total 10 100g", category: "Perlengkapan Mandi", purchasePrice: 4000, sellingPrice: 6500, stock: 40, status: "Aktif" },
  { barcode: "8997007400444", name: "Colgate Pasta Gigi Total 12 75g", category: "Perlengkapan Mandi", purchasePrice: 12000, sellingPrice: 16500, stock: 30, status: "Aktif" },
  { barcode: "8997007500555", name: "Sunlight Lemon Sabun Cuci Piring 755ml", category: "Perlengkapan Mandi", purchasePrice: 12000, sellingPrice: 16500, stock: 25, status: "Aktif" },
  { barcode: "8997007600666", name: "Rinso Anti Noda Deterjen 900g", category: "Perlengkapan Mandi", purchasePrice: 18000, sellingPrice: 24000, stock: 22, status: "Aktif" },
  { barcode: "8997007700777", name: "Wipol Karbol Wangi 2L", category: "Perlengkapan Mandi", purchasePrice: 14000, sellingPrice: 19000, stock: 18, status: "Aktif" },
  { barcode: "8997007800888", name: "Vaseline Body Lotion 200ml", category: "Perlengkapan Mandi", purchasePrice: 20000, sellingPrice: 27000, stock: 15, status: "Aktif" },
  { barcode: "8997007900999", name: "Gillette Mach3 Razor", category: "Perlengkapan Mandi", purchasePrice: 30000, sellingPrice: 42000, stock: 12, status: "Aktif" },
]);

// ── Settings ──────────────────────────────────────────────
await db.insert(schema.settings).values([
  { key: "storeName", value: "QPOS Minimarket" },
  { key: "phone", value: "021-1234567" },
  { key: "address", value: "Jl. Merdeka No. 123, Jakarta" },
]);

console.log("Database berhasil di-seed dengan data contoh!");
console.log();
console.log("═══════════════════════════════════════");
console.log("  Akun Login (password: demo)");
console.log("═══════════════════════════════════════");
console.log("  admin   → admin / demo   (role: admin)");
console.log("  manager → manager / demo (role: manager)");
console.log("  cashier → cashier / demo (role: cashier)");
console.log("  kasir1  → kasir1 / demo  (role: cashier)");
console.log("  kasir2  → kasir2 / demo  (role: cashier)");
console.log("  mgr2    → mgr2 / demo    (role: manager)");
console.log("═══════════════════════════════════════");
console.log();
console.log("Ringkasan Data:");
console.log("  • 6 akun user");
console.log("  • 8 kategori (7 aktif, 1 nonaktif)");
console.log("  • 7 supplier");
console.log("  • 77 produk (stok bervariasi)");
console.log("  • 1 pengaturan toko");
process.exit(0);
