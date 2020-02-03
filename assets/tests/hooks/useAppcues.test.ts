import { renderHook } from "@testing-library/react-hooks"
import useAppcues from "../../src/hooks/useAppcues"

// Indicate that the file is a module so we can declare global
export {}

// tslint:disable: react-hooks-nesting

declare global {
  interface Window {
    /* eslint-disable typescript/no-explicit-any */
    Appcues?: {
      identify: (userId: string) => void
      page: () => void
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

window.username = "test user"
window.Appcues = {
  identify: jest.fn(),
  page: jest.fn(),
}

describe("useAppcues", () => {
  test("calls Appcues page on load", () => {
    renderHook(() => useAppcues())

    expect(window.Appcues!.page).toHaveBeenCalled()
  })

  test("calls Appcues indentify with the username on load", () => {
    renderHook(() => useAppcues())

    expect(window.Appcues!.identify).toHaveBeenCalledWith("test user")
  })
})
