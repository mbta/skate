import { Factory } from "fishery"
import { SearchQuery, SearchQueryType } from "../../src/models/searchQuery"

export class SearchQueryFactory extends Factory<SearchQuery> {
  searchType(property: SearchQueryType) {
    return this.params({ property })
  }

  // forProperty()
}

export const searchQueryAllFactory = SearchQueryFactory.define(
  ({ sequence }) => ({
    property: "all" as SearchQueryType,
    text: sequence.toString(),
  })
)

export const emptySearchQueryFactory = searchQueryAllFactory.params({
  text: "",
})
