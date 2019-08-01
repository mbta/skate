import React, { ReactElement, useContext } from "react"
import StateDispatchContext from "../contexts/stateDispatchContext"
import VehiclesByRouteIdContext from "../contexts/vehiclesByRouteIdContext"
import useRoutes from "../hooks/useRoutes"
import useTimepoints from "../hooks/useTimepoints"
import { allVehicles } from "../models/vehiclesByRouteId"
import { Vehicle, VehicleId, VehiclesForRoute } from "../realtime.d"
import { ByRouteId, Route, RouteId, TimepointsByRouteId } from "../schedule.d"
import RouteLadders from "./routeLadders"
import RoutePicker from "./routePicker"
import VehiclePropertiesPanel from "./vehiclePropertiesPanel"

export const findRouteById = (
  routes: Route[] | null,
  routeId: RouteId
): Route | undefined => (routes || []).find(route => route.id === routeId)

const findSelectedVehicle = (
  vehiclesByRouteId: ByRouteId<VehiclesForRoute>,
  selectedVehicleId: VehicleId | undefined
): Vehicle | undefined => {
  const vehicles: Vehicle[] = Object.values(vehiclesByRouteId).reduce(
    (acc, vehiclesForRoute) => acc.concat(allVehicles(vehiclesForRoute)),
    [] as Vehicle[]
  )
  return vehicles.find(vehicle => vehicle.id === selectedVehicleId)
}

const vehicleRoute = (
  allRoutes: Route[] | null,
  vehicle: Vehicle | undefined
): Route | undefined =>
  (allRoutes || []).find(route => route.id === (vehicle && vehicle.routeId))

const LadderPage = (): ReactElement<HTMLDivElement> => {
  const [state] = useContext(StateDispatchContext)
  const { routePickerIsVisible, selectedRouteIds, selectedVehicleId } = state

  const routes: Route[] | null = useRoutes()
  const timepointsByRouteId: TimepointsByRouteId = useTimepoints(
    selectedRouteIds
  )

  const vehiclesByRouteId: ByRouteId<VehiclesForRoute> = useContext(
    VehiclesByRouteIdContext
  )
  const selectedRoutes: Route[] = selectedRouteIds
    .map(routeId => findRouteById(routes, routeId))
    .filter(route => route) as Route[]

  const selectedVehicle = findSelectedVehicle(
    vehiclesByRouteId,
    selectedVehicleId
  )

  return (
    <div className="m-ladder-page">
      <RoutePicker
        isVisible={routePickerIsVisible}
        routes={routes}
        selectedRouteIds={selectedRouteIds}
      />

      <RouteLadders
        routes={selectedRoutes}
        timepointsByRouteId={timepointsByRouteId}
        selectedVehicleId={selectedVehicleId}
      />

      {selectedVehicle && (
        <VehiclePropertiesPanel
          selectedVehicle={selectedVehicle}
          selectedVehicleRoute={vehicleRoute(routes, selectedVehicle)}
        />
      )}
    </div>
  )
}

export default LadderPage
