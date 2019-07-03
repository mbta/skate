import { filter, loadState, saveState } from "../src/localStorage"

const APP_STATE_KEY = "mbta-skate-state"

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
}
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
})

describe("saveState", () => {
  test("saves stringified state to local storage", () => {
    const state = { selectedRouteIds: ["28", "39"] }
    saveState(state)

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      APP_STATE_KEY,
      '{"selectedRouteIds":["28","39"]}'
    )
  })

  test("only saves defined saved keys", () => {
    const state = {
      foo: "bar",
      selectedRouteIds: ["28", "39"],
    }
    saveState(state)

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      APP_STATE_KEY,
      '{"selectedRouteIds":["28","39"]}'
    )
  })
})

describe("loadState", () => {
  test("returns saved state from local storage", () => {
    jest
      .spyOn(window.localStorage, "getItem")
      .mockImplementation(
        (_stateKey: string) => '{"selectedRouteIds":["28","39"]}'
      )

    const expectedState = { selectedRouteIds: ["28", "39"] }

    expect(loadState()).toEqual(expectedState)
  })

  test("returns undefined if there is no saved state in local storage", () => {
    jest
      .spyOn(window.localStorage, "getItem")
      .mockImplementation((_stateKey: string) => null)

    expect(loadState()).toBeUndefined()
  })
})

describe("filter", () => {
  test("filters an object by allowed keys", () => {
    const originalObject = {
      one: 1,
      two: 2,
      three: 3,
    }
    const allowedKeys = ["one", "three"]
    const expected = {
      one: 1,
      three: 3,
    }

    expect(filter(originalObject, allowedKeys)).toEqual(expected)
  })
})
