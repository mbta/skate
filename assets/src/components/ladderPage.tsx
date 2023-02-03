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
  tabName,
} from "../models/routeTab"
import { allVehiclesAndGhosts } from "../models/vehiclesByRouteId"
import PickerContainer from "./pickerContainer"
import { VehicleId, VehicleOrGhost } from "../realtime.d"
import { ByRouteId, Route, RouteId, TimepointsByRouteId } from "../schedule.d"
import { Notifications } from "./notifications"
import Presets from "./presets"
import RouteLadders from "./routeLadders"
import RoutePicker from "./routePicker"
import {
  createRouteTab,
  selectRouteTab,
  selectRouteInTab,
  deselectRouteInTab,
  flipLadderInTab,
  toggleLadderCrowdingInTab,
  closeRouteTab,
  promptToSaveOrCreatePreset,
} from "../state"
import OldCloseButton from "./oldCloseButton"
import { SaveIcon, PlusThinIcon } from "../helpers/icon"
import { tagManagerEvent } from "../helpers/googleTagManager"
import useAlerts from "../hooks/useAlerts"
import { SocketContext } from "../contexts/socketContext"

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
  const title = tabName(tab)
  return (
    <div
      className={
        "m-ladder-page__tab" +
        (tab.isCurrentTab ? " m-ladder-page__tab-current" : "")
      }
      onClick={() => selectTab()}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          selectTab()
        }
      }}
      role="tab"
      tabIndex={tab.isCurrentTab ? 0 : -1}
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
          <button
            className="m-ladder-page__tab-save-button"
            title="Save"
            onClick={(e) => {
              e.stopPropagation()

              tagManagerEvent("preset_saved")

              saveTab()
            }}
          >
            <SaveIcon />
          </button>
        ) : null}
        <OldCloseButton onClick={() => closeTab()} />
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
    <button
      className="m-ladder-page__add-tab-button"
      title="Add Tab"
      onClick={() => {
        window.FS?.event("User added a new Route Ladder Tab")
        tagManagerEvent("new_tab_added")
        addTab()
      }}
    >
      <PlusThinIcon className="m-ladder-page__add-tab-icon" />
    </button>
  )
}

const LadderPage = (): ReactElement<HTMLDivElement> => {
  const [state, dispatch] = useContext(StateDispatchContext)
  const {
    routeTabs,
    selectedVehicleOrGhost,
    pickerContainerIsVisible,
    mobileMenuIsOpen,
  } = state

  useEffect(() => {
    if (routeTabs.filter(isOpenTab).length === 0) {
      dispatch(createRouteTab())
    }
  }, [dispatch, routeTabs])

  const { selectedRouteIds, ladderDirections, ladderCrowdingToggles } =
    currentRouteTab(routeTabs) || {
      selectedRouteIds: [] as string[],
      ladderDirections: {},
      ladderCrowdingToggles: {},
    }

  const routes: Route[] | null = useContext(RoutesContext)
  const timepointsByRouteId: TimepointsByRouteId =
    useTimepoints(selectedRouteIds)

  const { socket } = useContext(SocketContext)
  const alerts = useAlerts(socket, selectedRouteIds)
  const routesWithAlerts = []

  for (const routeId in alerts) {
    if (alerts[routeId].length > 0) {
      routesWithAlerts.push(routeId)
    }
  }

  const [currentDrawerContent, setCurrentDrawerContent] =
    useState<DrawerContent>("route_picker")

  const selectedRoutes: Route[] = selectedRouteIds
    .map((routeId) => findRouteById(routes, routeId))
    .filter((route) => route) as Route[]

  const pickerContainerVisibleClass = pickerContainerIsVisible
    ? "m-ladder-page--picker-container-visible"
    : "m-ladder-page--picker-container-hidden"

  const mobileMenuClass = mobileMenuIsOpen ? "blurred-mobile" : ""

  return (
    <div
      className={`m-ladder-page ${pickerContainerVisibleClass} ${mobileMenuClass}`}
    >
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
      <div className="m-ladder-page__tab-bar-and-ladders">
        <div className="m-ladder-page__route-tab-bar" role="tablist">
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
          routesWithAlerts={routesWithAlerts}
        />
      </div>
    </div>
  )
}

export default LadderPage
