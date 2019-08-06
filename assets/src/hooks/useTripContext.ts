import { useContext } from "react"
import TripsByIdContext from "../contexts/tripsByIdContext"
import { Trip, TripId } from "../schedule"

const useTripContext = (
  tripId: TripId | null | undefined
): Trip | undefined => {
  const tripsById = useContext(TripsByIdContext)
  if (tripId) {
    return tripsById[tripId]
  } else {
    return undefined
  }
}

export default useTripContext
