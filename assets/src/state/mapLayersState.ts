import { Dispatch as ReactDispatch } from "react"
import { Action } from "../state"

export interface MapLayersState {
  tileType: "base" | "satellite"
}

export const initialMapLayersState = {
  tileType: "base",
}

interface SetTileTypeAction {
  type: "SET_TILE_TYPE"
  payload: "base" | "satellite"
}

export const setTileType = (
  tileType: "base" | "satellite"
): SetTileTypeAction => ({
  type: "SET_TILE_TYPE",
  payload: tileType,
})

export type MapLayersAction = SetTileTypeAction

export type Dispatch = ReactDispatch<Action>

export const reducer = (
  state: MapLayersState,
  action: Action
): MapLayersState => {
  switch (action.type) {
    case "SET_TILE_TYPE":
      return {
        ...state,
        tileType: action.payload,
      }
  }

  return state
}
