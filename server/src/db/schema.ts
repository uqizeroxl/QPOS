import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  real,
  timestamp,
  uuid,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "manager", "cashier"]);
export const entityStatus = pgEnum("entity_status", ["Aktif", "Nonaktif"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    name: text("name").notNull(),
    role: userRole("role").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    usernameIdx: uniqueIndex("users_username_idx").on(table.username),
  }),
);

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description").default("").notNull(),
    status: entityStatus("status").default("Aktif").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: uniqueIndex("categories_name_idx").on(table.name),
  }),
);

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    barcode: text("barcode").notNull().unique(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    purchasePrice: real("purchase_price").default(0).notNull(),
    sellingPrice: real("selling_price").default(0).notNull(),
    stock: integer("stock").default(0).notNull(),
    status: entityStatus("status").default("Aktif").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    barcodeIdx: uniqueIndex("products_barcode_idx").on(table.barcode),
    categoryIdx: index("products_category_idx").on(table.category),
    nameIdx: index("products_name_idx").on(table.name),
  }),
);

export const suppliers = pgTable(
  "suppliers",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    phone: text("phone").default("").notNull(),
    address: text("address").default("").notNull(),
    notes: text("notes").default("").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: uniqueIndex("suppliers_name_idx").on(table.name),
  }),
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    transactionNumber: text("transaction_number").notNull().unique(),
    subtotal: real("subtotal").notNull(),
    discountPercent: real("discount_percent").default(0).notNull(),
    discountAmount: real("discount_amount").default(0).notNull(),
    grandTotal: real("grand_total").notNull(),
    paidAmount: real("paid_amount").notNull(),
    change: real("change_amount").notNull(),
    cashierName: text("cashier_name").default("").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("transactions_created_at_idx").on(table.createdAt),
  }),
);

export const transactionItems = pgTable(
  "transaction_items",
  {
    id: serial("id").primaryKey(),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull(),
    barcode: text("barcode").notNull(),
    name: text("name").notNull(),
    price: real("price").notNull(),
    quantity: integer("quantity").notNull(),
    subtotal: real("subtotal").notNull(),
  },
  (table) => ({
    transactionIdx: index("transaction_items_txn_idx").on(table.transactionId),
  }),
);

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});