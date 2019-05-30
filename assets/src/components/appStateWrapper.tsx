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
} from "../skate"
import { initialState, reducer } from "../state"
import App from "./app"

const findSelectedVehicle = (
  vehiclesByRouteId: VehiclesByRouteId,
  selectedVehicleId: VehicleId | undefined
): Vehicle | undefined =>
  Object.values(vehiclesByRouteId)
    .reduce((acc, vehicles) => acc.concat(vehicles), [])
    .find(vehicle => vehicle.id === selectedVehicleId)

const AppStateWrapper = (): JSX.Element => {
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
      <App
        routes={routes}
        timepointsByRouteId={timepointsByRouteId}
        selectedRouteIds={selectedRouteIds}
        selectedRoutes={selectedRoutes}
        vehiclesByRouteId={vehiclesByRouteId}
        selectedVehicleId={selectedVehicleId}
        selectedVehicle={selectedVehicle}
      />
    </DispatchProvider>
  )
}

export default AppStateWrapper
