import React, { useState } from "react"
import { useRoute } from "../../contexts/routesContext"
import { CircleCheckIcon } from "../../helpers/icon"
import {
  RoutePattern,
  RoutePatternId,
  DirectionName,
  DirectionId,
  RouteId,
  Route,
  ByRoutePatternId,
} from "../../schedule"
import { Card } from "../card"
import CloseButton from "../closeButton"
import { RoutePill } from "../routePill"

const sortRoutePatterns = (routePatterns: RoutePattern[]): RoutePattern[] =>
  routePatterns.sort((rp1, rp2) => rp1.sortOrder - rp2.sortOrder)

const displayName = (routePattern: RoutePattern) => {
  //const splitName = routePattern.name.split("- ", 2)
  return routePattern.name
}

const DetailSection = ({
  title,
  isOpen,
  toggleOpen,
  className,
  children,
}: {
  title: string
  isOpen: boolean
  toggleOpen: () => void
  className: string
  children: JSX.Element
}) => {
  return (
    <details
      className={`m-route-properties-card__details-section ${className}`}
      {...(isOpen ? { open: true } : {})}
    >
      <summary
        onClick={(event) => {
          // preventDefault so that open/closed state is managed entirely by react
          // see https://github.com/facebook/react/issues/15486
          event.preventDefault()
          toggleOpen()
        }}
      >
        {`${isOpen ? "Hide" : "Show"} ${title}`}
      </summary>
      {children}
    </details>
  )
}

const DirectionPicker = ({
  selectedRoutePattern,
  routePatterns,
  selectRoutePattern,
  directionNames,
}: {
  selectedRoutePattern: RoutePattern
  routePatterns: ByRoutePatternId<RoutePattern>
  selectRoutePattern: (routePattern: RoutePattern) => void
  directionNames: {
    0: DirectionName
    1: DirectionName
  }
}) => {
  const directionIds: DirectionId[] = Array.from(
    new Set(Object.values(routePatterns).map((rp) => rp.directionId))
  )

  return (
    <div className="m-route-properties-card__direction-picker">
      {directionIds.map((directionId) => (
        <div
          key={directionId}
          className={`direction-button ${
            selectedRoutePattern.directionId === directionId ? "selected" : ""
          }`}
        >
          <input
            type="radio"
            id={`direction-radio-${directionId}`}
            name="direction"
            checked={selectedRoutePattern.directionId === directionId}
            onChange={() => {
              // TODO: Try to find same pattern as selectedRoutePattern first
              const targetRoutePattern =
                sortRoutePatterns(Object.values(routePatterns)).find(
                  (routePattern) => routePattern.directionId === directionId
                ) || null

              if (targetRoutePattern) {
                selectRoutePattern(targetRoutePattern)
              }
            }}
          />
          <label htmlFor={`direction-radio-${directionId}`}>
            {directionNames[directionId as DirectionId]}
          </label>
        </div>
      ))}
    </div>
  )
}

const VariantOption = ({
  routePattern,
  isSelected,
  selectRoutePattern,
}: {
  routePattern: RoutePattern
  isSelected: boolean
  selectRoutePattern: (routePattern: RoutePattern) => void
}) => {
  return (
    <div
      className={`m-route-properties-card__variant-picker-variant ${
        isSelected ? "selected" : ""
      }`}
    >
      <input
        type="radio"
        id={`variant-radio-${routePattern.id}`}
        name="variant"
        defaultChecked={isSelected}
        onChange={() => selectRoutePattern(routePattern)}
      />

      <label htmlFor={`variant-radio-${routePattern.id}`}>
        <CircleCheckIcon className="variant-check" />
        <div>
          <div className="m-route-properties-card__variant-picker-name">
            {displayName(routePattern)}
          </div>
          <div className="m-route-properties-card__variant-picker-time-description">
            {routePattern.timeDescription && routePattern.timeDescription}
          </div>
        </div>
      </label>
    </div>
  )
}

const VariantPicker = ({
  routePatterns,
  selectedRoutePatternId,
  selectRoutePattern,
}: {
  routePatterns: RoutePattern[]
  selectedRoutePatternId: RoutePatternId
  selectRoutePattern: (routePattern: RoutePattern) => void
}): JSX.Element => {
  {
    return (
      <>
        {sortRoutePatterns(routePatterns).map((routePattern) => (
          <VariantOption
            key={routePattern.id}
            routePattern={routePattern}
            isSelected={routePattern.id === selectedRoutePatternId}
            selectRoutePattern={selectRoutePattern}
          />
        ))}
      </>
    )
  }
}

const RoutePropertiesCard = ({
  routePatterns,
  selectedRoutePatternId,
  selectRoutePattern,
  onClose,
}: {
  routePatterns: ByRoutePatternId<RoutePattern>
  selectedRoutePatternId: RoutePatternId
  selectRoutePattern: (routePattern: RoutePattern) => void
  onClose: () => void
}) => {
  const [openedDetails, setOpenedDetails] = useState<
    "variants" | "stops" | null
  >(null)

  const selectedRoutePattern = routePatterns[selectedRoutePatternId]
  const route: Route | null = useRoute(selectedRoutePattern?.routeId)

  if (!route || selectedRoutePattern === undefined) {
    return <></>
  }
  return (
    <div className="m-route-properties-card" aria-label="route properties card">
      <Card
        style={"white"}
        noFocusOrHover={true}
        title={
          <>
            <div className="route-title">
              <RoutePill routeName={routeId} />
              <h4>{displayName(selectedRoutePattern)}</h4>
            </div>
            <CloseButton onClick={onClose} closeButtonType={"l_light"} />
          </>
        }
      >
        <DirectionPicker
          selectedRoutePattern={selectedRoutePattern}
          routePatterns={routePatterns}
          selectRoutePattern={selectRoutePattern}
          directionNames={route.directionNames}
        />
        <DetailSection
          title="variants"
          isOpen={openedDetails === "variants"}
          toggleOpen={() =>
            setOpenedDetails((prevValue) =>
              prevValue === "variants" ? null : "variants"
            )
          }
          className="variant-picker"
        >
          <VariantPicker
            routePatterns={Object.values(routePatterns).filter(
              (routePattern) =>
                routePattern.directionId === selectedRoutePattern.directionId
            )}
            selectedRoutePatternId={selectedRoutePattern.id}
            selectRoutePattern={selectRoutePattern}
          />
        </DetailSection>
        <DetailSection
          title={`${(
            route.directionNames[selectedRoutePattern.directionId] || ""
          ).toLowerCase()} stops`}
          isOpen={openedDetails === "stops"}
          toggleOpen={() =>
            setOpenedDetails((prevValue) =>
              prevValue === "stops" ? null : "stops"
            )
          }
          className="variant-stop-list"
        >
          <ol>
            {selectedRoutePattern.shape &&
              selectedRoutePattern.shape.stops?.map((stop) => (
                <li key={stop.id}>{stop.name}</li>
              ))}
          </ol>
        </DetailSection>
      </Card>
    </div>
  )
}

export default RoutePropertiesCard
