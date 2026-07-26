import type { ActivityType } from "./enums";

export type { ActivityType };

export type ActivityLogItem = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  createdAt: string;
};

export type AddActivityPayload = Omit<ActivityLogItem, "id" | "createdAt"> & {
  createdAt?: string;
};
