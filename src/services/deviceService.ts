import { apiService } from "./api/apiService";
import type { DeviceSession } from "../types/device";

export type { DeviceSession } from "../types/device";

export const deviceService = {
  listDevices: async () => {
    const response = await apiService.get<DeviceSession[]>("/devices");
    return response.data;
  },

  logoutDevice: async (deviceId: string) => {
    await apiService.delete(`/devices/${deviceId}`);
  },
};
