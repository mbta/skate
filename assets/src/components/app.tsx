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
  selectedRoutes: Route[]
  vehiclesByRouteId: VehiclesByRouteId
  selectedVehicleId: VehicleId | undefined
  selectedVehicle: Vehicle | undefined
}

const vehicleRoute = (
  allRoutes: Route[] | null,
  vehicle: Vehicle | undefined
): Route | undefined =>
  (allRoutes || []).find(route => route.id === (vehicle && vehicle.route_id))

const App = ({
  routes,
  timepointsByRouteId,
  selectedRouteIds,
  selectedRoutes,
  vehiclesByRouteId,
  selectedVehicleId,
  selectedVehicle,
}: Props) => (
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

export default App
