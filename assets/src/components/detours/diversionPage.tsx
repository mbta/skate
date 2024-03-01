import React, {
  ComponentProps,
  ComponentPropsWithoutRef,
  PropsWithChildren,
  useState,
} from "react"
import { DiversionPanel } from "./diversionPanel"
import { DetourMap } from "./detourMap"
import { DetourState, useDetour } from "../../hooks/useDetour"
import { Alert, Button, CloseButton, Modal } from "react-bootstrap"
import * as BsIcons from "../../helpers/bsIcons"
import { OriginalRoute } from "../../models/detour"
import { joinClasses } from "../../helpers/dom"
import { AsProp } from "react-bootstrap/esm/helpers"
import { DetourFinishedPanel } from "./detourFinishedPanel"
import ZoomLevelWrapper from "../ZoomLevelWrapper"
import { StopMarkerWithStopCard } from "../map/markers/stopMarker"

interface DiversionPageProps {
  originalRoute: OriginalRoute
  onClose?: () => void
}

export const DiversionPage = ({
  originalRoute,
  onClose,
}: DiversionPageProps) => {
  const {
    state,

    addConnectionPoint,
    addWaypoint,

    canAddPoints,
    startPoint,
    endPoint,
    waypoints,

    detourShape,
    directions,

    missedStops,
    routeSegments,

    canUndo,
    undo,
    clear,
    finishDetour,
    editDetour,
  } = useDetour(originalRoute.routePatternId)

  const [textArea, setTextArea] = useState("")
  const [showConfirmCloseModal, setShowConfirmCloseModal] =
    useState<boolean>(false)

  return (
    <>
      <article className="l-diversion-page h-100 border-box inherit-box">
        <header className="l-diversion-page__header text-bg-light border-bottom">
          <CloseButton
            className="p-4"
            onClick={() => setShowConfirmCloseModal(true)}
          />
        </header>

        <div className="l-diversion-page__panel bg-light">
          {state === DetourState.Edit && (
            <DiversionPanel
              directions={directions}
              missedStops={missedStops}
              routeName={originalRoute.routeName}
              routeDescription={originalRoute.routeDescription}
              routeOrigin={originalRoute.routeOrigin}
              routeDirection={originalRoute.routeDirection}
              detourFinished={finishDetour !== undefined}
              onFinishDetour={finishDetour}
            />
          )}
          {state === DetourState.Finished && editDetour && (
            <DetourFinishedPanel
              onNavigateBack={editDetour}
              detourText={textArea}
              onChangeDetourText={setTextArea}
            />
          )}
        </div>
        <div className="l-diversion-page__map position-relative">
          {state === DetourState.Finished && (
            <Alert
              variant="info"
              className="position-absolute top-0 left-0 m-2 icon-link z-1"
            >
              <BsIcons.ExclamationCircleFill />
              Detour is not editable from this screen.
            </Alert>
          )}
          <DetourMap
            originalShape={originalRoute.shape.points}
            center={originalRoute.center}
            zoom={originalRoute.zoom}
            detourShape={detourShape}
            startPoint={startPoint ?? undefined}
            endPoint={endPoint ?? undefined}
            waypoints={waypoints}
            routeSegments={routeSegments}
            originalShapeClickable={canAddPoints}
            onClickMap={addWaypoint ?? (() => {})}
            onClickOriginalShape={addConnectionPoint ?? (() => {})}
            undoDisabled={canUndo === false}
            onUndo={undo ?? (() => {})}
            onClear={clear ?? (() => {})}
          >
          <ZoomLevelWrapper>
            {(zoomLevel) => (
              originalRoute.shape.stops?.map((v) => (
                <StopMarkerWithStopCard
                  stop={v}
                  zoomLevel={zoomLevel}
                  interactionStatesDisabled={false}
                />
              ))
            )}
          </ZoomLevelWrapper>
          </DetourMap>
        </div>
      </article>
      <Modal
        show={showConfirmCloseModal}
        onHide={() => setShowConfirmCloseModal(false)}
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
          <Button
            onClick={() => {
              setShowConfirmCloseModal(false)
              onClose?.()
            }}
            variant="primary"
          >
            Yes, I&apos;m sure
          </Button>
          <Button
            onClick={() => setShowConfirmCloseModal(false)}
            variant="outline-primary"
          >
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

DiversionPagePanel.Header = DiversionPagePanelHeader

DiversionPagePanelBody.ScrollArea = DiversionPagePanelScrollArea
DiversionPagePanelBody.Footer = DiversionPagePanelFooter

DiversionPagePanel.Body = DiversionPagePanelBody

DiversionPage.Panel = DiversionPagePanel

export const Panel = DiversionPagePanel
