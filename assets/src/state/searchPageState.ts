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
  RoutePattern,
}

interface SelectedVehicleId {
  type: SelectedEntityType.Vehicle
  vehicleId: VehicleId
}

export interface RoutePatternIdentifier {
  routeId: RouteId
  routePatternId: RoutePatternId
}

export interface SelectedRoutePattern extends RoutePatternIdentifier {
  type: SelectedEntityType.RoutePattern
}

export type SelectedEntity = SelectedVehicleId | SelectedRoutePattern

export interface SearchPageState {
  query: SearchQuery
  isActive: boolean
  savedQueries: SavedSearchQuery[]
  selectedEntity?: SelectedEntity | null
  selectedEntityHistory: SelectedEntity[]
}

export const initialSearchPageState = {
  query: emptySearchQuery,
  isActive: false,
  savedQueries: [],
  selectedEntityHistory: [],
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

interface GoBackAction {
  type: "GO_BACK"
}

export const goBack = (): GoBackAction => {
  return { type: "GO_BACK" }
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
  | GoBackAction

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
        selectedEntityHistory: action.payload
          ? [
              ...state.selectedEntityHistory,
              {
                type: SelectedEntityType.Vehicle,
                vehicleId: action.payload.vehicleId,
              },
            ]
          : state.selectedEntityHistory,
      }

    case "SELECT_SEARCH_ENTITY":
      return {
        ...state,
        selectedEntity: action.payload,
        selectedEntityHistory: action.payload
          ? [...state.selectedEntityHistory, action.payload]
          : state.selectedEntityHistory,
      }

    case "GO_BACK":
      state.selectedEntityHistory.slice
      return {
        ...state,
        selectedEntity: state.selectedEntityHistory.at(-2) || null,
        selectedEntityHistory: state.selectedEntityHistory.slice(0, -1),
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
