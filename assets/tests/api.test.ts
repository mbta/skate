import { fetchRoutes, fetchTimepointsForRoute } from "../src/api"

declare global {
  interface Window {
    /* eslint-disable typescript/no-explicit-any */
    fetch: (uri: string) => Promise<any>
  }
}

describe("fetchRoutes", () => {
  test("fetches a list of routes", done => {
    window.fetch = () =>
      Promise.resolve({
        json: () => ({
          data: [{ id: "28" }, { id: "39" }, { id: "71" }],
        }),
        ok: true,
        status: 200,
      })

    fetchRoutes().then(routes => {
      expect(routes).toEqual([{ id: "28" }, { id: "39" }, { id: "71" }])
      done()
    })
  })

  test("throws an error if the response status is not 200", done => {
    window.fetch = () =>
      Promise.resolve({
        json: () => ({ data: null }),
        ok: false,
        status: 500,
      })

    fetchRoutes()
      .then(() => done("fetchRoutes did not throw an error"))
      .catch(error => {
        expect(error).not.toBeUndefined()
        done()
      })
  })
})

describe("fetchTimepointsForRoute", () => {
  test("fetches a list of timepoints for a route", done => {
    window.fetch = () =>
      Promise.resolve({
        json: () => ({
          data: ["MATPN", "WELLH", "MORTN"],
        }),
        ok: true,
        status: 200,
      })

    fetchTimepointsForRoute("28").then(timepoints => {
      expect(timepoints).toEqual([
        { id: "MATPN" },
        { id: "WELLH" },
        { id: "MORTN" },
      ])
      done()
    })
  })

  test("throws an error if the response status is not 200", done => {
    window.fetch = () =>
      Promise.resolve({
        json: () => ({ data: null }),
        ok: false,
        status: 500,
      })

    fetchTimepointsForRoute("28")
      .then(() => done("fetchTimepointsForRoute did not throw an error"))
      .catch(error => {
        expect(error).not.toBeUndefined()
        done()
      })
  })
})
