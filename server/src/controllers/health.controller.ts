import { Request, Response } from "express";

export const getApiStatus = (_req: Request, res: Response) => {
  res.status(200).json({
    name: "QPOS API",
    version: "2.0.0",
    status: "running"
  });
};
