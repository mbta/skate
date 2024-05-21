import React, { ReactElement } from "react"
import { Button, FormSelect } from "react-bootstrap"
import { Panel } from "./diversionPage"
import {
  ByRoutePatternId,
  Route,
  RoutePattern,
  RoutePatternId,
} from "../../schedule"
import RoutePropertiesCard from "../mapPage/routePropertiesCard"

interface SelectedRouteInfo {
  selectedRoute: Route | null
  getRoutePicker: () => ReactElement
}

export class SelectedRouteInfoWithRoute implements SelectedRouteInfo {
  selectedRoute: Route
  routePatterns: ByRoutePatternId<RoutePattern>
  selectedRoutePatternId: RoutePatternId

  constructor({
    selectedRoute,
    routePatterns,
    selectedRoutePatternId,
  }: {
    selectedRoute: Route
    routePatterns: ByRoutePatternId<RoutePattern>
    selectedRoutePatternId: RoutePatternId
  }) {
    this.selectedRoute = selectedRoute
    this.routePatterns = routePatterns
    this.selectedRoutePatternId = selectedRoutePatternId
  }

  getRoutePicker = () => {
    return (
      <RoutePropertiesCard
        routePatterns={this.routePatterns}
        selectedRoutePatternId={this.selectedRoutePatternId}
        selectRoutePattern={() => {}}
      />
    )
  }
}

export class SelectedRouteInfoWithoutRoute implements SelectedRouteInfo {
  selectedRoute = null

  getRoutePicker = () => {
    return (
      <p className="fst-italic">
        Select a route in order to choose a direction.
      </p>
    )
  }
}

interface DetourRouteSelectionPanelProps {
  allRoutes: Route[]
  selectedRouteInfo: SelectedRouteInfo
}

export const DetourRouteSelectionPanel = ({
  allRoutes,
  selectedRouteInfo,
}: DetourRouteSelectionPanelProps) => (
  <Panel as="article">
    <Panel.Header className="">
      <h1 className="c-diversion-panel__h1 my-3">Create Detour</h1>
    </Panel.Header>

    <Panel.Body className="d-flex flex-column">
      <Panel.Body.ScrollArea className="d-flex flex-column">
        <section className="pb-3">
          <h2 className="c-diversion-panel__h2">Choose route</h2>
          <FormSelect>
            <option value={undefined}>Select a route</option>
            {allRoutes.map((route) => (
              <option
                key={route.id}
                value={route.id}
                selected={route.id === selectedRouteInfo.selectedRoute?.id}
              >
                {route.name}
              </option>
            ))}
          </FormSelect>
        </section>

        <section className="pb-3">
          <h2 className="c-diversion-panel__h2">Choose direction</h2>
          {selectedRouteInfo.getRoutePicker()}
        </section>
      </Panel.Body.ScrollArea>

      <Panel.Body.Footer className="d-flex">
        <Button className="m-3 flex-grow-1" onClick={() => {}}>
          Start drawing detour
        </Button>
      </Panel.Body.Footer>
    </Panel.Body>
  </Panel>
)
