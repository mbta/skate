import React, { createContext, ReactElement } from "react"
import { VehicleOrGhost } from "../realtime"

const VehicleForNotificationContext = createContext<
  VehicleOrGhost | null | undefined
>(null)

export const VehicleForNotificationProvider = ({
  vehicleForNotification,
  children,
}: {
  vehicleForNotification: VehicleOrGhost | null | undefined
  children: ReactElement<HTMLElement>
}) => {
  return (
    <VehicleForNotificationContext.Provider value={vehicleForNotification}>
      {children}
    </VehicleForNotificationContext.Provider>
  )
}

export default VehicleForNotificationContext
