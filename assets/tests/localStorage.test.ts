import { filter, loadState, saveState } from "../src/localStorage"

const APP_STATE_KEY = "test-mbta-skate-state"

const PERSISTED_KEYS = ["selectedRouteIds"]

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
}

describe("saveState", () => {
  const originalLocalStorage = window.localStorage

  beforeAll(() => {
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
    })
  })

  afterAll(() => {
    Object.defineProperty(window, "localStorage", originalLocalStorage)
  })

  test("saves stringified state to local storage", () => {
    const state = { selectedRouteIds: ["28", "39"] }
    saveState(APP_STATE_KEY, state, PERSISTED_KEYS)

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
    saveState(APP_STATE_KEY, state, PERSISTED_KEYS)

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      APP_STATE_KEY,
      '{"selectedRouteIds":["28","39"]}'
    )
  })
})

describe("loadState", () => {
  const originalLocalStorage = window.localStorage

  beforeAll(() => {
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
    })
  })

  afterAll(() => {
    Object.defineProperty(window, "localStorage", originalLocalStorage)
  })

  test("returns saved state from local storage", () => {
    jest
      .spyOn(window.localStorage, "getItem")
      .mockImplementation(
        (_stateKey: string) => '{"selectedRouteIds":["28","39"]}'
      )

    const expectedState = { selectedRouteIds: ["28", "39"] }

    expect(loadState(APP_STATE_KEY)).toEqual(expectedState)
  })

  test("returns undefined if there is no saved state in local storage", () => {
    jest
      .spyOn(window.localStorage, "getItem")
      .mockImplementation((_stateKey: string) => null)

    expect(loadState(APP_STATE_KEY)).toBeUndefined()
  })
})

describe("filter", () => {
  const originalLocalStorage = window.localStorage

  beforeAll(() => {
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
    })
  })

  afterAll(() => {
    Object.defineProperty(window, "localStorage", originalLocalStorage)
  })

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
