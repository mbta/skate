defmodule Concentrate.Busloc do
  @moduledoc """
  Parser for GTFS-RT enhanced JSON files from Busloc.
  """
  @behaviour Concentrate.Parser
  require Logger

  defmodule TripDescriptor do
    alias Gtfs.Direction
    alias Gtfs.Route
    alias Gtfs.Trip

    @type t :: %__MODULE__{
      trip_id: Trip.id(),
      route_id: Route.id(),
      direction_id: Direction.id(),
      start_date: :calendar.date(),
      start_time: :calendar.date(),
      schedule_relationship: atom()
    }

    defstruct [
      :trip_id,
      :route_id,
      :direction_id,
      :start_date,
      :start_time,
      schedule_relationship: :SCHEDULED
    ]
  end

  alias __MODULE__.TripDescriptor
  alias Gtfs.Block
  alias Gtfs.Run
  alias Gtfs.Trip

  @type t :: %__MODULE__{
    id: String.t(),
    trip_id: Trip.id(),
    label: String.t(),
    latitude: float(),
    longitude: float(),
    bearing: integer(),
    speed: float(),
    last_updated: Util.Time.timestamp(),
    block_id: Block.id() | nil,
    run_id: Run.id() | nil,
    operator_id: String.t(),
    operator_name: String.t(),
  }

  defstruct [
    :id,
    :trip_id,
    :label,
    :latitude,
    :longitude,
    :bearing,
    :speed,
    :last_updated,
    :block_id,
    :run_id,
    :operator_id,
    :operator_name
  ]

  @impl Concentrate.Parser
  def parse(binary) when is_binary(binary) do
    binary
    |> Jason.decode!(strings: :copy)
    |> decode_entities()
  end

  @spec decode_entities(map()) :: [t()]
  defp decode_entities(%{"entity" => entities}) do
    Enum.flat_map(entities, &decode_feed_entity(&1))
  end

  defp decode_feed_entity(%{"trip_update" => %{}}), do: []

  defp decode_feed_entity(%{"vehicle" => %{} = vehicle}), do: decode_vehicle(vehicle)

  defp decode_feed_entity(_), do: []

  @spec decode_vehicle(map()) :: [t()]
  def decode_vehicle(vp) do
    operator = Map.get(vp, "operator", %{})
    position = Map.get(vp, "position", %{})
    vehicle = Map.get(vp, "vehicle", %{})

    case decode_trip_descriptor(Map.get(vp, "trip")) do
      [trip] ->
        [
          %__MODULE__{
            id: Map.get(vehicle, "id"),
            trip_id: trip.trip_id,
            label: Map.get(vehicle, "label"),
            latitude: Map.get(position, "latitude"),
            longitude: Map.get(position, "longitude"),
            bearing: Map.get(position, "bearing"),
            speed: Map.get(position, "speed"),
            last_updated: Map.get(vp, "timestamp"),
            block_id: Map.get(vp, "block_id"),
            run_id: Map.get(vp, "run_id"),
            operator_id: Map.get(operator, "id"),
            operator_name: Map.get(operator, "name")
          }
        ]

      [] ->
        []
    end
  end

  @spec decode_trip_descriptor(map() | nil) :: [TripDescriptor.t()] | []
  defp decode_trip_descriptor(nil) do
    []
  end

  defp decode_trip_descriptor(trip) do
    [
      %TripDescriptor{
        trip_id: Map.get(trip, "trip_id"),
        route_id: Map.get(trip, "route_id"),
        direction_id: Map.get(trip, "direction_id"),
        start_date: date(Map.get(trip, "start_date")),
        start_time: Map.get(trip, "start_time"),
        schedule_relationship: schedule_relationship(Map.get(trip, "schedule_relationship"))
      }
    ]
  end

  @spec date(String.t() | nil) :: :calendar.date() | nil
  def date(nil) do
    nil
  end

  def date(<<year_str::binary-4, month_str::binary-2, day_str::binary-2>>) do
    {
      String.to_integer(year_str),
      String.to_integer(month_str),
      String.to_integer(day_str)
    }
  end

  def date(date) when is_binary(date) do
    {:ok, date} = Date.from_iso8601(date)
    Date.to_erl(date)
  end

  @spec schedule_relationship(String.t() | nil) :: atom()
  defp schedule_relationship(nil), do: :SCHEDULED

  for relationship <- ~w(SCHEDULED ADDED UNSCHEDULED CANCELED SKIPPED NO_DATA)a do
    defp schedule_relationship(unquote(Atom.to_string(relationship))), do: unquote(relationship)
  end

  @spec current_status(String.t() | nil) :: atom()
  # default
  defp current_status(nil), do: :IN_TRANSIT_TO

  for status <- ~w(INCOMING_AT STOPPED_AT IN_TRANSIT_TO)a do
    defp current_status(unquote(Atom.to_string(status))), do: unquote(status)
  end
end
