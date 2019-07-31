import React, { ReactElement, useContext } from "react"
import VehiclesByRouteIdContext from "../contexts/vehiclesByRouteIdContext"
import { allVehicles } from "../models/vehiclesByRouteId"
import { Vehicle, VehicleId, VehiclesForRoute } from "../realtime.d"
import { ByRouteId, Route, RouteId, TimepointsByRouteId } from "../schedule.d"
import RouteLadders from "./routeLadders"
import RoutePicker from "./routePicker"
import VehiclePropertiesPanel from "./vehiclePropertiesPanel"

interface Props {
  routePickerIsVisible: boolean
  routes: Route[] | null
  timepointsByRouteId: TimepointsByRouteId
  selectedRouteIds: RouteId[]
  selectedVehicleId: VehicleId | undefined
}

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

const LadderPage = ({
  routePickerIsVisible,
  routes,
  selectedRouteIds,
  selectedVehicleId,
  timepointsByRouteId,
}: Props): ReactElement<HTMLDivElement> => {
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
