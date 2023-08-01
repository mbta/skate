export type OldSearchQueryType = "all" | "run" | "vehicle" | "operator"

export const searchPropertyDisplayConfig = {
  vehicle: { order: 0, name: "Vehicles" },
  operator: { order: 1, name: "Operators" },
  run: { order: 2, name: "Runs" },
  location: { order: 3, name: "Locations" },
}

export type SearchProperty = keyof typeof searchPropertyDisplayConfig

export type SearchProperties<T> = {
  [K in SearchProperty]: T
}

export type PropertyLimits = SearchProperties<number | null>

export interface SearchQuery {
  text: string
  property: OldSearchQueryType | string
  properties: PropertyLimits
}

export interface SavedSearchQuery {
  text: string
}

export const defaultResultLimit = 5

export const defaultAllProperties = {
  run: defaultResultLimit,
  vehicle: defaultResultLimit,
  operator: defaultResultLimit,
  location: defaultResultLimit,
}

export const emptySearchQuery: SearchQuery = {
  text: "",
  property: "all",
  properties: defaultAllProperties,
}

export const filterToAlphanumeric = (text: string): string =>
  text.replace(/[^0-9a-zA-Z]/g, "")

export const isValidSearchQuery = ({ text }: SearchQuery): boolean =>
  isValidSearchText(text)

export const isValidSearchText = (text: string): boolean =>
  filterToAlphanumeric(text).length >= 2
