import {
  initialSearch,
  isValidSearch,
  reducer,
  Search,
  setSearchProperty,
  setSearchText,
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

  test("setSearchProperty allows you to set property", () => {
    const newSearch = reducer(initialSearch, setSearchProperty("run"))

    expect(newSearch.property).toEqual("run")
  })
})

describe("isValidSearch", () => {
  test("returns true if the search text contains at least 2 characters", () => {
    const validSearch: Search = {
      text: "12",
      property: "run",
    }

    expect(isValidSearch(validSearch)).toBeTruthy()
  })

  test("returns false if the search text contains fewer than 2 characters", () => {
    const invalidSearch: Search = {
      text: "1",
      property: "run",
    }

    expect(isValidSearch(invalidSearch)).toBeFalsy()
  })
})
