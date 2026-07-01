import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { appConfig } from "./config/app.config";
import { errorHandler } from "./middleware/error-handler.middleware";
import { notFoundHandler } from "./middleware/not-found.middleware";
import routes from "./routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(appConfig.nodeEnv === "production" ? "combined" : "dev"));

app.use("/", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
