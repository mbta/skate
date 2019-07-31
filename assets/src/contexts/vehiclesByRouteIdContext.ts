import { createContext } from "react"
import { ByRouteId, VehiclesForRoute } from "../skate"

const VehiclesByRouteIdContext = createContext({} as ByRouteId<
  VehiclesForRoute
>)

export default VehiclesByRouteIdContext
