import { NextFunction, Response } from "express";
import { StoreRole } from "../generated/master-prisma/client";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import * as memberService from "../services/member.service";

type AddMemberBody = {
  accountId?: string;
  role?: StoreRole;
};

type UpdateRoleBody = {
  role?: StoreRole;
};

export const listMembers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const members = await memberService.listMembers(req.tenant.storeId);
    res.status(200).json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { accountId, role } = req.body as AddMemberBody;

    if (!accountId || !role) {
      res.status(400).json({
        success: false,
        message: "accountId dan role wajib diisi.",
      });
      return;
    }

    if (!Object.values(StoreRole).includes(role)) {
      res.status(400).json({
        success: false,
        message: "Role tidak valid. Pilihan: OWNER, MANAGER, CASHIER.",
      });
      return;
    }

    const member = await memberService.addMember(
      req.tenant.storeId,
      accountId,
      role,
    );

    res.status(201).json({ success: true, data: member });
  } catch (error) {
    if (
      error instanceof memberService.AccountNotFoundError ||
      error instanceof memberService.MemberAlreadyExistsError
    ) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};

export const updateMemberRole = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { memberId } = req.params;
    const { role } = req.body as UpdateRoleBody;

    if (!role) {
      res.status(400).json({
        success: false,
        message: "Role wajib diisi.",
      });
      return;
    }

    if (!Object.values(StoreRole).includes(role)) {
      res.status(400).json({
        success: false,
        message: "Role tidak valid. Pilihan: OWNER, MANAGER, CASHIER.",
      });
      return;
    }

    const member = await memberService.updateMemberRole(
      memberId,
      req.tenant.storeId,
      role,
    );

    res.status(200).json({ success: true, data: member });
  } catch (error) {
    if (error instanceof memberService.MemberNotFoundError) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};

export const removeMember = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { memberId } = req.params;

    await memberService.removeMember(
      memberId,
      req.tenant.storeId,
      req.user.id,
    );

    res.status(200).json({ success: true, message: "Anggota berhasil dihapus." });
  } catch (error) {
    if (
      error instanceof memberService.MemberNotFoundError ||
      error instanceof memberService.SelfRemoveError ||
      error instanceof memberService.LastOwnerRemoveError
    ) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
};

export const searchAccounts = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = (req.query.q as string) ?? "";

    if (!query.trim()) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const accounts = await memberService.searchAccounts(
      query,
      req.tenant.storeId,
    );

    res.status(200).json({ success: true, data: accounts });
  } catch (error) {
    next(error);
  }
};
