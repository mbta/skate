import React, { createContext, ReactElement } from "react"
import {
  Dispatch as NotificationsDispatch,
  toggleReadState,
} from "../hooks/useNotificationsReducer"
import { Notification } from "../realtime"
import { Dispatch, initialState, setNotification, State } from "../state"

type StateDispatchContextData = [State, Dispatch]

// tslint:disable-next-line: no-empty
const noopDispatch: Dispatch = () => {}
export const StateDispatchContext = createContext([
  initialState,
  noopDispatch,
] as StateDispatchContextData)

export const StateDispatchProvider = ({
  state,
  dispatch,
  children,
}: {
  state: State
  dispatch: Dispatch
  children: ReactElement<HTMLElement>
}) => {
  return (
    <StateDispatchContext.Provider value={[state, dispatch]}>
      {children}
    </StateDispatchContext.Provider>
  )
}

export const openVPPForNotification = (
  notification: Notification,
  stateDispatch: Dispatch,
  notificationsDispatch: NotificationsDispatch
): void => {
  if (notification.state === "unread") {
    notificationsDispatch(toggleReadState(notification))
  }
  stateDispatch(setNotification(notification))
}
