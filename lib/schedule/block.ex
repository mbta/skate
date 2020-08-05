defmodule Schedule.Block do
  alias Schedule.Gtfs.Service
  alias Schedule.Hastus
  alias Schedule.Trip

  @type id :: String.t()
  @typedoc """
  Block ids are repeated between different services.
  In order to uniquely identify a block, you need a Service.id() in addition to a Block.id()
  """
  @type key :: {id(), Service.id()}
  @type by_id :: %{key() => t()}

  @type t :: %__MODULE__{
          id: id(),
          service_id: Service.id(),
          schedule_id: Hastus.Schedule.id() | nil,
          start_time: Util.Time.time_of_day(),
          end_time: Util.Time.time_of_day(),
          # only revenue trips. always nonempty
          trips: [Trip.t()]
        }

  @enforce_keys [
    :id,
    :service_id,
    :start_time,
    :end_time,
    :trips
  ]

  defstruct [
    :id,
    :service_id,
    :schedule_id,
    :start_time,
    :end_time,
    :trips
  ]

  @spec blocks_from_trips([Trip.t()]) :: by_id()
  def blocks_from_trips(trips) do
    {revenue_trips, nonrevenue_trips} =
      Enum.split_with(trips, fn trip -> trip.route_id != nil end)

    nonrevenue_trips =
      Enum.group_by(nonrevenue_trips, fn trip -> {trip.block_id, trip.schedule_id} end)

    revenue_trips
    |> Enum.filter(fn trip -> trip.stop_times != [] end)
    |> Enum.group_by(fn trip -> {trip.block_id, trip.service_id} end)
    |> Helpers.map_values(fn trips ->
      block_id = List.first(trips).block_id
      schedule_id = List.first(trips).schedule_id
      deadheads = Map.get(nonrevenue_trips, {block_id, schedule_id}, [])
      block_from_trips(trips, deadheads)
    end)
  end

  @spec block_from_trips([Trip.t()], [Trip.t()]) :: t()
  def block_from_trips(revenue_trips, nonrevenue_trips \\ []) do
    revenue_trips = Enum.sort_by(revenue_trips, & &1.start_time)
    nonrevenue_trips = Enum.sort_by(nonrevenue_trips, & &1.start_time)
    first_trip = List.first(revenue_trips)

    start_time =
      if nonrevenue_trips == [] do
        first_trip.start_time
      else
        min(
          first_trip.start_time,
          List.first(nonrevenue_trips).start_time
        )
      end

    end_time =
      if nonrevenue_trips == [] do
        List.last(revenue_trips).end_time
      else
        max(
          List.last(revenue_trips).end_time,
          List.last(nonrevenue_trips).end_time
        )
      end

    %__MODULE__{
      id: first_trip.block_id,
      service_id: first_trip.service_id,
      schedule_id: first_trip.schedule_id,
      start_time: start_time,
      end_time: end_time,
      trips: revenue_trips
    }
  end

  @spec get(by_id(), id(), Service.id()) :: t() | nil
  def get(by_id, block_id, service_id) do
    by_id[{block_id, service_id}]
  end

  @doc """
  Whether the block is active at any time during the time_of_day range.
  """
  @spec is_active(t(), Util.Time.time_of_day(), Util.Time.time_of_day()) :: boolean()
  def is_active(block, start_time_of_day, end_time_of_day) do
    end_time_of_day > block.start_time and
      start_time_of_day < block.end_time
  end

  @doc """
  The trip that happens after the given trip_id in the given block.
  If the trip_id is not in the block, then :err
  If the trip_id belongs to the last trip in the block, then :last
  """
  @spec next_trip(t(), Trip.id()) :: {:trip, Trip.t()} | :last | :err
  def next_trip(block, trip_id) do
    trips = block.trips

    case Enum.find_index(trips, &(&1.id == trip_id)) do
      nil ->
        :err

      index ->
        case Enum.at(trips, index + 1) do
          nil -> :last
          next_trip -> {:trip, next_trip}
        end
    end
  end

  @spec trip_at_time(t(), Util.Time.time_of_day()) :: Trip.t() | nil
  def trip_at_time(block, now) do
    cond do
      now <= block.start_time ->
        # Block isn't scheduled to have started yet
        List.first(block.trips)

      now >= block.end_time ->
        # Block is scheduled to have finished
        List.last(block.trips)

      true ->
        # Either the current trip or the trip that is about to start
        # If it's between the end of the last trip and the end of the block, use the last trip
        Enum.find(block.trips, fn trip -> trip.end_time > now end) ||
          List.last(block.trips)
    end
  end

  @spec overload?(id()) :: boolean
  def overload?(block_id), do: String.match?(block_id, overload_id_regex())

  @spec id_sans_overload(id() | nil) :: id() | nil
  def id_sans_overload(nil), do: nil

  def id_sans_overload(id), do: String.replace(id, overload_id_regex(), "")

  defp overload_id_regex(), do: ~r/-OL.+$/
end
