defmodule Schedule.Block do
  @moduledoc false

  alias Schedule.AsDirected
  alias Schedule.Gtfs.Service
  alias Schedule.Hastus
  alias Schedule.Piece
  alias Schedule.Trip

  require Logger

  @type id :: String.t()
  @typedoc """
  Block ids are repeated between different services.
  In order to uniquely identify a block, you need a Schedule.id() in addition to a Block.id()
  """
  @type key :: {Hastus.Schedule.id(), id()}
  @type by_id :: %{key() => t()}

  @type t :: %__MODULE__{
          id: id(),
          service_id: Service.id() | nil,
          schedule_id: Hastus.Schedule.id(),
          start_time: Util.Time.time_of_day(),
          end_time: Util.Time.time_of_day(),
          pieces: [Piece.t()]
        }

  @enforce_keys [
    :id,
    :service_id,
    :schedule_id,
    :start_time,
    :end_time,
    :pieces
  ]

  @derive {Jason.Encoder, only: [:id, :schedule_id, :pieces]}

  defstruct [
    :id,
    :service_id,
    :schedule_id,
    :start_time,
    :end_time,
    :pieces
  ]

  @spec key(t()) :: key()
  def key(block) do
    {block.schedule_id, block.id}
  end

  @spec blocks_from_pieces([Piece.t()]) :: by_id()
  def blocks_from_pieces(pieces) do
    pieces
    |> Enum.reject(&Piece.from_non_current_rating?/1)
    |> Enum.group_by(&Piece.block_key/1)
    |> Helpers.map_values(&block_from_pieces(&1))
  end

  @spec block_from_pieces([Piece.t()]) :: t()
  def block_from_pieces(pieces) do
    pieces = Enum.sort_by(pieces, & &1.start_time)
    first_piece = List.first(pieces)
    last_piece = List.last(pieces)

    first_revenue_trip =
      pieces
      |> Enum.flat_map(& &1.trips)
      |> Enum.find(&Trip.is_revenue_trip?/1)

    service_id =
      case first_revenue_trip do
        %Trip{service_id: service_id} -> service_id
        _ -> nil
      end

    %__MODULE__{
      id: first_piece.block_id,
      service_id: service_id,
      schedule_id: first_piece.schedule_id,
      start_time: first_piece.start_time,
      end_time: last_piece.end_time,
      pieces: pieces
    }
  end

  @spec revenue_trips(t()) :: [Trip.t()]
  def revenue_trips(%__MODULE__{pieces: pieces}) do
    pieces
    |> Enum.flat_map(& &1.trips)
    |> Enum.filter(&Trip.is_revenue_trip?/1)
  end

  @spec get(by_id(), Hastus.Schedule.id(), id()) :: t() | nil
  def get(by_id, schedule_id, block_id) do
    by_id[{schedule_id, block_id}]
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
  @spec next_revenue_trip(t(), Trip.id()) :: {:trip, Trip.t() | AsDirected.t()} | :last | :err
  def next_revenue_trip(block, trip_id) do
    trips = revenue_trips(block)

    case Enum.find_index(trips, &(&1.id == trip_id)) do
      nil ->
        :err

      index ->
        case Enum.at(trips, index + 1) do
          nil -> :last
          next_revenue_trip -> {:trip, next_revenue_trip}
        end
    end
  end

  @spec trip_at_time(t(), Util.Time.time_of_day()) :: Trip.t() | nil
  def trip_at_time(block, now) do
    cond do
      now <= block.start_time ->
        # Block isn't scheduled to have started yet
        block |> revenue_trips |> List.first()

      now >= block.end_time ->
        # Block is scheduled to have finished
        block |> revenue_trips |> List.last()

      true ->
        # Either the current trip or the trip that is about to start
        # If it's between the end of the last trip and the end of the block, use the last trip
        block |> revenue_trips |> Enum.find(fn trip -> trip.end_time > now end) ||
          block |> revenue_trips |> List.last()
    end
  end

  @spec pull_back_place_id(t() | nil) :: String.t() | nil
  def pull_back_place_id(block) do
    with true <- !is_nil(block),
         last_piece <- List.last(block.pieces),
         true <- !is_nil(last_piece),
         piece_trips <- last_piece.trips,
         last_piece_trip <- List.last(piece_trips),
         true <- !is_nil(last_piece_trip) do
      last_piece_trip.end_place
    else
      _ -> nil
    end
  end

  @spec overload?(id()) :: boolean
  def overload?(block_id), do: String.match?(block_id, overload_id_regex())

  @spec id_sans_overload(id() | nil) :: id() | nil
  def id_sans_overload(nil), do: nil

  def id_sans_overload(id), do: String.replace(id, overload_id_regex(), "")

  @spec date_for_block(t()) :: Date.t()
  def date_for_block(block) do
    active_blocks_fn =
      Application.get_env(:realtime, :active_blocks_fn, &Schedule.active_blocks/2)

    now = Util.Time.now()
    one_hour_ago = now - 60 * 60
    in_ten_minutes = now + 10 * 60

    {date, _blocks} =
      one_hour_ago
      |> active_blocks_fn.(in_ten_minutes)
      |> Enum.find(
        {Util.Time.today(), []},
        fn {_date, blocks} -> Enum.member?(blocks, block) end
      )

    date
  end

  defp overload_id_regex(), do: ~r/-OL.+$/
end
