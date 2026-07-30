import { masterPrisma } from "../utils/master-prisma";

export type DeviceSessionInfo = {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  isCurrent: boolean;
  lastActiveAt: Date;
  createdAt: Date;
};

function parseUserAgent(ua: string) {
  let browser = "Unknown";
  let os = "Unknown";
  let deviceType = "desktop";

  if (/Chrome/i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua)) browser = "Chrome";
  else if (/Firefox/i.test(ua) && !/Seamonkey/i.test(ua)) browser = "Firefox";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua)) browser = "Safari";
  else if (/Edg/i.test(ua)) browser = "Edge";
  else if (/OPR/i.test(ua) || /Opera/i.test(ua)) browser = "Opera";
  else if (/UCBrowser/i.test(ua)) browser = "UC Browser";
  else if (/SamsungBrowser/i.test(ua)) browser = "Samsung Internet";

  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua) && !/Android/i.test(ua)) os = "Linux";
  else if (/Android/i.test(ua)) {
    os = "Android";
    deviceType = /Mobile/i.test(ua) ? "mobile" : "tablet";
  } else if (/iOS|iPhone|iPad|iPod/i.test(ua)) {
    os = "iOS";
    deviceType = /iPad/i.test(ua) ? "tablet" : "mobile";
  } else if (/CrOS/i.test(ua)) os = "ChromeOS";

  return { browser, os, deviceType };
}

function formatDeviceName(browser: string, os: string, deviceType: string) {
  if (deviceType === "mobile" || deviceType === "tablet") {
    return `${os} (${deviceType === "mobile" ? "Mobile" : "Tablet"})`;
  }
  return `${browser} di ${os}`;
}

export const createDeviceSession = async (params: {
  accountId: string;
  userAgent: string;
  ipAddress: string;
}) => {
  const { browser, os, deviceType } = parseUserAgent(params.userAgent);
  const deviceName = formatDeviceName(browser, os, deviceType);

  const session = await masterPrisma.deviceSession.create({
    data: {
      accountId: params.accountId,
      deviceName,
      deviceType,
      browser,
      os,
      ipAddress: params.ipAddress,
      tokenVersion: 1,
    },
  });

  return session;
};

export const listDeviceSessions = async (
  accountId: string,
  currentDeviceId?: string,
): Promise<DeviceSessionInfo[]> => {
  const sessions = await masterPrisma.deviceSession.findMany({
    where: { accountId },
    orderBy: { lastActiveAt: "desc" },
  });

  return sessions.map((s) => ({
    id: s.id,
    deviceName: s.deviceName,
    deviceType: s.deviceType,
    browser: s.browser,
    os: s.os,
    ipAddress: s.ipAddress,
    isCurrent: s.id === currentDeviceId,
    lastActiveAt: s.lastActiveAt,
    createdAt: s.createdAt,
  }));
};

export const logoutDevice = async (deviceId: string, accountId: string) => {
  const device = await masterPrisma.deviceSession.findFirst({
    where: { id: deviceId, accountId },
  });

  if (!device) return false;

  await masterPrisma.deviceSession.update({
    where: { id: deviceId },
    data: { tokenVersion: { increment: 1 } },
  });

  return true;
};

export const logoutAllDevices = async (accountId: string) => {
  await masterPrisma.deviceSession.updateMany({
    where: { accountId },
    data: { tokenVersion: { increment: 1 } },
  });
};

export const touchDeviceSession = async (deviceId: string) => {
  await masterPrisma.deviceSession.update({
    where: { id: deviceId },
    data: { lastActiveAt: new Date() },
  });
};

export const verifyDeviceToken = async (deviceId: string, deviceTokenVersion: number) => {
  const device = await masterPrisma.deviceSession.findUnique({
    where: { id: deviceId },
  });

  if (!device) return false;
  if (device.tokenVersion !== deviceTokenVersion) return false;

  return true;
};

export const countActiveDevices = async (accountId: string) => {
  return masterPrisma.deviceSession.count({
    where: { accountId },
  });
};
