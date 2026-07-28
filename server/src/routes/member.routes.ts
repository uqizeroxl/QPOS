import { Router } from "express";

import * as memberController from "../controllers/member.controller";
import { authorize } from "../middleware/auth.middleware";
import { UserRole } from "../generated/prisma/client";

const router = Router();

router.use(authorize([UserRole.OWNER]));

router.get("/", memberController.listMembers);
router.post("/", memberController.addMember);
router.patch("/:memberId", memberController.updateMemberRole);
router.delete("/:memberId", memberController.removeMember);
router.get("/search", memberController.searchAccounts);

export default router;
