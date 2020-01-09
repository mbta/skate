defmodule Gtfs.Block do
  alias Gtfs.Service
  alias Gtfs.Trip

  @type id :: String.t()
  @type t :: [Trip.t()]
  @typedoc """
  Block ids are repeated between different services.
  In order to uniquely identify a block, you need a Service.id() in addition to a Block.id()
  """
  @type key :: {id(), Service.id()}
  @type by_id :: %{key() => t()}

  @spec group_trips_by_block([Trip.t()]) :: by_id()
  def group_trips_by_block(trips) do
    trips
    |> Enum.filter(fn trip -> trip.stop_times != [] end)
    |> Enum.group_by(fn trip -> {trip.block_id, trip.service_id} end)
    |> Helpers.map_values(&sort_trips_by_time/1)
  end

  @spec get(by_id(), id(), Service.id()) :: t() | nil
  def get(by_id, block_id, service_id) do
    by_id[{block_id, service_id}]
  end

  @doc """
  Get the time of the first stop of the first trip for this block
  """
  @spec start_time(t()) :: Util.Time.time_of_day()
  def start_time(block) do
    block
    |> first_trip()
    |> Trip.start_time()
  end

  @doc """
  Get the time of the last stop of the last trip for this block
  """
  @spec end_time(t()) :: Util.Time.time_of_day()
  def end_time(block) do
    block
    |> last_trip()
    |> Trip.end_time()
  end

  @doc """
  Whether the block is active at any time during the time_of_day range.
  """
  @spec is_active(t(), Util.Time.time_of_day(), Util.Time.time_of_day()) :: bool
  def is_active(block, start_time_of_day, end_time_of_day) do
    end_time_of_day > start_time(block) and
      start_time_of_day < end_time(block)
  end

  @spec first_trip(t()) :: Trip.t()
  def first_trip(block), do: List.first(block)

  @spec last_trip(t()) :: Trip.t()
  def last_trip(block), do: List.last(block)

  @doc """
  The trip that happens after the given trip_id in the given block.
  If the trip_id is not in the block, then :err
  If the trip_id belongs to the last trip in the block, then :last
  """
  @spec next_trip(t(), Trip.id()) :: {:trip, Trip.t()} | :last | :err
  def next_trip(block, trip_id) do
    case Enum.find_index(block, &(&1.id == trip_id)) do
      nil ->
        :err

      index ->
        case Enum.at(block, index + 1) do
          nil -> :last
          next_trip -> {:trip, next_trip}
        end
    end
  end

  @spec trip_at_time(t(), Util.Time.time_of_day()) :: Trip.t() | nil
  def trip_at_time(block, now) do
    cond do
      now <= start_time(block) ->
        # Block isn't scheduled to have started yet
        first_trip(block)

      now >= end_time(block) ->
        # Block is scheduled to have finished
        nil

      true ->
        # Either the current trip or the trip that is about to start
        Enum.find(block, fn trip -> Trip.end_time(trip) > now end)
    end
  end

  @spec sort_trips_by_time([Trip.t()]) :: [Trip.t()]
  defp sort_trips_by_time(trips) do
    Enum.sort_by(trips, &Trip.start_time/1)
  end
end
