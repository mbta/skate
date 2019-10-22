import React, { ReactElement } from "react"
import SearchForm from "./searchForm"

const SearchPage = (): ReactElement<HTMLDivElement> => (
  <div className="c-page">
    <SearchForm />
    <div className="m-search-results" />
  </div>
)

export default SearchPage
