defmodule Concentrate.BuslocTripUpdate do
  @moduledoc """
  Parser for GTFS-RT enhanced JSON files from Busloc.
  """
  @behaviour Concentrate.Parser
  require Logger

  defmodule StopTimeUpdate do
    alias Gtfs.Stop

    @type t :: %__MODULE__{
            stop_id: Stop.id(),
            remark: String.t() | nil,
            schedule_relationship: atom()
          }

    defstruct [
      :stop_id,
      :remark,
      schedule_relationship: :SCHEDULED
    ]

    @spec decode_stop_time_update(map()) :: t()
    def decode_stop_time_update(stu) do
      %__MODULE__{
        stop_id: Map.get(stu, "stop_id"),
        remark: Map.get(stu, "remark"),
        schedule_relationship: schedule_relationship(Map.get(stu, "schedule_relationship"))
      }
    end

    @spec schedule_relationship(String.t() | nil) :: atom()
    defp schedule_relationship(nil), do: :SCHEDULED

    for relationship <- ~w(SCHEDULED ADDED UNSCHEDULED CANCELED SKIPPED NO_DATA)a do
      defp schedule_relationship(unquote(Atom.to_string(relationship))), do: unquote(relationship)
    end
  end

  alias __MODULE__.StopTimeUpdate
  alias Gtfs.Trip
  alias Gtfs.Route

  @type t :: %__MODULE__{
          trip_id: Trip.id(),
          route_id: Route.id(),
          remark: String.t() | nil,
          stop_time_updates: [%__MODULE__.StopTimeUpdate{}]
        }

  defstruct [
    :trip_id,
    :route_id,
    :remark,
    stop_time_updates: []
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

  defp decode_feed_entity(%{"trip_update" => trip_update}), do: [decode_trip_update(trip_update)]

  defp decode_feed_entity(%{"vehicle" => %{}}), do: []

  defp decode_feed_entity(_), do: []

  @spec decode_trip_update(map()) :: t()
  def decode_trip_update(tu) do
    %__MODULE__{
      trip_id: tu |> Map.get("trip") |> Map.get("trip_id"),
      route_id: tu |> Map.get("trip") |> Map.get("route_id"),
      remark: Map.get(tu, "remark"),
      stop_time_updates:
        Enum.map(
          Map.get(tu, "stop_time_update"),
          &StopTimeUpdate.decode_stop_time_update/1
        )
    }
  end
end
