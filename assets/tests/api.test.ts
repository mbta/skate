import {
  apiCall,
  fetchMinischeduleBlock,
  fetchMinischeduleRun,
  fetchRoutes,
  fetchShapeForRoute,
  fetchShapeForTrip,
  fetchShuttleRoutes,
  fetchTimepointsForRoute,
} from "../src/api"
import * as browser from "../src/models/browser"

// tslint:disable no-empty

declare global {
  interface Window {
    /* eslint-disable typescript/no-explicit-any */
    fetch: (uri: string) => Promise<any>
  }
}

const mockFetch = (status: number, json: any): void => {
  window.fetch = () =>
    Promise.resolve({
      json: () => json,
      status,
    } as Response)
}

describe("apiCall", () => {
  let browserReloadSpy: jest.SpyInstance

  beforeEach(() => {
    browserReloadSpy = jest
      .spyOn(browser, "reload")
      .mockImplementation(() => {})
  })

  afterAll(() => {
    browserReloadSpy.mockRestore()
  })

  test("returns parsed data", (done) => {
    mockFetch(200, { data: "raw" })

    const parse = jest.fn(() => "parsed")

    apiCall({
      url: "/",
      parser: parse,
    }).then((parsed) => {
      expect(parse).toHaveBeenCalledWith("raw")
      expect(parsed).toEqual("parsed")
      done()
    })
  })

  test("reloads the page if the response status is a redirect (3xx)", (done) => {
    mockFetch(302, { data: null })

    apiCall({
      url: "/",
      parser: () => null,
    }).catch(() => {
      expect(browser.reload).toHaveBeenCalled()
      done()
    })
  })

  test("reloads the page if the response status is forbidden (403)", (done) => {
    mockFetch(403, { data: null })

    apiCall({
      url: "/",
      parser: () => null,
    }).catch(() => {
      expect(browser.reload).toHaveBeenCalled()
      done()
    })
  })

  test("returns a default for any other response", (done) => {
    mockFetch(500, { data: null })

    apiCall({
      url: "/",
      parser: () => null,
      defaultResult: "default",
    }).then((result) => {
      expect(result).toEqual("default")
      done()
    })
  })

  test("throws an error for any other response status if there's no default", (done) => {
    mockFetch(500, { data: null })

    apiCall({
      url: "/",
      parser: () => null,
    })
      .then(() => {
        done("fetchRoutes did not throw an error")
      })
      .catch((error) => {
        expect(error).toBeDefined()
        done()
      })
  })
})

describe("fetchRoutes", () => {
  test("fetches a list of routes", (done) => {
    mockFetch(200, {
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
    })

    fetchRoutes().then((routes) => {
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
})

describe("fetchShapeForRoute", () => {
  test("fetches a shape for the route", (done) => {
    const shapes = [
      {
        id: "shape1",
        points: [
          {
            shape_id: "shape1",
            lat: 42.41356,
            lon: -70.99211,
            sequence: 0,
          },
        ],
      },
      {
        id: "shape2",
        points: [
          {
            shape_id: "shape2",
            lat: 43.41356,
            lon: -71.99211,
            sequence: 0,
          },
        ],
      },
    ]

    mockFetch(200, { data: shapes })

    fetchShapeForRoute("28").then((response) => {
      expect(response).toEqual(shapes)
      done()
    })
  })

  test("defaults to [] if there's an error", (done) => {
    mockFetch(500, { data: null })

    fetchShapeForRoute("28").then((result) => {
      expect(result).toEqual([])
      done()
    })
  })
})

describe("fetchShapeForTrip", () => {
  test("fetches a shape for the trip", (done) => {
    const shape = {
      id: "shape",
      points: [
        {
          shape_id: "shape1",
          lat: 42.41356,
          lon: -70.99211,
          sequence: 0,
        },
      ],
    }

    mockFetch(200, { data: shape })

    fetchShapeForTrip("trip").then((response) => {
      expect(response).toEqual(shape)
      done()
    })
  })

  test("defaults to null if there's an error", (done) => {
    mockFetch(500, { data: null })

    fetchShapeForTrip("28").then((result) => {
      expect(result).toEqual(null)
      done()
    })
  })
})

describe("fetchShuttleRoutes", () => {
  test("fetches a list of shuttle routes", (done) => {
    mockFetch(200, {
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
    })

    fetchShuttleRoutes().then((routes) => {
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
})

describe("fetchTimepointsForRoute", () => {
  test("fetches a list of timepoints for a route", (done) => {
    mockFetch(200, { data: ["MATPN", "WELLH", "MORTN"] })

    fetchTimepointsForRoute("28").then((timepoints) => {
      expect(timepoints).toEqual(["MATPN", "WELLH", "MORTN"])
      done()
    })
  })

  test("defaults to [] if there's an error", (done) => {
    mockFetch(500, { data: null })

    fetchTimepointsForRoute("28").then((result) => {
      expect(result).toEqual([])
      done()
    })
  })
})

describe("minischedulesRun", () => {
  test("fetches a run with a break", (done) => {
    mockFetch(200, {
      data: {
        id: "run",
        activities: [
          {
            break_type: "break type",
            start_time: 0,
            end_time: 1,
          },
        ],
      },
    })

    fetchMinischeduleRun("trip").then((result) => {
      expect(result).toEqual({
        id: "run",
        activities: [
          {
            breakType: "break type",
            startTime: 0,
            endTime: 1,
          },
        ],
      })
      done()
    })
  })

  test("can return null", (done) => {
    mockFetch(200, { data: null })
    fetchMinischeduleRun("trip").then((result) => {
      expect(result).toEqual(null)
      done()
    })
  })
})

describe("minischedulesBlock", () => {
  test("fetches a block with a piece", (done) => {
    mockFetch(200, {
      data: {
        id: "block",
        pieces: [
          {
            run_id: "run",
            block_id: "block",
            start: {
              time: 0,
              place: "start place",
              "mid_route?": false,
            },
            trips: [
              {
                id: "trip",
                block_id: "block",
                route_id: "route",
                headsign: "headsign",
                direction_id: 0,
                via_variant: "X",
                run_id: "run",
                start_time: 45,
                end_time: 567,
              },
              {
                kind: "rad",
                start_time: 567,
                end_time: 1000,
              },
            ],
            end: {
              time: 1,
              place: "end place",
              "mid_route?": false,
            },
          },
        ],
      },
    })

    fetchMinischeduleBlock("trip").then((result) => {
      expect(result).toEqual({
        id: "block",
        pieces: [
          {
            runId: "run",
            blockId: "block",
            start: {
              time: 0,
              place: "start place",
              midRoute: false,
            },
            trips: [
              {
                id: "trip",
                blockId: "block",
                routeId: "route",
                headsign: "headsign",
                directionId: 0,
                viaVariant: "X",
                runId: "run",
                startTime: 45,
                endTime: 567,
              },
              {
                kind: "rad",
                startTime: 567,
                endTime: 1000,
              },
            ],
            end: {
              time: 1,
              place: "end place",
              midRoute: false,
            },
          },
        ],
      })
      done()
    })
  })

  test("can return null", (done) => {
    mockFetch(200, { data: null })
    fetchMinischeduleBlock("trip").then((result) => {
      expect(result).toEqual(null)
      done()
    })
  })
})
