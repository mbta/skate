import { describe, test, expect } from "@jest/globals"
import { joinClasses } from "../../src/helpers/dom"

describe("joinClasses", () => {
  test("combine a list of class names into a single string", () => {
    expect(joinClasses(["foo", "bar"])).toEqual("foo bar")
  })

  test("filters out empty strings", () => {
    expect(joinClasses(["foo", "bar", ""])).toEqual("foo bar")
  })
})
