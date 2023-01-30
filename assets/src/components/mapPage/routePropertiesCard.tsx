import React from "react"

import { useRoute } from "../../contexts/routesContext"
import useRoutePatterns from "../../hooks/useRoutePatterns"
import {
  DirectionId,
  DirectionName,
  Route,
  RouteId,
  RoutePattern,
  RoutePatternId,
} from "../../schedule"
import { Card } from "../card"
import { RoutePill } from "../routePill"

const DirectionPicker = ({
  selectedRoutePattern,
  routePatterns,
  setSelectedRoutePatternId,
  directionNames,
}: {
  selectedRoutePattern: RoutePattern
  routePatterns: RoutePattern[]
  setSelectedRoutePatternId: (routePatternId: RoutePatternId | null) => void
  directionNames: {
    0: DirectionName
    1: DirectionName
  }
}) => {
  const setRoutePatternToFirstWithDirection = (directionId: DirectionId) => {
    setSelectedRoutePatternId(
      routePatterns.find(
        (routePattern) => routePattern.directionId === directionId
      )?.id || null
    )
  }

  return (
    <div className="m-route-properties-card__direction-picker">
      {[0, 1].map((directionId) => (
        <>
          <input
            type="radio"
            id={`direction-radio-${directionId}`}
            name="direction"
            checked={selectedRoutePattern.directionId === directionId}
            onClick={() =>
              selectedRoutePattern.directionId === directionId
                ? {}
                : setRoutePatternToFirstWithDirection(directionId === 0 ? 1 : 0)
            }
          />
          <label htmlFor={`direction-radio-${directionId}`}>
            {directionNames[directionId as DirectionId]}
          </label>
        </>
      ))}
    </div>
  )
}

const VariantPicker = ({
  routePatterns,
  setSelectedRoutePatternId,
}: {
  routePatterns: RoutePattern[]
  setSelectedRoutePatternId: (routePatternId: RoutePatternId | null) => void
}): JSX.Element => {
  {
    return (
      <>
        {routePatterns.map((routePattern) => (
          <div
            className="m-route-properties-card__variant-picker"
            key={"route-pattern.id"}
          >
            <input
              type="radio"
              id={`variant-radio-${routePattern.id}`}
              name="variant"
              onClick={() => setSelectedRoutePatternId(routePattern.id)}
            />

            <label htmlFor={`variant-radio-${routePattern.id}`}>
              <div>
                {routePattern.name}
                {routePattern.timeDescription && routePattern.timeDescription}
              </div>
            </label>
          </div>
        ))}
      </>
    )
  }
}

const RoutePropertiesCard = ({
  routeId,
  selectedRoutePatternId,
  setSelectedRoutePatternId,
  onClose,
}: {
  routeId: RouteId
  selectedRoutePatternId: RoutePatternId
  setSelectedRoutePatternId: (routePatternId: RoutePatternId | null) => void
  onClose: () => void
}) => {
  const routePatterns: RoutePattern[] | null = useRoutePatterns(routeId)
  const route: Route | null = useRoute(routeId)

  if (routePatterns === null || routePatterns.length === 0 || route === null) {
    return <></>
  }

  const selectedRoutePattern: RoutePattern =
    routePatterns.find(
      (routePattern) => routePattern.id === selectedRoutePatternId
    ) || routePatterns[0]

  return (
    <Card
      style={"white"}
      title={
        <div>
          <RoutePill routeName={routeId} />
          {selectedRoutePattern.name}
        </div>
      }
      additionalClass="m-route-properties-card"
      closeCallback={onClose}
    >
      <DirectionPicker
        selectedRoutePattern={selectedRoutePattern}
        routePatterns={routePatterns}
        setSelectedRoutePatternId={setSelectedRoutePatternId}
        directionNames={route.directionNames}
      />
      <details className="m-route-properties-card__variant-picker">
        <summary>Variants </summary>
        <VariantPicker
          routePatterns={routePatterns.filter(
            (routePattern) =>
              routePattern.directionId === selectedRoutePattern.directionId
          )}
          setSelectedRoutePatternId={setSelectedRoutePatternId}
        />
      </details>
      <details className="m-route-properties-card__selected-variant-stops">
        <summary>Stops</summary>
        {selectedRoutePattern.shape &&
          selectedRoutePattern.shape.stops?.map((stop) => (
            <div>{stop.name}</div>
          ))}
      </details>
    </Card>
  )
}

export default RoutePropertiesCard
