import React, { createContext, ReactElement, useContext } from "react"
import { Trip, TripId, TripsById } from "../schedule"

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

export const useTripContext = (
  tripId: TripId | null | undefined
): Trip | undefined => {
  const tripsById = useContext(TripsByIdContext)
  if (tripId) {
    return tripsById[tripId]
  } else {
    return undefined
  }
}

export default TripsByIdContext
