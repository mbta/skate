import React, { ReactElement } from "react"
import TripsByIdContext from "../contexts/tripsByIdContext"
import { TripsById } from "../schedule"

const TripsByIdProvider = ({
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

export default TripsByIdProvider
