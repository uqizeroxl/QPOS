import { NextFunction, Response } from "express";
import * as deviceService from "../services/device.service";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";

export const listDevices = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const devices = await deviceService.listDeviceSessions(
      req.user.id,
      req.user.deviceId,
    );

    res.status(200).json({
      success: true,
      data: devices,
    });
  } catch (error) {
    next(error);
  }
};

export const logoutDevice = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const deviceId = req.params.deviceId?.trim();

    if (!deviceId) {
      res.status(400).json({
        success: false,
        message: "Device ID wajib dikirim.",
      });
      return;
    }

    if (deviceId === req.user.deviceId) {
      res.status(400).json({
        success: false,
        message: "Gunakan tombol 'Logout dari perangkat ini' untuk perangkat saat ini.",
      });
      return;
    }

    const success = await deviceService.logoutDevice(deviceId, req.user.id);

    if (!success) {
      res.status(404).json({
        success: false,
        message: "Perangkat tidak ditemukan.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Perangkat berhasil dilogoutkan.",
    });
  } catch (error) {
    next(error);
  }
};
