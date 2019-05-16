import React, { useReducer } from "react"
import useRoutes from "../hooks/useRoutes"
import useSocket from "../hooks/useSocket"
import useTimepoints from "../hooks/useTimepoints"
import useVehicles from "../hooks/useVehicles"
import DispatchProvider from "../providers/dispatchProvider"
import {
  Route,
  TimepointsByRouteId,
  Vehicle,
  VehicleId,
  VehiclesByRouteId,
} from "../skate.d"
import { initialState, reducer } from "../state"
import RouteLadders from "./routeLadders"
import RoutePicker from "./routePicker"
import VehiclePropertiesPanel from "./vehiclePropertiesPanel"

const findSelectedVehicle = (
  vehiclesByRouteId: VehiclesByRouteId,
  selectedVehicleId: VehicleId | undefined
): Vehicle | undefined =>
  Object.values(vehiclesByRouteId)
    .reduce((acc, vehicles) => acc.concat(vehicles), [])
    .find(vehicle => vehicle.id === selectedVehicleId)

const App = (): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { selectedRouteIds, selectedVehicleId } = state

  const routes: Route[] | null = useRoutes()
  const timepointsByRouteId: TimepointsByRouteId = useTimepoints(
    selectedRouteIds
  )
  const socket = useSocket()
  const vehiclesByRouteId = useVehicles(socket, selectedRouteIds)

  const selectedRoutes = (routes || []).filter(route =>
    selectedRouteIds.includes(route.id)
  )

  const selectedVehicle = findSelectedVehicle(
    vehiclesByRouteId,
    selectedVehicleId
  )

  return (
    <DispatchProvider dispatch={dispatch}>
      <div className="m-app">
        <RoutePicker routes={routes} selectedRouteIds={selectedRouteIds} />

        <RouteLadders
          routes={selectedRoutes}
          timepointsByRouteId={timepointsByRouteId}
          vehiclesByRouteId={vehiclesByRouteId}
          selectedVehicleId={selectedVehicleId}
        />

        {selectedVehicle && (
          <VehiclePropertiesPanel selectedVehicle={selectedVehicle} />
        )}
      </div>
    </DispatchProvider>
  )
}

export default App
