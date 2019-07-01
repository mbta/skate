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

  @spec sort_trips_by_time([Trip.t()]) :: [Trip.t()]
  defp sort_trips_by_time(trips) do
    Enum.sort_by(
      trips,
      fn trip -> List.first(trip.stop_times).time end
    )
  end
end
