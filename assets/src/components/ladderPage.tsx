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
import { Ghost, VehicleId, VehicleInScheduledService } from "../realtime.d"
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
import { fullStoryEvent } from "../helpers/fullStory"
import { usePanelStateFromStateDispatchContext } from "../hooks/usePanelState"

type DrawerContent = "route_picker" | "presets"

export const findRouteById = (
  routes: Route[] | null,
  routeId: RouteId
): Route | undefined => (routes || []).find((route) => route.id === routeId)

export const findSelectedVehicleOrGhost = (
  vehiclesByRouteId: ByRouteId<(VehicleInScheduledService | Ghost)[]>,
  selectedVehicleId: VehicleId | undefined
): VehicleInScheduledService | Ghost | undefined => {
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
        "c-ladder-page__tab" +
        (tab.isCurrentTab ? " c-ladder-page__tab-current" : "")
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
      <div className="c-ladder-page__tab-contents">
        <div
          className={
            "c-ladder-page__tab-title" +
            (tab.saveChangesToTabUuid
              ? " c-ladder-page__tab-title--edited"
              : "")
          }
        >
          {title}
        </div>
        {tab.isCurrentTab && showSaveIcon ? (
          <button
            className="c-ladder-page__tab-save-button"
            title="Save"
            onClick={(e) => {
              e.stopPropagation()

              tagManagerEvent("preset_saved")
              fullStoryEvent('User clicked Route Tab "Save" Button', {})

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
      className="c-ladder-page__add-tab-button"
      title="Add Tab"
      onClick={() => {
        fullStoryEvent("User added a new Route Ladder Tab", {})
        tagManagerEvent("new_tab_added")
        addTab()
      }}
    >
      <PlusThinIcon className="c-ladder-page__add-tab-icon" />
    </button>
  )
}

const LadderPage = (): ReactElement<HTMLDivElement> => {
  const [{ routeTabs, pickerContainerIsVisible, mobileMenuIsOpen }, dispatch] =
    useContext(StateDispatchContext)

  const {
    currentView: { selectedVehicleOrGhost },
  } = usePanelStateFromStateDispatchContext()

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
    ? "c-ladder-page--picker-container-visible"
    : "c-ladder-page--picker-container-hidden"

  const mobileMenuClass = mobileMenuIsOpen ? "blurred-mobile" : ""

  return (
    <div
      className={`c-ladder-page ${pickerContainerVisibleClass} ${mobileMenuClass}`}
    >
      <Notifications />

      <PickerContainer>
        <>
          <div className="c-ladder-page__routes-presets-toggle u-hideable">
            <button
              id="c-ladder-page__routes_picker_button"
              className={
                currentDrawerContent === "route_picker"
                  ? "c-ladder-page__routes_picker_button--selected"
                  : "c-ladder-page__routes_picker_button--unselected"
              }
              onClick={() => setCurrentDrawerContent("route_picker")}
            >
              Routes
            </button>
            <button
              id="c-ladder-page__presets_picker_button"
              className={
                currentDrawerContent === "presets"
                  ? "c-ladder-page__routes_picker_button--selected"
                  : "c-ladder-page__routes_picker_button--unselected"
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
      <div className="c-ladder-page__tab-bar-and-ladders">
        <div className="c-ladder-page__route-tab-bar" role="tablist">
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
