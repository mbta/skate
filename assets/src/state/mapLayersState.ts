import { Dispatch as ReactDispatch } from "react"
import { Action } from "../state"
import { TileType } from "../tilesetUrls"

export interface MapLayersState {
  searchMap: {
    tileType: TileType
    pullbackLayerEnabled: boolean
  }
  shuttleMap: {
    tileType: TileType
  }
  detourMap: {
    tileType: TileType
  }
  legacySearchMap: {
    tileType: TileType
  }
}

export type MapKey = keyof MapLayersState

export const initialMapLayersState: MapLayersState = {
  searchMap: {
    tileType: "base",
    pullbackLayerEnabled: false,
  },
  shuttleMap: {
    tileType: "base",
  },
  detourMap: {
    tileType: "base",
  },
  legacySearchMap: {
    tileType: "base",
  },
}

interface SetTileTypeAction {
  type: "SET_TILE_TYPE"
  key: MapKey
  payload: TileType
}

export const setTileType = (
  key: MapKey,
  tileType: TileType
): SetTileTypeAction => ({
  type: "SET_TILE_TYPE",
  key,
  payload: tileType,
})

interface TogglePullbackLayerAction {
  type: "TOGGLE_PULLBACK_LAYER"
  key: MapKey
}

export const togglePullbackLayer = (
  key: MapKey
): TogglePullbackLayerAction => ({
  type: "TOGGLE_PULLBACK_LAYER",
  key,
})

export type MapLayersAction = SetTileTypeAction | TogglePullbackLayerAction

export type Dispatch = ReactDispatch<Action>

export const reducer = (
  state: MapLayersState,
  action: Action
): MapLayersState => {
  switch (action.type) {
    case "SET_TILE_TYPE":
      return {
        ...state,
        [action.key]: { ...state[action.key], tileType: action.payload },
      }
    case "TOGGLE_PULLBACK_LAYER":
      return action.key === "searchMap"
        ? {
            ...state,
            [action.key]: {
              ...state[action.key],
              pullbackLayerEnabled: !state[action.key].pullbackLayerEnabled,
            },
          }
        : state
  }

  return state
}
