import { Router } from "express";
import { listDevices, logoutDevice } from "../controllers/device.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, listDevices);
router.delete("/:deviceId", authenticate, logoutDevice);

export default router;
