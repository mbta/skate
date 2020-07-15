import React, { useContext, useState } from "react"
import { SocketContext } from "../../contexts/socketContext"
import { VehiclesByRouteIdContext } from "../../contexts/vehiclesByRouteIdContext"
import { useTripShape } from "../../hooks/useShapes"
import useVehiclesForRoute from "../../hooks/useVehiclesForRoute"
import { hasBlockWaiver } from "../../models/blockWaiver"
import { isVehicle, shouldShowHeadwayDiagram } from "../../models/vehicle"
import {
  DataDiscrepancy,
  Vehicle,
  VehicleId,
  VehicleOrGhost,
} from "../../realtime"
import { Route, RouteId, Shape } from "../../schedule"
import Map from "../map"
import PropertiesList from "../propertiesList"
import BlockWaiverList from "./blockWaiverList"
import CrowdingDiagram from "./crowdingDiagram"
import Header from "./header"
import HeadwayDiagram from "./headwayDiagram"
import TabPanels, { TabMode } from "./tabPanels"
import { useNearestIntersection } from "../../hooks/useNearestIntersection"

interface Props {
  selectedVehicle: Vehicle
  route?: Route
}

const InvalidBanner = () => (
  <div className="m-vehicle-properties-panel__invalid-banner">
    <span className="m-vehicle-properties-panel__invalid-banner-title">
      Invalid
    </span>
    - We cannot match this vehicle to a scheduled trip at this time. This
    vehicle may be off-route or severely off-schedule.
  </div>
)

const NotAvailable = () => (
  <span className="m-vehicle-properties-panel__not-available">
    Not available
  </span>
)

const directionsUrl = (
  latitude: number,
  longitude: number
) => `https://www.google.com/maps/dir/?api=1\
&destination=${latitude.toString()},${longitude.toString()}\
&travelmode=driving`

const useRouteVehicles = (
  routeId: RouteId | null,
  primaryVehicleId: VehicleId
): Vehicle[] => {
  // Get vehicles we've already fetched from the context.
  const vehiclesByRouteId = useContext(VehiclesByRouteIdContext)
  const existingVehiclesAndGhosts: VehicleOrGhost[] | undefined =
    routeId === null ? undefined : vehiclesByRouteId[routeId]
  // If we haven't already fetched this route, open a new channel.
  const { socket } = useContext(SocketContext)
  const newVehiclesAndGhosts: VehicleOrGhost[] | null = useVehiclesForRoute(
    socket,
    existingVehiclesAndGhosts === undefined ? routeId : null
  )
  return (existingVehiclesAndGhosts || newVehiclesAndGhosts || [])
    .filter(isVehicle)
    .filter((v) => v.id !== primaryVehicleId)
}

const Location = ({ vehicle }: { vehicle: Vehicle }) => {
  const routeVehicles: Vehicle[] = useRouteVehicles(vehicle.routeId, vehicle.id)
  const shapes: Shape[] = useTripShape(vehicle.tripId)
  const { isOffCourse, latitude, longitude, stopStatus } = vehicle
  const nearestIntersection: string | null = useNearestIntersection(
    latitude,
    longitude
  )

  return (
    <div className="m-vehicle-properties-panel__location">
      <div className="m-vehicle-properties-panel__label">Current Location</div>
      {nearestIntersection ? (
        <div className="m-vehicle-properties-panel__value">
          {nearestIntersection}
        </div>
      ) : null}
      <a
        className="m-vehicle-properties-panel__link"
        href={directionsUrl(latitude, longitude)}
        target="_blank"
      >
        Directions
      </a>
      <div className="m-vehicle-properties-panel__label">Next Stop</div>
      <div className="m-vehicle-properties-panel__value">
        {isOffCourse || vehicle.isShuttle ? (
          <NotAvailable />
        ) : (
          <>{stopStatus.stopName}</>
        )}
      </div>
      <div className="m-vehicle-properties-panel__map">
        <Map
          vehicles={[vehicle]}
          shapes={shapes}
          secondaryVehicles={routeVehicles}
        />
      </div>
    </div>
  )
}

const Discrepancy = ({
  dataDiscrepancy: { attribute, sources },
}: {
  dataDiscrepancy: DataDiscrepancy
}) => (
  <dl className="m-vehicle-properties-panel__data-discrepancy">
    <dt>{attribute}</dt>
    <dd>
      <ul>
        {sources.map(({ id, value }) => (
          <li key={`${attribute}-${id}`}>
            <span className="m-vehicle-properties-panel__data-discrepancy-source-id">
              {id}
            </span>
            <span className="m-vehicle-properties-panel__data-discrepancy-source-value">
              {value}
            </span>
          </li>
        ))}
      </ul>
    </dd>
  </dl>
)

const DataDiscrepancies = ({
  vehicle: { dataDiscrepancies },
}: {
  vehicle: Vehicle
}) => (
  <ul className="m-vehicle-properties-panel__data-discrepancies">
    {dataDiscrepancies.map((dataDiscrepancy) => (
      <li key={dataDiscrepancy.attribute}>
        <Discrepancy dataDiscrepancy={dataDiscrepancy} />
      </li>
    ))}
  </ul>
)

const inDebugMode = (): boolean =>
  !!new URL(document.location.href).searchParams.get("debug")

const shouldShowDataDiscrepancies = ({ dataDiscrepancies }: Vehicle): boolean =>
  inDebugMode() && dataDiscrepancies.length > 0

const StatusContent = ({ selectedVehicle }: { selectedVehicle: Vehicle }) => (
  <>
    {hasBlockWaiver(selectedVehicle) && (
      <BlockWaiverList blockWaivers={selectedVehicle.blockWaivers} />
    )}

    <PropertiesList vehicleOrGhost={selectedVehicle} />

    <CrowdingDiagram crowding={selectedVehicle.crowding} />

    <Location vehicle={selectedVehicle} />

    {shouldShowDataDiscrepancies(selectedVehicle) && (
      <DataDiscrepancies vehicle={selectedVehicle} />
    )}
  </>
)

const VehiclePropertiesPanel = ({ selectedVehicle, route }: Props) => {
  const [tabMode, setTabMode] = useState<TabMode>("status")

  return (
    <div className="m-vehicle-properties-panel">
      <Header
        vehicle={selectedVehicle}
        route={route}
        tabMode={tabMode}
        setTabMode={setTabMode}
      />

      {selectedVehicle.isOffCourse && <InvalidBanner />}

      {
        /* istanbul ignore next */
        shouldShowHeadwayDiagram(selectedVehicle) && (
          <HeadwayDiagram vehicle={selectedVehicle} />
        )
      }

      {selectedVehicle.isShuttle ? (
        <StatusContent selectedVehicle={selectedVehicle} />
      ) : (
        <TabPanels
          vehicleOrGhost={selectedVehicle}
          statusContent={<StatusContent selectedVehicle={selectedVehicle} />}
          mode={tabMode}
        />
      )}
    </div>
  )
}

export default VehiclePropertiesPanel
