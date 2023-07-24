export type SearchQueryType = "all" | "run" | "vehicle" | "operator"

export interface SearchQuery {
  text: string
  property: SearchQueryType | string
}

export interface SavedSearchQuery {
  text: string
}

export const emptySearchQuery: SearchQuery = {
  text: "",
  property: "all",
}

export const filterToAlphanumeric = (text: string): string =>
  text.replace(/[^0-9a-zA-Z]/g, "")

export const isValidSearchQuery = ({ text }: SearchQuery): boolean =>
  isValidSearchText(text)

export const isValidSearchText = (text: string): boolean =>
  filterToAlphanumeric(text).length >= 2
