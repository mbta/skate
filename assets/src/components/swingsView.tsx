import React, {
  ReactElement,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { useRoutes } from "../contexts/routesContext"
import { SocketContext } from "../contexts/socketContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { isVehicle } from "../models/vehicle"
import Loading from "./loading"
import { partition, flatten, uniq } from "../helpers/array"
import { GhostSwingIcon, UpDownIcon, UpRightIcon } from "../helpers/icon"
import { runIdToLabel } from "../helpers/vehicleLabel"
import useCurrentTime from "../hooks/useCurrentTime"
import useSwings from "../hooks/useSwings"
import useVehiclesForRunIds from "../hooks/useVehiclesForRunIds"
import useVehiclesForBlockIds from "../hooks/useVehiclesForBlockIds"
import { ByRunId, VehicleOrGhost } from "../realtime"
import { ByBlockId, ByRouteId, Route, Swing } from "../schedule"
import {
  closeView,
  rememberSwingsViewScrollPosition,
  selectVehicle,
  toggleShowHidePastSwings,
} from "../state"
import { formattedScheduledTime, serviceDaySeconds } from "../util/dateTime"
import { tagManagerEvent } from "../helpers/googleTagManager"
import ViewHeader from "./viewHeader"

const SwingsView = (): ReactElement<HTMLElement> => {
  const [
    { mobileMenuIsOpen, swingsViewScrollPosition, showPastSwings },
    dispatch,
  ] = useContext(StateDispatchContext)
  const currentTime = useCurrentTime()
  const swings = useSwings()
  const elementRef = useRef<HTMLDivElement | null>(null)
  const [isInitialRender, setIsInitialRender] = useState<boolean>(true)

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

  const hideMe = () => {
    // reset scrollTop to avoid race condition with useEffect cleanup
    if (elementRef.current) {
      elementRef.current.scrollTop = 0
    }

    dispatch(closeView())
  }

  const mobileMenuClass = mobileMenuIsOpen ? "blurred-mobile" : ""

  useLayoutEffect(() => {
    const element = elementRef.current

    // in addition to other criteria, wait until swings are populated so that the
    // element is tall enough to scroll
    if (isInitialRender && element && swings) {
      setIsInitialRender(false)

      element.scrollTop = swingsViewScrollPosition
    }

    return () => {
      if (element) {
        dispatch(rememberSwingsViewScrollPosition(element.scrollTop))
      }
    }
  }, [isInitialRender, swingsViewScrollPosition, dispatch, swings])

  return (
    <div
      id="c-swings-view"
      className={`c-swings-view ${mobileMenuClass}`}
      ref={elementRef}
    >
      <ViewHeader title="Swings" closeView={hideMe} />
      {swings ? (
        <SwingsTable
          pastSwings={pastSwings}
          activeSwings={activeSwings}
          swingVehiclesByRunId={swingVehiclesByRunId}
          swingVehiclesByBlockId={swingVehiclesByBlockId}
          swingRoutesById={swingRoutesById}
          showPastSwings={showPastSwings}
          toggleShowPastSwings={() => dispatch(toggleShowHidePastSwings())}
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
  showPastSwings,
  toggleShowPastSwings,
}: {
  pastSwings: Swing[]
  activeSwings: Swing[]
  swingVehiclesByRunId: ByRunId<VehicleOrGhost>
  swingVehiclesByBlockId: ByBlockId<VehicleOrGhost>
  swingRoutesById: ByRouteId<Route>
  showPastSwings: boolean
  toggleShowPastSwings: () => void
}): ReactElement<HTMLElement> => {
  return (
    <div className="c-swings-view__table-container">
      <table className="c-swings-view__table">
        <thead className="c-swings-view__table-header">
          <tr>
            <th className="c-swings-view__table-header-cell">
              <div>
                Swing On
                <div className="c-swings-view__table-header-cell-subheaders">
                  <div className="c-swings-view__table-header-cell-subheader">
                    Time
                  </div>
                </div>
              </div>
            </th>
            <th className="c-swings-view__table-header-cell c-swings-view__table-header-cell-swing-on">
              Swing On
              <div className="c-swings-view__table-header-cell-subheaders">
                <div className="c-swings-view__table-header-cell-subheader">
                  Run
                </div>
              </div>
            </th>
            <th className="c-swings-view__table-header-cell c-swings-view__table-header-cell-swing-off">
              Swing Off
              <div className="c-swings-view__table-header-cell-subheaders">
                <div className="c-swings-view__table-header-cell-subheader">
                  Run
                </div>
                <div className="c-swings-view__table-header-cell-route-subheader">
                  Route
                </div>
              </div>
            </th>
            <th className="c-swings-view__table-header-cell">Vehicle</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th
              className={
                "c-swings-view__show-past" +
                (showPastSwings
                  ? " c-swings-view__show-past-enabled"
                  : " c-swings-view__show-past-disabled")
              }
              colSpan={4}
              onClick={toggleShowPastSwings}
            >
              <UpDownIcon className="c-swings-view__show-past-icon" />
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
          ? "c-swings-view__table-row-active"
          : "c-swings-view__table-row-inactive") +
        (isLastPast ? " c-swings-view__table-row-last-past" : "")
      }
    >
      <th className="c-swings-view__table-cell">
        <div className="c-swings-view__table-cell-contents">
          {formattedScheduledTime(
            swing.time,
            vehicleOrGhost && isVehicle(vehicleOrGhost)
              ? vehicleOrGhost.overloadOffset
              : undefined
          )}
        </div>
      </th>
      <th className="c-swings-view__table-cell">
        <div className="c-swings-view__table-cell-contents">
          <SwingCellContent
            vehicleOrGhost={swingOnVehicleOrGhost}
            runId={swing.toRunId}
            onClick={() => {
              tagManagerEvent("clicked_swing_on")
              window.FS?.event('User clicked "Swing On" run button')
            }}
          />
        </div>
      </th>
      <th className="c-swings-view__table-cell">
        <div className="c-swings-view__table-cell-contents">
          <SwingCellContent
            vehicleOrGhost={swingOffVehicleOrGhost}
            runId={swing.fromRunId}
            onClick={() => {
              tagManagerEvent("clicked_swing_off")
              window.FS?.event('User clicked "Swing Off" run button')
            }}
          />
          <div className="c-swings-view__route-pill">
            <div className="c-swings-view__route">
              {route ? route.name : swing.fromRouteId}
            </div>
          </div>
        </div>
      </th>
      <th className="c-swings-view__table-cell">
        <div className="c-swings-view__table-cell-contents">
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
  onClick,
}: {
  vehicleOrGhost?: VehicleOrGhost
  runId: string
  onClick?: () => void
}): ReactElement<HTMLElement> => {
  const [, dispatch] = useContext(StateDispatchContext)

  return (
    <>
      {vehicleOrGhost ? (
        <>
          {isVehicle(vehicleOrGhost) ? (
            <UpRightIcon className="c-swings-view__run-icon c-swings-view__run-icon-arrow" />
          ) : (
            <GhostSwingIcon className="c-swings-view__run-icon c-swings-view__run-icon-ghost" />
          )}

          <button
            onClick={() => {
              onClick && onClick()
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
