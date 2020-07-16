import { mount } from "enzyme"
import React from "react"
import renderer from "react-test-renderer"
import {
  BreakRow,
  Minischedule,
  MinischeduleBlock,
  MinischeduleRun,
} from "../../../src/components/propertiesPanel/minischedule"
import {
  useMinischeduleBlock,
  useMinischeduleRun,
} from "../../../src/hooks/useMinischedule"
import { Break, Piece, Run, Trip } from "../../../src/minischedule"
import { Vehicle } from "../../../src/realtime"
import { mockUseStateOnce } from "../../testHelpers/mockHelpers"

jest.mock("../../../src/hooks/useMinischedule", () => ({
  __esModule: true,
  useMinischeduleRun: jest.fn(),
  useMinischeduleBlock: jest.fn(),
}))

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
  startPlace: "1st Street and A Ave",
  endPlace: "999th Street and ZZZ Ave",
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
  startPlace: "Red Square",
  endPlace: "Blue Triangle",
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
  startPlace: "Sometown Center",
  endPlace: "Othertown Village",
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
  startPlace: "Highway 1",
  endPlace: "Trouble",
}

const piece: Piece = {
  runId: "run",
  blockId: "block",
  startTime: 1820,
  startPlace: "start",
  trips: [revenueTrip],
  endTime: 1821,
  endPlace: "end",
  startMidRoute: null,
  endMidRoute: false,
}

const asDirectedPiece: Piece = {
  runId: "run",
  blockId: null,
  startTime: 15600,
  startPlace: "place",
  trips: [
    {
      kind: "rad",
      startTime: 16200,
      endTime: 44400,
    },
  ],
  endTime: 16200,
  endPlace: "place",
  startMidRoute: null,
  endMidRoute: false,
}

const midRouteSwingTrip1: Trip = {
  id: "trip1",
  blockId: "block",
  routeId: "R",
  headsign: "Trip 1",
  directionId: 0,
  viaVariant: null,
  runId: "run1",
  startTime: 60,
  endTime: 240,
  startPlace: "terminal1",
  endPlace: "terminal2",
}

const midRouteSwingTrip2: Trip = {
  id: "trip2",
  blockId: "block",
  routeId: "R",
  headsign: "Trip 2",
  directionId: 1,
  viaVariant: null,
  runId: "run2",
  startTime: 300,
  endTime: 480,
  startPlace: "terminal2",
  endPlace: "terminal1",
}

const midRouteSwingPiece1: Piece = {
  runId: "run1",
  blockId: "block",
  startTime: 0,
  startPlace: "terminal1",
  trips: [midRouteSwingTrip1],
  endTime: 180,
  endPlace: "swingplace",
  startMidRoute: null,
  endMidRoute: true,
}

const midRouteSwingPiece2: Piece = {
  runId: "run2",
  blockId: "block",
  startTime: 120,
  startPlace: "swingplace",
  trips: [midRouteSwingTrip2],
  endTime: 480,
  endPlace: "terminal1",
  startMidRoute: {
    time: 180,
    trip: midRouteSwingTrip1,
  },
  endMidRoute: false,
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
  crowding: null,
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
    const breakk: Break = {
      breakType: "Paid meal before",
      startTime: 10,
      endTime: 1810,
      endPlace: "Timepoint Bravo",
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
      startPlace: "A Streetcorner",
      endPlace: "Prominent Landmark",
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

  test("renders a mid route swing on", () => {
    const run: Run = {
      id: "run2",
      activities: [midRouteSwingPiece2],
    }
    ;(useMinischeduleRun as jest.Mock).mockImplementationOnce(() => run)
    const tree = renderer
      .create(<MinischeduleRun vehicleOrGhost={vehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a mid route swing off", () => {
    const run: Run = {
      id: "run1",
      activities: [midRouteSwingPiece1],
    }
    ;(useMinischeduleRun as jest.Mock).mockImplementationOnce(() => run)
    const tree = renderer
      .create(<MinischeduleRun vehicleOrGhost={vehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders duty details of run", () => {
    const piece1: Piece = {
      runId: "run",
      blockId: "block",
      startTime: 22000,
      startPlace: "cabot",
      trips: [],
      endTime: 36450,
      endPlace: "cabot",
      startMidRoute: null,
      endMidRoute: false,
    }
    const break1: Break = {
      breakType: "Paid meal before",
      startTime: 36450,
      endTime: 38070,
      endPlace: "cabot",
    }
    const piece2: Piece = {
      runId: "run",
      blockId: "block",
      startTime: 38070,
      startPlace: "cabot",
      trips: [],
      endTime: 40760,
      endPlace: "cabot",
      startMidRoute: null,
      endMidRoute: false,
    }
    const break2: Break = {
      breakType: "Split break",
      startTime: 40760,
      endTime: 43760,
      endPlace: "cabot",
    }
    const piece3: Piece = {
      runId: "run",
      blockId: "block",
      startTime: 43760,
      startPlace: "cabot",
      trips: [],
      endTime: 52590,
      endPlace: "cabot",
      startMidRoute: null,
      endMidRoute: false,
    }
    const break3: Break = {
      breakType: "Technical break",
      startTime: 52590,
      endTime: 63240,
      endPlace: "cabot",
    }
    const piece4: Piece = {
      runId: "run",
      blockId: "block",
      startTime: 63240,
      startPlace: "cabot",
      trips: [],
      endTime: 78000,
      endPlace: "cabot",
      startMidRoute: null,
      endMidRoute: false,
    }
    const break4: Break = {
      breakType: "Split break",
      startTime: 78000,
      endTime: 83000,
      endPlace: "cabot",
    }

    const run: Run = {
      id: "run",
      activities: [
        piece1,
        break1,
        piece2,
        break2,
        piece3,
        break3,
        piece4,
        break4,
      ],
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

  test("renders a mid route swing", () => {
    ;(useMinischeduleBlock as jest.Mock).mockImplementationOnce(() => ({
      id: "block",
      pieces: [midRouteSwingPiece1, midRouteSwingPiece2],
    }))

    const tree = renderer
      .create(<MinischeduleBlock vehicleOrGhost={vehicle} />)
      .toJSON()

    expect(tree).toMatchSnapshot()
  })
})

describe("Minischedule", () => {
  test("renders a Show past trips button", () => {
    const block = { id: "block", pieces: [] }
    const tree = renderer
      .create(
        <Minischedule
          runOrBlock={block}
          vehicleOrGhost={vehicle}
          view="block"
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("renders a Hide past trips button", () => {
    mockUseStateOnce(true)
    const block = { id: "block", pieces: [] }
    const tree = renderer
      .create(
        <Minischedule
          runOrBlock={block}
          vehicleOrGhost={vehicle}
          view="block"
        />
      )
      .toJSON()

    expect(tree).toMatchSnapshot()
  })

  test("clicking the show/hide button toggles whether past trips are shown", () => {
    const block = { id: "block", pieces: [] }
    const wrapper = mount(
      <Minischedule runOrBlock={block} vehicleOrGhost={vehicle} view="block" />
    )

    expect(wrapper.html()).toContain("m-minischedule--hide-past")
    wrapper.find(".m-minischedule__show-past").simulate("click")
    expect(wrapper.html()).toContain("m-minischedule--show-past")
    wrapper.find(".m-minischedule__show-past").simulate("click")
    expect(wrapper.html()).toContain("m-minischedule--hide-past")
  })

  test("highlights pullouts if they're active", () => {
    const run = {
      id: "run",
      activities: [
        {
          ...piece,
          trips: [
            { ...nonrevenueTrip, startTime: 0 },
            { ...revenueTrip, startTime: 1 },
          ],
        },
      ],
    }
    const tree = renderer
      .create(
        <Minischedule
          runOrBlock={run}
          vehicleOrGhost={{
            ...vehicle,
            tripId: revenueTrip.id,
            routeStatus: "pulling_out",
          }}
          view="run"
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  test("highlights deadheads if they're active", () => {
    const run = {
      id: "run",
      activities: [
        {
          ...piece,
          trips: [
            { ...revenueTrip, id: "before", startTime: 0 },
            { ...nonrevenueTrip, id: "deadhead", startTime: 1 },
            { ...revenueTrip, id: "after", startTime: 2 },
          ],
        },
      ],
    }
    const tree = renderer
      .create(
        <Minischedule
          runOrBlock={run}
          vehicleOrGhost={{
            ...vehicle,
            tripId: "after",
            routeStatus: "laying_over",
          }}
          view="run"
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})

describe("BreakRow", () => {
  test("Split breaks show as unpaid, with place", () => {
    const breakk: Break = {
      breakType: "Split break",
      startTime: 0,
      endTime: 0,
      endPlace: "Charlie Circle",
    }

    const wrapper = mount(
      <BreakRow break={breakk} index={0} activeIndex={null} />
    )
    expect(wrapper.html()).toContain("Break (Unpaid)")
    expect(wrapper.html()).toContain("Charlie Circle")
  })

  test("Paid breaks show as paid, with place", () => {
    const breakk: Break = {
      breakType: "Paid meal after",
      startTime: 0,
      endTime: 0,
      endPlace: "Delta Drive",
    }

    const wrapper = mount(
      <BreakRow break={breakk} index={0} activeIndex={null} />
    )
    expect(wrapper.html()).toContain("Break (Paid)")
    expect(wrapper.html()).toContain("Delta Drive")
  })

  test("Travel times show as paid, with destination", () => {
    const breakk: Break = {
      breakType: "Travel from",
      startTime: 0,
      endTime: 0,
      endPlace: "Echo Avenue",
    }

    const wrapper = mount(
      <BreakRow break={breakk} index={0} activeIndex={null} />
    )
    expect(wrapper.html()).toContain("Travel to Echo Avenue (Paid)")
  })

  test("Unrecognized types show their name and place", () => {
    const breakk: Break = {
      breakType: "Unrecognized break type",
      startTime: 0,
      endTime: 0,
      endPlace: "Foxtrot Village",
    }

    const wrapper = mount(
      <BreakRow break={breakk} index={0} activeIndex={null} />
    )
    expect(wrapper.html()).toContain("Unrecognized break type")
    expect(wrapper.html()).toContain("Foxtrot Village")
    expect(wrapper.html()).not.toContain("(Paid)")
    expect(wrapper.html()).not.toContain("(Unpaid)")
  })
})
