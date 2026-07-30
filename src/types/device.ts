export type DeviceSession = {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  isCurrent: boolean;
  lastActiveAt: string;
  createdAt: string;
};
