import React, { useId } from "react"
import { Button, Form, Spinner } from "react-bootstrap"
import { Panel } from "./diversionPage"
import {
  ByRoutePatternId,
  Route,
  RoutePattern,
  RoutePatternId,
} from "../../schedule"
import RoutePropertiesCard from "../mapPage/routePropertiesCard"

interface SelectedRouteInfoWithRoutePatterns {
  selectedRoute: Route
  routePatterns: ByRoutePatternId<RoutePattern>
  selectedRoutePatternId: RoutePatternId | null
}

interface SelectedRouteInfoWithoutRoutePatterns {
  selectedRoute: null | Route
  routePatterns?: undefined
  selectedRoutePatternId?: undefined
}

type SelectedRouteInfo =
  | SelectedRouteInfoWithRoutePatterns
  | SelectedRouteInfoWithoutRoutePatterns

interface DetourRouteSelectionPanelProps {
  allRoutes: Route[]
  selectedRouteInfo: SelectedRouteInfo

  isLoadingRoutePatterns: boolean

  onConfirm: () => void
  onSelectRoute: (route: Route | undefined) => void
  onSelectRoutePattern: (routePattern: RoutePattern | undefined) => void
}

const selectedRoutePatternFromInfo = (
  selectedRouteInfo: SelectedRouteInfoWithRoutePatterns
): RoutePatternId =>
  selectedRouteInfo.selectedRoutePatternId ||
  Object.values(selectedRouteInfo.routePatterns).find(
    (rp) => rp.directionId === 1
  )?.id ||
  Object.values(selectedRouteInfo.routePatterns)[0].id

export const DetourRouteSelectionPanel = ({
  allRoutes,
  selectedRouteInfo,
  onConfirm,
  onSelectRoute,
  onSelectRoutePattern,
  isLoadingRoutePatterns,
}: DetourRouteSelectionPanelProps) => {
  const selectId = "choose-route-select" + useId()

  return (
    <Panel as="article">
      <Panel.Header className="">
        <h1 className="c-diversion-panel__h1 my-3">Create Detour</h1>
      </Panel.Header>

      <Panel.Body className="d-flex flex-column">
        <Panel.Body.ScrollArea className="d-flex flex-column">
          <section className="pb-3">
            <h2 className="c-diversion-panel__h2" id={selectId}>
              Choose route
            </h2>
            <Form>
              <Form.Select
                required
                aria-labelledby={selectId}
                value={selectedRouteInfo.selectedRoute?.id}
                onChange={(changeEvent) => {
                  onSelectRoute?.(
                    allRoutes.find(
                      (route) => route.id === changeEvent.target.value
                    )
                  )
                }}
              >
                <option value="">Select a route</option>
                {allRoutes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                Select a route to continue.
              </Form.Control.Feedback>
            </Form>
          </section>

          <section className="pb-3">
            <h2 className="c-diversion-panel__h2">Choose direction</h2>
            {selectedRouteInfo.selectedRoute ? (
              <div className="position-relative">
                {selectedRouteInfo.routePatterns && (
                  <>
                    <RoutePropertiesCard
                      routePatterns={selectedRouteInfo.routePatterns}
                      selectedRoutePatternId={selectedRoutePatternFromInfo(
                        selectedRouteInfo
                      )}
                      selectRoutePattern={onSelectRoutePattern}
                      defaultOpened="variants"
                    />
                    <div
                      hidden={!isLoadingRoutePatterns}
                      className="position-absolute inset-0 bg-light opacity-75 d-flex justify-content-center align-items-center"
                    >
                      <Spinner />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="fst-italic">
                Select a route in order to choose a direction.
              </p>
            )}
          </section>
        </Panel.Body.ScrollArea>

        <Panel.Body.Footer className="d-flex">
          <Button className="m-3 flex-grow-1" onClick={onConfirm}>
            Start drawing detour
          </Button>
        </Panel.Body.Footer>
      </Panel.Body>
    </Panel>
  )
}
