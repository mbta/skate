import {
  apiCall,
  fetchMinischeduleBlock,
  fetchMinischeduleRun,
  fetchNearestIntersection,
  fetchRoutes,
  fetchShapeForRoute,
  fetchShapeForTrip,
  fetchShuttleRoutes,
  fetchSwings,
  fetchTimepointsForRoute,
  putRouteSettings,
  putUserSetting,
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
  window.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => json,
      status,
    } as Response)
  )
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
            start_time: 0,
            start_place: "start place",
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
                start_place: "start place",
                end_time: 567,
                end_place: "end place",
              },
              {
                kind: "rad",
                start_time: 567,
                end_time: 1000,
              },
            ],
            end_time: 1,
            end_place: "end place",
            "start_mid_route?": null,
            "end_mid_route?": false,
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
            startTime: 0,
            startPlace: "start place",
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
                startPlace: "start place",
                endTime: 567,
                endPlace: "end place",
              },
              {
                kind: "rad",
                startTime: 567,
                endTime: 1000,
              },
            ],
            endTime: 1,
            endPlace: "end place",
            startMidRoute: null,
            endMidRoute: false,
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

describe("fetchNearestIntersection", () => {
  test("parses an intersection name", (done) => {
    mockFetch(200, {
      data: "Broadway & 7th Ave",
    })

    fetchNearestIntersection(0, 0).then((intersection) => {
      expect(intersection).toEqual("Broadway & 7th Ave")
      done()
    })
  })

  test("handles a missing intersection", (done) => {
    mockFetch(200, {
      data: null,
    })

    fetchNearestIntersection(0, 0).then((intersection) => {
      expect(intersection).toEqual(null)
      done()
    })
  })
})

describe("fetchSwings", () => {
  test("parses swings", (done) => {
    const swing = {
      from_route_id: "1",
      from_run_id: "123-456",
      from_trip_id: "1234",
      to_route_id: "1",
      to_run_id: "123-789",
      to_trip_id: "5678",
      time: 100,
    }

    mockFetch(200, {
      data: [swing],
    })

    fetchSwings().then((swings) => {
      expect(swings).toEqual([
        {
          fromRouteId: "1",
          fromRunId: "123-456",
          fromTripId: "1234",
          toRouteId: "1",
          toRunId: "123-789",
          toTripId: "5678",
          time: 100,
        },
      ])
      done()
    })
  })
})

describe("putUserSetting", () => {
  test("uses PUT and CSRF token", () => {
    mockFetch(200, "")
    putUserSetting("name", "value")
    expect(window.fetch).toHaveBeenCalledTimes(1)
    const args = (window.fetch as jest.Mock).mock.calls[0][1]
    expect(args.method).toEqual("PUT")
    expect(args.headers).toHaveProperty("x-csrf-token")
  })
})

describe("putRouteSettings", () => {
  test("uses PUT and CSRF token", () => {
    mockFetch(200, "")
    putRouteSettings({
      selectedRouteIds: [],
      ladderDirections: {},
      ladderCrowdingToggles: {},
    })
    expect(window.fetch).toHaveBeenCalledTimes(1)
    const args = (window.fetch as jest.Mock).mock.calls[0][1]
    expect(args.method).toEqual("PUT")
    expect(args.headers).toHaveProperty("x-csrf-token")
  })
})
