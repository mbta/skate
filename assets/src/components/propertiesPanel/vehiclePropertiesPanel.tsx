import React, { useContext, useState } from "react"
import { SocketContext } from "../../contexts/socketContext"
import { VehiclesByRouteIdContext } from "../../contexts/vehiclesByRouteIdContext"
import { useNearestIntersection } from "../../hooks/useNearestIntersection"
import { useTripShape } from "../../hooks/useShapes"
import useVehiclesForRoute from "../../hooks/useVehiclesForRoute"
import { hasBlockWaiver } from "../../models/blockWaiver"
import { isVehicle } from "../../models/vehicle"
import {
  DataDiscrepancy,
  Vehicle,
  VehicleId,
  VehicleOrGhost,
} from "../../realtime"
import { RouteId, Shape } from "../../schedule"
import { isOk } from "../../util/fetchResult"
import { Card, CardBody } from "../card"
import PropertiesList, { vehicleProperties } from "../propertiesList"
import BlockWaiverList from "./blockWaiverList"
import CrowdingDiagram from "./crowdingDiagram"
import Header from "./header"
import MiniMap from "./miniMap"
import TabPanels, { TabMode } from "./tabPanels"

interface Props {
  selectedVehicle: Vehicle
}

/* eslint-disable no-irregular-whitespace */
const InvalidBanner = () => (
  <Card
    additionalClass="m-vehicle-properties-panel__invalid-banner"
    style="lemon"
    title={<h3>Invalid Bus</h3>}
    noFocusOrHover={true}
  >
    <CardBody>
      We cannot match this vehicle to a scheduled trip at this time. This
      vehicle may be off-route or severely off-schedule.
    </CardBody>
  </Card>
)
/* eslint-enable no-irregular-whitespace */

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

  const nearestIntersectionResult = useNearestIntersection(latitude, longitude)
  const nearestIntersection = isOk(nearestIntersectionResult)
    ? nearestIntersectionResult.ok
    : null

  return (
    <div className="m-vehicle-properties-panel__location">
      <div className="m-vehicle-properties-panel__latlng">
        <div className="m-vehicle-properties-panel__label">
          Current Location
        </div>
        {nearestIntersection ? (
          <div className="m-vehicle-properties-panel__value">
            {nearestIntersection}
          </div>
        ) : null}
        <a
          className="m-vehicle-properties-panel__link"
          href={directionsUrl(latitude, longitude)}
          target="_blank"
          rel="noreferrer"
        >
          Directions
        </a>
      </div>
      <div className="m-vehicle-properties-panel__next-stop">
        <div className="m-vehicle-properties-panel__label">Next Stop</div>
        <div className="m-vehicle-properties-panel__value">
          {isOffCourse || vehicle.isShuttle ? (
            <NotAvailable />
          ) : (
            <>{stopStatus.stopName}</>
          )}
        </div>
      </div>
      <div className="m-vehicle-properties-panel__map">
        <MiniMap
          vehicle={vehicle}
          routeVehicles={routeVehicles}
          shapes={shapes}
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
          <li key={`${attribute}-${id}`} data-testid="data-discrepancy">
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

    <PropertiesList properties={vehicleProperties(selectedVehicle)} />

    <CrowdingDiagram crowding={selectedVehicle.crowding} />

    <Location vehicle={selectedVehicle} />

    {shouldShowDataDiscrepancies(selectedVehicle) && (
      <DataDiscrepancies vehicle={selectedVehicle} />
    )}
  </>
)

const VehiclePropertiesPanel = ({ selectedVehicle }: Props) => {
  const [tabMode, setTabMode] = useState<TabMode>("status")

  return (
    <div className="m-vehicle-properties-panel">
      <Header
        vehicle={selectedVehicle}
        tabMode={tabMode}
        setTabMode={setTabMode}
      />

      {selectedVehicle.isOffCourse && <InvalidBanner />}

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
