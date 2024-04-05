import { describe, expect, jest, test } from "@jest/globals"
import { act, renderHook, waitFor } from "@testing-library/react"
import { useApiCall } from "../../src/hooks/useApiCall"

const renderUseApiCall = (initialProps: Parameters<typeof useApiCall>[0]) =>
  renderHook(useApiCall, {
    initialProps,
  })

const PromiseWithResolvers = <T>(): {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: any) => void
} => {
  let resolve: ((value: T | PromiseLike<T>) => void) | undefined = undefined
  let reject: ((reason?: any) => void) | undefined = undefined
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  if (resolve === undefined || reject === undefined) {
    throw Error("Promise failed to assign `resolve` and/or `reject`")
  }

  return { promise, resolve, reject }
}

describe("when first rendered", () => {
  test("should return loading state", () => {
    const { result } = renderUseApiCall({
      apiCall: () => new Promise(() => {}),
    })

    expect(result.current?.isLoading).toBe(true)
  })

  test("should call the input function", () => {
    const fn = jest.fn(() => new Promise(() => {}))

    renderUseApiCall({
      apiCall: fn,
    })

    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe("when the input function changes", () => {
  test("should change to loading state", async () => {
    const fn = jest.fn(() => Promise.resolve(undefined))
    const fn2 = jest.fn(() => Promise.resolve(undefined))

    const { result, rerender } = renderUseApiCall({
      apiCall: fn,
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false), {
      interval: 1,
    })

    rerender({ apiCall: fn2 })

    await waitFor(() => expect(result.current.isLoading).toBe(true), {
      interval: 1,
    })

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledTimes(1)
  })

  test("should call the input function", () => {
    const fn = jest.fn(() => new Promise(() => {}))
    const fn2 = jest.fn(() => new Promise(() => {}))

    const { rerender } = renderUseApiCall({
      apiCall: fn,
    })

    rerender({ apiCall: fn2 })

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledTimes(1)
  })

  test("should return the previous result until promise resolves", async () => {
    const fn = jest.fn(() => Promise.resolve("first result"))
    const fn2 = jest.fn(() => Promise.resolve("second result"))

    const { result, rerender } = renderUseApiCall({
      apiCall: fn,
    })

    await waitFor(() => expect(result.current.result).toBe("first result"), {
      interval: 1,
    })

    rerender({ apiCall: fn2 })

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(true)
        expect(result.current.result).toBe("first result")
      },
      { interval: 1 }
    )

    await waitFor(() => expect(result.current.result).toBe("second result"), {
      interval: 1,
    })

    expect(result.current.isLoading).toBe(false)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledTimes(1)
  })

  test("previous functions that resolve out of order should not change the return value", async () => {
    const { promise, resolve } = PromiseWithResolvers()

    const fn = jest.fn(() => promise)
    const fn2 = jest.fn(() => Promise.resolve("second result"))

    const { result, rerender } = renderUseApiCall({
      apiCall: fn,
    })

    rerender({ apiCall: fn2 })

    await waitFor(() => expect(result.current.result).toBe("second result"), {
      interval: 1,
    })

    act(() => {
      resolve("first result")
    })

    expect(result.current.result).toBe("second result")

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledTimes(1)
  })
})

describe("when the input function does not change", () => {
  test("should not call the input function again", () => {
    const apiCall = jest.fn(() => new Promise(() => {}))
    const initialProps = { apiCall }

    const { rerender } = renderUseApiCall({
      apiCall,
    })

    rerender(initialProps)

    expect(apiCall).toHaveBeenCalledTimes(1)
  })

  test("should return last result", async () => {
    const apiCall = jest.fn(() => Promise.resolve("result"))
    const initialProps = { apiCall }

    const { rerender, result } = renderUseApiCall({
      apiCall,
    })

    rerender(initialProps)

    await waitFor(() => expect(result.current.result).toEqual("result"), {
      interval: 1,
    })
  })
})

describe("when unmounted", () => {
  test("input function receives cancelation signal", () => {
    const apiCall = async (abortSignal: AbortSignal): Promise<void> => {
      await waitFor(() => expect(abortSignal.aborted).toBe(true), {
        interval: 1,
      })
    }

    const { unmount } = renderUseApiCall({
      apiCall,
    })

    unmount()
  })
})

describe("when function throws an error", () => {
  test.failing("should return isLoading=false", async () => {
    const fn = jest.fn(() =>
      // Create a rejected promise
      Promise.reject("my reason")
      // It's the callers job to catch it
      // .catch(() => {})
    )

    const { result } =
     renderUseApiCall({
      apiCall: fn,
    })

    await waitFor(() => expect(result.current.isLoading).toBe(true))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  test.skip("previous functions that resolve out of order should not change the return value", async () => {
    const fn = jest.fn(() => Promise.reject("my reason"))

    const { result } = renderUseApiCall({
      apiCall: fn,
    })



    await waitFor(() => expect(result.current.result).toBe("second result"), {
      interval: 1,
    })

    expect(result.current.result).toBe("second result")

    expect(fn).toHaveBeenCalledTimes(1)
  })
})

