defmodule Schedule.Minischedule.Trip do
  alias Schedule.Block
  alias Schedule.Gtfs.{Direction, Route, RoutePattern, Timepoint}
  alias Schedule.Hastus.Run

  @type id :: Schedule.Trip.id()

  @type t :: %__MODULE__{
          id: id(),
          block_id: Block.id(),
          route_id: Route.id() | nil,
          headsign: String.t() | nil,
          direction_id: Direction.id() | nil,
          via_variant: RoutePattern.via_variant() | nil,
          run_id: Run.id() | nil,
          start_time: Util.Time.time_of_day(),
          end_time: Util.Time.time_of_day(),
          start_place: String.t(),
          end_place: String.t()
        }

  @enforce_keys [
    :id,
    :block_id
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :block_id,
    route_id: nil,
    headsign: nil,
    direction_id: nil,
    via_variant: nil,
    run_id: nil,
    start_time: 0,
    end_time: 0,
    start_place: nil,
    end_place: nil
  ]

  @spec from_full_trip(Schedule.Trip.t(), Timepoint.timepoint_names_by_id()) :: t()
  def from_full_trip(trip, timepoint_names_by_id) do
    %__MODULE__{
      id: trip.id,
      block_id: trip.block_id,
      route_id: trip.route_id,
      headsign: trip.headsign,
      direction_id: trip.direction_id,
      via_variant: trip.route_pattern_id && RoutePattern.via_variant(trip.route_pattern_id),
      run_id: trip.run_id,
      start_time: trip.start_time,
      end_time: trip.end_time,
      start_place: Timepoint.pretty_name_for_id(timepoint_names_by_id, trip.start_place),
      end_place: Timepoint.pretty_name_for_id(timepoint_names_by_id, trip.end_place)
    }
  end

  def from_following_deadhead(deadhead, block_id) do
    %__MODULE__{
      id: "following_deadhead_#{deadhead.run_id}_#{deadhead.start_time}",
      block_id: block_id,
      route_id: nil,
      run_id: deadhead.run_id,
      start_time: deadhead.start_time,
      end_time: deadhead.end_time
    }
  end

  def from_leading_deadhead(deadhead, block_id) do
    %__MODULE__{
      id: "leading_deadhead_#{deadhead.run_id}_#{deadhead.start_time}",
      block_id: block_id,
      route_id: nil,
      run_id: deadhead.run_id,
      start_time: deadhead.start_time,
      end_time: deadhead.end_time
    }
  end
end
