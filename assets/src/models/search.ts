import { Dispatch as ReactDispatch } from "react"

export interface Search {
  text: string
  property: string
  isActive: boolean
}

export const initialSearch = {
  text: "",
  property: "all",
  isActive: false,
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
      return {
        ...search,
        isActive: isValidSearch(search),
      }
  }
  return search
}

export const isValidSearch = ({ text }: Search): boolean => text.length >= 2
