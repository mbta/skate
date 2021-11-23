import React, { ReactElement, useContext, useState } from "react"
import RoutesContext from "../contexts/routesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useTimepoints from "../hooks/useTimepoints"
import { RouteTab, currentRouteTab, isNotPreset } from "../models/routeTab"
import { allVehiclesAndGhosts } from "../models/vehiclesByRouteId"
import PickerContainer from "./pickerContainer"
import { VehicleId, VehicleOrGhost } from "../realtime.d"
import { ByRouteId, Route, RouteId, TimepointsByRouteId } from "../schedule.d"
import { Notifications } from "./notifications"
import Presets from "./presets"
import RightPanel from "./rightPanel"
import RouteLadders from "./routeLadders"
import RoutePicker from "./routePicker"
import featureIsEnabled from "../laboratoryFeatures"
import {
  createRouteTab,
  selectRouteTab,
  selectRoute,
  deselectRoute,
  selectRouteInTab,
  deselectRouteInTab,
  flipLadderInTab,
  toggleLadderCrowdingInTab,
  flipLadder,
  toggleLadderCrowding,
} from "../state"

type DrawerContent = "route_picker" | "presets"

export const findRouteById = (
  routes: Route[] | null,
  routeId: RouteId
): Route | undefined => (routes || []).find((route) => route.id === routeId)

export const findSelectedVehicleOrGhost = (
  vehiclesByRouteId: ByRouteId<VehicleOrGhost[]>,
  selectedVehicleId: VehicleId | undefined
): VehicleOrGhost | undefined => {
  return allVehiclesAndGhosts(vehiclesByRouteId).find(
    (bus) => bus.id === selectedVehicleId
  )
}

const LadderTab = ({
  tab,
  selectTab,
}: {
  tab: RouteTab
  selectTab: () => void
}): ReactElement<HTMLDivElement> => {
  const title = tab.presetName || "Untitled"
  return (
    <div
      className={
        tab.isCurrentTab ? "m-ladder-page__tab-current" : "m-ladder-page__tab"
      }
      onClick={() => selectTab()}
    >
      {title}
    </div>
  )
}

const AddTabButton = ({
  addTab,
}: {
  addTab: () => void
}): ReactElement<HTMLDivElement> => {
  return (
    <div className="m-ladder-page__add-tab-button" onClick={addTab}>
      +
    </div>
  )
}

const LadderPage = (): ReactElement<HTMLDivElement> =>
  featureIsEnabled("presets_workspaces") ? (
    <LadderPageWithTabs />
  ) : (
    <LadderPageWithoutTabs />
  )

const LadderPageWithoutTabs = (): ReactElement<HTMLDivElement> => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const {
    selectedRouteIds,
    ladderDirections,
    ladderCrowdingToggles,
    selectedVehicleOrGhost,
  } = state

  const routes: Route[] | null = useContext(RoutesContext)
  const timepointsByRouteId: TimepointsByRouteId =
    useTimepoints(selectedRouteIds)

  const selectedRoutes: Route[] = selectedRouteIds
    .map((routeId) => findRouteById(routes, routeId))
    .filter((route) => route) as Route[]

  return (
    <div className="m-ladder-page">
      <Notifications />
      <PickerContainer>
        <RoutePicker
          selectedRouteIds={selectedRouteIds}
          selectRoute={(routeId) => dispatch(selectRoute(routeId))}
          deselectRoute={(routeId) => dispatch(deselectRoute(routeId))}
        />
      </PickerContainer>

      <>
        <RouteLadders
          routes={selectedRoutes}
          timepointsByRouteId={timepointsByRouteId}
          selectedVehicleId={selectedVehicleOrGhost?.id}
          deselectRoute={(routeId) => dispatch(deselectRoute(routeId))}
          reverseLadder={(routeId) => dispatch(flipLadder(routeId))}
          toggleCrowding={(routeId) => dispatch(toggleLadderCrowding(routeId))}
          ladderDirections={ladderDirections}
          ladderCrowdingToggles={ladderCrowdingToggles}
        />
        <RightPanel selectedVehicleOrGhost={selectedVehicleOrGhost} />
      </>
    </div>
  )
}

const LadderPageWithTabs = (): ReactElement<HTMLDivElement> => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const { routeTabs, selectedVehicleOrGhost } = state

  const { selectedRouteIds, ladderDirections, ladderCrowdingToggles } =
    currentRouteTab(routeTabs)

  const routes: Route[] | null = useContext(RoutesContext)
  const timepointsByRouteId: TimepointsByRouteId =
    useTimepoints(selectedRouteIds)

  const [currentDrawerContent, setCurrentDrawerContent] =
    useState<DrawerContent>("route_picker")

  const selectedRoutes: Route[] = selectedRouteIds
    .map((routeId) => findRouteById(routes, routeId))
    .filter((route) => route) as Route[]

  return (
    <div className="m-ladder-page">
      <Notifications />

      <PickerContainer>
        <>
          <button onClick={() => setCurrentDrawerContent("route_picker")}>
            Routes
          </button>
          <button onClick={() => setCurrentDrawerContent("presets")}>
            Presets
          </button>
          {currentDrawerContent === "route_picker" ? (
            <RoutePicker
              selectedRouteIds={selectedRouteIds}
              selectRoute={(routeId) => dispatch(selectRouteInTab(routeId))}
              deselectRoute={(routeId) => dispatch(deselectRouteInTab(routeId))}
            />
          ) : (
            <Presets />
          )}
        </>
      </PickerContainer>
      <div className="m-ladder-page__route-tab-bar">
        {routeTabs
          .filter(isNotPreset)
          .sort((a, b) => (a.ordering || 0) - (b.ordering || 0))
          .map((routeTab) => (
            <LadderTab
              tab={routeTab}
              selectTab={() => dispatch(selectRouteTab(routeTab.ordering!))}
              key={routeTab.ordering!}
            />
          ))}

        <AddTabButton addTab={() => dispatch(createRouteTab())} />
      </div>

      <RouteLadders
        routes={selectedRoutes}
        timepointsByRouteId={timepointsByRouteId}
        selectedVehicleId={selectedVehicleOrGhost?.id}
        deselectRoute={(routeId) => dispatch(deselectRouteInTab(routeId))}
        reverseLadder={(routeId) => dispatch(flipLadderInTab(routeId))}
        toggleCrowding={(routeId) =>
          dispatch(toggleLadderCrowdingInTab(routeId))
        }
        ladderDirections={ladderDirections}
        ladderCrowdingToggles={ladderCrowdingToggles}
      />
      <RightPanel selectedVehicleOrGhost={selectedVehicleOrGhost} />
    </div>
  )
}

export default LadderPage
