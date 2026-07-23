import bcrypt from "bcryptjs";
import db from "./db";

const existingUser = db.prepare("SELECT id FROM users LIMIT 1").get();
if (existingUser) {
  console.log("Database sudah memiliki data. Seed dilewati.");
  process.exit(0);
}

const hashedPassword = await bcrypt.hash("demo", 10);

const seedUser = db.prepare(
  "INSERT INTO users (id, username, password, name, role) VALUES (?, ?, ?, ?, ?)",
);

seedUser.run(crypto.randomUUID(), "admin", hashedPassword, "Admin Utama", "admin");
seedUser.run(crypto.randomUUID(), "manager", hashedPassword, "Manajer Toko", "manager");
seedUser.run(crypto.randomUUID(), "cashier", hashedPassword, "Kasir", "cashier");

db.prepare("INSERT INTO categories (name, description, status) VALUES (?, ?, ?)").run(
  "Makanan Ringan",
  "Cemilan dan snack",
  "Aktif",
);
db.prepare("INSERT INTO categories (name, description, status) VALUES (?, ?, ?)").run(
  "Minuman",
  "Minuman ringan dan kemasan",
  "Aktif",
);
db.prepare("INSERT INTO categories (name, description, status) VALUES (?, ?, ?)").run(
  "Sembako",
  "Sembilan bahan pokok",
  "Aktif",
);

db.prepare("INSERT INTO categories (name, description, status) VALUES (?, ?, ?)").run(
  "Alat Tulis",
  "ATK dan perlengkapan kantor",
  "Nonaktif",
);

db.prepare(
  "INSERT INTO products (barcode, name, category, purchase_price, selling_price, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
).run("8991001100111", "Chitato Sapi Panggang 68g", "Makanan Ringan", 8000, 10500, 50, "Aktif");

db.prepare(
  "INSERT INTO products (barcode, name, category, purchase_price, selling_price, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
).run("8991001200226", "Lays Classic 68g", "Makanan Ringan", 8500, 11000, 35, "Aktif");

db.prepare(
  "INSERT INTO products (barcode, name, category, purchase_price, selling_price, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
).run("8991001300333", "Qtela Balado 68g", "Makanan Ringan", 7500, 10000, 20, "Aktif");

db.prepare(
  "INSERT INTO products (barcode, name, category, purchase_price, selling_price, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
).run("8992002100111", "Coca-Cola 250ml Kaleng", "Minuman", 4000, 6000, 3, "Aktif");

db.prepare(
  "INSERT INTO products (barcode, name, category, purchase_price, selling_price, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
).run("8992002200222", "Sprite 250ml Kaleng", "Minuman", 4000, 6000, 60, "Aktif");

db.prepare(
  "INSERT INTO products (barcode, name, category, purchase_price, selling_price, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
).run("8992002300333", "Fanta Strawberry 250ml Kaleng", "Minuman", 4000, 6000, 2, "Aktif");

db.prepare(
  "INSERT INTO products (barcode, name, category, purchase_price, selling_price, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
).run("8993003100111", "Beras Ramos 1kg", "Sembako", 12000, 15500, 25, "Aktif");

db.prepare(
  "INSERT INTO products (barcode, name, category, purchase_price, selling_price, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
).run("8993003200222", "Gula Pasir Gulaku 1kg", "Sembako", 14000, 17500, 30, "Aktif");

db.prepare(
  "INSERT INTO products (barcode, name, category, purchase_price, selling_price, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
).run("8993003300333", "Minyak Goreng Filma 1L", "Sembako", 18000, 22500, 4, "Aktif");

db.prepare(
  "INSERT INTO products (barcode, name, category, purchase_price, selling_price, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
).run("8994004100111", "Pulpen Joyko Standard", "Alat Tulis", 2000, 3500, 0, "Nonaktif");

db.prepare(
  "INSERT INTO suppliers (name, phone, address, notes) VALUES (?, ?, ?, ?)",
).run("PT Indofood Sukses Makmur Tbk", "021-12345678", "Jl. Jend. Sudirman Kav. 76-78, Jakarta", "Supplier makanan ringan");

db.prepare(
  "INSERT INTO suppliers (name, phone, address, notes) VALUES (?, ?, ?, ?)",
).run("PT Coca-Cola Indonesia", "021-87654321", "Jl. HR. Rasuna Said, Jakarta", "Supplier minuman");

db.prepare(
  "INSERT INTO suppliers (name, phone, address, notes) VALUES (?, ?, ?, ?)",
).run("UD Sembako Sejahtera", "08123456789", "Pasar Induk Kramat Jati, Jakarta", "Supplier sembako");

db.prepare(
  "INSERT INTO settings (key, value) VALUES (?, ?)",
).run("storeName", "QPOS Minimarket");

db.prepare(
  "INSERT INTO settings (key, value) VALUES (?, ?)",
).run("phone", "021-1234567");

db.prepare(
  "INSERT INTO settings (key, value) VALUES (?, ?)",
).run("address", "Jl. Merdeka No. 123, Jakarta");

console.log("Database berhasil di-seed dengan data contoh!");
console.log("Akun login:");
console.log("  admin   → admin / demo");
console.log("  manager → manager / demo");
console.log("  cashier → cashier / demo");
process.exit(0);