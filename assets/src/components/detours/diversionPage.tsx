import React, {
  ComponentProps,
  ComponentPropsWithoutRef,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react"
import { DrawDetourPanel } from "./drawDetourPanel"
import { DetourMap } from "./detourMap"
import { useDetour } from "../../hooks/useDetour"
import { Alert, Button, CloseButton, Modal } from "react-bootstrap"
import * as BsIcons from "../../helpers/bsIcons"
import { OriginalRoute } from "../../models/detour"
import { joinClasses } from "../../helpers/dom"
import { AsProp } from "react-bootstrap/esm/helpers"
import { DetourFinishedPanel } from "./detourFinishedPanel"
import { DetourRouteSelectionPanel } from "./detourRouteSelectionPanel"
import { Route, RoutePattern } from "../../schedule"
import RoutesContext from "../../contexts/routesContext"
import { Snapshot } from "xstate"
import inTestGroup, { TestGroups } from "../../userInTestGroup"
import { ActiveDetourPanel } from "./activeDetourPanel"
import { PastDetourPanel } from "./pastDetourPanel"
import userInTestGroup from "../../userInTestGroup"
import { ActivateDetour } from "./activateDetourModal"
import { DeactivateDetourModal } from "./deactivateDetourModal"

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

interface DiversionPageFunctions {
  onClose?: () => void
  onConfirmClose: () => void
  onCancelClose?: () => void
  showConfirmCloseModal: boolean
}

interface DiversionPageFromInput {
  originalRoute: OriginalRoute
}

interface DiversionPageFromSnapshot {
  /** A _validated_ snapshot from which to initialize {@linkcode createDetourMachine} with */
  snapshot: Snapshot<unknown>
}

export type DiversionPageStateProps =
  | DiversionPageFromInput
  | DiversionPageFromSnapshot

export type DiversionPageProps = DiversionPageStateProps &
  DiversionPageFunctions

export const DiversionPage = ({
  onClose,
  onConfirmClose,
  onCancelClose,
  showConfirmCloseModal,
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
  } = useDetour(
    "snapshot" in useDetourProps
      ? { snapshot: useDetourProps.snapshot }
      : { input: useDetourProps.originalRoute }
  )

  const [textArea, setTextArea] = useState("")

  const nearestIntersectionDirection = [
    { instruction: "From " + nearestIntersection },
  ]
  const extendedDirections = directions
    ? nearestIntersectionDirection.concat(directions)
    : undefined

  const { route, routePattern, routePatterns } = snapshot.context
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

  useEffect(() => {
    if (snapshot.matches({ "Detour Drawing": "Share Detour" })) {
      setTextArea(
        [
          `Detour ${routeName} ${routeDirection}`,
          routeOrigin,
          ,
          "Connection Points:",
          connectionPoints?.start?.name ?? "N/A",
          connectionPoints?.end?.name ?? "N/A",
          ,
          `Missed Stops (${missedStops?.length}):`,
          ...(missedStops?.map(({ name }) => name) ?? ["no stops"]),
          ,
          "Turn-by-Turn Directions:",
          ...(extendedDirections?.map((v) => v.instruction) ?? []),
        ].join("\n")
      )
    }
  }, [
    snapshot,
    routeName,
    routeDirection,
    routeOrigin,
    extendedDirections,
    missedStops,
    connectionPoints?.start?.name,
    connectionPoints?.end?.name,
  ])

  const routes = useContext(RoutesContext)

  return (
    <>
      <article className="l-diversion-page h-100 border-box inherit-box">
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
          {snapshot.matches({ "Detour Drawing": "Pick Route Pattern" }) ? (
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
          ) : snapshot.matches({ "Detour Drawing": "Editing" }) &&
            routePattern ? (
            <DrawDetourPanel
              directions={extendedDirections}
              missedStops={missedStops}
              routeName={routeName ?? "??"}
              routeDescription={routeDescription ?? "??"}
              routeOrigin={routeOrigin ?? "??"}
              routeDirection={routeDirection ?? "??"}
              detourFinished={reviewDetour !== undefined}
              onReviewDetour={reviewDetour}
              onChangeRoute={() => send({ type: "detour.route-pattern.open" })}
            />
          ) : snapshot.matches({ "Detour Drawing": "Share Detour" }) &&
            editDetour ? (
            <DetourFinishedPanel
              onNavigateBack={editDetour}
              detourText={textArea}
              onChangeDetourText={setTextArea}
              onActivateDetour={
                inTestGroup(TestGroups.DetoursList)
                  ? () => {
                      send({ type: "detour.share.open-activate-modal" })
                    }
                  : undefined
              }
            >
              {snapshot.matches({
                "Detour Drawing": {
                  "Share Detour": "Activating",
                },
              }) ? (
                <ActivateDetour.Modal
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
            </DetourFinishedPanel>
          ) : snapshot.matches({ "Detour Drawing": "Active" }) ? (
            <ActiveDetourPanel
              directions={extendedDirections}
              connectionPoints={[
                connectionPoints?.start?.name ?? "N/A",
                connectionPoints?.end?.name ?? "N/A",
              ]}
              missedStops={missedStops}
              routeName={routeName ?? "??"}
              routeDescription={routeDescription ?? "??"}
              routeOrigin={routeOrigin ?? "??"}
              routeDirection={routeDirection ?? "??"}
              onNavigateBack={onConfirmClose}
              onOpenDeactivateModal={
                userInTestGroup(TestGroups.DetoursPilot)
                  ? () => {
                      send({ type: "detour.active.open-deactivate-modal" })
                    }
                  : undefined
              }
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
                />
              ) : null}
            </ActiveDetourPanel>
          ) : snapshot.matches({ "Detour Drawing": "Past" }) ? (
            <PastDetourPanel />
          ) : null}
        </div>
        <div className="l-diversion-page__map position-relative">
          {snapshot.matches({ "Detour Drawing": "Share Detour" }) && (
            <Alert
              variant="info"
              className="position-absolute top-0 left-0 m-2 icon-link z-1"
            >
              <BsIcons.ExclamationCircleFill />
              Detour shape is not editable from this screen.
            </Alert>
          )}
          {routingError?.type === "no_route" && (
            <RoutingErrorAlert>
              You can&apos;t route to this location. Please try a different
              point.
            </RoutingErrorAlert>
          )}
          {routingError?.type === "unknown" && <RoutingErrorAlert />}
          <DetourMap
            originalShape={shape?.points ?? []}
            center={
              "originalRoute" in useDetourProps
                ? useDetourProps.originalRoute.center
                : undefined
            }
            zoom={
              "originalRoute" in useDetourProps
                ? useDetourProps.originalRoute.zoom
                : undefined
            }
            detourShape={detourShape}
            startPoint={startPoint ?? undefined}
            endPoint={endPoint ?? undefined}
            waypoints={waypoints}
            unfinishedRouteSegments={
              inTestGroup(TestGroups.BackwardsDetourPrevention)
                ? unfinishedRouteSegments
                : undefined
            }
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
      <Modal
        show={showConfirmCloseModal}
        onHide={onCancelClose}
        animation={false}
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-3 fw-medium">
            Are you sure you want to exit detour mode?
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="lh-base mt-0 mb-3">
            When you close out of this screen, you will not be able to access
            the details of your detour again. You may want to copy and paste
            these details to another application.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onConfirmClose} variant="primary">
            Yes, I&apos;m sure
          </Button>
          <Button onClick={onCancelClose} variant="outline-primary">
            Back to Detour
          </Button>
        </Modal.Footer>
      </Modal>
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

// If we just use the `dismissible` prop, the close button is
// positioned absolutely in a way that looks weird, so we need to wrap
// the Alert in our own show state logic.
const RoutingErrorAlert = ({
  children,
}: PropsWithChildren): React.ReactElement => {
  const [show, setShow] = useState<boolean>(true)

  return (
    <Alert
      variant="ui-alert"
      className="position-absolute top-0 left-0 mt-3 start-50 translate-middle-x icon-link z-1"
      show={show}
    >
      <BsIcons.ExclamationTriangleFill />
      {children ?? "Something went wrong. Please try again."}
      <CloseButton onClick={() => setShow(false)} />
    </Alert>
  )
}

DiversionPagePanel.Header = DiversionPagePanelHeader

DiversionPagePanelBody.ScrollArea = DiversionPagePanelScrollArea
DiversionPagePanelBody.Footer = DiversionPagePanelFooter

DiversionPagePanel.Body = DiversionPagePanelBody

DiversionPage.Panel = DiversionPagePanel

export const Panel = DiversionPagePanel
