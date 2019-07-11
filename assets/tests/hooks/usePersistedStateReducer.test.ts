import { renderHook } from "react-hooks-testing-library"
import usePersistedStateReducer, {
  filter,
} from "../../src/hooks/usePersistedStateReducer"
import { Reducer, State } from "../../src/state"

// tslint:disable: react-hooks-nesting

const reducer: Reducer = (state, _action) => state

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
}

describe("usePersistedStateReducer", () => {
  const originalLocalStorage = window.localStorage

  beforeAll(() => {
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
    })
    jest
      .spyOn(window.localStorage, "getItem")
      .mockImplementation((_stateKey: string) => null)
  })

  afterAll(() => {
    Object.defineProperty(window, "localStorage", originalLocalStorage)
  })

  test("initializes the state with the given initial value", () => {
    const initialState: State = {
      selectedRouteIds: ["1", "2"],
      selectedVehicleId: "2",
    }

    const { result } = renderHook(() =>
      usePersistedStateReducer(reducer, initialState)
    )
    const [state, dispatch] = result.current

    expect(state).toEqual(initialState)
    expect(typeof dispatch).toEqual("function")
  })

  test("loads initial state from local storage", () => {
    jest
      .spyOn(window.localStorage, "getItem")
      .mockImplementation(
        (_stateKey: string) => '{"selectedRouteIds":["28","39"]}'
      )

    const initialState: State = {
      selectedRouteIds: ["1", "2"],
      selectedVehicleId: "2",
    }
    const expectedState: State = {
      selectedRouteIds: ["28", "39"],
      selectedVehicleId: "2",
    }

    const { result } = renderHook(() =>
      usePersistedStateReducer(reducer, initialState)
    )
    const [state] = result.current

    expect(state).toEqual(expectedState)
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
