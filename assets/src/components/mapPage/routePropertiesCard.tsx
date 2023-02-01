import React from "react"
import { useRoute } from "../../contexts/routesContext"
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
import { RoutePill } from "../routePill"

const sortRoutePatterns = (routePatterns: RoutePattern[]): RoutePattern[] =>
  routePatterns.sort((rp1, rp2) => rp1.sortOrder - rp2.sortOrder)

const DirectionPicker = ({
  selectedRoutePattern,
  routePatterns,
  selectRoutePattern,
  directionNames,
}: {
  selectedRoutePattern: RoutePattern
  routePatterns: ByRoutePatternId<RoutePattern>
  selectRoutePattern: ({
    routeId,
    routePatternId,
  }: {
    routeId: RouteId
    routePatternId: RoutePatternId
  }) => void
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
        <>
          <input
            type="radio"
            id={`direction-radio-${directionId}`}
            name="direction"
            defaultChecked={selectedRoutePattern.directionId === directionId}
            onChange={() => {
              const targetDirectionId = directionId === 0 ? 1 : 0
              const targetRoutePattern =
                sortRoutePatterns(Object.values(routePatterns)).find(
                  (routePattern) =>
                    routePattern.directionId === targetDirectionId
                ) || null

              if (targetRoutePattern) {
                selectRoutePattern({
                  routeId: targetRoutePattern.routeId,
                  routePatternId: targetRoutePattern.id,
                })
              }
            }}
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
  selectedRoutePatternId,
  selectRoutePattern,
}: {
  routePatterns: RoutePattern[]
  selectedRoutePatternId: RoutePatternId
  selectRoutePattern: (routePattern: {
    routeId: RouteId
    routePatternId: RoutePatternId
  }) => void
}): JSX.Element => {
  {
    return (
      <>
        {sortRoutePatterns(routePatterns).map((routePattern) => (
          <div
            className="m-route-properties-card__variant-picker"
            key={routePattern.id}
          >
            <input
              type="radio"
              id={`variant-radio-${routePattern.id}`}
              name="variant"
              defaultChecked={routePattern.id === selectedRoutePatternId}
              onChange={() =>
                selectRoutePattern({
                  routeId: routePattern.routeId,
                  routePatternId: routePattern.id,
                })
              }
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
  routePatterns,
  selectedRoutePatternId,
  selectRoutePattern,
  onClose,
}: {
  routeId: RouteId
  routePatterns: ByRoutePatternId<RoutePattern>
  selectedRoutePatternId: RoutePatternId
  selectRoutePattern: (routePattern: {
    routeId: RouteId
    routePatternId: RoutePatternId
  }) => void
  onClose: () => void
}) => {
  const route: Route | null = useRoute(routeId)

  const selectedRoutePattern = routePatterns[selectedRoutePatternId]

  if (!route || selectedRoutePattern === undefined) {
    return <></>
  }

  return (
    <Card
      style={"white"}
      noFocusOrHover={true}
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
        selectRoutePattern={selectRoutePattern}
        directionNames={route.directionNames}
      />
      <details className="m-route-properties-card__variant-picker">
        <summary>Variants </summary>
        <VariantPicker
          routePatterns={Object.values(routePatterns).filter(
            (routePattern) =>
              routePattern.directionId === selectedRoutePattern.directionId
          )}
          selectedRoutePatternId={selectedRoutePattern.id}
          selectRoutePattern={selectRoutePattern}
        />
      </details>
      <details className="m-route-properties-card__selected-variant-stops">
        <summary>Stops</summary>
        {selectedRoutePattern.shape &&
          selectedRoutePattern.shape.stops?.map((stop) => (
            <div key={stop.id}>{stop.name}</div>
          ))}
      </details>
    </Card>
  )
}

export default RoutePropertiesCard
