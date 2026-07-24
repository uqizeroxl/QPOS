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

await db.insert(schema.users).values([
  { username: "admin", password: hashedPassword, name: "Admin Utama", role: "admin" },
  { username: "manager", password: hashedPassword, name: "Manajer Toko", role: "manager" },
  { username: "cashier", password: hashedPassword, name: "Kasir", role: "cashier" },
]);

await db.insert(schema.categories).values([
  { name: "Makanan Ringan", description: "Cemilan dan snack", status: "Aktif" },
  { name: "Minuman", description: "Minuman ringan dan kemasan", status: "Aktif" },
  { name: "Sembako", description: "Sembilan bahan pokok", status: "Aktif" },
  { name: "Alat Tulis", description: "ATK dan perlengkapan kantor", status: "Nonaktif" },
]);

await db.insert(schema.products).values([
  { barcode: "8991001100111", name: "Chitato Sapi Panggang 68g", category: "Makanan Ringan", purchasePrice: 8000, sellingPrice: 10500, stock: 50, status: "Aktif" },
  { barcode: "8991001200226", name: "Lays Classic 68g", category: "Makanan Ringan", purchasePrice: 8500, sellingPrice: 11000, stock: 35, status: "Aktif" },
  { barcode: "8991001300333", name: "Qtela Balado 68g", category: "Makanan Ringan", purchasePrice: 7500, sellingPrice: 10000, stock: 20, status: "Aktif" },
  { barcode: "8992002100111", name: "Coca-Cola 250ml Kaleng", category: "Minuman", purchasePrice: 4000, sellingPrice: 6000, stock: 3, status: "Aktif" },
  { barcode: "8992002200222", name: "Sprite 250ml Kaleng", category: "Minuman", purchasePrice: 4000, sellingPrice: 6000, stock: 60, status: "Aktif" },
  { barcode: "8992002300333", name: "Fanta Strawberry 250ml Kaleng", category: "Minuman", purchasePrice: 4000, sellingPrice: 6000, stock: 2, status: "Aktif" },
  { barcode: "8993003100111", name: "Beras Ramos 1kg", category: "Sembako", purchasePrice: 12000, sellingPrice: 15500, stock: 25, status: "Aktif" },
  { barcode: "8993003200222", name: "Gula Pasir Gulaku 1kg", category: "Sembako", purchasePrice: 14000, sellingPrice: 17500, stock: 30, status: "Aktif" },
  { barcode: "8993003300333", name: "Minyak Goreng Filma 1L", category: "Sembako", purchasePrice: 18000, sellingPrice: 22500, stock: 4, status: "Aktif" },
  { barcode: "8994004100111", name: "Pulpen Joyko Standard", category: "Alat Tulis", purchasePrice: 2000, sellingPrice: 3500, stock: 0, status: "Nonaktif" },
]);

await db.insert(schema.suppliers).values([
  { name: "PT Indofood Sukses Makmur Tbk", phone: "021-12345678", address: "Jl. Jend. Sudirman Kav. 76-78, Jakarta", notes: "Supplier makanan ringan" },
  { name: "PT Coca-Cola Indonesia", phone: "021-87654321", address: "Jl. HR. Rasuna Said, Jakarta", notes: "Supplier minuman" },
  { name: "UD Sembako Sejahtera", phone: "08123456789", address: "Pasar Induk Kramat Jati, Jakarta", notes: "Supplier sembako" },
]);

await db.insert(schema.settings).values([
  { key: "storeName", value: "QPOS Minimarket" },
  { key: "phone", value: "021-1234567" },
  { key: "address", value: "Jl. Merdeka No. 123, Jakarta" },
]);

console.log("Database berhasil di-seed dengan data contoh!");
console.log("Akun login:");
console.log("  admin   → admin / demo");
console.log("  manager → manager / demo");
console.log("  cashier → cashier / demo");
process.exit(0);