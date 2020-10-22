import { createContext } from "react"
import { VehicleOrGhost } from "../realtime"

const VehicleForNotificationContext = createContext<
  VehicleOrGhost | null | undefined
>(null)

export default VehicleForNotificationContext
