import {
  jest,
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
} from "@jest/globals"
import { loadState, saveState } from "../src/localStorage"

const APP_STATE_KEY = "test-mbta-skate-state"

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
    saveState(APP_STATE_KEY, state)

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
