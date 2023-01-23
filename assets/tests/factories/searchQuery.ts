import { Factory } from "fishery"
import {
  emptySearchQuery,
  SearchQuery,
  SearchQueryType,
} from "../../src/models/searchQuery"

class SearchQueryFactory extends Factory<SearchQuery> {
  searchType(property: SearchQueryType) {
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

export const emptySearchQueryFactory = searchQueryFactory
