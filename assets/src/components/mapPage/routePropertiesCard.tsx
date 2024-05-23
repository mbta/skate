import React, { ComponentPropsWithoutRef, useState } from "react"
import { useRoute } from "../../contexts/routesContext"
import { CircleCheckIcon } from "../../helpers/icon"
import {
  RoutePattern,
  RoutePatternId,
  DirectionName,
  DirectionId,
  Route,
  ByRoutePatternId,
} from "../../schedule"
import CloseButton from "../closeButton"
import { RoutePill } from "../routePill"
import { joinClasses } from "../../helpers/dom"

const sortRoutePatterns = (routePatterns: RoutePattern[]): RoutePattern[] =>
  routePatterns.sort((rp1, rp2) => rp1.sortOrder - rp2.sortOrder)

export const patternDisplayName = (
  routePattern: RoutePattern
): { name: string; description: string } => {
  const splitName = routePattern.name.split(" - ", 2)
  const timeDescription = routePattern.timeDescription

  return splitName.length < 2
    ? { name: routePattern.name, description: timeDescription || "" }
    : {
        name: routePattern.headsign || splitName[1],
        description: `from ${splitName[0]}${
          timeDescription ? `, ${timeDescription}` : ""
        }`,
      }
}

const DetailSection = ({
  title,
  isOpen,
  toggleOpen,
  className,
  toggleClassName,
  children,
}: {
  title: string
  isOpen: boolean
  toggleOpen: () => void
  className: string
  toggleClassName?: string
  children: JSX.Element
}) => {
  return (
    <div
      className={`c-route-properties-card__details-section ${
        isOpen ? "c-route-properties-card__details-section--open" : ""
      }`}
    >
      <button
        className={joinClasses([
          "c-route-properties-card__disclosure_toggle",
          toggleClassName,
        ])}
        aria-expanded={isOpen}
        aria-controls={"details" + className}
        onClick={toggleOpen}
      >
        <span id={"summary" + className}>
          {isOpen ? "Hide" : "Show"} {title}
        </span>
      </button>
      <div
        id={"details" + className}
        aria-labelledby={"summary" + className}
        className={`c-route-properties-card__details ${className}`}
      >
        {isOpen && children}
      </div>
    </div>
  )
}

const routePatternForTargetDirection = (
  currentRoutePattern: RoutePattern,
  newDirectionId: DirectionId,
  routePatterns: ByRoutePatternId<RoutePattern>
): RoutePattern | undefined => {
  // attempt to find the same route pattern for the opposite direction
  const possibleNextRoutePatternId = `${currentRoutePattern.id.slice(
    0,
    -1
  )}${newDirectionId}`

  const sortedRoutePatterns = sortRoutePatterns(Object.values(routePatterns))

  const nextRoutePattern = sortedRoutePatterns.find(
    (rp) => rp.id === possibleNextRoutePatternId
  )

  if (nextRoutePattern) {
    return nextRoutePattern
  }

  return sortedRoutePatterns.find((rp) => rp.directionId === newDirectionId)
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
  ).sort((d1, d2) => d1 - d2)

  return (
    <div className="c-route-properties-card__direction-picker">
      {directionIds.map((directionId) => (
        <div
          key={directionId}
          className={joinClasses([
            "direction-button",
            selectedRoutePattern.directionId === directionId &&
              "direction-button--selected",
            "position-relative",
          ])}
        >
          <input
            type="radio"
            id={`direction-radio-${directionId}`}
            name="direction"
            checked={selectedRoutePattern.directionId === directionId}
            onChange={() => {
              const targetRoutePattern = routePatternForTargetDirection(
                selectedRoutePattern,
                directionId,
                routePatterns
              )

              if (targetRoutePattern) {
                selectRoutePattern(targetRoutePattern)
              }
            }}
          />
          <label
            htmlFor={`direction-radio-${directionId}`}
            className="stretched-link"
          >
            {directionNames[directionId]}
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
  const { name, description } = patternDisplayName(routePattern)
  return (
    <div
      className={`c-route-properties-card__variant-option${
        isSelected ? " c-route-properties-card__variant-option--selected" : ""
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
          <div className="c-route-properties-card__variant-option-name">
            {name}
          </div>
          <div className="c-route-properties-card__variant-option-description">
            {description}
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
      <fieldset>
        {sortRoutePatterns(routePatterns).map((routePattern) => (
          <VariantOption
            key={routePattern.id}
            routePattern={routePattern}
            isSelected={routePattern.id === selectedRoutePatternId}
            selectRoutePattern={selectRoutePattern}
          />
        ))}
      </fieldset>
    )
  }
}

export type RoutePropertiesCardOpened = "variants" | "stops" | null

const RoutePropertiesCard = ({
  routePatterns,
  selectedRoutePatternId,
  selectRoutePattern,
  onClose,

  openSection,
  onChangeSection,
}: {
  routePatterns: ByRoutePatternId<RoutePattern>
  selectedRoutePatternId: RoutePatternId
  selectRoutePattern: (routePattern: RoutePattern) => void

  onClose?: () => void

  openSection?: RoutePropertiesCardOpened
  onChangeSection?: (newSection: RoutePropertiesCardOpened) => void
}) => {
  const selectedRoutePattern = routePatterns[selectedRoutePatternId]
  const route: Route | null = useRoute(selectedRoutePattern?.routeId)

  if (!route || selectedRoutePattern === undefined) {
    return <></>
  }
  const { name, description } = patternDisplayName(selectedRoutePattern)

  return (
    <div className="c-route-properties-card" aria-label="route properties card">
      <div className="c-route-properties-card__header">
        <div className="c-route-properties-card__route-title">
          <RoutePill routeName={route.name} />
          <div>
            <h2>{name}</h2>
            <div className="c-route-properties-card__route-description">
              {description}
            </div>
          </div>
        </div>
        {onClose && (
          <CloseButton onClick={onClose} closeButtonType={"l_light"} />
        )}
      </div>
      <DirectionPicker
        selectedRoutePattern={selectedRoutePattern}
        routePatterns={routePatterns}
        selectRoutePattern={selectRoutePattern}
        directionNames={route.directionNames}
      />
      <DetailSection
        title="variants"
        isOpen={openSection === "variants"}
        toggleOpen={() =>
          onChangeSection?.(openSection === "variants" ? null : "variants")
        }
        className="variant-picker"
        toggleClassName="c-route-properties-card__disclosure_toggle--variants"
      >
        <VariantPicker
          routePatterns={Object.values(routePatterns).filter(
            (routePattern) =>
              routePattern.directionId === selectedRoutePattern.directionId
          )}
          selectedRoutePatternId={selectedRoutePattern.id}
          selectRoutePattern={(routePattern: RoutePattern) => {
            selectRoutePattern(routePattern)
          }}
        />
      </DetailSection>
      <hr />
      <DetailSection
        title={`${(
          route.directionNames[selectedRoutePattern.directionId] || ""
        ).toLowerCase()} stops`}
        isOpen={openSection === "stops"}
        toggleOpen={() =>
          onChangeSection?.(openSection === "stops" ? null : "stops")
        }
        className="variant-stop-list"
      >
        <div>
          <ol>
            {selectedRoutePattern.shape &&
              selectedRoutePattern.shape.stops?.map((stop) => (
                <li key={stop.id}>{stop.name}</li>
              ))}
          </ol>
        </div>
      </DetailSection>
    </div>
  )
}

interface RPCSectionStateProps
  extends Omit<
    ComponentPropsWithoutRef<typeof RoutePropertiesCard>,
    "openSection" | "onChangeSection"
  > {
  defaultOpenSection?: RoutePropertiesCardOpened
}

const RoutePropertiesCardWithSectionState = ({
  defaultOpenSection: openSectionDefault,
  ...props
}: RPCSectionStateProps) => {
  const [openSection, setOpenSection] = useState<RoutePropertiesCardOpened>(
    openSectionDefault ?? null
  )

  return (
    <RoutePropertiesCard
      openSection={openSection}
      onChangeSection={setOpenSection}
      {...props}
    />
  )
}
RoutePropertiesCard.WithSectionState = RoutePropertiesCardWithSectionState

export default RoutePropertiesCard
