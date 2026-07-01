import { useContext } from "react";
import { ActivityContext } from "../contexts/activityContextValue";

export function useActivityLog() {
  const context = useContext(ActivityContext);

  if (!context) {
    throw new Error("useActivityLog must be used within ActivityProvider.");
  }

  return context;
}
