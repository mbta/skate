import React, { ReactElement, useContext, useState } from "react"
import { useRoutes } from "../contexts/routesContext"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { isVehicle } from "../models/vehicle"
import Loading from "./loading"
import { partition, flatten, uniq } from "../helpers/array"
import { ghostSwingIcon, upDownIcon, upRightIcon } from "../helpers/icon"
import { runIdToLabel } from "../helpers/vehicleLabel"
import useCurrentTime from "../hooks/useCurrentTime"
import useSwings from "../hooks/useSwings"
import useVehiclesForRunIds from "../hooks/useVehiclesForRunIds"
import useVehiclesForBlockIds from "../hooks/useVehiclesForBlockIds"
import { ByRunId, VehicleOrGhost } from "../realtime"
import { ByBlockId, ByRouteId, Route, Swing } from "../schedule"
import { closeSwingsView, selectVehicle } from "../state"
import { formattedScheduledTime, serviceDaySeconds } from "../util/dateTime"
import { tagManagerEvent } from "../helpers/googleTagManager"
import ViewHeader from "./viewHeader"

const SwingsView = (): ReactElement<HTMLElement> => {
  const [{ mobileMenuIsOpen }, dispatch] = useContext(StateDispatchContext)
  const currentTime = useCurrentTime()
  const swings = useSwings()

  const pastSwingSecs = 900

  const [activeSwings, pastSwings] = swings
    ? partition(
        swings.sort((swing1, swing2) => {
          return swing1.time - swing2.time
        }),
        (swing) => {
          return swing.time + pastSwingSecs > serviceDaySeconds(currentTime)
        }
      )
    : [[], []]

  const swingRunIds = uniq(
    flatten(activeSwings.map((swing) => [swing.fromRunId, swing.toRunId]))
  )

  const swingBlockIds = uniq(activeSwings.map((swing) => swing.blockId))

  const { socket } = useContext(SocketContext)
  const swingRunVehicles = useVehiclesForRunIds(socket, swingRunIds)

  const swingVehiclesByRunId = swingRunVehicles
    ? swingRunVehicles.reduce((map, vehicle) => {
        if (vehicle.runId) {
          return { ...map, [vehicle.runId]: vehicle }
        } else {
          return map
        }
      }, {})
    : {}

  const swingBlockVehicles = useVehiclesForBlockIds(socket, swingBlockIds)

  const swingVehiclesByBlockId = swingBlockVehicles
    ? swingBlockVehicles.reduce((map, vehicle) => {
        return { ...map, [vehicle.blockId]: vehicle }
      }, {})
    : {}

  const swingRouteIds = uniq(activeSwings.map((swing) => swing.fromRouteId))
  const swingRoutes = useRoutes(swingRouteIds)
  const swingRoutesById: ByRouteId<Route> = swingRoutes.reduce((map, route) => {
    return { ...map, [route.id]: route }
  }, {})

  const hideMe = () => dispatch(closeSwingsView())

  const mobileMenuClass = mobileMenuIsOpen ? "blurred-mobile" : ""

  return (
    <div id="m-swings-view" className={`m-swings-view ${mobileMenuClass}`}>
      <ViewHeader title="Swings" closeView={hideMe} />
      {swings ? (
        <SwingsTable
          pastSwings={pastSwings}
          activeSwings={activeSwings}
          swingVehiclesByRunId={swingVehiclesByRunId}
          swingVehiclesByBlockId={swingVehiclesByBlockId}
          swingRoutesById={swingRoutesById}
        />
      ) : (
        <Loading />
      )}
    </div>
  )
}

const SwingsTable = ({
  pastSwings,
  activeSwings,
  swingVehiclesByRunId,
  swingVehiclesByBlockId,
  swingRoutesById,
}: {
  pastSwings: Swing[]
  activeSwings: Swing[]
  swingVehiclesByRunId: ByRunId<VehicleOrGhost>
  swingVehiclesByBlockId: ByBlockId<VehicleOrGhost>
  swingRoutesById: ByRouteId<Route>
}): ReactElement<HTMLElement> => {
  const [showPastSwings, setShowPastSwings] = useState<boolean>(false)

  return (
    <div className="m-swings-view__table-container">
      <table className="m-swings-view__table">
        <thead className="m-swings-view__table-header">
          <tr>
            <th className="m-swings-view__table-header-cell">
              <div>
                Swing On
                <div className="m-swings-view__table-header-cell-subheaders">
                  <div className="m-swings-view__table-header-cell-subheader">
                    Time
                  </div>
                </div>
              </div>
            </th>
            <th className="m-swings-view__table-header-cell m-swings-view__table-header-cell-swing-on">
              Swing On
              <div className="m-swings-view__table-header-cell-subheaders">
                <div className="m-swings-view__table-header-cell-subheader">
                  Run
                </div>
              </div>
            </th>
            <th className="m-swings-view__table-header-cell m-swings-view__table-header-cell-swing-off">
              Swing Off
              <div className="m-swings-view__table-header-cell-subheaders">
                <div className="m-swings-view__table-header-cell-subheader">
                  Run
                </div>
                <div className="m-swings-view__table-header-cell-route-subheader">
                  Route
                </div>
              </div>
            </th>
            <th className="m-swings-view__table-header-cell">Vehicle</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th
              className={
                "m-swings-view__show-past" +
                (showPastSwings
                  ? " m-swings-view__show-past-enabled"
                  : " m-swings-view__show-past-disabled")
              }
              colSpan={4}
              onClick={() => setShowPastSwings(!showPastSwings)}
            >
              {upDownIcon("m-swings-view__show-past-icon")}
              {`${showPastSwings ? "Hide" : "Show"} past swings`}
            </th>
          </tr>
          {showPastSwings
            ? pastSwings.map((swing, i, swings) => (
                <SwingRow
                  swing={swing}
                  isPast={true}
                  isLastPast={i === swings.length - 1}
                  swingVehiclesByRunId={swingVehiclesByRunId}
                  swingVehicleForBlockId={swingVehiclesByBlockId[swing.blockId]}
                  route={swingRoutesById[swing.fromRouteId]}
                  key={`${swing.fromRunId}-${swing.toRunId}`}
                />
              ))
            : null}
          {activeSwings.map((swing) => (
            <SwingRow
              swing={swing}
              isPast={false}
              swingVehiclesByRunId={swingVehiclesByRunId}
              swingVehicleForBlockId={swingVehiclesByBlockId[swing.blockId]}
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
  isPast,
  isLastPast,
  swingVehiclesByRunId,
  swingVehicleForBlockId,
  route,
}: {
  swing: Swing
  isPast: boolean
  isLastPast?: boolean
  swingVehiclesByRunId: ByRunId<VehicleOrGhost>
  swingVehicleForBlockId: VehicleOrGhost
  route: Route | null
}): ReactElement<HTMLElement> => {
  const swingOffVehicleOrGhost = swingVehiclesByRunId[swing.fromRunId]
  const swingOnVehicleOrGhost = swingVehiclesByRunId[swing.toRunId]
  const vehicleOrGhost = swingOffVehicleOrGhost || swingOnVehicleOrGhost

  return (
    <tr
      className={
        (vehicleOrGhost && !isPast
          ? "m-swings-view__table-row-active"
          : "m-swings-view__table-row-inactive") +
        (isLastPast ? " m-swings-view__table-row-last-past" : "")
      }
    >
      <th className="m-swings-view__table-cell">
        <div className="m-swings-view__table-cell-contents">
          {formattedScheduledTime(
            swing.time,
            vehicleOrGhost && isVehicle(vehicleOrGhost)
              ? vehicleOrGhost.overloadOffset
              : undefined
          )}
        </div>
      </th>
      <th className="m-swings-view__table-cell">
        <div className="m-swings-view__table-cell-contents">
          <SwingCellContent
            vehicleOrGhost={swingOnVehicleOrGhost}
            runId={swing.toRunId}
            tagManagerEventText="clicked_swing_on"
          />
        </div>
      </th>
      <th className="m-swings-view__table-cell">
        <div className="m-swings-view__table-cell-contents">
          <SwingCellContent
            vehicleOrGhost={swingOffVehicleOrGhost}
            runId={swing.fromRunId}
            tagManagerEventText="clicked_swing_off"
          />
          <div className="m-swings-view__route-pill">
            <div className="m-swings-view__route">
              {route ? route.name : swing.fromRouteId}
            </div>
          </div>
        </div>
      </th>
      <th className="m-swings-view__table-cell">
        <div className="m-swings-view__table-cell-contents">
          {swingVehicleForBlockId && isVehicle(swingVehicleForBlockId)
            ? swingVehicleForBlockId.label
            : null}
        </div>
      </th>
    </tr>
  )
}

const SwingCellContent = ({
  vehicleOrGhost,
  runId,
  tagManagerEventText,
}: {
  vehicleOrGhost?: VehicleOrGhost
  runId: string
  tagManagerEventText: string
}): ReactElement<HTMLElement> => {
  const [, dispatch] = useContext(StateDispatchContext)

  return (
    <>
      {vehicleOrGhost ? (
        <>
          {isVehicle(vehicleOrGhost)
            ? upRightIcon(
                "m-swings-view__run-icon m-swings-view__run-icon-arrow"
              )
            : ghostSwingIcon(
                "m-swings-view__run-icon m-swings-view__run-icon-ghost"
              )}

          <button
            onClick={() => {
              tagManagerEvent(tagManagerEventText)
              dispatch(selectVehicle(vehicleOrGhost))
            }}
          >
            {runIdToLabel(runId)}
          </button>
        </>
      ) : (
        runIdToLabel(runId)
      )}
    </>
  )
}

export default SwingsView
