import { mount } from "enzyme"
import React from "react"
import renderer, { act } from "react-test-renderer"
import * as Api from "../../src/api"
import App from "../../src/components/app"
import { Route } from "../../src/skate"

jest.mock("../../src/api")

test("renders", () => {
  const tree = renderer.create(<App />).toJSON()

  expect(tree).toMatchSnapshot()
})

test("fetches routes", () => {
  const mockFetchRoutes = jest.spyOn(Api, "fetchRoutes")
  const mockFetchRoutesImplementation: () => Promise<Route[]> = () => ({
    [Symbol.toStringTag]: "Promise",
    catch: jest.fn(),
    finally: jest.fn(),
    then: jest.fn(),
  })
  mockFetchRoutes.mockImplementation(mockFetchRoutesImplementation)

  act(() => {
    mount(<App />)
  })

  expect(mockFetchRoutes).toHaveBeenCalled()
})
