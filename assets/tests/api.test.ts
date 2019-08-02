import { fetchRoutes, fetchTimepointsForRoute, fetchTrips } from "../src/api"

// tslint:disable no-empty

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
          data: [
            {
              direction_names: {
                0: "Outbound",
                1: "Inbound",
              },
              id: "28",
            },
            {
              direction_names: {
                0: "Outbound",
                1: "Inbound",
              },
              id: "39",
            },
            {
              direction_names: {
                0: "Outbound",
                1: "Inbound",
              },
              id: "71",
            },
          ],
        }),
        ok: true,
        status: 200,
      })

    fetchRoutes().then(routes => {
      expect(routes).toEqual([
        {
          directionNames: {
            "0": "Outbound",
            "1": "Inbound",
          },
          id: "28",
        },
        {
          directionNames: {
            "0": "Outbound",
            "1": "Inbound",
          },
          id: "39",
        },
        {
          directionNames: {
            "0": "Outbound",
            "1": "Inbound",
          },
          id: "71",
        },
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

    const spyConsoleError = jest.spyOn(console, "error")
    spyConsoleError.mockImplementationOnce(() => {})

    fetchRoutes()
      .then(() => {
        spyConsoleError.mockRestore()
        done("fetchRoutes did not throw an error")
      })
      .catch(error => {
        expect(error).not.toBeUndefined()
        expect(spyConsoleError).toHaveBeenCalled()
        spyConsoleError.mockRestore()
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
      expect(timepoints).toEqual(["MATPN", "WELLH", "MORTN"])
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

    const spyConsoleError = jest.spyOn(console, "error")
    spyConsoleError.mockImplementationOnce(() => {})

    fetchTimepointsForRoute("28")
      .then(() => {
        spyConsoleError.mockRestore()
        done("fetchTimepointsForRoute did not throw an error")
      })
      .catch(error => {
        expect(error).not.toBeUndefined()
        expect(spyConsoleError).toHaveBeenCalled()
        spyConsoleError.mockRestore()
        done()
      })
  })
})

describe("fetchTrips", () => {
  test("fetches trips", done => {
    window.fetch = () =>
      Promise.resolve({
        json: () => ({
          data: [
            {
              block_id: "B34-126",
              direction_id: 1,
              headsign: "Dudley",
              id: "40728552",
              route_id: "42",
              route_pattern_id: "42-1-1",
              stop_times: [
                { stop_id: "s1", timepoint_id: "fhill", timestamp: 2 },
                { stop_id: "s2", timepoint_id: null, timestamp: 3 },
              ],
            },
          ],
        }),

        ok: true,
        status: 200,
      })

    fetchTrips("42", 1, 4).then(trips => {
      expect(trips).toEqual([
        {
          blockId: "B34-126",
          directionId: 1,
          headsign: "Dudley",
          id: "40728552",
          routeId: "42",
          routePatternId: "42-1-1",
          stopTimes: [
            { stopId: "s1", timepointId: "fhill", timestamp: 2 },
            { stopId: "s2", timepointId: null, timestamp: 3 },
          ],
        },
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

    const spyConsoleError = jest.spyOn(console, "error")
    spyConsoleError.mockImplementationOnce(() => {})

    fetchTrips("28", 1, 4)
      .then(() => {
        spyConsoleError.mockRestore()
        done("fetchTrips did not throw an error")
      })
      .catch(error => {
        expect(error).not.toBeUndefined()
        expect(spyConsoleError).toHaveBeenCalled()
        spyConsoleError.mockRestore()
        done()
      })
  })
})
