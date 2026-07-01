import app from "./app";
import { appConfig } from "./config/app.config";

app.listen(appConfig.port, () => {
  console.log(`QPOS API is running on port ${appConfig.port}`);
});
