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
            <th className="m-swings-view__table-header-cell">
              Swing On <span className="swing-on-time">Time</span>
            </th>
            <th className="m-swings-view__table-header-cell">
              <span className="swing-on">Swing On </span>
              <div className="subheader">Run</div>
            </th>
            <th className="m-swings-view__table-header-cell swing-off">
              Swing Off<div className="subheader">Run</div>
              <div className="route-subheader">Route</div>
            </th>
            <th className="m-swings-view__table-header-cell">
              Vehicle <span className="vehicle-no">No.</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedSwings.map((swing) => (
            <SwingRow
              swing={swing}
              swingVehiclesByRunId={swingVehiclesByRunId}
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
  swingVehiclesByRunId,
  route,
}: {
  swing: Swing
  swingVehiclesByRunId: ByRunId<VehicleOrGhost>
  route: Route | null
}): ReactElement<HTMLElement> => {
  const swingOffVehicleOrGhost = swingVehiclesByRunId[swing.fromRunId]
  const swingOnVehicleOrGhost = swingVehiclesByRunId[swing.toRunId]
  const vehicleOrGhost = swingOffVehicleOrGhost || swingOnVehicleOrGhost

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
        <SwingCellContent
          vehicleOrGhost={swingOnVehicleOrGhost}
          runId={swing.toRunId}
          fsEventText={"Clicked on swing-on from swings view"}
        />
      </th>
      <th className="m-swings-view__table-cell swing-off">
        <SwingCellContent
          vehicleOrGhost={swingOffVehicleOrGhost}
          runId={swing.fromRunId}
          fsEventText={"Clicked on swing-off from swings view"}
        />
        <div className="m-swings-view__route-pill">
          <div className="m-swings-view__route">
            {route ? route.name : swing.fromRouteId}
          </div>
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

const SwingCellContent = ({
  vehicleOrGhost,
  runId,
  fsEventText,
}: {
  vehicleOrGhost?: VehicleOrGhost
  runId: string
  fsEventText: string
}): ReactElement<HTMLElement> => {
  const [, dispatch] = useContext(StateDispatchContext)

  return (
    <>
      {vehicleOrGhost ? (
        <>
          {isVehicle(vehicleOrGhost)
            ? upRightIcon("m-swings-view__run_icon arrow")
            : ghostIcon("m-swings-view__run_icon ghost")}

          <a
            onClick={() => {
              if (window.FS) {
                window.FS.event(fsEventText)
              }
              dispatch(selectVehicle(vehicleOrGhost.id))
            }}
          >
            {runIdToLabel(runId)}
          </a>
        </>
      ) : (
        runIdToLabel(runId)
      )}{" "}
    </>
  )
}

export default SwingsView
