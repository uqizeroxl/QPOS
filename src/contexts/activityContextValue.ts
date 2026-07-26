import { createContext } from "react";
import type { ActivityLogItem, AddActivityPayload } from "../types/activity";

export type { ActivityLogItem, AddActivityPayload } from "../types/activity";
export type { ActivityType } from "../types/enums";

export type ActivityContextValue = {
  activities: ActivityLogItem[];
  addActivity: (activity: AddActivityPayload) => void;
  clearActivities: () => void;
};

export const ActivityContext = createContext<ActivityContextValue | undefined>(
  undefined,
);
