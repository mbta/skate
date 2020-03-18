import { className } from "../../src/helpers/dom"

describe("className", () => {
  test("combine a list of class names into a single string", () => {
    expect(className(["foo", "bar"])).toEqual("foo bar")
  })

  test("filters out empty strings", () => {
    expect(className(["foo", "bar", ""])).toEqual("foo bar")
  })
})
