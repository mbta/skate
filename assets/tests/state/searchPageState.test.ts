import {
  addSavedQuery,
  initialSearchPageState,
  reducer,
  SearchPageState,
  setSearchProperty,
  setSearchText,
  submitSearch,
} from "../../src/state/searchPageState"

describe("initialSearchPageState", () => {
  test("sets text to empty string", () => {
    expect(initialSearchPageState.query.text).toEqual("")
  })

  test("sets property to 'all'", () => {
    expect(initialSearchPageState.query.property).toEqual("all")
  })
})

describe("reducer", () => {
  test("setSearchText allows you to set text", () => {
    const newSearch = reducer(initialSearchPageState, setSearchText("new text"))

    expect(newSearch.query.text).toEqual("new text")
  })

  test("setSearchText sets isActive to false", () => {
    const activeSearch = {
      ...initialSearchPageState,
      isActive: true,
    }
    const newSearch = reducer(activeSearch, setSearchText("new text"))

    expect(newSearch.isActive).toEqual(false)
  })

  test("setSearchProperty allows you to set property", () => {
    const newSearch = reducer(initialSearchPageState, setSearchProperty("run"))

    expect(newSearch.query.property).toEqual("run")
  })

  test("setSearchProperty sets isActive to false", () => {
    const activeSearch = {
      ...initialSearchPageState,
      isActive: true,
    }
    const newSearch = reducer(activeSearch, setSearchProperty("run"))

    expect(newSearch.isActive).toEqual(false)
  })

  test("submitSearch sets isActive to true if the query is valid", () => {
    const validQuery: SearchPageState = {
      query: { text: "12", property: "run" },
      isActive: false,
      savedQueries: [],
    }
    const newSearch = reducer(validQuery, submitSearch())

    expect(newSearch.isActive).toEqual(true)
  })

  test("submitSearch does not set isActive to true if the query is invalid", () => {
    const invalidQuery: SearchPageState = {
      query: { text: "1", property: "run" },
      isActive: false,
      savedQueries: [],
    }
    const newSearch = reducer(invalidQuery, submitSearch())

    expect(newSearch.isActive).toEqual(false)
  })

  test("submitSearch saves the query if it's valid", () => {
    const validQuery: SearchPageState = {
      query: { text: "12", property: "run" },
      isActive: false,
      savedQueries: [],
    }
    const newSearch = reducer(validQuery, submitSearch())

    expect(newSearch.savedQueries).toEqual([{ text: "12" }])
  })

  test("submitSearch does not save the query if it's not valid", () => {
    const invalidQuery: SearchPageState = {
      query: { text: "1", property: "run" },
      isActive: false,
      savedQueries: [],
    }
    const newSearch = reducer(invalidQuery, submitSearch())

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

  test("caps at 10 saved queries", () => {
    expect(
      addSavedQuery(
        [
          { text: "j" },
          { text: "i" },
          { text: "h" },
          { text: "g" },
          { text: "f" },
          { text: "e" },
          { text: "d" },
          { text: "c" },
          { text: "b" },
          { text: "a" },
        ],
        { text: "k" }
      )
    ).toEqual([
      { text: "k" },
      { text: "j" },
      { text: "i" },
      { text: "h" },
      { text: "g" },
      { text: "f" },
      { text: "e" },
      { text: "d" },
      { text: "c" },
      { text: "b" },
    ])
  })
})
