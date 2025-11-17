import React, {
  ComponentProps,
  ComponentPropsWithoutRef,
  PropsWithChildren,
  useCallback,
  useContext,
} from "react"
import { DrawDetourPanel } from "./detourPanels/drawDetourPanel"
import { DetourMap } from "./detourMap"
import { useDetour } from "../../hooks/useDetour"
import { CloseButton } from "react-bootstrap"
import { OriginalRoute } from "../../models/detour"
import { joinClasses } from "../../helpers/dom"
import { AsProp } from "react-bootstrap/esm/helpers"
import { DetourFinishedPanel } from "./detourPanels/detourFinishedPanel"
import { DetourRouteSelectionPanel } from "./detourPanels/detourRouteSelectionPanel"
import { Route, RoutePattern } from "../../schedule"
import RoutesContext from "../../contexts/routesContext"
import { Snapshot } from "xstate"
import inTestGroup, { TestGroups } from "../../userInTestGroup"
import { ActiveDetourPanel } from "./detourPanels/activeDetourPanel"
import { PastDetourPanel } from "./detourPanels/pastDetourPanel"
import userInTestGroup from "../../userInTestGroup"
import { useCurrentTimeSeconds } from "../../hooks/useCurrentTime"
import { timeAgoLabel } from "../../util/dateTime"
import { DetourStatus, timestampLabelFromStatus } from "../detoursTable"
import { ActivateDetour } from "./activateDetourModal"
import { DeactivateDetourModal } from "./deactivateDetourModal"
import { DeleteDetourModal } from "./deleteDetourModal"
import DetourDrawingAlert from "./alerts/detourDrawingAlert"
import RoutingErrorAlert from "./alerts/routingErrorAlert"
import useScreenSize from "../../hooks/useScreenSize"
import { Drawer } from "../drawer"
import { isMobile } from "../../util/screenSize"
import { AffectedRoute } from "./detourPanelComponents"
import { ChangeDuration } from "./changeDurationModal"
import { deleteDetour, copyToDraftDetour } from "../../api"
import { isOk } from "../../util/result"
import CopiedDetourToast from "./alerts/copiedDetourToast"
import { fullStoryEvent } from "../../helpers/fullStory"
import { useMapZoomAndCenter } from "../../hooks/useMapZoomAndCenter"
import { LatLngLiteral } from "leaflet"
import { useNavigate } from "react-router-dom"

const displayFieldsFromRouteAndPattern = (
  route: Route,
  routePattern: RoutePattern
) => {
  const routeName = route.name

  const routeDescription = routePattern.headsign ?? ""

  const routeOrigin = routePattern?.name

  const routeDirection =
    routePattern && route.directionNames[routePattern.directionId]

  const shape = routePattern.shape

  return { routeName, routeDirection, routeOrigin, routeDescription, shape }
}

const parseIntoDirectionsList = (directions: string) => {
  return directions.split("\n").map((direction) => ({ instruction: direction }))
}

interface DiversionPageFunctions {
  onClose: () => void
  onOpenDetour?: (detourId: number, props?: { fromCopy: boolean }) => void
  showFromCopy?: boolean
}

interface DiversionPageFromInput {
  originalRoute: OriginalRoute
}

interface DiversionPageFromSnapshot {
  /** A _validated_ snapshot from which to initialize {@linkcode createDetourMachine} with */
  snapshot: Snapshot<unknown>
  author: string
  updatedAt: number
}

export type DiversionPageStateProps =
  | DiversionPageFromInput
  | DiversionPageFromSnapshot

export type DiversionPageProps = DiversionPageStateProps &
  DiversionPageFunctions

export const DiversionPage = ({
  onClose,
  onOpenDetour,
  showFromCopy,
  ...useDetourProps
}: DiversionPageProps) => {
  const {
    snapshot,
    send,

    addConnectionPoint,
    addWaypoint,

    startPoint,
    endPoint,
    waypoints,

    detourShape,
    directions,
    routingError,
    nearestIntersection,

    unfinishedRouteSegments,

    stops,
    missedStops,
    routeSegments,
    connectionPoints,

    canUndo,
    undo,
    clear,
    reviewDetour,
    editDetour,

    selectedDuration,
    selectedReason,

    editedSelectedDuration,
  } = useDetour(useDetourProps)
  const navigate = useNavigate()

  const deleteDetourCallback = useCallback(() => {
    if (snapshot.context.uuid) {
      deleteDetour(snapshot.context.uuid).then(() => {
        onClose()
        return send({ type: "detour.delete.delete-modal.delete-draft" })
      })
    }
  }, [onClose, send, snapshot.context.uuid])

  const copyToDraftDetourCallback = useCallback(() => {
    fullStoryEvent("Copy Past Detour to Draft", {})
    if (snapshot.context.uuid) {
      copyToDraftDetour(snapshot.context.uuid).then((response) => {
        if (response && isOk(response)) {
          onClose()
          navigate(`/detours/${response.ok}?fromCopy=true`)
        }
      })
    }
  }, [onClose, onOpenDetour, navigate, snapshot.context.uuid])

  const nearestIntersectionDirection = [
    { instruction: "From " + nearestIntersection },
  ]
  const extendedDirections = directions
    ? nearestIntersectionDirection.concat(directions)
    : undefined

  const { route, routePattern, routePatterns, editedDirections } =
    snapshot.context
  const routePatternsById = Object.fromEntries(
    routePatterns?.map((rp) => [rp.id, rp]) ?? []
  )

  const {
    routeName = undefined,
    routeDirection = undefined,
    routeOrigin = undefined,
    routeDescription = undefined,
    shape = undefined,
  } = route && routePattern
    ? displayFieldsFromRouteAndPattern(route, routePattern)
    : {}

  const copyableDetourText = [
    `Detour ${routeName} ${routeDirection}`,
    routeOrigin,
    ,
    "Turn-by-Turn Directions:",
    ...(editedDirections
      ? [editedDirections]
      : extendedDirections?.map((v) => v.instruction) ?? []),
    ,
    "Connection Points:",
    connectionPoints?.start?.name ?? "N/A",
    connectionPoints?.end?.name ?? "N/A",
    ,
    `Missed Stops (${missedStops?.length}):`,
    ...(missedStops?.map(({ name }) => name) ?? ["no stops"]),
  ].join("\n")

  const routes = useContext(RoutesContext)
  const epochNowInSeconds = useCurrentTimeSeconds()

  const detourStatus = (() => {
    if (snapshot.matches({ "Detour Drawing": "Active" })) {
      return DetourStatus.Active
    } else if (snapshot.matches({ "Detour Drawing": "Past" })) {
      return DetourStatus.Closed
    } else {
      return DetourStatus.Draft
    }
  })()

  const { mapZoom, mapCenter } = useMapZoomAndCenter(
    routeDirection ?? "",
    routeName ?? "",
    shape,
    useDetourProps as { originalRoute: { center: LatLngLiteral; zoom: number } }
  )

  const detourPanel: ({
    deleteDetourCallback,
    copyToDraftDetourCallback,
  }: {
    deleteDetourCallback: () => void
    copyToDraftDetourCallback: () => void
  }) => React.JSX.Element = () => {
    const onDeleteDetour =
      inTestGroup(TestGroups.DeleteDraftDetours) && snapshot.context.uuid
        ? () => send({ type: "detour.delete.open-delete-modal" })
        : undefined

    if (snapshot.matches({ "Detour Drawing": "Pick Route Pattern" })) {
      return (
        <DetourRouteSelectionPanel
          isLoadingRoutePatterns={snapshot.matches({
            "Detour Drawing": {
              "Pick Route Pattern": { "Pick Route ID": "Loading" },
            },
          })}
          isRouteInvalid={snapshot.matches({
            "Detour Drawing": {
              "Pick Route Pattern": {
                "Pick Route ID": "Error: No Route",
              },
            },
          })}
          allRoutes={routes ?? []}
          selectedRouteInfo={
            route && routePatterns && routePatternsById
              ? {
                  routePatterns: routePatternsById,
                  selectedRoute: route,
                  selectedRoutePatternId: routePattern?.id ?? null,
                }
              : {
                  selectedRoute: route ?? null,
                }
          }
          onSelectRoute={(route) => {
            if (route) {
              send({
                type: "detour.route-pattern.select-route",
                route,
              })
            } else {
              send({
                type: "detour.route-pattern.delete-route",
              })
            }
          }}
          onSelectRoutePattern={(routePattern) => {
            routePattern &&
              send({
                type: "detour.route-pattern.select-pattern",
                routePattern,
              })
          }}
          onConfirm={() => send({ type: "detour.route-pattern.done" })}
        />
      )
    } else if (
      snapshot.matches({ "Detour Drawing": "Editing" }) &&
      routePattern
    ) {
      return (
        <DrawDetourPanel
          directions={extendedDirections}
          connectionPoints={
            connectionPoints && [
              connectionPoints?.start?.name ?? "N/A",
              connectionPoints?.end?.name ?? "N/A",
            ]
          }
          missedStops={missedStops}
          routeName={routeName ?? "??"}
          routeDescription={routeDescription ?? "??"}
          routeOrigin={routeOrigin ?? "??"}
          routeDirection={routeDirection ?? "??"}
          detourFinished={reviewDetour !== undefined}
          onReviewDetour={reviewDetour}
          onChangeRoute={() => send({ type: "detour.route-pattern.open" })}
          onDeleteDetour={onDeleteDetour}
        >
          {snapshot.matches({
            "Detour Drawing": {
              Editing: "Deleting",
            },
          }) ? (
            <DeleteDetourModal
              onDelete={deleteDetourCallback}
              onCancel={() =>
                send({ type: "detour.delete.delete-modal.cancel" })
              }
              affectedRoute={
                <AffectedRoute
                  routeName={routeName ?? "??"}
                  routeDescription={routeDescription ?? "??"}
                  routeOrigin={routeOrigin ?? "??"}
                  routeDirection={routeDirection ?? "??"}
                />
              }
            />
          ) : null}
        </DrawDetourPanel>
      )
    } else if (
      snapshot.matches({ "Detour Drawing": "Share Detour" }) &&
      editDetour
    ) {
      return (
        <DetourFinishedPanel
          onNavigateBack={editDetour}
          copyableDetourText={copyableDetourText}
          // Include fallback if editedDirections was not initialized on an older detour
          editableDirections={
            editedDirections ||
            (extendedDirections?.map((v) => v.instruction).join("\n") ?? "")
          }
          connectionPoints={[
            connectionPoints?.start?.name ?? "N/A",
            connectionPoints?.end?.name ?? "N/A",
          ]}
          missedStops={missedStops}
          onChangeDetourText={(detourText: string) =>
            send({ type: "detour.share.edit-directions", detourText })
          }
          onActivateDetour={
            inTestGroup(TestGroups.DetoursList)
              ? () => {
                  send({ type: "detour.share.open-activate-modal" })
                }
              : undefined
          }
          onDeleteDetour={onDeleteDetour}
          affectedRoute={
            <AffectedRoute
              routeName={routeName ?? "??"}
              routeDescription={routeDescription ?? "??"}
              routeOrigin={routeOrigin ?? "??"}
              routeDirection={routeDirection ?? "??"}
            />
          }
        >
          {snapshot.matches({
            "Detour Drawing": {
              "Share Detour": "Activating",
            },
          }) ? (
            <ActivateDetour.Modal
              nextStepLabel={
                (snapshot.matches({
                  "Detour Drawing": {
                    "Share Detour": { Activating: "Selecting Duration" },
                  },
                }) &&
                  "Confirm Duration") ||
                (snapshot.matches({
                  "Detour Drawing": {
                    "Share Detour": { Activating: "Selecting Reason" },
                  },
                }) &&
                  "Confirm Reason") ||
                undefined
              }
              onCancel={() => {
                send({ type: "detour.share.activate-modal.cancel" })
              }}
              onBack={
                snapshot.can({ type: "detour.share.activate-modal.back" })
                  ? () => {
                      send({ type: "detour.share.activate-modal.back" })
                    }
                  : undefined
              }
              onNext={
                snapshot.can({ type: "detour.share.activate-modal.next" })
                  ? () => {
                      send({ type: "detour.share.activate-modal.next" })
                    }
                  : undefined
              }
              onActivate={
                snapshot.can({
                  type: "detour.share.activate-modal.activate",
                })
                  ? () => {
                      send({ type: "detour.share.activate-modal.activate" })
                    }
                  : undefined
              }
            >
              {snapshot.matches({
                "Detour Drawing": {
                  "Share Detour": { Activating: "Selecting Duration" },
                },
              }) ? (
                <ActivateDetour.SelectingDuration
                  onSelectDuration={(selectedDuration: string) => {
                    send({
                      type: "detour.share.activate-modal.select-duration",
                      duration: selectedDuration,
                    })
                  }}
                  selectedDuration={selectedDuration}
                />
              ) : snapshot.matches({
                  "Detour Drawing": {
                    "Share Detour": { Activating: "Selecting Reason" },
                  },
                }) ? (
                <ActivateDetour.SelectingReason
                  onSelectReason={(selectedReason: string) => {
                    send({
                      type: "detour.share.activate-modal.select-reason",
                      reason: selectedReason,
                    })
                  }}
                  selectedReason={selectedReason}
                />
              ) : snapshot.matches({
                  "Detour Drawing": {
                    "Share Detour": { Activating: "Confirming" },
                  },
                }) ? (
                <ActivateDetour.Confirming />
              ) : null}
            </ActivateDetour.Modal>
          ) : null}

          {snapshot.matches({
            "Detour Drawing": {
              "Share Detour": "Deleting",
            },
          }) ? (
            <DeleteDetourModal
              onDelete={deleteDetourCallback}
              onCancel={() =>
                send({ type: "detour.delete.delete-modal.cancel" })
              }
              affectedRoute={
                <AffectedRoute
                  routeName={routeName ?? "??"}
                  routeDescription={routeDescription ?? "??"}
                  routeOrigin={routeOrigin ?? "??"}
                  routeDirection={routeDirection ?? "??"}
                />
              }
            />
          ) : null}
        </DetourFinishedPanel>
      )
    } else if (
      snapshot.matches({ "Detour Drawing": "Active" }) &&
      snapshot.context.activatedAt &&
      snapshot.context.selectedDuration !== undefined &&
      snapshot.context.selectedReason !== undefined
    ) {
      return (
        <ActiveDetourPanel
          copyableDetourText={copyableDetourText}
          directions={
            editedDirections
              ? parseIntoDirectionsList(editedDirections)
              : // Include fallback if editedDirections was not initialized on an older detour
                extendedDirections
          }
          connectionPoints={[
            connectionPoints?.start?.name ?? "N/A",
            connectionPoints?.end?.name ?? "N/A",
          ]}
          missedStops={missedStops}
          routeName={routeName ?? "??"}
          routeDescription={routeDescription ?? "??"}
          routeOrigin={routeOrigin ?? "??"}
          routeDirection={routeDirection ?? "??"}
          onNavigateBack={onClose}
          showIssueButton={userInTestGroup(TestGroups.DetoursPilot)}
          onOpenDeactivateModal={
            userInTestGroup(TestGroups.DetoursPilot)
              ? () => {
                  send({ type: "detour.active.open-deactivate-modal" })
                }
              : undefined
          }
          onOpenChangeDurationModal={
            userInTestGroup(TestGroups.DetoursPilot)
              ? () => {
                  send({ type: "detour.active.open-change-duration-modal" })
                }
              : undefined
          }
          activatedAt={snapshot.context.activatedAt}
          detourDuration={snapshot.context.selectedDuration}
          detourReason={snapshot.context.selectedReason}
        >
          {snapshot.matches({
            "Detour Drawing": { Active: "Deactivating" },
          }) ? (
            <DeactivateDetourModal
              onDeactivate={() =>
                send({ type: "detour.active.deactivate-modal.deactivate" })
              }
              onCancel={() =>
                send({ type: "detour.active.deactivate-modal.cancel" })
              }
              routeName={routeName || "??"}
              routeDescription={routeDescription || "??"}
              routeOrigin={routeOrigin || "??"}
              routeDirection={routeDirection || "??"}
            />
          ) : null}
          {snapshot.matches({
            "Detour Drawing": { Active: "Changing Duration" },
          }) ? (
            <ChangeDuration.Modal
              onCancel={() =>
                send({ type: "detour.active.change-duration-modal.cancel" })
              }
              onNext={() =>
                send({ type: "detour.active.change-duration-modal.done" })
              }
              nextStepButton="Done"
              nextStepLabel="Confirm Duration"
              modalTitle="Change detour duration"
            >
              <ChangeDuration.Body
                onSelectDuration={(selectedDuration: string) => {
                  send({
                    type: "detour.active.change-duration-modal.select-duration",
                    duration: selectedDuration,
                  })
                }}
                selectedDuration={selectedDuration}
                editedSelectedDuration={editedSelectedDuration}
              />
            </ChangeDuration.Modal>
          ) : null}
        </ActiveDetourPanel>
      )
    } else if (snapshot.matches({ "Detour Drawing": "Past" })) {
      return (
        <PastDetourPanel
          copyableDetourText={copyableDetourText}
          directions={
            editedDirections
              ? parseIntoDirectionsList(editedDirections)
              : // Include fallback if editedDirections was not initialized on an older detour
                extendedDirections
          }
          connectionPoints={[
            connectionPoints?.start?.name ?? "N/A",
            connectionPoints?.end?.name ?? "N/A",
          ]}
          missedStops={missedStops}
          routeName={routeName ?? "??"}
          routeDescription={routeDescription ?? "??"}
          routeOrigin={routeOrigin ?? "??"}
          routeDirection={routeDirection ?? "??"}
          onNavigateBack={onClose}
          onCopyToDraftDetour={copyToDraftDetourCallback}
        />
      )
    } else {
      return <></>
    }
  }

  const displayType = useScreenSize()

  return (
    <>
      <article
        data-fs-element="Detours"
        className={`l-diversion-page l-diversion-page--${displayType} h-100 border-box inherit-box`}
      >
        <header
          className={joinClasses([
            "l-diversion-page__header",
            "border-bottom",
            snapshot.matches({ "Detour Drawing": "Active" }) &&
            userInTestGroup(TestGroups.DetoursPilot)
              ? "active-detour"
              : "text-bg-light",
          ])}
        >
          {"snapshot" in useDetourProps && !isMobile(displayType) ? (
            <>
              {detourStatus !== DetourStatus.Active && (
                <>
                  <span className="l-diversion-page__header-details">
                    <strong className="font-m-semi me-2">
                      {timestampLabelFromStatus(detourStatus)}
                    </strong>
                    {timeAgoLabel(epochNowInSeconds, useDetourProps.updatedAt)}
                  </span>
                </>
              )}
              <span className="l-diversion-page__header-details">
                <strong className="font-m-semi me-2">Created by</strong>
                {useDetourProps.author}
              </span>
            </>
          ) : isMobile(displayType) ? (
            <div className="flex-grow-1 fw-semibold text-center">Detours</div>
          ) : null}
          <CloseButton className="p-4" onClick={onClose} />
        </header>

        <div
          className={joinClasses([
            "l-diversion-page__panel",
            snapshot.matches({ "Detour Drawing": "Active" }) &&
            userInTestGroup(TestGroups.DetoursPilot)
              ? "active-detour"
              : "text-bg-light",
          ])}
        >
          {isMobile(displayType) ? (
            <Drawer.WithState startOpen>
              {detourPanel({ deleteDetourCallback, copyToDraftDetourCallback })}
            </Drawer.WithState>
          ) : (
            detourPanel({ deleteDetourCallback, copyToDraftDetourCallback })
          )}
        </div>
        <div className="l-diversion-page__map position-relative">
          {snapshot.matches({ "Detour Drawing": "Share Detour" }) && (
            <DetourDrawingAlert>
              Detour shape is not editable from this screen.
            </DetourDrawingAlert>
          )}
          {showFromCopy && <CopiedDetourToast />}
          {routingError?.type === "no_route" && (
            <RoutingErrorAlert>
              You can&apos;t route to this location. Please try a different
              point.
            </RoutingErrorAlert>
          )}
          {routingError?.type === "unknown" && <RoutingErrorAlert />}
          <DetourMap
            originalShape={shape?.points ?? []}
            center={mapCenter}
            zoom={mapZoom}
            detourShape={detourShape}
            startPoint={startPoint ?? undefined}
            endPoint={endPoint ?? undefined}
            waypoints={waypoints}
            unfinishedRouteSegments={unfinishedRouteSegments}
            routeSegments={routeSegments}
            onAddWaypoint={addWaypoint}
            onClickOriginalShape={addConnectionPoint ?? (() => {})}
            undoDisabled={canUndo === false}
            onUndo={undo ?? (() => {})}
            onClear={clear ?? (() => {})}
            stops={stops}
            editing={snapshot.matches({ "Detour Drawing": "Editing" })}
          />
        </div>
      </article>
    </>
  )
}

type AsProps<As extends React.ElementType> = ComponentProps<As> & AsProp<As>

const DiversionPagePanel = <As extends React.ElementType = "article">({
  children,
  as: As = "article",
  ...props
}: PropsWithChildren<AsProps<As>>) => (
  <As
    {...props}
    className={joinClasses([
      "l-diversion-page-panel",
      "border-end",
      props.className,
    ])}
  >
    {children}
  </As>
)

const DiversionPagePanelHeader = <As extends React.ElementType = "header">({
  children,
  as: As = "header",
  ...props
}: PropsWithChildren<AsProps<As>>) => (
  <As
    {...props}
    className={joinClasses([
      "l-diversion-page-panel__header",
      "border-bottom",
      "px-3",
      "d-inline-flex",
      "justify-content-between",
      "align-items-baseline",
      props.className,
    ])}
  >
    {children}
  </As>
)

const DiversionPagePanelBody = ({
  children,
  ...props
}: PropsWithChildren<ComponentPropsWithoutRef<"div">>) => (
  <div
    {...props}
    className={joinClasses([
      "l-diversion-page-panel__body",
      "bg-light",
      props.className,
    ])}
  >
    {children}
  </div>
)

const DiversionPagePanelScrollArea = ({
  children,
  ...props
}: PropsWithChildren<ComponentPropsWithoutRef<"div">>) => (
  <div
    {...props}
    className={joinClasses([
      "l-diversion-page-panel__scroll-area",
      "px-3",
      props.className,
    ])}
  >
    {children}
  </div>
)

const DiversionPagePanelFooter = ({
  children,
  className,
  ...props
}: PropsWithChildren<ComponentPropsWithoutRef<"div">>) => (
  <div
    {...props}
    className={joinClasses(["border-top", "d-flex", "mt-auto", className])}
  >
    {children}
  </div>
)

DiversionPagePanel.Header = DiversionPagePanelHeader

DiversionPagePanelBody.ScrollArea = DiversionPagePanelScrollArea
DiversionPagePanelBody.Footer = DiversionPagePanelFooter

DiversionPagePanel.Body = DiversionPagePanelBody

DiversionPage.Panel = DiversionPagePanel

export const Panel = DiversionPagePanel
