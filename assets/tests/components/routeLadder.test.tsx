import { mount } from "enzyme"
import React from "react"
import renderer, { act } from "react-test-renderer"
import RouteLadder from "../../src/components/routeLadder"
import DispatchProvider from "../../src/providers/dispatchProvider"
import { Route } from "../../src/skate"
import { deselectRoute } from "../../src/state"

declare global {
  interface Window {
    /* eslint-disable typescript/no-explicit-any */
    fetch: (uri: string) => Promise<any>
  }
}

test("renders a route ladder", () => {
  const route: Route = { id: "28" }
  const timepoints = [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }]

  const tree = renderer
    .create(<RouteLadder route={route} timepoints={timepoints} />)
    .toJSON()

  expect(tree).toMatchSnapshot()
})

test("displays loading if we are fetching the timepoints", () => {
  const route: Route = { id: "28" }
  const timepoints = null

  const tree = renderer
    .create(<RouteLadder route={route} timepoints={timepoints} />)
    .toJSON()

  expect(tree).toMatchSnapshot()
})

test("fetches timepoints for this route if we don't yet have them", () => {
  const mockDispatch = jest.fn()
  const route: Route = { id: "28" }
  const timepoints = undefined

  window.fetch = () =>
    Promise.resolve({
      json: () => ({
        data: ["MATPN", "WELLH", "MORTN"],
      }),
      ok: true,
      status: 200,
    })

  act(() => {
    renderer
      .create(
        <DispatchProvider dispatch={mockDispatch}>
          <RouteLadder route={route} timepoints={timepoints} />
        </DispatchProvider>
      )
      .toJSON()
  })

  expect(mockDispatch.mock.calls.length).toBe(1)
  expect(mockDispatch.mock.calls[0][0]).toEqual({
    payload: { routeId: "28" },
    type: "SET_LOADING_TIMEPOINTS_FOR_ROUTE",
  })
})

test("does not fetch timepoints for this route if we are currently loading them", () => {
  const mockDispatch = jest.fn()
  const route: Route = { id: "28" }
  const timepoints = null

  act(() => {
    renderer
      .create(
        <DispatchProvider dispatch={mockDispatch}>
          <RouteLadder route={route} timepoints={timepoints} />
        </DispatchProvider>
      )
      .toJSON()
  })

  expect(mockDispatch.mock.calls.length).toBe(0)
})

test("clicking the close button deselects that route", () => {
  const mockDispatch = jest.fn()
  const route: Route = { id: "28" }
  const timepoints = [{ id: "MATPN" }, { id: "WELLH" }, { id: "MORTN" }]

  const wrapper = mount(
    <DispatchProvider dispatch={mockDispatch}>
      <RouteLadder route={route} timepoints={timepoints} />
    </DispatchProvider>
  )
  wrapper.find(".m-route-ladder__close").simulate("click")

  expect(mockDispatch).toHaveBeenCalledWith(deselectRoute("28"))
})
