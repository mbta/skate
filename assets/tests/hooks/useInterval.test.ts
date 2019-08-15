import { renderHook } from "@testing-library/react-hooks"
import useInterval from "../../src/hooks/useInterval"

// tslint:disable: react-hooks-nesting

jest.useFakeTimers()

describe("useInterval", () => {
  test("sets an interval to call the callback after a delay", () => {
    const callback = jest.fn()

    renderHook(() => useInterval(callback, 1000))

    jest.runOnlyPendingTimers()

    expect(callback).toHaveBeenCalledTimes(1)
  })

  test("allows you to pause the interval by passing null for the delay", () => {
    const callback = jest.fn()

    renderHook(() => useInterval(callback, null))

    jest.runOnlyPendingTimers()

    expect(callback).not.toHaveBeenCalled()
  })
})
