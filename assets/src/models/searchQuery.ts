export type OldSearchPropertyQuery = "all" | "run" | "vehicle" | "operator"

export const searchPropertyDisplayConfig = {
  vehicle: { order: 0, name: "Vehicles" },
  operator: { order: 1, name: "Operators" },
  run: { order: 2, name: "Runs" },
  location: { order: 3, name: "Locations" },
}

export type SearchProperty = keyof typeof searchPropertyDisplayConfig

export type VehiclePropertyQuery = "all" | "vehicle" | "run" | "operator"
export type SearchPropertyQuery = "all" | VehiclePropertyQuery | "location"

export type SearchProperties<T> = {
  [K in SearchProperty]: T
}

export type PropertyLimits = SearchProperties<number | null>

export type SearchResultCategory = "vehicle" | "location"
export type CategoryResultLimits = { vehicle: number; location: number }

export interface SearchQuery {
  text: string
  property: SearchPropertyQuery
  categoryResultLimits: CategoryResultLimits
  // TODO: Remove Properties
  properties: PropertyLimits
}

export interface SavedSearchQuery {
  text: string
}

export const defaultResultLimit = 25

export const defaultAllProperties = {
  run: defaultResultLimit,
  vehicle: defaultResultLimit,
  operator: defaultResultLimit,
  location: defaultResultLimit,
}

export const defaultCategoryResultLimits = {
  vehicle: defaultResultLimit,
  location: defaultResultLimit,
}

export const emptySearchQuery: SearchQuery = {
  text: "",
  property: "all",
  properties: defaultAllProperties,
  categoryResultLimits: defaultCategoryResultLimits,
}

export const filterToAlphanumeric = (text: string): string =>
  text.replace(/[^0-9a-zA-Z]/g, "")

export const isValidSearchQuery = ({ text }: SearchQuery): boolean =>
  isValidSearchText(text)

export const isValidSearchText = (text: string): boolean =>
  filterToAlphanumeric(text).length >= 2
