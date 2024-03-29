import { useContext } from "react"
import { TabMode } from "../components/propertiesPanel/tabPanels"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { Dispatch } from "../state"
import {
  OpenView,
  PagePath,
  VehicleType,
  ViewState,
  closeView,
  openLateView,
  openNotificaitonDrawer,
  openPreviousView,
  openSwingsView,
  selectVehicle,
  setPath,
  setTabMode,
} from "../state/pagePanelState"

/**
 * React hook providing the API to control the current {@link PageViewState}
 * and {@link ViewState} from the {@link StateDispatchContext}.
 */
export const usePanelStateFromStateDispatchContext = () => {
  const [{ view }, dispatch] = useContext(StateDispatchContext)

  return usePanelStateForViewState(view, dispatch)
}

/**
 * Provides the API for controlling application view state {@link ViewState} through the
 * reducer {@link dispatch} parameter.
 *
 * @param view The current state of the reducer
 * @param dispatch The reducer's dispatch method
 */
export const usePanelStateForViewState = (
  view: ViewState,
  dispatch: Dispatch
) => {
  const currentView = view.state[view.currentPath]
  return {
    currentView,
    setPath: (path: PagePath) => {
      if (path !== view.currentPath) {
        dispatch(setPath(path))
      }
    },
    setTabMode: (tabMode: TabMode) => dispatch(setTabMode(tabMode)),
    openVehiclePropertiesPanel: (vehicle: VehicleType, initialView?: TabMode) =>
      dispatch(selectVehicle(vehicle, initialView ?? "status")),
    openLateView: () => dispatch(openLateView()),
    openSwingsView: () => dispatch(openSwingsView()),
    openNotificationDrawer: () => dispatch(openNotificaitonDrawer()),
    closeView: () => dispatch(closeView()),
    openPreviousView: () => dispatch(openPreviousView()),
    isViewOpen:
      currentView.openView !== OpenView.None ||
      (currentView.selectedVehicleOrGhost && true) ||
      false,
  }
}
