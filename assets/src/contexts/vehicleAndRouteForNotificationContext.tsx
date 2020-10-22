import { createContext } from "react"
import { VehicleOrGhostAndRoute } from "../realtime"

const VehicleAndRouteForNotificationContext = createContext<
  VehicleOrGhostAndRoute | null | undefined
>(null)

export default VehicleAndRouteForNotificationContext
