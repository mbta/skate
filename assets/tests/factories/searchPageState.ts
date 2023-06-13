import { Factory } from "fishery"
import { SearchPageState } from "../../src/state/searchPageState"
import { emptySearchQueryFactory, searchQueryAllFactory } from "./searchQuery"

export const searchPageStateFactory = Factory.define<SearchPageState>(() => ({
  query: emptySearchQueryFactory.build(),
  isActive: false,
  savedQueries: [],
}))

export const activeSearchPageStateFactory = searchPageStateFactory.params({
  isActive: true,
  query: searchQueryAllFactory.build(),
})
