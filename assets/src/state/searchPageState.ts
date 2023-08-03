import { Dispatch as ReactDispatch } from "react"
import { LocationSearchResult } from "../models/locationSearchResult"
import {
  emptySearchQuery,
  isValidSearchQuery,
  SavedSearchQuery,
  SearchQuery,
  SearchProperty,
  PropertyLimits,
  defaultResultLimit,
  SearchResultCategory,
  defaultCategoryResultLimits,
} from "../models/searchQuery"
import { VehicleId } from "../realtime"
import { RouteId, RoutePatternId } from "../schedule"

export enum SelectedEntityType {
  Vehicle = 1,
  RoutePattern,
  Location,
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

export interface SelectedLocation {
  type: SelectedEntityType.Location
  location: LocationSearchResult
}

export type SelectedEntity =
  | SelectedVehicleId
  | SelectedRoutePattern
  | SelectedLocation

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

interface SetOldSearchPropertyAction {
  type: "SET_SEARCH_PROPERTY"
  payload: {
    property: string
  }
}

export const setOldSearchProperty = (
  property: string
): SetOldSearchPropertyAction => ({
  type: "SET_SEARCH_PROPERTY",
  payload: { property },
})

interface SetCategoryMatchLimitAction {
  type: "SET_CATEGORY_MATCH_LIMIT"
  payload: { category: SearchResultCategory; limit: number }
}

export const setCategoryMatchLimit = (
  category: SearchResultCategory,
  limit: number
): SetCategoryMatchLimitAction => ({
  type: "SET_CATEGORY_MATCH_LIMIT",
  payload: { category, limit },
})

interface SetPropertyMatchLimitAction {
  type: "SET_PROPERTY_MATCH_LIMIT"
  payload: { property: SearchProperty; limit: number }
}

export const setPropertyMatchLimit = (
  property: SearchProperty,
  limit: number
): SetPropertyMatchLimitAction => ({
  type: "SET_PROPERTY_MATCH_LIMIT",
  payload: { property, limit },
})

interface SetSearchPropertiesAction {
  type: "SET_SEARCH_PROPERTIES"
  payload: SearchProperty[]
}
export const setSearchProperties = (
  properties: SearchProperty[]
): SetSearchPropertiesAction => ({
  type: "SET_SEARCH_PROPERTIES",
  payload: properties,
})

interface SubmitSearchAction {
  type: "SUBMIT_SEARCH"
}

export const submitSearch = (): SubmitSearchAction => ({
  type: "SUBMIT_SEARCH",
})

interface NewSearchSessionAction {
  type: "NEW_SEARCH_SESSION"
  payload: SelectedEntity | null
}
export const newSearchSession = (
  newSelection?: SelectedEntity | null
): NewSearchSessionAction => ({
  type: "NEW_SEARCH_SESSION",
  payload: newSelection || null,
})

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

export const setSelectedEntity = (
  selectedEntity: SelectedEntity | null
): SelectEntityAction => ({
  type: "SELECT_SEARCH_ENTITY",
  payload: selectedEntity,
})

export type Action =
  | SetSearchTextAction
  | SetOldSearchPropertyAction
  | SetPropertyMatchLimitAction
  | SetCategoryMatchLimitAction
  | SetSearchPropertiesAction
  | SubmitSearchAction
  | NewSearchSessionAction
  | SelectEntityAction
  | GoBackAction

export type Dispatch = ReactDispatch<Action>

export const reducer = (
  state: SearchPageState,
  action: Action
): SearchPageState => {
  switch (action.type) {
    case "SET_SEARCH_TEXT": {
      return {
        ...state,
        query: {
          ...state.query,
          text: action.payload.text,
          properties: Object.fromEntries(
            Object.entries(state.query.properties).map(([property, limit]) => [
              property,
              limit === null ? limit : defaultResultLimit,
            ])
          ) as PropertyLimits,
          categoryResultLimits: defaultCategoryResultLimits,
        },

        isActive: false,
      }
    }
    case "SET_SEARCH_PROPERTY":
      return {
        ...state,
        query: { ...state.query, property: action.payload.property },
        isActive: false,
      }
    case "SET_PROPERTY_MATCH_LIMIT":
      return {
        ...state,
        query: {
          ...state.query,
          properties: {
            ...state.query.properties,
            [action.payload.property]: action.payload.limit,
          },
        },
      }
    case "SET_CATEGORY_MATCH_LIMIT":
      return {
        ...state,
        query: {
          ...state.query,
          categoryResultLimits: {
            ...state.query.categoryResultLimits,
            [action.payload.category]: action.payload.limit,
          },
        },
      }

    case "SET_SEARCH_PROPERTIES":
      return {
        ...state,
        query: {
          ...state.query,
          properties: setSearchPropertyLimits(
            state.query.properties,
            action.payload
          ),
        },
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

    case "NEW_SEARCH_SESSION":
      return {
        ...state,
        selectedEntity: action.payload,
        isActive: false,
        query: emptySearchQuery,
        selectedEntityHistory: [],
      }
    case "SELECT_SEARCH_ENTITY": {
      const lastSelection = state.selectedEntity
      return {
        ...state,
        selectedEntity: action.payload,
        selectedEntityHistory:
          lastSelection &&
          shouldAddLastSelectionToHistory(action.payload, lastSelection)
            ? [lastSelection, ...state.selectedEntityHistory]
            : state.selectedEntityHistory,
      }
    }

    case "GO_BACK": {
      const [previousSelection, ...history] = state.selectedEntityHistory
      return {
        ...state,
        selectedEntity: previousSelection || null,
        selectedEntityHistory: history,
      }
    }
  }
  return state
}

const setSearchPropertyLimits = (
  properties: PropertyLimits,
  desiredProperties: SearchProperty[]
) => {
  return Object.fromEntries(
    Object.entries(properties).map(([oldProperty, oldLimit]) => {
      const propertyIsDesired = desiredProperties.some(
        (desiredProperty) => desiredProperty === oldProperty
      )

      return [
        oldProperty,
        propertyIsDesired
          ? oldLimit === null
            ? defaultResultLimit
            : oldLimit
          : null,
      ]
    })
  ) as PropertyLimits
}

/*
The last selection should only be added to the selection history if it is different from the new selection.
For vehicles, this means having a different vehicleId. 
For route patterns, this means having a different routeId.
 */
const shouldAddLastSelectionToHistory = (
  newSelection: SelectedEntity | null,
  lastSelection: SelectedEntity
) => {
  if (
    newSelection &&
    lastSelection.type === SelectedEntityType.RoutePattern &&
    newSelection.type === SelectedEntityType.RoutePattern &&
    lastSelection.routeId === newSelection.routeId
  ) {
    return false
  }

  if (
    newSelection &&
    lastSelection.type === SelectedEntityType.Vehicle &&
    newSelection.type === SelectedEntityType.Vehicle &&
    lastSelection.vehicleId === newSelection.vehicleId
  ) {
    return false
  }
  return true
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
