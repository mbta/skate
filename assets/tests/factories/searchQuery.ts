import { Factory } from "fishery"
import {
  emptySearchQuery,
  SearchQuery,
  OldSearchPropertyQuery,
  SearchProperty,
} from "../../src/models/searchQuery"

class SearchQueryFactory extends Factory<SearchQuery> {
  searchType(property: OldSearchPropertyQuery | SearchProperty) {
    return this.params({ property })
  }

  searchFor(text: string) {
    return this.params({ text })
  }
}

const searchQueryFactory = SearchQueryFactory.define(() => ({
  ...emptySearchQuery,
}))

export const searchQueryAllFactory = searchQueryFactory.searchType("all")

export const searchQueryOperatorFactory =
  searchQueryFactory.searchType("operator")

export const searchQueryRunFactory = searchQueryFactory.searchType("run")

export const searchQueryVehicleFactory =
  searchQueryFactory.searchType("vehicle")

export const searchQueryLocationFactory =
  searchQueryFactory.searchType("location")

export const emptySearchQueryFactory = searchQueryFactory
