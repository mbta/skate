import React, { ReactElement, useContext, useState, useEffect } from "react"
import RoutesContext from "../contexts/routesContext"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import useTimepoints from "../hooks/useTimepoints"
import {
  RouteTab,
  currentRouteTab,
  isOpenTab,
  isEditedPreset,
  isPreset,
} from "../models/routeTab"
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
  closeRouteTab,
  promptToSaveOrCreatePreset,
} from "../state"
import CloseButton from "./closeButton"
import { saveIcon, plusThinIcon } from "../helpers/icon"

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
  closeTab,
  showSaveIcon,
  saveTab,
}: {
  tab: RouteTab
  selectTab: () => void
  closeTab: () => void
  showSaveIcon: boolean
  saveTab: () => void
}): ReactElement<HTMLDivElement> => {
  const title = tab.presetName || "Untitled"
  return (
    <div
      className={
        "m-ladder-page__tab" +
        (tab.isCurrentTab ? " m-ladder-page__tab-current" : "")
      }
      onClick={() => selectTab()}
    >
      <div className="m-ladder-page__tab-contents">
        <div
          className={
            "m-ladder-page__tab-title" +
            (tab.saveChangesToTabUuid
              ? " m-ladder-page__tab-title--edited"
              : "")
          }
        >
          {title}
        </div>
        {tab.isCurrentTab && showSaveIcon ? (
          <div
            onClick={(e) => {
              e.stopPropagation()

              if (window.FS) {
                window.FS.event("Preset saved")
              }

              saveTab()
            }}
          >
            {saveIcon("m-ladder-page__tab-save-icon")}
          </div>
        ) : null}
        <CloseButton onClick={() => closeTab()} />
      </div>
    </div>
  )
}

const AddTabButton = ({
  addTab,
}: {
  addTab: () => void
}): ReactElement<HTMLDivElement> => {
  return (
    <div
      className="m-ladder-page__add-tab-button"
      onClick={() => {
        if (window.FS) {
          window.FS.event("New tab added")
        }
        addTab()
      }}
    >
      {plusThinIcon("m-ladder-page__add-tab-icon")}
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

  useEffect(() => {
    if (routeTabs.filter((routeTab) => isOpenTab(routeTab)).length === 0) {
      dispatch(createRouteTab())
    }
  }, [JSON.stringify(routeTabs)])

  const { selectedRouteIds, ladderDirections, ladderCrowdingToggles } =
    currentRouteTab(routeTabs) || {
      selectedRouteIds: [] as string[],
      ladderDirections: {},
      ladderCrowdingToggles: {},
    }

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
          <div className="m-ladder-page__routes-presets-toggle">
            <button
              id="m-ladder-page__routes_picker_button"
              className={
                currentDrawerContent === "route_picker"
                  ? "m-ladder-page__routes_picker_button_selected"
                  : "m-ladder-page__routes_picker_button_unselected"
              }
              onClick={() => setCurrentDrawerContent("route_picker")}
            >
              Routes
            </button>
            <button
              id="m-ladder-page__presets_picker_button"
              className={
                currentDrawerContent === "presets"
                  ? "m-ladder-page__routes_picker_button_selected"
                  : "m-ladder-page__routes_picker_button_unselected"
              }
              onClick={() => setCurrentDrawerContent("presets")}
            >
              Presets
            </button>
          </div>
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
          .filter(isOpenTab)
          .sort((a, b) => (a.ordering || 0) - (b.ordering || 0))
          .map((routeTab) => (
            <LadderTab
              tab={routeTab}
              selectTab={() => dispatch(selectRouteTab(routeTab.uuid))}
              closeTab={() => dispatch(closeRouteTab(routeTab.uuid))}
              showSaveIcon={!isPreset(routeTab) || isEditedPreset(routeTab)}
              saveTab={() => {
                dispatch(promptToSaveOrCreatePreset(routeTab))
              }}
              key={routeTab.uuid}
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
