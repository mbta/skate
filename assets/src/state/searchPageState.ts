import { Dispatch as ReactDispatch } from "react"
import {
  emptySearchQuery,
  isValidSearchQuery,
  SavedSearchQuery,
  SearchQuery,
} from "../models/searchQuery"
import { VehicleId } from "../realtime"
import { RouteId, RoutePatternId } from "../schedule"

export enum SelectedEntityType {
  Vehicle = 1,
  Route,
}

interface SelectedVehicle {
  type: SelectedEntityType.Vehicle
  vehicleId: VehicleId
}

export interface SelectedRoute {
  type: SelectedEntityType.Route

  routeId: RouteId
  routePatternId: RoutePatternId
}

export type SelectedEntity = SelectedVehicle | SelectedRoute

export interface SearchPageState {
  query: SearchQuery
  isActive: boolean
  savedQueries: SavedSearchQuery[]
  selectedEntity?: SelectedEntity | null
}

export const initialSearchPageState = {
  query: emptySearchQuery,
  isActive: false,
  savedQueries: [],
}

interface SetSearchTextAction {
  type: "SET_SEARCH_TEXT"
  payload: {
    text: string
  }
}

export const setSearchText = (text: string): SetSearchTextAction => ({
  type: "SET_SEARCH_TEXT",
  payload: { text },
})

interface SetSearchPropertyAction {
  type: "SET_SEARCH_PROPERTY"
  payload: {
    property: string
  }
}

export const setSearchProperty = (
  property: string
): SetSearchPropertyAction => ({
  type: "SET_SEARCH_PROPERTY",
  payload: { property },
})

interface SubmitSearchAction {
  type: "SUBMIT_SEARCH"
}

export const submitSearch = (): SubmitSearchAction => ({
  type: "SUBMIT_SEARCH",
})

interface SelectVehicleAction {
  type: "SELECT_SEARCH_VEHICLE"
  payload: { vehicleId: VehicleId } | null
}

interface SelectEntityAction {
  type: "SELECT_SEARCH_ENTITY"
  payload: SelectedEntity | null
}

export const setSelectedVehicle = (
  vehicleId: VehicleId | null
): SelectVehicleAction => ({
  type: "SELECT_SEARCH_VEHICLE",
  payload: vehicleId ? { vehicleId: vehicleId } : null,
})
export const setSelectedEntity = (
  selectedEntity: SelectedEntity | null
): SelectEntityAction => ({
  type: "SELECT_SEARCH_ENTITY",
  payload: selectedEntity,
})

export type Action =
  | SetSearchTextAction
  | SetSearchPropertyAction
  | SubmitSearchAction
  | SelectVehicleAction
  | SelectEntityAction

export type Dispatch = ReactDispatch<Action>

export const reducer = (
  state: SearchPageState,
  action: Action
): SearchPageState => {
  switch (action.type) {
    case "SET_SEARCH_TEXT":
      return {
        ...state,
        query: { ...state.query, text: action.payload.text },
        isActive: false,
      }
    case "SET_SEARCH_PROPERTY":
      return {
        ...state,
        query: { ...state.query, property: action.payload.property },
        isActive: false,
      }
    case "SUBMIT_SEARCH":
      if (isValidSearchQuery(state.query)) {
        return {
          ...state,
          isActive: true,
          savedQueries: addSavedQuery(state.savedQueries, {
            text: state.query.text,
          }),
        }
      } else {
        return {
          ...state,
          isActive: false,
        }
      }
    case "SELECT_SEARCH_VEHICLE":
      return {
        ...state,
        selectedEntity: action.payload
          ? {
              type: SelectedEntityType.Vehicle,
              vehicleId: action.payload.vehicleId,
            }
          : null,
      }

    case "SELECT_SEARCH_ENTITY":
      return {
        ...state,
        selectedEntity: action.payload,
      }
  }
  return state
}

export const addSavedQuery = (
  previouslySaved: SavedSearchQuery[],
  newSearch: SavedSearchQuery
): SavedSearchQuery[] =>
  [newSearch]
    .concat(
      previouslySaved.filter((savedQuery) => savedQuery.text !== newSearch.text)
    )
    .slice(0, 10)
