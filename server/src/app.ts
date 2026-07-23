import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import categoryRoutes from "./routes/categories";
import supplierRoutes from "./routes/suppliers";
import transactionRoutes from "./routes/transactions";
import settingsRoutes from "./routes/settings";
import dashboardRoutes from "./routes/dashboard";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "success", data: { status: "ok", timestamp: new Date().toISOString() } });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(errorHandler);

export default app;