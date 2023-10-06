import React, { useContext, useState } from "react"
import { SocketContext } from "../../contexts/socketContext"
import { VehiclesByRouteIdContext } from "../../contexts/vehiclesByRouteIdContext"
import { useNearestIntersection } from "../../hooks/useNearestIntersection"
import { useTripShape } from "../../hooks/useShapes"
import useVehiclesForRoute from "../../hooks/useVehiclesForRoute"
import { hasBlockWaiver } from "../../models/blockWaiver"
import { isVehicleInScheduledService } from "../../models/vehicle"
import {
  DataDiscrepancy,
  VehicleInScheduledService,
  VehicleId,
  Vehicle,
  Ghost,
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
import { DiamondTurnRightIcon } from "../../helpers/icon"
import * as FullStory from "@fullstory/browser"

interface Props {
  selectedVehicle: Vehicle
  initialTab?: TabMode
}

const InvalidBanner = () => (
  <Card
    additionalClass="c-vehicle-properties-panel__invalid-banner"
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

const NotAvailable = () => (
  <span className="c-vehicle-properties-panel__not-available">
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
): VehicleInScheduledService[] => {
  // Get vehicles we've already fetched from the context.
  const vehiclesByRouteId = useContext(VehiclesByRouteIdContext)

  const existingVehiclesAndGhosts:
    | (VehicleInScheduledService | Ghost)[]
    | undefined = routeId === null ? undefined : vehiclesByRouteId[routeId]
  // If we haven't already fetched this route, open a new channel.
  const { socket } = useContext(SocketContext)
  const newVehiclesAndGhosts: (VehicleInScheduledService | Ghost)[] | null =
    useVehiclesForRoute(
      socket,
      existingVehiclesAndGhosts === undefined ? routeId : null
    )
  return (existingVehiclesAndGhosts || newVehiclesAndGhosts || [])
    .filter(isVehicleInScheduledService)
    .filter((v) => v.id !== primaryVehicleId)
}

const Location = ({ vehicle }: { vehicle: Vehicle }) => {
  const routeVehicles: VehicleInScheduledService[] = useRouteVehicles(
    vehicle.routeId,
    vehicle.id
  )
  const shapes: Shape[] = useTripShape(vehicle.tripId)
  const { isOffCourse, latitude, longitude, stopStatus } = vehicle

  const nearestIntersectionResult = useNearestIntersection(latitude, longitude)
  const nearestIntersection = isOk(nearestIntersectionResult)
    ? nearestIntersectionResult.ok
    : null

  return (
    <div className="c-vehicle-properties-panel__location">
      <div className="c-vehicle-properties-panel__latlng">
        <div className="c-vehicle-properties-panel__label">
          Current Location
        </div>
        {nearestIntersection ? (
          <div className="c-vehicle-properties-panel__value">
            {nearestIntersection}
          </div>
        ) : null}
        <a
          className="c-vehicle-properties-panel__directions button-small"
          href={directionsUrl(latitude, longitude)}
          target="_blank"
          rel="noreferrer"
        >
          <DiamondTurnRightIcon />
          Get directions to bus
        </a>
      </div>
      <div className="c-vehicle-properties-panel__next-stop">
        <div className="c-vehicle-properties-panel__label">Next Stop</div>
        <div className="c-vehicle-properties-panel__value">
          {isOffCourse || vehicle.isShuttle ? (
            <NotAvailable />
          ) : (
            <>{stopStatus.stopName}</>
          )}
        </div>
      </div>
      <div className="c-vehicle-properties-panel__map">
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
  <dl className="c-vehicle-properties-panel__data-discrepancy">
    <dt>{attribute}</dt>
    <dd>
      <ul>
        {sources.map(({ id, value }) => (
          <li key={`${attribute}-${id}`} data-testid="data-discrepancy">
            <span className="c-vehicle-properties-panel__data-discrepancy-source-id">
              {id}
            </span>
            <span className="c-vehicle-properties-panel__data-discrepancy-source-value">
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
  <ul className="c-vehicle-properties-panel__data-discrepancies">
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
    <div className="c-vehicle-properties-panel__notes">
      {selectedVehicle.isOffCourse && <InvalidBanner />}

      {hasBlockWaiver(selectedVehicle) && (
        <BlockWaiverList blockWaivers={selectedVehicle.blockWaivers} />
      )}
    </div>

    <PropertiesList properties={vehicleProperties(selectedVehicle)} />

    <CrowdingDiagram crowding={selectedVehicle.crowding} />

    <Location vehicle={selectedVehicle} />

    {shouldShowDataDiscrepancies(selectedVehicle) && (
      <DataDiscrepancies vehicle={selectedVehicle} />
    )}
  </>
)

const VehiclePropertiesPanel = ({
  selectedVehicle,
  initialTab = "status",
}: Props) => {
  const [tabMode, setTabMode] = useState<TabMode>(initialTab)

  return (
    <div className="c-vehicle-properties-panel">
      <Header
        vehicle={selectedVehicle}
        tabMode={tabMode}
        setTabMode={(newTabMode) => {
          if (newTabMode !== tabMode) {
            FullStory.event("Switched tab in Vehicle Properties Panel", {
              tab_str: newTabMode,
            })
          }
          setTabMode(newTabMode)
        }}
      />

      {isVehicleInScheduledService(selectedVehicle) ? (
        <TabPanels
          vehicleOrGhost={selectedVehicle}
          statusContent={<StatusContent selectedVehicle={selectedVehicle} />}
          mode={tabMode}
        />
      ) : (
        <StatusContent selectedVehicle={selectedVehicle} />
      )}
    </div>
  )
}

export default VehiclePropertiesPanel
