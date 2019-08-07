import React, { createContext, ReactElement } from "react"
import { TripsById } from "../schedule"

export const TripsByIdContext = createContext({} as TripsById)

export const TripsByIdProvider = ({
  tripsById,
  children,
}: {
  tripsById: TripsById
  children: ReactElement<HTMLElement>
}) => {
  return (
    <TripsByIdContext.Provider value={tripsById}>
      {children}
    </TripsByIdContext.Provider>
  )
}
