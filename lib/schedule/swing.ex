defmodule Schedule.Swing do
  alias Schedule.Hastus
  alias Schedule.Gtfs.Service
  alias Schedule.Route
  alias Schedule.Trip
  alias Schedule.Minischedule

  @type t :: %__MODULE__{
          from_route_id: Route.id(),
          from_run_id: Hastus.Run.id(),
          from_trip_id: Trip.id(),
          to_route_id: Route.id(),
          to_run_id: Hastus.Run.id(),
          to_trip_id: Trip.id(),
          time: Util.Time.time_of_day()
        }

  @derive Jason.Encoder

  defstruct [
    :from_route_id,
    :from_run_id,
    :from_trip_id,
    :to_route_id,
    :to_run_id,
    :to_trip_id,
    :time
  ]

  @type by_schedule_id_and_route_id :: %{{Service.id(), Route.id()} => [t()]}

  @spec from_minischedule_blocks(Minischedule.Block.by_id(), Trip.by_id()) ::
          by_schedule_id_and_route_id()
  def from_minischedule_blocks(minischedule_blocks, trips_by_id) do
    piece_pairs =
      minischedule_blocks
      |> Map.values()
      |> Enum.map(& &1.pieces)
      |> Enum.flat_map(fn pieces_for_block ->
        Enum.chunk_every(pieces_for_block, 2, 1, :discard)
        |> Enum.map(&List.to_tuple/1)
      end)

    trip_pairs_with_swing =
      piece_pairs
      |> Enum.map(fn {piece1, piece2} ->
        trip1 = piece1.trips |> List.last() |> trip_or_trip_id_to_trip(trips_by_id)
        trip2 = piece2.trips |> List.first() |> trip_or_trip_id_to_trip(trips_by_id)

        {trip1, trip2}
      end)
      |> Enum.filter(fn {trip1, trip2} ->
        trip1.route_id || trip2.route_id
      end)

    Enum.reduce(trip_pairs_with_swing, %{}, fn trip_pair, acc ->
      {swing_off_trip, swing_on_trip} = trip_pair

      swing = %__MODULE__{
        from_route_id: swing_off_trip.route_id,
        from_run_id: swing_off_trip.run_id,
        from_trip_id: swing_off_trip.id,
        to_route_id: swing_on_trip.route_id,
        to_run_id: swing_on_trip.run_id,
        to_trip_id: swing_on_trip.id,
        time: swing_on_trip.start_time
      }

      service_id = Map.get(swing_off_trip, :service_id) || Map.get(swing_on_trip, :service_id)

      if service_id do
        [swing_off_trip.route_id, swing_on_trip.route_id]
        |> Enum.uniq()
        |> Enum.map(&{service_id, &1})
        |> Enum.reduce(acc, fn key, swing_map ->
          Map.update(swing_map, key, [swing], fn swings -> [swing | swings] end)
        end)
      else
        acc
      end
    end)
  end

  defp trip_or_trip_id_to_trip(%Minischedule.Trip{} = trip, trips_by_id),
    do: Map.get(trips_by_id, trip.id, trip)

  defp trip_or_trip_id_to_trip(trip_id, trips_by_id), do: Map.fetch!(trips_by_id, trip_id)
end
