import React, {
  ComponentProps,
  ComponentPropsWithoutRef,
  PropsWithChildren,
} from "react"
import { DiversionPanel } from "./diversionPanel"
import { DetourMap } from "./detourMap"
import { useDetour } from "../../hooks/useDetour"
import { CloseButton } from "react-bootstrap"
import { OriginalRoute } from "../../models/detour"
import { joinClasses } from "../../helpers/dom"
import { AsProp } from "react-bootstrap/esm/helpers"

interface DiversionPageProps {
  originalRoute: OriginalRoute
  onClose?: () => void
}

export const DiversionPage = ({
  originalRoute,
  onClose,
}: DiversionPageProps) => {
  const {
    addConnectionPoint,
    addWaypoint,

    startPoint,
    endPoint,
    waypoints,

    detourShape,
    directions,

    missedStops,

    canUndo,
    undo,
    clear,
  } = useDetour(originalRoute.routePatternId)

  return (
    <article className="l-diversion-page h-100 border-box inherit-box">
      <header className="l-diversion-page__header text-bg-light border-bottom">
        <CloseButton className="p-4" onClick={onClose} />
      </header>
      <div className="l-diversion-page__panel bg-light">
        <DiversionPanel
          directions={directions}
          missedStops={missedStops}
          routeName={originalRoute.routeName}
          routeDescription={originalRoute.routeDescription}
          routeOrigin={originalRoute.routeOrigin}
          routeDirection={originalRoute.routeDirection}
        />
      </div>
      <div className="l-diversion-page__map">
        <DetourMap
          originalShape={originalRoute.shape.points}
          center={originalRoute.center}
          zoom={originalRoute.zoom}
          detourShape={detourShape}
          startPoint={startPoint ?? undefined}
          endPoint={endPoint ?? undefined}
          waypoints={waypoints}
          onClickMap={addWaypoint}
          onClickOriginalShape={addConnectionPoint}
          undoDisabled={canUndo === false}
          onUndo={undo}
          onClear={clear}
        />
      </div>
    </article>
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

DiversionPagePanel.Header = DiversionPagePanelHeader

DiversionPagePanel.Body = DiversionPagePanelBody

DiversionPage.Panel = DiversionPagePanel

export const Panel = DiversionPagePanel
