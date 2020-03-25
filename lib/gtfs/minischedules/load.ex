defmodule Gtfs.Minischedules.Load do
  @moduledoc """
  Load the HASTUS data into minischedules data
  """

  alias Gtfs.Hastus.{Activity, Trip}
  alias Gtfs.Minischedules.Piece

  @type loaded :: %{}

  @spec load([Trip.t()], [Activity.t()]) :: loaded()
  def load(_trips, _activities) do
    %{}
  end

  @spec pieces_from_trips([Trip.t()]) :: [Piece.t()]
  def pieces_from_trips(trips) do
    trips
    |> group_trips
    |> Enum.map(&piece_from_trip_group/1)
  end

  # The trips that form a piece together
  @typep trip_group :: {Piece.key(), [Trip.t()]}

  @spec group_trips([Trip.t()]) :: [trip_group()]
  defp group_trips([]) do
    []
  end

  defp group_trips(trips) do
    first_key = piece_key_for_trip(List.first(trips))

    {first_piece_trips, other_trips} =
      Enum.split_while(trips, fn trip -> piece_key_for_trip(trip) == first_key end)

    [{first_key, first_piece_trips} | group_trips(other_trips)]
  end

  @spec piece_key_for_trip(Trip.t()) :: Piece.key()
  defp piece_key_for_trip(trip) do
    {trip.schedule_id, trip.run_id, trip.block_id}
  end

  @spec piece_from_trip_group(trip_group()) :: Piece.t()
  defp piece_from_trip_group({{schedule_id, run_id, block_id}, trips}) do
    first_trip = List.first(trips)
    last_trip = List.last(trips)

    %Piece{
      schedule_id: schedule_id,
      run_id: run_id,
      block_id: block_id,
      start: %{
        time: first_trip.start_time,
        place: first_trip.start_place,
        mid_route?: false
      },
      trips: trips,
      end: %{
        time: last_trip.end_time,
        place: last_trip.end_place,
        mid_route?: false
      }
    }
  end
end
