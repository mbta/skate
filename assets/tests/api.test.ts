import {
  apiCall,
  checkedApiCall,
  fetchScheduleBlock,
  fetchScheduleRun,
  fetchNearestIntersection,
  fetchRoutes,
  fetchShapeForRoute,
  fetchShapeForTrip,
  fetchShuttleRoutes,
  fetchSwings,
  fetchTimepointsForRoute,
  putUserSetting,
  putRouteTabs,
  fetchStations,
  fetchRoutePatterns,
  fetchLocationSearchResults,
  fetchLocationSearchResultById,
  fetchLocationSearchSuggestions,
} from "../src/api"
import routeFactory from "./factories/route"
import routeTabFactory from "./factories/routeTab"
import stopFactory from "./factories/stop"
import * as browser from "../src/models/browser"
import { string, unknown } from "superstruct"
import { LocationType } from "../src/models/stopData"
import * as Sentry from "@sentry/react"
import locationSearchResultDataFactory from "./factories/locationSearchResultData"
import locationSearchResultFactory from "./factories/locationSearchResult"
import locationSearchSuggestionDataFactory from "./factories/locationSearchSuggestionData"
import locationSearchSuggestionFactory from "./factories/locationSearchSuggestion"

jest.mock("@sentry/react", () => ({
  __esModule: true,
  captureException: jest.fn(),
}))

declare global {
  interface Window {
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
      defaultResult: "default",
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
      defaultResult: "default",
    }).then(() => {
      expect(browser.reload).toHaveBeenCalled()
      done()
    })
  })

  test("reloads the page if the response status is forbidden (403)", (done) => {
    mockFetch(403, { data: null })

    apiCall({
      url: "/",
      parser: () => null,
      defaultResult: "default",
    }).then(() => {
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
})

describe("checkedApiCall", () => {
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

    checkedApiCall({
      url: "/",
      dataStruct: string(),
      parser: parse,
      defaultResult: "default",
    }).then((parsed) => {
      expect(parse).toHaveBeenCalledWith("raw")
      expect(parsed).toEqual("parsed")
      done()
    })
  })

  test("raises error for malformed data when no default", async () => {
    mockFetch(200, { data: 12 })

    const parse = jest.fn(() => "parsed")

    await checkedApiCall({
      url: "/",
      dataStruct: string(),
      parser: parse,
      defaultResult: "default",
    })

    expect(Sentry.captureException).toHaveBeenCalled()
  })

  test("returns default value when malformed data", async () => {
    mockFetch(200, { data: 12 })

    const parse = jest.fn(() => "parsed")

    await checkedApiCall({
      url: "/",
      dataStruct: string(),
      parser: parse,
      defaultResult: null,
    }).then((result) => expect(result).toBeNull())
  })

  test("reloads the page if the response status is a redirect (3xx)", (done) => {
    mockFetch(302, { data: null })

    checkedApiCall({
      url: "/",
      dataStruct: unknown(),
      parser: () => null,
      defaultResult: "default",
    }).then(() => {
      expect(browser.reload).toHaveBeenCalled()
      done()
    })
  })

  test("reloads the page if the response status is forbidden (403)", (done) => {
    mockFetch(403, { data: null })

    checkedApiCall({
      url: "/",
      dataStruct: unknown(),
      parser: () => null,
      defaultResult: "default",
    }).then(() => {
      expect(browser.reload).toHaveBeenCalled()
      done()
    })
  })

  test("returns a default for any other response", (done) => {
    mockFetch(500, { data: null })

    checkedApiCall({
      url: "/",
      dataStruct: unknown(),
      parser: () => null,
      defaultResult: "default",
    }).then((result) => {
      expect(result).toEqual("default")
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
          garages: ["Southampton"],
        },
        {
          direction_names: {
            0: "Outbound",
            1: "Inbound",
          },
          id: "39",
          garages: ["Southampton"],
        },
        {
          direction_names: {
            0: "Outbound",
            1: "Inbound",
          },
          id: "71",
          garages: ["North Cambridge"],
        },
      ],
    })

    fetchRoutes().then((routes) => {
      expect(routes).toEqual([
        routeFactory.build({
          id: "28",
          garages: ["Southampton"],
          name: undefined,
        }),
        routeFactory.build({
          id: "39",
          garages: ["Southampton"],
          name: undefined,
        }),
        routeFactory.build({
          id: "71",
          garages: ["North Cambridge"],
          name: undefined,
        }),
      ])
      done()
    })
  })
})

describe("fetchRoutePatterns", () => {
  test("fetches route patterns for route", (done) => {
    mockFetch(200, {
      data: [
        {
          id: "rp1",
          name: "route pattern 1",
          direction_id: 0,
          route_id: "66",
          sort_order: 0,
          time_desc: "Mornings only",
          shape: {
            id: "shape1",
            points: [
              {
                shape_id: "shape1",
                sequence: 0,
                lat: 42.41356,
                lon: -70.99211,
              },
            ],
          },
          headsign: "Headsign",
        },
      ],
    })

    fetchRoutePatterns("66").then((routePatterns) => {
      expect(routePatterns).toEqual([
        {
          id: "rp1",
          name: "route pattern 1",
          directionId: 0,
          routeId: "66",
          sortOrder: 0,
          timeDescription: "Mornings only",
          shape: {
            id: "shape1",
            points: [
              {
                lat: 42.41356,
                lon: -70.99211,
              },
            ],
          },
          headsign: "Headsign",
        },
      ])
      done()
    })
  })
})

describe("fetchShapeForRoute", () => {
  test("fetches a shape for the route", (done) => {
    const shapeData = [
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

    const shapes = [
      {
        id: "shape1",
        points: [
          {
            lat: 42.41356,
            lon: -70.99211,
          },
        ],
      },
      {
        id: "shape2",
        points: [
          {
            lat: 43.41356,
            lon: -71.99211,
          },
        ],
      },
    ]

    mockFetch(200, { data: shapeData })

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
    const shapeData = {
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

    const shape = {
      id: "shape",
      points: [
        {
          lat: 42.41356,
          lon: -70.99211,
        },
      ],
    }

    mockFetch(200, { data: shapeData })

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

describe("fetchStations", () => {
  test("fetches a list stations", (done) => {
    const [station1, station2] = stopFactory.buildList(2, {
      locationType: LocationType.Station,
    })
    mockFetch(200, {
      data: [
        {
          id: station1.id,
          name: station1.name,
          location_type: "station",
          lat: station1.lat,
          lon: station1.lon,
        },
        {
          id: station2.id,
          name: station2.name,
          location_type: "station",
          lat: station2.lat,
          lon: station2.lon,
        },
      ],
    })

    fetchStations().then((stations) => {
      expect(stations).toEqual([station1, station2])
      done()
    })
  })

  test("returns empty list on error", (done) => {
    mockFetch(500, {
      data: null,
    })

    fetchStations().then((stations) => {
      expect(stations).toEqual([])
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

describe("fetchScheduleRun", () => {
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

    fetchScheduleRun("trip", "run").then((result) => {
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
    fetchScheduleRun("trip", "run").then((result) => {
      expect(result).toEqual(null)
      done()
    })
  })
})

describe("fetchScheduleBlock", () => {
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

    fetchScheduleBlock("trip").then((result) => {
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
    fetchScheduleBlock("trip").then((result) => {
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
      block_id: "B1",
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

    fetchSwings(["1"]).then((swings) => {
      expect(swings).toEqual([
        {
          blockId: "B1",
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

describe("fetchLocationSearchResults", () => {
  test("parses location search results", (done) => {
    const result = locationSearchResultDataFactory.build({
      name: "Some Landmark",
      address: "123 Test St",
      latitude: 1,
      longitude: 2,
    })

    mockFetch(200, {
      data: [result],
    })

    fetchLocationSearchResults("query").then((results) => {
      expect(results).toEqual([
        locationSearchResultFactory.build({
          name: "Some Landmark",
          address: "123 Test St",
          latitude: 1,
          longitude: 2,
        }),
      ])
      done()
    })
  })
})

describe("fetchLocationSearchResultById", () => {
  test("parses location returned", (done) => {
    const result = locationSearchResultDataFactory.build({
      name: "Some Landmark",
      address: "123 Test St",
      latitude: 1,
      longitude: 2,
    })

    mockFetch(200, {
      data: result,
    })

    fetchLocationSearchResultById("query").then((results) => {
      expect(results).toEqual(
        locationSearchResultFactory.build({
          name: "Some Landmark",
          address: "123 Test St",
          latitude: 1,
          longitude: 2,
        })
      )
      done()
    })
  })
})

describe("fetchLocationSearchSuggestions", () => {
  test("parses location search suggestions", (done) => {
    const result = locationSearchSuggestionDataFactory.build({
      text: "Some Landmark",
      place_id: "test-place",
    })

    mockFetch(200, {
      data: [result],
    })

    fetchLocationSearchSuggestions("query").then((result) => {
      expect(result).toEqual([
        locationSearchSuggestionFactory.build({
          text: "Some Landmark",
          placeId: "test-place",
        }),
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

describe("putRouteTabs", () => {
  test("uses PUT", () => {
    mockFetch(200, {
      data: [
        {
          preset_name: "some name",
          selected_route_ids: ["1", "28"],
          ordering: 0,
          ladder_directions: {},
          ladder_crowding_toggles: {},
          is_current_tab: false,
        },
      ],
    })

    const routeTabs = [
      routeTabFactory.build({
        presetName: "some name",
        selectedRouteIds: ["1", "28"],
        ordering: 0,
        ladderDirections: {},
        ladderCrowdingToggles: {},
        isCurrentTab: false,
      }),
    ]

    putRouteTabs(routeTabs)

    expect(window.fetch).toHaveBeenCalledTimes(1)
    const args = (window.fetch as jest.Mock).mock.calls[0][1]
    expect(args.method).toEqual("PUT")
    expect(args.headers).toHaveProperty("x-csrf-token")
    expect(args.body).toEqual(JSON.stringify({ route_tabs: routeTabs }))
  })
})
