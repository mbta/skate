import { partition, uniq } from "../../src/helpers/array"

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
