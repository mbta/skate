import { describe, test, expect } from "@jest/globals"
import {
  equalByElements,
  flatten,
  intersperseString,
  partition,
  uniq,
  uniqBy,
} from "../../src/helpers/array"

describe("partition", () => {
  test("partitions elements that the test function evaluates to true into the first bucket, else to the second bucket", () => {
    const numbers = [1, 2, 3, 4, 5, 6]
    const isOddFn = (num: number): boolean => num % 2 === 1

    const oddNumbers = [1, 3, 5]
    const evenNumbers = [2, 4, 6]

    expect(partition(numbers, isOddFn)).toEqual([oddNumbers, evenNumbers])
  })
})

describe("uniq", () => {
  test("empty case", () => {
    expect(uniq([])).toEqual([])
  })

  test("removes duplicate values", () => {
    expect(uniq(["1", "1"])).toEqual(["1"])
  })

  test("keeps different values", () => {
    expect(uniq(["1", "2"])).toEqual(["1", "2"])
  })

  test("sorts output", () => {
    expect(uniq(["2", "1"])).toEqual(["1", "2"])
  })

  test("removes duplicate values even if they're not next to each other", () => {
    expect(uniq(["1", "3", "2", "3", "1", "1"])).toEqual(["1", "2", "3"])
  })
})

describe("uniqBy", () => {
  test("removes values with duplicated function results", () => {
    expect(uniqBy([4, 6], (n) => n % 2 === 0)).toEqual([4])
  })

  test("keeps values with distinct function results", () => {
    expect(uniqBy([4, 5], (n) => n % 2 === 0)).toEqual([4, 5])
  })
})

describe("flatten", () => {
  test("empty case", () => {
    expect(flatten([])).toEqual([])
  })

  test("children are empty", () => {
    expect(flatten([[], []])).toEqual([])
  })

  test("flattens children", () => {
    expect(flatten([[1, 2], [], [3, 4, 5], [6]])).toEqual([1, 2, 3, 4, 5, 6])
  })
})

describe("intersperseString", () => {
  test("empty", () => {
    expect(intersperseString("", "")).toEqual("")
    expect(intersperseString("abc", "")).toEqual("abc")
    expect(intersperseString("", "--")).toEqual("")
  })

  test("intersperses the delimiter", () => {
    expect(intersperseString("abc", "--")).toEqual("a--b--c")
  })
})

describe("equalByElements", () => {
  test("returns true with equal elements", () => {
    expect(equalByElements(["a", "b"], ["a", "b"])).toBeTruthy()
  })

  test("returns true with equal elements according to provided function", () => {
    expect(
      equalByElements([3, 7], [13, 17], (x, y) => x % 10 === y % 10)
    ).toBeTruthy()
  })

  test("returns false with the same elements in different order", () => {
    expect(equalByElements(["a", "b"], ["b", "a"])).toBeFalsy()
  })

  test("returns false with same length but different elements", () => {
    expect(equalByElements(["a", "b"], ["c", "d"])).toBeFalsy()
  })

  test("returns false with same length but different elements according to provided function", () => {
    expect(
      equalByElements([3, 7], [14, 18], (x, y) => x % 10 === y % 10)
    ).toBeFalsy()
  })

  test("returns false with different length", () => {
    expect(equalByElements(["a", "b"], ["c"])).toBeFalsy()
  })
})
