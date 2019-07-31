import { partition } from "../../src/helpers/array"

describe("partition", () => {
  test("partitions elements that the test function evaluates to true into the first bucket, else to the second bucket", () => {
    const numbers = [1, 2, 3, 4, 5, 6]
    const isOddFn = (num: number): boolean => num % 2 === 1

    const oddNumbers = [1, 3, 5]
    const evenNumbers = [2, 4, 6]

    expect(partition(numbers, isOddFn)).toEqual([oddNumbers, evenNumbers])
  })
})
