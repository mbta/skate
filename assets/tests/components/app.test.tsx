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

test("doesn't re-fetch routes", () => {
  const mockFetchRoutes = jest.spyOn(Api, "fetchRoutes")
  const mockFetchRoutesImplementation: () => Promise<Route[]> = () => ({
    [Symbol.toStringTag]: "Promise",
    catch: jest.fn(),
    finally: jest.fn(),
    then: jest.fn(),
  })
  mockFetchRoutes.mockImplementation(mockFetchRoutesImplementation)

  const numCallsBefore = (Api.fetchRoutes as jest.Mock).mock.calls.length

  act(() => {
    const app = mount(<App />)
    app.update()
  })

  const numCallsAfter = (Api.fetchRoutes as jest.Mock).mock.calls.length
  expect(numCallsAfter - numCallsBefore).toBe(1)
})
