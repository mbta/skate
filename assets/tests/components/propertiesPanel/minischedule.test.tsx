import React from "react"
import renderer from "react-test-renderer"
import {
  MinischeduleBlock,
  MinischeduleRun,
} from "../../../src/components/propertiesPanel/minischedule"
import {
  useMinischeduleBlock,
  useMinischeduleRun,
} from "../../../src/hooks/useMinischedule"
import { Break, Piece, Run, Trip } from "../../../src/minischedule"
import { Vehicle } from "../../../src/realtime"

jest.mock("../../../src/hooks/useMinischedule", () => ({
  __esModule: true,
  useMinischeduleRun: jest.fn(),
  useMinischeduleBlock: jest.fn(),
}))

const breakk: Break = {
  breakType: "Paid meal before",
  startTime: 10,
  endTime: 1810,
}

const nonrevenueTrip: Trip = {
  id: "nonrevenue",
  blockId: "block",
  routeId: null,
  headsign: null,
  directionId: null,
  viaVariant: null,
  runId: null,
  startTime: 0,
  endTime: 1,
}

const revenueTrip: Trip = {
  id: "trip",
  blockId: "block",
  routeId: "R",
  headsign: "Revenue",
  directionId: 1,
  viaVariant: "X",
  runId: "run",
  startTime: 0,
  endTime: 1,
}

const revenueTrip2: Trip = {
  id: "trip2",
  blockId: "block",
  routeId: "R",
  headsign: "Revenue The Other Direction",
  directionId: 0,
  viaVariant: "X",
  runId: "run",
  startTime: 350,
  endTime: 351,
}

const tripWithoutDirection: Trip = {
  id: "trip3",
  blockId: "block",
  routeId: "R",
  headsign: "Revenue Missing Direction",
  directionId: null,
  viaVariant: "X",
  runId: "run",
  startTime: 652,
  endTime: 653,
}

const piece: Piece = {
  runId: "run",
  blockId: "block",
  start: {
    time: 1820,
    place: "start",
    midRoute: false,
  },
  trips: [revenueTrip],
  end: {
    time: 1821,
    place: "end",
    midRoute: false,
  },
}

const asDirectedPiece: Piece = {
  runId: "run",
  blockId: null,
  start: {
    time: 15600,
    place: "place",
    midRoute: false,
  },
  trips: [
    {
      kind: "rad",
      startTime: 16200,
      endTime: 44400,
    },
  ],
  end: {
    time: 16200,
    place: "place",
    midRoute: false,
  },
}

const vehicle: Vehicle = {
  id: "vehicleId",
  label: "",
  runId: "123-4567",
  timestamp: 1590828502,
  latitude: 42.38274,
  longitude: -71.86523,
  directionId: 0,
  routeId: "1",
  tripId: "44444444",
  headsign: "Harvard",
  viaVariant: "_",
  operatorId: "99999",
  operatorName: "CHARLIE",
  operatorLogonTime: null,
  bearing: 143.7,
  blockId: "C12-34",
  headwaySecs: 385.8,
  headwaySpacing: null,
  previousVehicleId: "y4321",
  scheduleAdherenceSecs: 35,
  scheduledHeadwaySecs: 40,
  isShuttle: false,
  isOverload: false,
  isOffCourse: false,
  layoverDepartureTime: null,
  dataDiscrepancies: [],
  stopStatus: { stopId: "93", stopName: "Massachusetts Ave @ Newbury St" },
  timepointStatus: {
    timepointId: "hynes",
    fractionUntilTimepoint: 0.13316513898674723,
  },
  scheduledLocation: {
    routeId: "1",
    directionId: 0,
    tripId: "44444444",
    runId: "123-1408",
    timeSinceTripStartTime: 940,
    headsign: "Harvard",
    viaVariant: "_",
    timepointStatus: {
      timepointId: "hynes",
      fractionUntilTimepoint: 0.6666666666666666,
    },
  },
  routeStatus: "on_route",
  endOfTripType: "another_trip",
  blockWaivers: [],
}

describe("MinischeduleRun", () => {
  test("renders the loading state", () => {
    ;(useMinischeduleRun as jest.Mock).mockImplementationOnce(() => undefined)
    const tree = renderer
      .create(<MinischeduleRun vehicleOrGhost={vehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a not found state", () => {
    ;(useMinischeduleRun as jest.Mock).mockImplementationOnce(() => null)
    const tree = renderer
      .create(<MinischeduleRun vehicleOrGhost={vehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a run", () => {
    const multiTripPiece = {
      ...piece,
      trips: [revenueTrip, revenueTrip2],
    }

    ;(useMinischeduleRun as jest.Mock).mockImplementationOnce(() => ({
      id: "run",
      activities: [breakk, multiTripPiece],
    }))
    const tree = renderer
      .create(<MinischeduleRun vehicleOrGhost={vehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a run with no layovers between trips", () => {
    const immediatelyFollowingTrip = {
      ...revenueTrip2,
      startTime: 1,
    }

    const multiTripPiece = {
      ...piece,
      trips: [revenueTrip, immediatelyFollowingTrip],
    }

    ;(useMinischeduleRun as jest.Mock).mockImplementationOnce(() => ({
      id: "run",
      activities: [multiTripPiece],
    }))
    const tree = renderer
      .create(<MinischeduleRun vehicleOrGhost={vehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a run with a current layover between trips", () => {
    const multiTripPiece = {
      ...piece,
      trips: [revenueTrip, revenueTrip2],
    }

    const vehicleOnLayover: Vehicle = {
      ...vehicle,
      tripId: "trip2",
      routeStatus: "laying_over",
    }

    ;(useMinischeduleRun as jest.Mock).mockImplementationOnce(() => ({
      id: "run",
      activities: [multiTripPiece],
    }))
    const tree = renderer
      .create(<MinischeduleRun vehicleOrGhost={vehicleOnLayover} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a run with a non-current layover between trips", () => {
    const multiTripPiece = {
      ...piece,
      trips: [revenueTrip, revenueTrip2],
    }

    const vehicleNotOnLayover: Vehicle = {
      ...vehicle,
      tripId: "trip2",
      routeStatus: "on_route",
    }

    ;(useMinischeduleRun as jest.Mock).mockImplementationOnce(() => ({
      id: "run",
      activities: [multiTripPiece],
    }))
    const tree = renderer
      .create(<MinischeduleRun vehicleOrGhost={vehicleNotOnLayover} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("on a run with multiple layovers, marks the correct one current", () => {
    const revenueTrip3: Trip = {
      id: "trip3",
      blockId: "block",
      routeId: "R",
      headsign: "Revenue Trip The Third",
      directionId: 1,
      viaVariant: "X",
      runId: "run",
      startTime: 650,
      endTime: 651,
    }

    const multiTripPiece = {
      ...piece,
      trips: [revenueTrip, revenueTrip2, revenueTrip3],
    }

    const vehicleOnAParticularLayover: Vehicle = {
      ...vehicle,
      tripId: "trip3",
      routeStatus: "laying_over",
    }

    ;(useMinischeduleRun as jest.Mock).mockImplementationOnce(() => ({
      id: "run",
      activities: [multiTripPiece],
    }))
    const tree = renderer
      .create(<MinischeduleRun vehicleOrGhost={vehicleOnAParticularLayover} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a run with a layover before an as-directed", () => {
    const asDirectedPieceWithLayover: Piece = {
      ...asDirectedPiece,
      trips: [revenueTrip, ...asDirectedPiece.trips],
    }

    const vehicleWithLayover: Vehicle = {
      ...vehicle,
      tripId: null,
      routeStatus: "laying_over",
    }

    ;(useMinischeduleRun as jest.Mock).mockImplementationOnce(() => ({
      id: "run",
      activities: [asDirectedPieceWithLayover],
    }))
    const tree = renderer
      .create(<MinischeduleRun vehicleOrGhost={vehicleWithLayover} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders as directed pieces", () => {
    const run: Run = {
      id: "run",
      activities: [asDirectedPiece],
    }

    ;(useMinischeduleRun as jest.Mock).mockImplementationOnce(() => run)
    const tree = renderer
      .create(<MinischeduleRun vehicleOrGhost={vehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe("MinischeduleBlock", () => {
  test("renders the loading state", () => {
    ;(useMinischeduleBlock as jest.Mock).mockImplementationOnce(() => undefined)
    const tree = renderer
      .create(<MinischeduleBlock vehicleOrGhost={vehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a not found state", () => {
    ;(useMinischeduleBlock as jest.Mock).mockImplementationOnce(() => null)
    const tree = renderer
      .create(<MinischeduleBlock vehicleOrGhost={vehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a block", () => {
    ;(useMinischeduleBlock as jest.Mock).mockImplementationOnce(() => ({
      id: "block",
      pieces: [piece],
    }))
    const tree = renderer
      .create(<MinischeduleBlock vehicleOrGhost={vehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders pulls and deadheads", () => {
    const deadheadPiece: Piece = {
      ...piece,
      trips: [
        { ...nonrevenueTrip, id: "pullout" },
        { ...nonrevenueTrip, id: "deadhead", startTime: 180, endTime: 360 },
        { ...nonrevenueTrip, id: "pullback", startTime: 840, endTime: 960 },
      ],
    }
    ;(useMinischeduleBlock as jest.Mock).mockImplementationOnce(() => ({
      id: "block",
      pieces: [deadheadPiece],
    }))
    const tree = renderer
      .create(<MinischeduleBlock vehicleOrGhost={vehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders trips in both directions, or missing direction", () => {
    const multiDirectionPiece: Piece = {
      ...piece,
      trips: [revenueTrip, revenueTrip2, tripWithoutDirection],
    }
    ;(useMinischeduleBlock as jest.Mock).mockImplementationOnce(() => ({
      id: "block",
      pieces: [multiDirectionPiece],
    }))

    const tree = renderer
      .create(<MinischeduleBlock vehicleOrGhost={vehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
