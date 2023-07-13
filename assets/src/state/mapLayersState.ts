import { Dispatch as ReactDispatch } from "react"
import { Action } from "../state"
import { TileType } from "../tilesetUrls"

export interface MapLayersState {
  searchMap: {
    tileType: TileType
  }
  shuttleMap: {
    tileType: TileType
  }
  legacySearchMap: {
    tileType: TileType
  }
}

type MapKey = keyof MapLayersState

export const initialMapLayersState: MapLayersState = {
  searchMap: {
    tileType: "base",
  },
  shuttleMap: {
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
  key: key,
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
        [action.key]: { ...state[action.key], tileType: action.payload },
      }
  }

  return state
}
