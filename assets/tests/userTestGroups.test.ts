import { StructError } from "superstruct"
import appData from "../src/appData"
import inTestGroup from "../src/userTestGroups"

jest.mock("appData")

describe("User Test Groups API", () => {
  test("raise error when given wrong json data type", () => {
    ;(appData as jest.Mock)
      .mockImplementationOnce(() => ({
        // Wrong data type
        userTestGroups: null,
      }))
      .mockImplementationOnce(() => ({
        // Wrong data type
        userTestGroups: "1.0",
      }))
      .mockImplementation(() => ({
        // Wrong data type
        userTestGroups: "{}",
      }))

    // Start with no groups or keys
    expect(() => inTestGroup("non-existent-group")).toThrow(StructError)
    expect(() => inTestGroup("non-existent-group")).toThrow(StructError)
    expect(() => inTestGroup("non-existent-group")).toThrow(StructError)
  })

  test("raise error when given invalid json", () => {
    ;(appData as jest.Mock)
      .mockImplementationOnce(() => ({
        userTestGroups: "asdf1234!@#$",
      }))
      .mockImplementationOnce(() => ({
        userTestGroups: [1, 2, 3],
      }))
      .mockImplementation(() => ({
        userTestGroups: "",
      }))

    expect(() => inTestGroup("non-existent-group")).toThrow(SyntaxError)
    expect(() => inTestGroup("non-existent-group")).toThrow(SyntaxError)
    expect(() => inTestGroup("non-existent-group")).toThrow(SyntaxError)
  })

  test("confirm user is not in test group when missing user test group information", () => {
    // Missing data key
    ;(appData as jest.Mock).mockImplementation(() => {})

    expect(inTestGroup("non-existent-group")).toBe(false)
  })

  test("confirm user in multiple test groups", () => {
    const group_1 = "user-test-group-1"
    const group_2 = "user-test-group-2"
    ;(appData as jest.Mock).mockImplementation(() => ({
      userTestGroups: JSON.stringify([group_1, group_2]),
    }))

    expect(inTestGroup(group_1)).toBe(true)
    expect(inTestGroup(group_2)).toBe(true)
    expect(inTestGroup(group_1 + group_2)).toBe(false)
  })
})
