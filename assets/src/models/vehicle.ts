import { Vehicle } from "../realtime"

export const isShuttle = (vehicle: Vehicle): boolean =>
  (vehicle.runId || "").startsWith("999")
