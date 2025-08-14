import React, { useContext } from "react"
import { SocketContext } from "../../contexts/socketContext"
import { VehiclesByRouteIdContext } from "../../contexts/vehiclesByRouteIdContext"
import { useNearestIntersectionFetchResult } from "../../hooks/useNearestIntersection"
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
import TabPanels from "./tabPanels"
import { fullStoryEvent } from "../../helpers/fullStory"
import { IndividualPropertiesPanelProps } from "../propertiesPanel"
import { DirectionsButton } from "../directionsButton"

type Props = {
  selectedVehicle: Vehicle
  openMapEnabled: boolean
} & IndividualPropertiesPanelProps

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

const Location = ({
  vehicle,
  openMapEnabled,
}: {
  vehicle: Vehicle
  openMapEnabled: boolean
}) => {
  const routeVehicles: VehicleInScheduledService[] = useRouteVehicles(
    vehicle.routeId,
    vehicle.id
  )
  const shapes: Shape[] = useTripShape(vehicle.tripId)
  const { isOffCourse, latitude, longitude, stopStatus } = vehicle

  const nearestIntersectionResult = useNearestIntersectionFetchResult(
    latitude,
    longitude
  )
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
        <DirectionsButton latitude={latitude} longitude={longitude} />
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
          openMapEnabled={openMapEnabled}
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

const StatusContent = ({
  selectedVehicle,
  openMapEnabled,
}: {
  selectedVehicle: Vehicle
  openMapEnabled: boolean
}) => (
  <>
    <div className="c-vehicle-properties-panel__notes">
      {selectedVehicle.isOffCourse && <InvalidBanner />}

      {hasBlockWaiver(selectedVehicle) && (
        <BlockWaiverList blockWaivers={selectedVehicle.blockWaivers} />
      )}
    </div>

    <PropertiesList properties={vehicleProperties(selectedVehicle)} />

    <CrowdingDiagram crowding={selectedVehicle.crowding} />

    <Location vehicle={selectedVehicle} openMapEnabled={openMapEnabled} />

    {shouldShowDataDiscrepancies(selectedVehicle) && (
      <DataDiscrepancies vehicle={selectedVehicle} />
    )}
  </>
)

const VehiclePropertiesPanel = ({
  selectedVehicle,
  tabMode,
  onChangeTabMode,
  onClosePanel,
  openMapEnabled,
}: Props) => {
  return (
    <div className="c-vehicle-properties-panel">
      <Header
        vehicle={selectedVehicle}
        tabMode={tabMode}
        onChangeTabMode={(newTabMode) => {
          if (newTabMode !== tabMode) {
            fullStoryEvent("Switched tab in Vehicle Properties Panel", {
              tab_str: newTabMode,
            })
          }
          onChangeTabMode(newTabMode)
        }}
        onClosePanel={onClosePanel}
      />

      {isVehicleInScheduledService(selectedVehicle) ? (
        <TabPanels
          vehicleOrGhost={selectedVehicle}
          statusContent={
            <StatusContent
              selectedVehicle={selectedVehicle}
              openMapEnabled={openMapEnabled}
            />
          }
          mode={tabMode}
        />
      ) : (
        <StatusContent
          selectedVehicle={selectedVehicle}
          openMapEnabled={openMapEnabled}
        />
      )}
    </div>
  )
}

export default VehiclePropertiesPanel
