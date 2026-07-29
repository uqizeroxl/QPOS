import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { appConfig } from "./config/app.config";
import { errorHandler } from "./middleware/error-handler.middleware";
import { notFoundHandler } from "./middleware/not-found.middleware";
import { globalLimiter } from "./middleware/rate-limiter.middleware";
import routes from "./routes";

const app = express();

app.set("trust proxy", 1);
app.use(globalLimiter);

const allowedOrigins: string[] = appConfig.corsOrigin
  ? appConfig.corsOrigin.split(",").map((s) => s.trim()).filter(Boolean)
  : [];

app.use(
  helmet({
    contentSecurityPolicy:
      appConfig.nodeEnv === "production"
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "https://accounts.google.com", "https://apis.google.com", "https://www.tiktok.com", "https://www.tiktokapis.com"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              connectSrc: [
                "'self'",
                ...allowedOrigins,
                "https://api.qpos.shop",
                "https://accounts.google.com",
                "https://www.googleapis.com",
                "https://oauth2.googleapis.com",
                "https://www.tiktok.com",
                "https://www.tiktokapis.com",
                "https://open.tiktokapis.com",
              ],
              imgSrc: ["'self'", "data:"],
              fontSrc: ["'self'"],
              frameSrc: ["'self'", "https://accounts.google.com", "https://www.tiktok.com", "https://www.tiktokapis.com"],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
  }),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(morgan(appConfig.nodeEnv === "production" ? "combined" : "dev"));

app.use("/", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
