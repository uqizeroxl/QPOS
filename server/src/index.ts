import "dotenv/config";
import app from "./app";

const PORT = Number(process.env.PORT) || 8000;

app.listen(PORT, () => {
  console.log(`QPOS Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});