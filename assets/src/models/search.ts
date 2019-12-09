import { Dispatch as ReactDispatch } from "react"
import {
  SearchQuery,
  SavedSearchQuery,
  emptySearchQuery,
  isValidSearchQuery,
} from "./searchQuery"

export interface Search {
  query: SearchQuery
  isActive: boolean
  savedSearches: SavedSearchQuery[]
}

export const initialSearch = {
  query: emptySearchQuery,
  isActive: false,
  savedSearches: [],
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

export type Action =
  | SetSearchTextAction
  | SetSearchPropertyAction
  | SubmitSearchAction

export type Dispatch = ReactDispatch<Action>

export const reducer = (search: Search, action: Action): Search => {
  switch (action.type) {
    case "SET_SEARCH_TEXT":
      return {
        ...search,
        query: { ...search.query, text: action.payload.text },
        isActive: false,
      }
    case "SET_SEARCH_PROPERTY":
      return {
        ...search,
        query: { ...search.query, property: action.payload.property },
        isActive: false,
      }
    case "SUBMIT_SEARCH":
      if (isValidSearchQuery(search.query)) {
        return {
          ...search,
          isActive: true,
          savedSearches: addSavedSearch(search.savedSearches, {
            text: search.query.text,
          }),
        }
      } else {
        return {
          ...search,
          isActive: false,
        }
      }
  }
  return search
}

export const addSavedSearch = (
  previouslySaved: SavedSearchQuery[],
  newSearch: SavedSearchQuery
): SavedSearchQuery[] =>
  [newSearch]
    .concat(
      previouslySaved.filter(savedSearch => savedSearch.text !== newSearch.text)
    )
    .slice(0, 5)
