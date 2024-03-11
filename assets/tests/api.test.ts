import {
  jest,
  describe,
  test,
  expect,
  beforeEach,
  afterAll,
} from "@jest/globals"
import { SpyInstance } from "jest-mock"
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
  fetchAllStops,
  fetchFinishedDetour,
  apiCallWithError,
} from "../src/api"
import routeFactory from "./factories/route"
import routeTabFactory from "./factories/routeTab"
import stopFactory from "./factories/stop"
import * as browser from "../src/models/browser"
import { string, unknown } from "superstruct"
import {
  LocationType,
  RouteType,
  stopFromData,
  stopsFromData,
} from "../src/models/stopData"
import * as Sentry from "@sentry/react"
import locationSearchResultDataFactory from "./factories/locationSearchResultData"
import locationSearchResultFactory from "./factories/locationSearchResult"
import locationSearchSuggestionDataFactory from "./factories/locationSearchSuggestionData"
import locationSearchSuggestionFactory from "./factories/locationSearchSuggestion"
import stopDataFactory from "./factories/stopData"
import { shapePointFactory } from "./factories/shapePointFactory"
import { ok, fetchError } from "../src/util/fetchResult"

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
  let browserReloadSpy: SpyInstance

  beforeEach(() => {
    browserReloadSpy = jest
      .spyOn(browser, "reload")
      .mockImplementation(() => {})
  })

  afterAll(() => {
    browserReloadSpy.mockRestore()
  })

  test("returns parsed data", () => {
    mockFetch(200, { data: "raw" })

    const parse = jest.fn(() => "parsed")

    return apiCall({
      url: "/",
      parser: parse,
      defaultResult: "default",
    }).then((parsed) => {
      expect(parse).toHaveBeenCalledWith("raw")
      expect(parsed).toEqual("parsed")
    })
  })

  test("reloads the page if the response status is a redirect (3xx)", () => {
    mockFetch(302, { data: null })

    return apiCall({
      url: "/",
      parser: () => null,
      defaultResult: "default",
    }).then(() => {
      expect(browser.reload).toHaveBeenCalled()
    })
  })

  test("reloads the page if the response status is forbidden (403)", () => {
    mockFetch(403, { data: null })

    return apiCall({
      url: "/",
      parser: () => null,
      defaultResult: "default",
    }).then(() => {
      expect(browser.reload).toHaveBeenCalled()
    })
  })

  test("returns a default for any other response", () => {
    mockFetch(500, { data: null })

    return apiCall({
      url: "/",
      parser: () => null,
      defaultResult: "default",
    }).then((result) => {
      expect(result).toEqual("default")
    })
  })
})

describe("checkedApiCall", () => {
  let browserReloadSpy: SpyInstance

  beforeEach(() => {
    browserReloadSpy = jest
      .spyOn(browser, "reload")
      .mockImplementation(() => {})
  })

  afterAll(() => {
    browserReloadSpy.mockRestore()
  })

  test("returns parsed data", () => {
    mockFetch(200, { data: "raw" })

    const parse = jest.fn(() => "parsed")

    return checkedApiCall({
      url: "/",
      dataStruct: string(),
      parser: parse,
      defaultResult: "default",
    }).then((parsed) => {
      expect(parse).toHaveBeenCalledWith("raw")
      expect(parsed).toEqual("parsed")
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

  test("reloads the page if the response status is a redirect (3xx)", () => {
    mockFetch(302, { data: null })

    return checkedApiCall({
      url: "/",
      dataStruct: unknown(),
      parser: () => null,
      defaultResult: "default",
    }).then(() => {
      expect(browser.reload).toHaveBeenCalled()
    })
  })

  test("reloads the page if the response status is forbidden (403)", () => {
    mockFetch(403, { data: null })

    return checkedApiCall({
      url: "/",
      dataStruct: unknown(),
      parser: () => null,
      defaultResult: "default",
    }).then(() => {
      expect(browser.reload).toHaveBeenCalled()
    })
  })

  test("returns a default for any other response", () => {
    mockFetch(500, { data: null })

    return checkedApiCall({
      url: "/",
      dataStruct: unknown(),
      parser: () => null,
      defaultResult: "default",
    }).then((result) => {
      expect(result).toEqual("default")
    })
  })
})

describe("apiCallWithError", () => {
  let browserReloadSpy: SpyInstance

  beforeEach(() => {
    browserReloadSpy = jest
      .spyOn(browser, "reload")
      .mockImplementation(() => {})
  })

  afterAll(() => {
    browserReloadSpy.mockRestore()
  })

  test("returns parsed data", async () => {
    mockFetch(200, { data: "raw" })

    const parse = jest.fn(() => "parsed")

    return apiCallWithError({
      url: "/",
      dataStruct: string(),
      parser: parse,
    }).then((parsed) => {
      expect(parse).toHaveBeenCalledWith("raw")
      expect(parsed).toEqual(ok("parsed"))
    })
  })

  test("raises error for malformed data when no default", async () => {
    mockFetch(200, { data: 12 })

    const parse = jest.fn(() => "parsed")

    await apiCallWithError({
      url: "/",
      dataStruct: string(),
      parser: parse,
    })

    expect(Sentry.captureException).toHaveBeenCalled()
  })

  test("returns error when data is malformed", async () => {
    mockFetch(200, { data: 12 })

    const parse = jest.fn(() => "parsed")

    await apiCallWithError({
      url: "/",
      dataStruct: string(),
      parser: parse,
    }).then((result) => expect(result).toEqual(fetchError()))
  })

  test("reloads the page if the response status is a redirect (3xx)", async () => {
    mockFetch(302, { data: null })

    return apiCallWithError({
      url: "/",
      dataStruct: unknown(),
      parser: () => null,
    }).then(() => {
      expect(browser.reload).toHaveBeenCalled()
    })
  })

  test("reloads the page if the response status is forbidden (403)", async () => {
    mockFetch(403, { data: null })

    return apiCallWithError({
      url: "/",
      dataStruct: unknown(),
      parser: () => null,
    }).then(() => {
      expect(browser.reload).toHaveBeenCalled()
    })
  })

  test("returns an error for any other response", async () => {
    mockFetch(500, { data: null })

    return apiCallWithError({
      url: "/",
      dataStruct: unknown(),
      parser: () => null,
    }).then((result) => {
      expect(result).toEqual(fetchError())
    })
  })
})

describe("fetchRoutes", () => {
  test("fetches a list of routes", () => {
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

    return fetchRoutes().then((routes) => {
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
    })
  })
})

describe("fetchRoutePatterns", () => {
  test("fetches route patterns for route", () => {
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

    return fetchRoutePatterns("66").then((routePatterns) => {
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
    })
  })
})

describe("fetchShapeForRoute", () => {
  test("fetches a shape for the route", () => {
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

    return fetchShapeForRoute("28").then((response) => {
      expect(response).toEqual(shapes)
    })
  })

  test("defaults to [] if there's an error", () => {
    mockFetch(500, { data: null })

    return fetchShapeForRoute("28").then((result) => {
      expect(result).toEqual([])
    })
  })
})

describe("fetchFinishedDetour", () => {
  test("fetches a finished detour given a Route Pattern and connection points", () => {
    const stopData = stopDataFactory.buildList(3)
    const [connection_stop_start, connection_stop_end] =
      stopDataFactory.buildList(2)

    const stops = stopsFromData(stopData)

    const beforeDetour = shapePointFactory.buildList(3)
    const detour = shapePointFactory.buildList(3)
    const afterDetour = shapePointFactory.buildList(3)

    mockFetch(200, {
      data: {
        missed_stops: stopData,
        connection_stop_start,
        connection_stop_end,
        route_segments: {
          before_detour: beforeDetour,
          detour: detour,
          after_detour: afterDetour,
        },
      },
    })

    return fetchFinishedDetour(
      "route_pattern_id",
      shapePointFactory.build(),
      shapePointFactory.build()
    ).then((result) => {
      expect(result).toEqual({
        missedStops: stops,
        connectionPoint: {
          start: stopFromData(connection_stop_start),
          end: stopFromData(connection_stop_end),
        },
        routeSegments: {
          beforeDetour,
          detour,
          afterDetour,
        },
      })
    })
  })

  test("returns `undefined` for connection points if API result is `null`", () => {
    const stopData = stopDataFactory.buildList(3)

    const stops = stopsFromData(stopData)

    const beforeDetour = shapePointFactory.buildList(3)
    const detour = shapePointFactory.buildList(3)
    const afterDetour = shapePointFactory.buildList(3)

    mockFetch(200, {
      data: {
        missed_stops: stopData,
        connection_stop_start: null,
        connection_stop_end: null,
        route_segments: {
          before_detour: beforeDetour,
          detour: detour,
          after_detour: afterDetour,
        },
      },
    })

    return fetchFinishedDetour(
      "route_pattern_id",
      shapePointFactory.build(),
      shapePointFactory.build()
    ).then((result) => {
      expect(result).toEqual({
        missedStops: stops,
        connectionPoint: {
          start: undefined,
          end: undefined,
        },
        routeSegments: {
          beforeDetour,
          detour,
          afterDetour,
        },
      })
    })
  })

  test("defaults to null if there's an error", () => {
    mockFetch(500, { data: null })

    return fetchFinishedDetour(
      "route_pattern_id",
      shapePointFactory.build(),
      shapePointFactory.build()
    ).then((result) => {
      expect(result).toBeNull()
    })
  })
})

describe("fetchShapeForTrip", () => {
  test("fetches a shape for the trip", () => {
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

    return fetchShapeForTrip("trip").then((response) => {
      expect(response).toEqual(shape)
    })
  })

  test("defaults to null if there's an error", () => {
    mockFetch(500, { data: null })

    return fetchShapeForTrip("28").then((result) => {
      expect(result).toEqual(null)
    })
  })
})

describe("fetchShuttleRoutes", () => {
  test("fetches a list of shuttle routes", () => {
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

    return fetchShuttleRoutes().then((routes) => {
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
    })
  })
})

describe("fetchStations", () => {
  test("fetches a list stations", () => {
    const [station1, station2] = stopFactory.buildList(2, {
      locationType: LocationType.Station,
      vehicleType: null,
    })
    mockFetch(200, {
      data: [
        {
          id: station1.id,
          name: station1.name,
          location_type: "station",
          vehicle_type: null,
          lat: station1.lat,
          lon: station1.lon,
        },
        {
          id: station2.id,
          name: station2.name,
          location_type: "station",
          vehicle_type: null,
          lat: station2.lat,
          lon: station2.lon,
        },
      ],
    })

    return fetchStations().then((stations) => {
      expect(stations).toEqual([station1, station2])
    })
  })

  test("returns empty list on error", () => {
    mockFetch(500, {
      data: null,
    })

    return fetchStations().then((stations) => {
      expect(stations).toEqual([])
    })
  })
})

describe("fetchAllStops", () => {
  test("fetches a list of stops", () => {
    const route1 = routeFactory.build()
    const [station1, stop1] = [
      stopFactory.build({
        locationType: LocationType.Station,
        vehicleType: null,
      }),
      stopFactory.build({
        locationType: LocationType.Stop,
        vehicleType: RouteType.Bus,
        routes: [
          {
            id: route1.id,
            name: route1.name,
            type: 3,
          },
        ],
      }),
    ]
    mockFetch(200, {
      data: [
        {
          id: station1.id,
          name: station1.name,
          location_type: "station",
          vehicle_type: null,
          lat: station1.lat,
          lon: station1.lon,
        },
        {
          id: stop1.id,
          name: stop1.name,
          location_type: "stop",
          vehicle_type: 3,
          lat: stop1.lat,
          lon: stop1.lon,
          routes: [{ id: route1.id, name: route1.name, type: 3 }],
        },
      ],
    })

    return fetchAllStops().then((stops) => {
      expect(stops).toEqual([station1, stop1])
    })
  })

  test("returns empty list on error", () => {
    mockFetch(500, {
      data: null,
    })

    return fetchStations().then((stations) => {
      expect(stations).toEqual([])
    })
  })
})

describe("fetchTimepointsForRoute", () => {
  test("fetches a list of timepoints for a route", () => {
    mockFetch(200, { data: ["MATPN", "WELLH", "MORTN"] })

    return fetchTimepointsForRoute("28").then((timepoints) => {
      expect(timepoints).toEqual(["MATPN", "WELLH", "MORTN"])
    })
  })

  test("defaults to [] if there's an error", () => {
    mockFetch(500, { data: null })

    return fetchTimepointsForRoute("28").then((result) => {
      expect(result).toEqual([])
    })
  })
})

describe("fetchScheduleRun", () => {
  test("fetches a run with a break", () => {
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

    return fetchScheduleRun("trip", "run").then((result) => {
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
    })
  })

  test("can return null", () => {
    mockFetch(200, { data: null })
    return fetchScheduleRun("trip", "run").then((result) => {
      expect(result).toEqual(null)
    })
  })
})

describe("fetchScheduleBlock", () => {
  test("fetches a block with a piece", () => {
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

    return fetchScheduleBlock("trip").then((result) => {
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
    })
  })

  test("can return null", () => {
    mockFetch(200, { data: null })
    return fetchScheduleBlock("trip").then((result) => {
      expect(result).toEqual(null)
    })
  })
})

describe("fetchNearestIntersection", () => {
  test("parses an intersection name", () => {
    mockFetch(200, {
      data: "Broadway & 7th Ave",
    })

    return fetchNearestIntersection(0, 0).then((intersection) => {
      expect(intersection).toEqual("Broadway & 7th Ave")
    })
  })

  test("handles a missing intersection", () => {
    mockFetch(200, {
      data: null,
    })

    return fetchNearestIntersection(0, 0).then((intersection) => {
      expect(intersection).toEqual(null)
    })
  })
})

describe("fetchSwings", () => {
  test("parses swings", () => {
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

    return fetchSwings(["1"]).then((swings) => {
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
    })
  })
})

describe("fetchLocationSearchResults", () => {
  test("parses location search results", () => {
    const result = locationSearchResultDataFactory.build({
      name: "Some Landmark",
      address: "123 Test St",
      latitude: 1,
      longitude: 2,
    })

    mockFetch(200, {
      data: [result],
    })

    return fetchLocationSearchResults("query").then((results) => {
      expect(results).toEqual([
        locationSearchResultFactory.build({
          name: "Some Landmark",
          address: "123 Test St",
          latitude: 1,
          longitude: 2,
        }),
      ])
    })
  })
})

describe("fetchLocationSearchResultById", () => {
  test("parses location returned", () => {
    const result = locationSearchResultDataFactory.build({
      name: "Some Landmark",
      address: "123 Test St",
      latitude: 1,
      longitude: 2,
    })

    mockFetch(200, {
      data: result,
    })

    return fetchLocationSearchResultById("query").then((results) => {
      expect(results).toEqual(
        locationSearchResultFactory.build({
          name: "Some Landmark",
          address: "123 Test St",
          latitude: 1,
          longitude: 2,
        })
      )
    })
  })
})

describe("fetchLocationSearchSuggestions", () => {
  test("parses location search suggestions", () => {
    const result = locationSearchSuggestionDataFactory.build({
      text: "Some Landmark",
      place_id: "test-place",
    })

    mockFetch(200, {
      data: [result],
    })

    return fetchLocationSearchSuggestions("query").then((result) => {
      expect(result).toEqual([
        locationSearchSuggestionFactory.build({
          text: "Some Landmark",
          placeId: "test-place",
        }),
      ])
    })
  })
})

describe("putUserSetting", () => {
  test("uses PUT and CSRF token", () => {
    mockFetch(200, "")
    putUserSetting("name", "value")
    expect(window.fetch).toHaveBeenCalledTimes(1)
    const args = (window.fetch as jest.Mock<typeof window.fetch>).mock
      .calls[0][1]
    expect(args!.method).toEqual("PUT")
    expect(args!.headers).toHaveProperty("x-csrf-token")
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
    const args = (window.fetch as jest.Mock<typeof window.fetch>).mock
      .calls[0][1]
    expect(args!.method).toEqual("PUT")
    expect(args!.headers).toHaveProperty("x-csrf-token")
    expect(args!.body).toEqual(JSON.stringify({ route_tabs: routeTabs }))
  })
})
