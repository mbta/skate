defmodule Gtfs.Block do
  alias Gtfs.Helpers
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
    |> List.first()
    |> Map.get(:stop_times)
    |> List.first()
    |> Map.get(:time)
  end

  @doc """
  Get the time of the last stop of the last trip for this block
  """
  @spec end_time(t()) :: Util.Time.time_of_day()
  def end_time(block) do
    block
    |> List.last()
    |> Map.get(:stop_times)
    |> List.last()
    |> Map.get(:time)
  end

  @spec sort_trips_by_time([Trip.t()]) :: [Trip.t()]
  defp sort_trips_by_time(trips) do
    Enum.sort_by(
      trips,
      fn trip -> List.first(trip.stop_times).time end
    )
  end
end
