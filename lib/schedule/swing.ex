defmodule Schedule.Swing do
  alias Schedule.Block
  alias Schedule.Hastus
  alias Schedule.Gtfs.Service
  alias Schedule.Piece
  alias Schedule.Route
  alias Schedule.Trip

  @type t :: %__MODULE__{
          block_id: Block.id(),
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
    :block_id,
    :from_route_id,
    :from_run_id,
    :from_trip_id,
    :to_route_id,
    :to_run_id,
    :to_trip_id,
    :time
  ]

  @type by_schedule_id_and_route_id :: %{{Service.id(), Route.id()} => [t()]}

  @spec from_blocks(Block.by_id(), Trip.by_id()) ::
          by_schedule_id_and_route_id()
  def from_blocks(blocks, trips_by_id) do
    swings_info = blocks_to_swing_info(blocks, trips_by_id)

    Enum.reduce(swings_info, %{}, fn swing_info, acc ->
      swing = %__MODULE__{
        block_id: swing_info.block_id,
        from_route_id: swing_info.swing_off_trip.route_id,
        from_run_id: swing_info.swing_off_trip.run_id,
        from_trip_id: swing_info.swing_off_trip.id,
        to_route_id: swing_info.swing_on_trip.route_id,
        to_run_id: swing_info.swing_on_trip.run_id,
        to_trip_id: swing_info.swing_on_trip.id,
        time:
          if swing_info.mid_route_swing do
            swing_info.mid_route_swing.time
          else
            swing_info.swing_on_trip.start_time
          end
      }

      service_id =
        Map.get(swing_info.swing_off_trip, :service_id) ||
          Map.get(swing_info.swing_on_trip, :service_id)

      if service_id do
        [swing_info.swing_off_trip.route_id, swing_info.swing_on_trip.route_id]
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

  @spec blocks_to_swing_info(Block.by_id(), Trip.by_id()) ::
          [
            %{
              swing_off_trip: Trip.id() | Trip.t(),
              swing_on_trip: Trip.id() | Trip.t(),
              mid_route_swing: Piece.mid_route_swing() | nil,
              block_id: Schedule.Block.id()
            }
          ]
  defp blocks_to_swing_info(blocks, trips_by_id) do
    blocks
    |> Map.values()
    |> Enum.map(&{&1.pieces, &1.id})
    |> Enum.flat_map(fn {pieces_for_block, block_id} ->
      Enum.chunk_every(pieces_for_block, 2, 1, :discard)
      |> Enum.map(fn [piece1, piece2] -> {piece1, piece2, block_id} end)
    end)
    |> Enum.map(fn {piece1, piece2, block_id} ->
      trip1 = piece1.trips |> List.last() |> trip_or_trip_id_to_trip(trips_by_id)
      trip2 = piece2 |> first_trip_from_piece(trips_by_id)

      %{
        swing_off_trip: trip1,
        swing_on_trip: trip2,
        mid_route_swing: piece2.start_mid_route?,
        block_id: block_id
      }
    end)
    |> Enum.filter(fn %{swing_off_trip: trip1, swing_on_trip: trip2} ->
      !is_nil(trip1) && !is_nil(trip2) && (trip1.route_id || trip2.route_id)
    end)
  end

  @spec trip_or_trip_id_to_trip(
          Trip.id() | Schedule.Trip.t() | Schedule.AsDirected.t(),
          Trip.by_id()
        ) ::
          Schedule.Trip.t() | Trip.t() | nil
  defp trip_or_trip_id_to_trip(%Schedule.Trip{} = trip, trips_by_id),
    do: Map.get(trips_by_id, trip.id, trip)

  defp trip_or_trip_id_to_trip(%Schedule.AsDirected{}, _trips_by_id),
    do: nil

  defp trip_or_trip_id_to_trip(trip_id, trips_by_id), do: Map.fetch!(trips_by_id, trip_id)

  @spec first_trip_from_piece(Schedule.Piece.t(), Trip.by_id()) ::
          Trip.id() | Schedule.Trip.t() | Schedule.AsDirected.t()
  defp first_trip_from_piece(piece, trips_by_id) do
    first_full_trip =
      piece.trips
      |> Stream.map(&trip_or_trip_id_to_trip(&1, trips_by_id))
      |> Stream.filter(fn trip -> !is_nil(trip) end)
      |> Enum.take(1)
      |> List.first()

    case {first_full_trip, piece.start_mid_route?} do
      {nil, %{trip: mid_route_trip}} ->
        mid_route_trip |> trip_or_trip_id_to_trip(trips_by_id)

      {_, %{trip: mid_route_trip}} ->
        with %{} = first_trip <- mid_route_trip |> trip_or_trip_id_to_trip(trips_by_id) do
          %{first_trip | :run_id => first_full_trip.run_id}
        end

      {_, nil} ->
        first_full_trip
    end
  end
end
