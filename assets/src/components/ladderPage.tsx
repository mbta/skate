import React, { ReactElement, useContext, useState, useEffect } from "react"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import {
  RouteTab,
  currentRouteTab,
  isOpenTab,
  isEditedPreset,
  isPreset,
  tabName,
} from "../models/routeTab"
import PickerContainer from "./pickerContainer"
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
import { fullStoryEvent } from "../helpers/fullStory"
import { usePanelStateFromStateDispatchContext } from "../hooks/usePanelState"
import { DetourModal } from "./detours/detourModal"
import { Route } from "../schedule"

type DrawerContent = "route_picker" | "presets"

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
      tabIndex={tab.isCurrentTab ? -1 : 0}
      aria-selected={tab.isCurrentTab}
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

  const [currentDrawerContent, setCurrentDrawerContent] =
    useState<DrawerContent>("route_picker")
  const pickerContainerVisibleClass = pickerContainerIsVisible
    ? "c-ladder-page--picker-container-visible"
    : "c-ladder-page--picker-container-hidden"

  const mobileMenuClass = mobileMenuIsOpen ? "blurred-mobile" : ""

  const [routeForDetour, setRouteForDetour] = useState<Route | null>(null)

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
          selectedRouteIds={selectedRouteIds}
          selectedVehicleId={selectedVehicleOrGhost?.id}
          deselectRoute={(routeId) => dispatch(deselectRouteInTab(routeId))}
          reverseLadder={(routeId) => dispatch(flipLadderInTab(routeId))}
          toggleCrowding={(routeId) =>
            dispatch(toggleLadderCrowdingInTab(routeId))
          }
          ladderDirections={ladderDirections}
          ladderCrowdingToggles={ladderCrowdingToggles}
          onAddDetour={(route) => {
            setRouteForDetour(route)
          }}
        />
      </div>
      {routeForDetour && (
        <DetourModal
          originalRoute={{ route: routeForDetour }}
          show={!!routeForDetour}
          onClose={() => {
            setRouteForDetour(null)
          }}
        />
      )}
    </div>
  )
}

export default LadderPage
