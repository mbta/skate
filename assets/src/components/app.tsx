import React from "react"
import {
  Route,
  RouteId,
  TimepointsByRouteId,
  Vehicle,
  VehicleId,
  VehiclesByRouteId,
} from "../skate"
import RouteLadders from "./routeLadders"
import RoutePicker from "./routePicker"
import VehiclePropertiesPanel from "./vehiclePropertiesPanel"

interface Props {
  routes: Route[] | null
  timepointsByRouteId: TimepointsByRouteId
  selectedRouteIds: RouteId[]
  vehiclesByRouteId: VehiclesByRouteId
  selectedVehicleId: VehicleId | undefined
}

const findRouteById = (
  routes: Route[] | null,
  routeId: RouteId
): Route | undefined => (routes || []).find(route => route.id === routeId)

const findSelectedVehicle = (
  vehiclesByRouteId: VehiclesByRouteId,
  selectedVehicleId: VehicleId | undefined
): Vehicle | undefined =>
  Object.values(vehiclesByRouteId)
    .reduce((acc, vehicles) => acc.concat(vehicles), [])
    .find(vehicle => vehicle.id === selectedVehicleId)

const vehicleRoute = (
  allRoutes: Route[] | null,
  vehicle: Vehicle | undefined
): Route | undefined =>
  (allRoutes || []).find(route => route.id === (vehicle && vehicle.routeId))

const App = ({
  routes,
  timepointsByRouteId,
  selectedRouteIds,
  vehiclesByRouteId,
  selectedVehicleId,
}: Props) => {
  const selectedRoutes: Route[] = selectedRouteIds
    .map(routeId => findRouteById(routes, routeId))
    .filter(route => route) as Route[]

  const selectedVehicle = findSelectedVehicle(
    vehiclesByRouteId,
    selectedVehicleId
  )

  return (
    <div className="m-app">
      <RoutePicker routes={routes} selectedRouteIds={selectedRouteIds} />

      <RouteLadders
        routes={selectedRoutes}
        timepointsByRouteId={timepointsByRouteId}
        vehiclesByRouteId={vehiclesByRouteId}
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

export default App
