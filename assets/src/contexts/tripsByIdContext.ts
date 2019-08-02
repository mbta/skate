import { createContext } from "react"
import { TripsById } from "../schedule"

const TripsByIdContext = createContext({} as TripsById)

export default TripsByIdContext
