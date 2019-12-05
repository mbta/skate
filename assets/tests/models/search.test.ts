import {
  addSavedSearch,
  initialSearch,
  isValidSearch,
  reducer,
  Search,
  setSearchProperty,
  setSearchText,
  submitSearch,
} from "../../src/models/search"

describe("initialSearch", () => {
  test("returns a Search", () => {
    expect(initialSearch.hasOwnProperty("text")).toBeTruthy()
    expect(initialSearch.hasOwnProperty("property")).toBeTruthy()
  })

  test("sets text to empty string", () => {
    expect(initialSearch.text).toEqual("")
  })

  test("sets property to 'all'", () => {
    expect(initialSearch.property).toEqual("all")
  })
})

describe("reducer", () => {
  test("setSearchText allows you to set text", () => {
    const newSearch = reducer(initialSearch, setSearchText("new text"))

    expect(newSearch.text).toEqual("new text")
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

    expect(newSearch.property).toEqual("run")
  })

  test("setSearchProperty sets isActive to false", () => {
    const activeSearch = {
      ...initialSearch,
      isActive: true,
    }
    const newSearch = reducer(activeSearch, setSearchProperty("run"))

    expect(newSearch.isActive).toEqual(false)
  })

  test("submitSearch sets isActive to true if the search is valid", () => {
    const validSearch: Search = {
      text: "12",
      property: "run",
      isActive: false,
      savedSearches: [],
    }
    const newSearch = reducer(validSearch, submitSearch())

    expect(newSearch.isActive).toEqual(true)
  })

  test("submitSearch does not set isActive to true if the search is invalid", () => {
    const invalidSearch: Search = {
      text: "1",
      property: "run",
      isActive: false,
      savedSearches: [],
    }
    const newSearch = reducer(invalidSearch, submitSearch())

    expect(newSearch.isActive).toEqual(false)
  })

  test("submitSearch saves the search if it's valid", () => {
    const validSearch: Search = {
      text: "12",
      property: "run",
      isActive: false,
      savedSearches: [],
    }
    const newSearch = reducer(validSearch, submitSearch())

    expect(newSearch.savedSearches).toEqual([{ text: "12" }])
  })

  test("submitSearch does not save the search if it's not valid", () => {
    const invalidSearch: Search = {
      text: "1",
      property: "run",
      isActive: false,
      savedSearches: [],
    }
    const newSearch = reducer(invalidSearch, submitSearch())

    expect(newSearch.savedSearches).toEqual([])
  })
})

describe("isValidSearch", () => {
  test("returns true if the search text contains at least 2 characters", () => {
    const validSearch: Search = {
      text: "12",
      property: "run",
      isActive: false,
      savedSearches: [],
    }

    expect(isValidSearch(validSearch)).toBeTruthy()
  })

  test("returns false if the search text contains fewer than 2 characters", () => {
    const invalidSearch: Search = {
      text: "1",
      property: "run",
      isActive: false,
      savedSearches: [],
    }

    expect(isValidSearch(invalidSearch)).toBeFalsy()
  })

  test("returns false if the search contains more than 2 characters but they're not alphanumeric", () => {
    const invalidSearch: Search = {
      text: " -1 -",
      property: "run",
      isActive: false,
      savedSearches: [],
    }

    expect(isValidSearch(invalidSearch)).toBeFalsy()
  })
})

describe("addSavedSearch", () => {
  test("can save a first search", () => {
    expect(addSavedSearch([], { text: "a" })).toEqual([{ text: "a" }])
  })

  test("can save subsequent searches", () => {
    expect(addSavedSearch([{ text: "a" }], { text: "b" })).toEqual([
      { text: "b" },
      { text: "a" },
    ])
  })

  test("if there are duplicates, drops the old search", () => {
    expect(
      addSavedSearch([{ text: "b" }, { text: "a" }], { text: "a" })
    ).toEqual([{ text: "a" }, { text: "b" }])
  })

  test("caps at 5 saved searches", () => {
    expect(
      addSavedSearch(
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
