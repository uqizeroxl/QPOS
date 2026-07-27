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

app.use(globalLimiter);

app.use(
  helmet({
    contentSecurityPolicy:
      appConfig.nodeEnv === "production"
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "https://accounts.google.com", "https://apis.google.com"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              connectSrc: [
                "'self'",
                "https://api.qpos.shop",
                "https://accounts.google.com",
                "https://www.googleapis.com",
                "https://oauth2.googleapis.com",
              ],
              imgSrc: ["'self'", "data:"],
              fontSrc: ["'self'"],
              frameSrc: ["'self'", "https://accounts.google.com"],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
  }),
);

app.use(
  cors({
    origin: appConfig.corsOrigin || "http://localhost:5173",
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(morgan(appConfig.nodeEnv === "production" ? "combined" : "dev"));

app.use("/", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
