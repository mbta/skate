import React, {
  ComponentProps,
  ComponentPropsWithoutRef,
  PropsWithChildren,
  useEffect,
  useState,
} from "react"
import { DiversionPanel } from "./diversionPanel"
import { DetourMap } from "./detourMap"
import { useDetour } from "../../hooks/useDetour"
import { Alert, Button, CloseButton, Modal } from "react-bootstrap"
import * as BsIcons from "../../helpers/bsIcons"
import { OriginalRoute } from "../../models/detour"
import { joinClasses } from "../../helpers/dom"
import { AsProp } from "react-bootstrap/esm/helpers"
import { DetourFinishedPanel } from "./detourFinishedPanel"
import { Route, RoutePattern } from "../../schedule"

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

interface DiversionPageProps {
  originalRoute: OriginalRoute
  onClose?: () => void
  onConfirmClose?: () => void
  onCancelClose?: () => void
  showConfirmCloseModal: boolean
}

export const DiversionPage = ({
  originalRoute,
  onClose,
  onConfirmClose,
  onCancelClose,
  showConfirmCloseModal,
}: DiversionPageProps) => {
  const {
    snapshot,

    addConnectionPoint,
    addWaypoint,

    startPoint,
    endPoint,
    waypoints,

    detourShape,
    directions,
    routingError,
    nearestIntersection,

    stops,
    missedStops,
    routeSegments,
    connectionPoints,

    canUndo,
    undo,
    clear,
    finishDetour,
    editDetour,
  } = useDetour(originalRoute)

  const [textArea, setTextArea] = useState("")

  const nearestIntersectionDirection = [
    { instruction: "From " + nearestIntersection },
  ]
  const extendedDirections = directions
    ? nearestIntersectionDirection.concat(directions)
    : undefined

  const { route, routePattern } = snapshot.context
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
  }, [
    routeName,
    routeDirection,
    routeOrigin,
    extendedDirections,
    missedStops,
    connectionPoints?.start?.name,
    connectionPoints?.end?.name,
  ])

  return (
    <>
      <article className="l-diversion-page h-100 border-box inherit-box">
        <header className="l-diversion-page__header text-bg-light border-bottom">
          <CloseButton className="p-4" onClick={onClose} />
        </header>

        <div className="l-diversion-page__panel bg-light">
          {snapshot.matches({ "Detour Drawing": "Editing" }) ? (
            <DiversionPanel
              directions={extendedDirections}
              missedStops={missedStops}
              routeName={routeName ?? "??"}
              routeDescription={routeDescription ?? "??"}
              routeOrigin={routeOrigin ?? "??"}
              routeDirection={routeDirection ?? "??"}
              detourFinished={finishDetour !== undefined}
              onFinishDetour={finishDetour}
            />
          ) : snapshot.matches({ "Detour Drawing": "Share Detour" }) &&
            editDetour ? (
            <DetourFinishedPanel
              onNavigateBack={editDetour}
              detourText={textArea}
              onChangeDetourText={setTextArea}
            />
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
            center={originalRoute.center}
            zoom={originalRoute.zoom}
            detourShape={detourShape}
            startPoint={startPoint ?? undefined}
            endPoint={endPoint ?? undefined}
            waypoints={waypoints}
            routeSegments={routeSegments}
            onAddWaypoint={addWaypoint}
            onClickOriginalShape={addConnectionPoint ?? (() => {})}
            undoDisabled={canUndo === false}
            onUndo={undo ?? (() => {})}
            onClear={clear ?? (() => {})}
            stops={stops}
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
      "bg-light",
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
    className={joinClasses(["l-diversion-page-panel__body", props.className])}
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
