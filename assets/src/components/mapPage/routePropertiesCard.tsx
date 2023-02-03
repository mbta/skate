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
  return (
    <div className="m-route-properties-card__direction-picker">
      {
        // TODO: Should we always show both buttons? Some routes only go one direction?
      }
      {[0, 1].map((directionId) => (
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
            defaultChecked={selectedRoutePattern.directionId === directionId}
            onChange={() => {
              const targetDirectionId = directionId === 0 ? 1 : 0
              // TODO: Try to find matching pattern in other direction first
              const targetRoutePattern =
                sortRoutePatterns(Object.values(routePatterns)).find(
                  (routePattern) =>
                    routePattern.directionId === targetDirectionId
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
  routeId,
  routePatterns,
  selectedRoutePatternId,
  selectRoutePattern,
  onClose,
}: {
  routeId: RouteId
  routePatterns: ByRoutePatternId<RoutePattern>
  selectedRoutePatternId: RoutePatternId
  selectRoutePattern: (routePattern: RoutePattern) => void
  onClose: () => void
}) => {
  const route: Route | null = useRoute(routeId)
  const [openedDetails, setOpenedDetails] = useState<
    "variants" | "stops" | null
  >(null)

  const selectedRoutePattern = routePatterns[selectedRoutePatternId]

  if (!route || selectedRoutePattern === undefined) {
    return <></>
  }
  console.log("OPEN", openedDetails)
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
        <details
          className="m-route-properties-card__variant-picker"
          {...(openedDetails === "variants" ? { open: true } : {})}
          onClick={() => {
            setOpenedDetails("variants")
          }}
        >
          <summary>
            {`${openedDetails === "variants" ? "Hide" : "Show"} variants`}
          </summary>
          <VariantPicker
            routePatterns={Object.values(routePatterns).filter(
              (routePattern) =>
                routePattern.directionId === selectedRoutePattern.directionId
            )}
            selectedRoutePatternId={selectedRoutePattern.id}
            selectRoutePattern={selectRoutePattern}
          />
        </details>
        <details
          className="m-route-properties-card__selected-variant-stops"
          {...(openedDetails === "stops" ? { open: true } : {})}
          onClick={() => {
            if (openedDetails === "stops") {
              setOpenedDetails(null)
            } else {
              setOpenedDetails("stops")
            }
          }}
        >
          <summary>
            {`${
              openedDetails === "stops" ? "Hide" : "Show"
            } ${route.directionNames[
              selectedRoutePattern.directionId
            ].toLowerCase()} stops`}
          </summary>
          <ol>
            {selectedRoutePattern.shape &&
              selectedRoutePattern.shape.stops?.map((stop) => (
                <li key={stop.id}>{stop.name}</li>
              ))}
          </ol>
        </details>
      </Card>
    </div>
  )
}

export default RoutePropertiesCard
