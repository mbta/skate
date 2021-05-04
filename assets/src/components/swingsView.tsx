import React, { ReactElement, useContext } from "react"
import { useRoutes } from "../contexts/routesContext"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { isVehicle } from "../models/vehicle"
import Loading from "./loading"
import CloseButton from "./closeButton"
import { flatten, uniq } from "../helpers/array"
import { ghostIcon, upRightIcon } from "../helpers/icon"
import { runIdToLabel } from "../helpers/vehicleLabel"
import useCurrentTime from "../hooks/useCurrentTime"
import useSwings from "../hooks/useSwings"
import useVehiclesForRunIds from "../hooks/useVehiclesForRunIds"
import { ByRunId, VehicleOrGhost } from "../realtime"
import { ByRouteId, Route, Swing } from "../schedule"
import { selectVehicle, toggleSwingsView } from "../state"
import { formattedScheduledTime, serviceDaySeconds } from "../util/dateTime"

const SwingsView = (): ReactElement<HTMLElement> => {
  const [, dispatch] = useContext(StateDispatchContext)
  const currentTime = useCurrentTime()
  const swings = useSwings()

  const activeSwings = swings
    ? swings.filter((swing) => {
        return swing.time + 600 > serviceDaySeconds(currentTime)
      })
    : []

  const swingRunIds = uniq(
    flatten(activeSwings.map((swing) => [swing.fromRunId, swing.toRunId]))
  )

  const { socket } = useContext(SocketContext)
  const swingVehicles = useVehiclesForRunIds(socket, swingRunIds)

  const swingVehiclesByRunId = swingVehicles
    ? swingVehicles.reduce((map, vehicle) => {
        if (vehicle.runId) {
          return { ...map, [vehicle.runId]: vehicle }
        } else {
          return map
        }
      }, {})
    : {}

  const swingRouteIds = uniq(activeSwings.map((swing) => swing.fromRouteId))
  const swingRoutes = useRoutes(swingRouteIds)
  const swingRoutesById: ByRouteId<Route> = swingRoutes.reduce((map, route) => {
    return { ...map, [route.id]: route }
  }, {})

  const hideMe = () => dispatch(toggleSwingsView())

  return (
    <div id="m-swings-view" className="m-swings-view">
      <CloseButton onClick={hideMe} />
      <div className="m-swings-view__header">Swings view</div>
      <div className="m-swings-view__description">
        Upcoming swings on your selected routes
      </div>
      {swings ? (
        <SwingsTable
          swings={activeSwings}
          swingVehiclesByRunId={swingVehiclesByRunId}
          swingRoutesById={swingRoutesById}
        />
      ) : (
        <Loading />
      )}
    </div>
  )
}

const SwingsTable = ({
  swings,
  swingVehiclesByRunId,
  swingRoutesById,
}: {
  swings: Swing[]
  swingVehiclesByRunId: ByRunId<VehicleOrGhost>
  swingRoutesById: ByRouteId<Route>
}): ReactElement<HTMLElement> => {
  const sortedSwings = swings.sort((swing1, swing2) => {
    return swing1.time - swing2.time
  })

  return (
    <div className="m-swings-view__table-container">
      <table className="m-swings-view__table">
        <thead className="m-swings-view__table-header">
          <tr>
            <th className="m-swings-view__table-header-cell">Swing On Time</th>
            <th className="m-swings-view__table-header-cell">
              Swing On<div className="run-subheader">Run</div>
            </th>
            <th className="m-swings-view__table-header-cell swing-off">
              Swing Off<div className="run-subheader">Run</div>
              <div className="route-subheader">Route</div>
            </th>
            <th className="m-swings-view__table-header-cell">Vehicle No.</th>
          </tr>
        </thead>
        <tbody>
          {sortedSwings.map((swing) => (
            <SwingRow
              swing={swing}
              vehicleOrGhost={
                swingVehiclesByRunId[swing.fromRunId] ||
                swingVehiclesByRunId[swing.toRunId]
              }
              route={swingRoutesById[swing.fromRouteId]}
              key={`${swing.fromRunId}-${swing.toRunId}`}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

const SwingRow = ({
  swing,
  vehicleOrGhost,
  route,
}: {
  swing: Swing
  vehicleOrGhost: VehicleOrGhost | null
  route: Route | null
}): ReactElement<HTMLElement> => {
  const [, dispatch] = useContext(StateDispatchContext)

  return (
    <tr
      className={
        vehicleOrGhost
          ? "m-swings-view__table-row-active"
          : "m-swings-view__table-row-inactive"
      }
    >
      <th className="m-swings-view__table-cell">
        {formattedScheduledTime(swing.time)}
      </th>
      <th className="m-swings-view__table-cell">
        {runIdToLabel(swing.toRunId)}
      </th>
      <th className="m-swings-view__table-cell swing-off">
        {vehicleOrGhost ? (
          <>
            {isVehicle(vehicleOrGhost)
              ? upRightIcon("m-swings-view__run_icon")
              : ghostIcon("m-swings-view__run_icon")}

            <a
              onClick={() => {
                if (window.FS) {
                  window.FS.event("Clicked on run from swings view")
                }
                dispatch(selectVehicle(vehicleOrGhost.id))
              }}
            >
              {runIdToLabel(swing.fromRunId)}
            </a>
          </>
        ) : (
          runIdToLabel(swing.fromRunId)
        )}
        <div className="m-swings-view__route">
          {route ? route.name : swing.fromRouteId}
        </div>
      </th>
      <th className="m-swings-view__table-cell">
        {vehicleOrGhost && isVehicle(vehicleOrGhost)
          ? vehicleOrGhost.label
          : null}
      </th>
    </tr>
  )
}

export default SwingsView
