import { describe, expect, jest, test } from "@jest/globals"
import { Err, Ok, Result, isErr, isOk, map } from "../../src/util/result"

describe("Result<T, E>::isOk", () => {
  test("returns true for Ok<T>", () => {
    expect(isOk(Ok(undefined))).toBe(true)
  })
  test("returns false for Err<E>", () => {
    expect(isOk(Err(undefined))).toBe(false)
  })

  test("when `isOk`, allows accessing the internal value", () => {
    const value = Ok(10) as Result<number, unknown>

    expect(isOk(value) && value.ok).toEqual(10)
  })
})

describe("Result<T, E>::isErr", () => {
  test("returns true for Err<E>", () => {
    expect(isErr(Err(undefined))).toBe(true)
  })
  test("returns false for Ok<T>", () => {
    expect(isErr(Ok(undefined))).toBe(false)
  })

  test("when `isErr`, allows accessing the internal value", () => {
    const value = Err(10) as Result<unknown, number>

    expect(isErr(value) && value.err).toEqual(10)
  })
})

describe("Result<T, E>::map", () => {
  test("applies function if Ok<T>", () => {
    const fn = jest.fn(() => true)

    expect(map(Ok(undefined), fn)).toEqual(Ok(true))
    expect(fn).toHaveBeenCalledWith(undefined)
  })

  test("returns input if Err<E>", () => {
    const fn = jest.fn(() => false)

    expect(map(Err(true), fn)).toEqual(Err(true))
    expect(fn).not.toHaveBeenCalled()
  })
})
