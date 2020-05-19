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
import { Break, Piece, Trip } from "../../../src/minischedule"

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

describe("MinischeduleRun", () => {
  test("renders the loading state", () => {
    ;(useMinischeduleRun as jest.Mock).mockImplementationOnce(() => undefined)
    const tree = renderer
      .create(<MinischeduleRun activeTripId={"trip"} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a not found state", () => {
    ;(useMinischeduleRun as jest.Mock).mockImplementationOnce(() => null)
    const tree = renderer
      .create(<MinischeduleRun activeTripId={"trip"} />)
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
      .create(<MinischeduleRun activeTripId={"trip"} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe("MinischeduleBlock", () => {
  test("renders the loading state", () => {
    ;(useMinischeduleBlock as jest.Mock).mockImplementationOnce(() => undefined)
    const tree = renderer
      .create(<MinischeduleBlock activeTripId={"trip"} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a not found state", () => {
    ;(useMinischeduleBlock as jest.Mock).mockImplementationOnce(() => null)
    const tree = renderer
      .create(<MinischeduleBlock activeTripId={"trip"} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a block", () => {
    ;(useMinischeduleBlock as jest.Mock).mockImplementationOnce(() => ({
      id: "block",
      pieces: [piece],
    }))
    const tree = renderer
      .create(<MinischeduleBlock activeTripId={"trip"} />)
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
      .create(<MinischeduleBlock activeTripId={"trip"} />)
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
      .create(<MinischeduleBlock activeTripId={"trip"} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})
