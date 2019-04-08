import jest from "jest"
import { fetchRoutes } from "../src/api"

const mockFetch = data =>
  jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => data,
    }),
  )

// const mockFetch = data =>
// jest.fn().mockImplementation(() =>
//   Promise.resolve({
//     ok: true,
//     status: 200,
//     json: () => data,
//   }),
// )

describe("fetchRoutes", () => {
  it("fetches route data", () => {
    window.fetch = mockFetch({
      data: [
        { id: "28" },
        { id: "39" },
        { id: "71" },
        { id: "73" },
        { id: "111" },
      ],
    })

    const routes = fetchRoutes()

    expect(routes).toEqual([
      { id: "28" },
      { id: "39" },
      { id: "71" },
      { id: "73" },
      { id: "111" },
    ])

    // expect(window.fetch).toHaveBeenCalledTimes(1)
    expect(mockFetch.mock.calls.length).toBe(2)
  })
})
