import { useContext, useReducer } from "react"
import { TabMode } from "../components/propertiesPanel/tabPanels"
import { StateDispatchContext } from "../contexts/stateDispatchContext"
import { Dispatch } from "../state"
import {
  PagePath,
  VehicleType,
  ViewState,
  initialPageViewState,
  openViewReducer,
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
 * A {@link usePanelStateFromStateDispatchContext} which does not depend on {@link StateDispatchContext}.
 */
export const usePanelStateWithReducer = (initialState?: ViewState) => {
  const [viewState, viewDispatch] = useReducer(
    openViewReducer,
    initialState ?? initialPageViewState
  )

  return usePanelStateForViewState(viewState, viewDispatch)
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
  return {
    currentView: view.state[view.currentPath],
    setPath: (path: PagePath) => {
      if (path !== view.currentPath) {
        dispatch({
          type: "SET_CURRENT_PATH",
          path,
        })
      }
    },
    openVehiclePropertiesPanel: (
      vehicle: VehicleType,
      _initialView?: TabMode
    ) =>
      dispatch({
        type: "SELECT_VEHICLE",
        payload: { vehicle },
      }),
    openLateView: () =>
      dispatch({
        type: "OPEN_LATE_VIEW",
      }),
    openSwingsView: () =>
      dispatch({
        type: "OPEN_SWINGS_VIEW",
      }),
    openNotificationDrawer: () =>
      dispatch({
        type: "OPEN_NOTIFICATION_DRAWER",
      }),
    closeView: () =>
      dispatch({
        type: "CLOSE_VIEW",
      }),
    openPreviousView: () =>
      dispatch({
        type: "RETURN_TO_PREVIOUS_VIEW",
      }),
  }
}
