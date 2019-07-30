import { createContext } from "react"
import { VehiclesForRoute } from "../realtime"
import { ByRouteId } from "../schedule"

const VehiclesByRouteIdContext = createContext({} as ByRouteId<
  VehiclesForRoute
>)

export default VehiclesByRouteIdContext
