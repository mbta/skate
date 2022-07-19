import { renderHook } from "@testing-library/react-hooks"
import useAppcues, { cleanUsername } from "../../src/hooks/useAppcues"

// Indicate that the file is a module so we can declare global
export {}

declare global {
  interface Window {
    Appcues?: {
      identify: (shortUsername: string) => void
      page: () => void
      show: (id: string) => void
    }
    username: string
  }
}

const mockLocation = {
  pathname: "/",
  hash: "",
  search: "",
  state: "",
}
jest.mock("react-router-dom", () => ({
  useLocation: jest.fn().mockImplementation(() => mockLocation),
}))

window.Appcues = {
  identify: jest.fn(),
  page: jest.fn(),
  show: jest.fn(),
}

describe("useAppcues", () => {

  const originalQuerySelector = document.querySelector

  afterEach(() => {
    document.querySelector = originalQuerySelector
  })


  test("calls Appcues page on load", () => {
    renderHook(() => useAppcues())

    expect(window.Appcues!.page).toHaveBeenCalled()
  })

  test("calls Appcues indentify with the clean username on load", () => {

    document.querySelector = () => ({ getAttribute: () => "jdoe" })

    renderHook(() => useAppcues())

    expect(window.Appcues!.identify).toHaveBeenCalledWith("jdoe")
  })
})

describe("cleanUsername", () => {
  test("strips the prefix from the ActiveDirectory username", () => {
    const usernameWithPrefix = "mbta-active-directory_jdoe"
    const expected = "jdoe"

    expect(cleanUsername(usernameWithPrefix)).toEqual(expected)
  })

  test("doesn't affect a username without the ActiveDirectory prefix", () => {
    expect(cleanUsername("jdoe")).toEqual("jdoe")
  })
})
