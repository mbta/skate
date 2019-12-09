import {
  addSavedQuery,
  initialSearch,
  reducer,
  Search,
  setSearchProperty,
  setSearchText,
  submitSearch,
} from "../../src/models/search"

describe("initialSearch", () => {
  test("sets text to empty string", () => {
    expect(initialSearch.query.text).toEqual("")
  })

  test("sets property to 'all'", () => {
    expect(initialSearch.query.property).toEqual("all")
  })
})

describe("reducer", () => {
  test("setSearchText allows you to set text", () => {
    const newSearch = reducer(initialSearch, setSearchText("new text"))

    expect(newSearch.query.text).toEqual("new text")
  })

  test("setSearchText sets isActive to false", () => {
    const activeSearch = {
      ...initialSearch,
      isActive: true,
    }
    const newSearch = reducer(activeSearch, setSearchText("new text"))

    expect(newSearch.isActive).toEqual(false)
  })

  test("setSearchProperty allows you to set property", () => {
    const newSearch = reducer(initialSearch, setSearchProperty("run"))

    expect(newSearch.query.property).toEqual("run")
  })

  test("setSearchProperty sets isActive to false", () => {
    const activeSearch = {
      ...initialSearch,
      isActive: true,
    }
    const newSearch = reducer(activeSearch, setSearchProperty("run"))

    expect(newSearch.isActive).toEqual(false)
  })

  test("submitSearch sets isActive to true if the query is valid", () => {
    const validSearch: Search = {
      query: { text: "12", property: "run" },
      isActive: false,
      savedQueries: [],
    }
    const newSearch = reducer(validSearch, submitSearch())

    expect(newSearch.isActive).toEqual(true)
  })

  test("submitSearch does not set isActive to true if the query is invalid", () => {
    const invalidSearch: Search = {
      query: { text: "1", property: "run" },
      isActive: false,
      savedQueries: [],
    }
    const newSearch = reducer(invalidSearch, submitSearch())

    expect(newSearch.isActive).toEqual(false)
  })

  test("submitSearch saves the query if it's valid", () => {
    const validSearch: Search = {
      query: { text: "12", property: "run" },
      isActive: false,
      savedQueries: [],
    }
    const newSearch = reducer(validSearch, submitSearch())

    expect(newSearch.savedQueries).toEqual([{ text: "12" }])
  })

  test("submitSearch does not save the query if it's not valid", () => {
    const invalidSearch: Search = {
      query: { text: "1", property: "run" },
      isActive: false,
      savedQueries: [],
    }
    const newSearch = reducer(invalidSearch, submitSearch())

    expect(newSearch.savedQueries).toEqual([])
  })
})

describe("addSavedQuery", () => {
  test("can save a first query", () => {
    expect(addSavedQuery([], { text: "a" })).toEqual([{ text: "a" }])
  })

  test("can save subsequent queries", () => {
    expect(addSavedQuery([{ text: "a" }], { text: "b" })).toEqual([
      { text: "b" },
      { text: "a" },
    ])
  })

  test("if there are duplicates, drops the old query", () => {
    expect(
      addSavedQuery([{ text: "b" }, { text: "a" }], { text: "a" })
    ).toEqual([{ text: "a" }, { text: "b" }])
  })

  test("caps at 5 saved queries", () => {
    expect(
      addSavedQuery(
        [
          { text: "e" },
          { text: "d" },
          { text: "c" },
          { text: "b" },
          { text: "a" },
        ],
        { text: "f" }
      )
    ).toEqual([
      { text: "f" },
      { text: "e" },
      { text: "d" },
      { text: "c" },
      { text: "b" },
    ])
  })
})
