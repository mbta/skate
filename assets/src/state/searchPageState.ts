import { Dispatch as ReactDispatch } from "react"
import {
  emptySearchQuery,
  isValidSearchQuery,
  SavedSearchQuery,
  SearchQuery,
} from "../models/searchQuery"
import { VehicleId } from "../realtime"

export interface SearchPageState {
  query: SearchQuery
  isActive: boolean
  savedQueries: SavedSearchQuery[]
  selectedVehicleId?: VehicleId | null
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
  type: "SELECT_VEHICLE"
  payload: { vehicleId: VehicleId | null }
}

export const setSelectedVehicle = (
  vehicleId: VehicleId | null
): SelectVehicleAction => ({
  type: "SELECT_VEHICLE",
  payload: { vehicleId: vehicleId },
})

export type Action =
  | SetSearchTextAction
  | SetSearchPropertyAction
  | SubmitSearchAction
  | SelectVehicleAction

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
    case "SELECT_VEHICLE":
      return {
        ...state,
        selectedVehicleId: action.payload.vehicleId,
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
