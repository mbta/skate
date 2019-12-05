import { Dispatch as ReactDispatch } from "react"

export interface Search {
  text: string
  property: string
  isActive: boolean
  savedSearches: SavedSearch[]
}

export interface SavedSearch {
  text: string
}

export const initialSearch = {
  text: "",
  property: "all",
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
        text: action.payload.text,
        isActive: false,
      }
    case "SET_SEARCH_PROPERTY":
      return {
        ...search,
        property: action.payload.property,
        isActive: false,
      }
    case "SUBMIT_SEARCH":
      if (isValidSearch(search)) {
        return {
          ...search,
          isActive: true,
          savedSearches: addSavedSearch(search.savedSearches, {
            text: search.text,
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
  previouslySaved: SavedSearch[],
  newSearch: SavedSearch
): SavedSearch[] =>
  [newSearch]
    .concat(
      previouslySaved.filter(savedSearch => savedSearch.text !== newSearch.text)
    )
    .slice(0, 5)

const filterToAlphanumeric = (text: string): string =>
  text.replace(/[^0-9a-zA-Z]/g, "")

export const isValidSearch = ({ text }: Search): boolean =>
  filterToAlphanumeric(text).length >= 2
