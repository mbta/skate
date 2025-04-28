import {
  AsDirected,
  Block,
  Break,
  Piece,
  Run,
  ScheduleBlock,
  ScheduleRun,
  StopTime,
  Time,
  Trip,
} from "../minischedule"
import { RunId } from "../realtime"
import {
  BlockId,
  DirectionId,
  RouteId,
  StopId,
  Timepoint,
  TimepointId,
  TimepointNameById,
  TripId,
  ViaVariant,
} from "../schedule"

type ActivityData = BreakData | PieceData

interface ScheduleRunData {
  run: RunData
  timepoints: Timepoint[]
}

interface ScheduleBlockData {
  block: BlockData
  timepoints: Timepoint[]
}

interface RunData {
  id: RunId
  activities: ActivityData[]
}

interface BlockData {
  id: BlockId
  pieces: PieceData[]
}

interface AsDirectedData {
  kind: "wad" | "rad"
  start_time: Time
  end_time: Time
}

interface BreakData {
  break_type: string
  start_time: Time
  end_time: Time
  end_place: string
}

interface PieceData {
  run_id: RunId
  block_id: BlockId | null
  start_time: Time
  start_place: string
  trips: TripData[]
  end_time: Time
  end_place: string
  "start_mid_route?": { time: Time; trip: TripData } | null
  "end_mid_route?": boolean
}

interface TripData {
  id: TripId
  block_id: BlockId
  route_id: RouteId
  headsign: string | null
  direction_id: DirectionId | null
  via_variant: ViaVariant | null
  run_id: RunId | null
  start_time: Time
  end_time: Time
  start_place: string | null
  end_place: string | null
  stop_times: StopTimeData[]
}

interface StopTimeData {
  time: Time
  stop_id: StopId
  timepoint_id: TimepointId | null
}

const isBreakData = (
  activityData: BreakData | PieceData
): activityData is BreakData =>
  Object.prototype.hasOwnProperty.call(activityData, "break_type")

export const scheduleRunFromData = (
  scheduleRunData: ScheduleRunData
): ScheduleRun => ({
  run: runFromData(scheduleRunData),
  timepoints: timepointsFromData(scheduleRunData),
})

const runFromData = ({ run }: ScheduleRunData): Run => ({
  id: run.id,
  activities: run.activities.map((activityData) =>
    isBreakData(activityData)
      ? breakFromData(activityData)
      : pieceFromData(activityData)
  ),
})

const timepointsFromData = ({
  timepoints,
}: ScheduleRunData | ScheduleBlockData): TimepointNameById =>
  new Map(
    timepoints.map((timepoint: Timepoint) => [timepoint.id, timepoint.name])
  )

export const scheduleBlockFromData = (
  scheduleBlockData: ScheduleBlockData
): ScheduleBlock => ({
  block: blockFromData(scheduleBlockData),
  timepoints: timepointsFromData(scheduleBlockData),
})

export const blockFromData = ({ block }: ScheduleBlockData): Block => ({
  id: block.id,
  pieces: block.pieces.map(pieceFromData),
})

const breakFromData = (breakData: BreakData): Break => ({
  breakType: breakData.break_type,
  startTime: breakData.start_time,
  endTime: breakData.end_time,
  endPlace: breakData.end_place,
})

const pieceFromData = (pieceData: PieceData): Piece => ({
  runId: pieceData.run_id,
  blockId: pieceData.block_id,
  startTime: pieceData.start_time,
  startPlace: pieceData.start_place,
  trips: pieceData.trips.map((data) =>
    isTripData(data) ? tripFromData(data) : asDirectedFromData(data)
  ),
  endTime: pieceData.end_time,
  endPlace: pieceData.end_place,
  startMidRoute:
    pieceData["start_mid_route?"] === null
      ? null
      : {
          time: pieceData["start_mid_route?"].time,
          trip: tripFromData(pieceData["start_mid_route?"].trip),
        },
  endMidRoute: pieceData["end_mid_route?"],
})

const stopTimeFromData = (stopTimeData: StopTimeData): StopTime => ({
  time: stopTimeData.time,
  stopId: stopTimeData.stop_id,
  timepointId: stopTimeData.timepoint_id,
})

const tripFromData = (tripData: TripData): Trip => ({
  id: tripData.id,
  blockId: tripData.block_id,
  routeId: tripData.route_id,
  headsign: tripData.headsign,
  directionId: tripData.direction_id,
  viaVariant: tripData.via_variant,
  runId: tripData.run_id,
  startTime: tripData.start_time,
  endTime: tripData.end_time,
  startPlace: tripData.start_place || "",
  endPlace: tripData.end_place || "",
  stopTimes: tripData.stop_times.map(stopTimeFromData),
})

const asDirectedFromData = (asDirectedData: AsDirectedData): AsDirected => ({
  kind: asDirectedData.kind,
  startTime: asDirectedData.start_time,
  endTime: asDirectedData.end_time,
})

const isTripData = (data: TripData | AsDirectedData): data is TripData =>
  Object.prototype.hasOwnProperty.call(data, "id")
