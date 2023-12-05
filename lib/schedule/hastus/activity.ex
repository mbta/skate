defmodule Schedule.Hastus.Activity do
  @moduledoc false

  alias Schedule.AsDirected
  alias Schedule.Block
  alias Schedule.Break
  alias Schedule.Csv
  alias Schedule.Gtfs.Timepoint
  alias Schedule.Hastus
  alias Schedule.Piece
  alias Schedule.Hastus.{Place, Run}

  require Logger

  @type t :: %__MODULE__{
          schedule_id: Hastus.Schedule.id(),
          run_id: Run.id(),
          start_time: Util.Time.time_of_day(),
          end_time: Util.Time.time_of_day(),
          start_place: Place.id(),
          end_place: Place.id(),
          activity_type: String.t(),
          # present only for activity_type "Operator"
          # block ids elsewhere have a letter indicating the garage
          # the block id from the activity name is missing it
          # e.g. "57-11" instead of "A57-11"
          partial_block_id: Block.id() | nil
        }

  @enforce_keys [
    :schedule_id,
    :run_id,
    :start_time,
    :end_time,
    :start_place,
    :end_place,
    :activity_type
  ]

  defstruct [
    :schedule_id,
    :run_id,
    :start_time,
    :end_time,
    :start_place,
    :end_place,
    :activity_type,
    :partial_block_id
  ]

  @spec from_csv_row(Csv.row()) :: t()
  def from_csv_row(row) do
    activity_type = row["activity_type"]

    partial_block_id =
      if activity_type == "Operator" do
        String.replace(row["activity_name"], " ", "")
      else
        nil
      end

    %__MODULE__{
      schedule_id: row["schedule_id"],
      run_id: Run.from_parts(row["area"], row["run_id"]),
      start_time: Util.Time.parse_hhmm(row["start_time"]),
      end_time: Util.Time.parse_hhmm(row["end_time"]),
      start_place: Place.map_input_place_id(row["start_place"]),
      end_place: Place.map_input_place_id(row["end_place"]),
      activity_type: activity_type,
      partial_block_id: partial_block_id
    }
  end

  @spec parse(binary() | nil) :: [t()]
  def parse(file_binary) do
    Csv.parse(
      file_binary,
      parse: &from_csv_row/1,
      format: :hastus
    )
  end

  @spec run_key(t()) :: Run.key()
  def run_key(activity) do
    {activity.schedule_id, activity.run_id}
  end

  @spec to_pieces_and_breaks(
          [__MODULE__.t()],
          [Hastus.Trip.t()],
          %{
            Block.key() => [Hastus.Trip.t()]
          },
          Schedule.Trip.by_id(),
          Timepoint.timepoint_names_by_id()
        ) :: [Piece.t() | Break.t()]
  def to_pieces_and_breaks(
        activities,
        trips,
        all_trips_by_block,
        schedule_trips_by_id,
        timepoint_names_by_id
      ) do
    activities
    |> operator_activities_to_pieces(trips, all_trips_by_block, schedule_trips_by_id)
    |> as_directed_activities_to_pieces()
    |> add_deadheads_to_pieces()
    |> add_sign_ons_to_pieces()
    |> activities_to_breaks()
    |> set_pretty_names(timepoint_names_by_id)
  end

  @spec operator_activities_to_pieces(
          [__MODULE__.t()],
          [Hastus.Trip.t()],
          %{
            Block.key() => [Hastus.Trip.t()]
          },
          Schedule.Trip.by_id()
        ) ::
          [__MODULE__.t() | Piece.t()]
  defp operator_activities_to_pieces(activities, trips, all_trips_by_block, schedule_trips_by_id) do
    Enum.map(activities, fn activity ->
      operator_activity_to_piece(activity, trips, all_trips_by_block, schedule_trips_by_id)
    end)
  end

  @spec operator_activity_to_piece(
          __MODULE__.t(),
          [Hastus.Trip.t()],
          %{
            Block.key() => [Hastus.Trip.t()]
          },
          Schedule.Trip.by_id()
        ) ::
          Piece.t() | __MODULE__.t()
  defp operator_activity_to_piece(
         %__MODULE__{activity_type: "Operator"} = activity,
         trips_in_run,
         all_trips_by_block,
         schedule_trips_by_id
       ) do
    trips_in_piece =
      Enum.filter(trips_in_run, fn trip ->
        trip_in_operator?(activity, trip)
      end)

    if trips_in_piece == [] do
      Logger.warning(fn ->
        "Operator activity with no trips: #{activity.schedule_id} #{activity.run_id} start_time:#{activity.start_time}"
      end)
    end

    as_directeds_and_schedule_trips =
      if operator_is_as_directed?(activity) do
        [as_directed_from_trips(trips_in_piece)]
      else
        Enum.map(trips_in_piece, &Map.fetch!(schedule_trips_by_id, &1.trip_id))
      end

    %Piece{
      schedule_id: activity.schedule_id,
      run_id: activity.run_id,
      block_id: block_id_from_trips(trips_in_piece),
      start_time: activity.start_time,
      start_place: activity.start_place,
      trips: as_directeds_and_schedule_trips,
      end_time: activity.end_time,
      end_place: activity.end_place,
      start_mid_route?:
        start_mid_route?(activity, trips_in_piece, all_trips_by_block, schedule_trips_by_id),
      end_mid_route?: end_mid_route?(activity, trips_in_piece)
    }
  end

  defp operator_activity_to_piece(activity, _, _, _), do: activity

  @spec as_directed_from_trips([Hastus.Trip.t()]) :: AsDirected.t()
  defp as_directed_from_trips(trips_in_piece) do
    [
      %Hastus.Trip{route_id: nil} = _pullout,
      as_directed_trip,
      %Hastus.Trip{route_id: nil} = _pull_back
    ] = trips_in_piece

    kind =
      case as_directed_trip.route_id do
        "rad" -> :rad
        "wad" -> :wad
      end

    %AsDirected{
      kind: kind,
      start_time: as_directed_trip.start_time,
      end_time: as_directed_trip.end_time,
      start_place: as_directed_trip.start_place,
      end_place: as_directed_trip.end_place
    }
  end

  @spec as_directed_activities_to_pieces([__MODULE__.t() | Piece.t()]) :: [
          __MODULE__.t() | Piece.t()
        ]
  defp as_directed_activities_to_pieces(activities_and_pieces) do
    Enum.map(activities_and_pieces, fn
      %Piece{} = piece ->
        piece

      %__MODULE__{} = activity ->
        if activity_is_as_directed?(activity) do
          as_directed_activity_to_piece(activity)
        else
          activity
        end
    end)
  end

  @spec activity_is_as_directed?(__MODULE__.t()) :: boolean()
  defp activity_is_as_directed?(activity) do
    activity.activity_type == "rad" or activity.activity_type == "wad"
  end

  @spec as_directed_activity_to_piece(__MODULE__.t()) :: Piece.t()
  defp as_directed_activity_to_piece(activity) do
    %Piece{
      schedule_id: activity.schedule_id,
      run_id: activity.run_id,
      block_id: nil,
      start_time: activity.start_time,
      start_place: activity.start_place,
      trips: [
        %AsDirected{
          kind:
            case activity.activity_type do
              "wad" -> :wad
              "rad" -> :rad
            end,
          start_time: activity.start_time,
          end_time: activity.end_time,
          start_place: activity.start_place,
          end_place: activity.end_place
        }
      ],
      end_time: activity.end_time,
      end_place: activity.end_place
    }
  end

  @spec add_deadheads_to_pieces([__MODULE__.t() | Piece.t()]) :: [__MODULE__.t() | Piece.t()]
  defp add_deadheads_to_pieces([]) do
    []
  end

  defp add_deadheads_to_pieces([
         %__MODULE__{activity_type: "Deadhead from"} = deadhead,
         %Piece{} = piece
         | rest
       ]) do
    dummy_trip = Schedule.Trip.from_leading_deadhead(deadhead, piece.block_id)

    new_piece = %{
      piece
      | start_time: deadhead.start_time,
        start_place: deadhead.start_place,
        trips: [dummy_trip | piece.trips]
    }

    add_deadheads_to_pieces([new_piece | rest])
  end

  defp add_deadheads_to_pieces([
         %Piece{} = piece,
         %__MODULE__{activity_type: "Deadhead to"} = deadhead
         | rest
       ]) do
    dummy_trip = Schedule.Trip.from_following_deadhead(deadhead, piece.block_id)

    new_piece = %{
      piece
      | trips: piece.trips ++ [dummy_trip],
        end_time: deadhead.end_time,
        end_place: deadhead.end_place
    }

    add_deadheads_to_pieces([new_piece | rest])
  end

  defp add_deadheads_to_pieces([first | rest]) do
    [first | add_deadheads_to_pieces(rest)]
  end

  @spec add_sign_ons_to_pieces([__MODULE__.t() | Piece.t()]) :: [__MODULE__.t() | Piece.t()]
  defp add_sign_ons_to_pieces([]) do
    []
  end

  defp add_sign_ons_to_pieces([
         %__MODULE__{activity_type: "Sign-on"} = sign_on,
         %Piece{} = piece
         | rest
       ]) do
    new_piece = %{
      piece
      | start_time: sign_on.start_time,
        start_place: sign_on.start_place
    }

    add_sign_ons_to_pieces([new_piece | rest])
  end

  defp add_sign_ons_to_pieces([first | rest]) do
    [first | add_sign_ons_to_pieces(rest)]
  end

  @spec activities_to_breaks([__MODULE__.t() | Piece.t()]) :: [Break.t() | Piece.t()]
  defp activities_to_breaks(activities_and_pieces) do
    Enum.map(activities_and_pieces, fn
      %Piece{} = piece -> piece
      %__MODULE__{} = activity -> Break.from_activity(activity)
    end)
  end

  @spec trip_in_operator?(__MODULE__.t(), Hastus.Trip.t()) :: boolean()
  defp trip_in_operator?(%__MODULE__{activity_type: "Operator"} = activity, trip) do
    String.contains?(trip.block_id, activity.partial_block_id) and
      trip.start_time >= activity.start_time and
      trip.start_time <= activity.end_time
  end

  @spec operator_is_as_directed?(__MODULE__.t()) :: boolean()
  defp operator_is_as_directed?(%__MODULE__{activity_type: "Operator"} = activity) do
    activity.partial_block_id =~ ~r/^[r|w]ad/i
  end

  @spec start_mid_route?(
          __MODULE__.t(),
          [Hastus.Trip.t()],
          %{Block.key() => [Hastus.Trip.t()]},
          Schedule.Trip.by_id()
        ) ::
          Piece.mid_route_swing() | nil
  defp start_mid_route?(
         %__MODULE__{activity_type: "Operator"} = activity,
         hastus_trips_in_piece,
         all_hastus_trips_by_block,
         schedule_trips_by_id
       ) do
    if hastus_trips_in_piece != [] and
         List.first(hastus_trips_in_piece).start_time > activity.start_time do
      block_id = block_id_from_trips(hastus_trips_in_piece)

      hastus_trips_in_block =
        Map.get(all_hastus_trips_by_block, {activity.schedule_id, block_id}, [])

      hastus_trip_with_swing =
        Enum.find(hastus_trips_in_block, fn trip ->
          trip.start_time < activity.start_time && trip.end_time > activity.start_time
        end)

      if hastus_trip_with_swing do
        %{
          time: activity.start_time,
          trip: Map.fetch!(schedule_trips_by_id, hastus_trip_with_swing.trip_id)
        }
      else
        nil
      end
    else
      nil
    end
  end

  @spec end_mid_route?(__MODULE__.t(), [Hastus.Trip.t()]) :: boolean()
  defp end_mid_route?(%__MODULE__{activity_type: "Operator"} = activity, trips_in_piece) do
    trips_in_piece != [] and List.last(trips_in_piece).end_time > activity.end_time
  end

  @spec block_id_from_trips([Hastus.Trip.t()]) :: Block.id() | nil
  defp block_id_from_trips([]), do: nil
  defp block_id_from_trips([trip | _]), do: trip.block_id

  @spec set_pretty_names([Break.t() | Piece.t()], Timepoint.timepoint_names_by_id()) :: [
          Break.t() | Piece.t()
        ]
  defp set_pretty_names(pieces_and_breaks, timepoint_names_by_id) do
    Enum.map(
      pieces_and_breaks,
      fn piece_or_break ->
        case piece_or_break do
          %Break{} -> set_pretty_names_for_break(piece_or_break, timepoint_names_by_id)
          %Piece{} -> set_pretty_names_for_piece(piece_or_break, timepoint_names_by_id)
        end
      end
    )
  end

  @spec set_pretty_names_for_break(Break.t(), Timepoint.timepoint_names_by_id()) :: Break.t()
  defp set_pretty_names_for_break(break, timepoint_names_by_id) do
    pretty_start_place = Timepoint.pretty_name_for_id(timepoint_names_by_id, break.start_place)
    pretty_end_place = Timepoint.pretty_name_for_id(timepoint_names_by_id, break.end_place)

    %Break{
      break
      | start_place: pretty_start_place,
        end_place: pretty_end_place
    }
  end

  @spec set_pretty_names_for_piece(Piece.t(), Timepoint.timepoint_names_by_id()) :: Piece.t()
  defp set_pretty_names_for_piece(piece, timepoint_names_by_id) do
    trips_with_pretty_names =
      Enum.map(piece.trips, &Schedule.Trip.set_pretty_names(&1, timepoint_names_by_id))

    pretty_start_place = Timepoint.pretty_name_for_id(timepoint_names_by_id, piece.start_place)
    pretty_end_place = Timepoint.pretty_name_for_id(timepoint_names_by_id, piece.end_place)

    pretty_start_mid_route? =
      piece.start_mid_route? &&
        %{
          piece.start_mid_route?
          | trip:
              Schedule.Trip.set_pretty_names(piece.start_mid_route?.trip, timepoint_names_by_id)
        }

    %Piece{
      piece
      | trips: trips_with_pretty_names,
        start_place: pretty_start_place,
        end_place: pretty_end_place,
        start_mid_route?: pretty_start_mid_route?
    }
  end
end
