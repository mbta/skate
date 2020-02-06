defmodule Concentrate.Busloc do
  @moduledoc """
  Parser for GTFS-RT enhanced JSON files from Busloc.
  """
  @behaviour Concentrate.Parser
  require Logger

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
          operator_name: String.t()
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

    trip_id =
      vp
      |> Map.get("trip", %{})
      |> Map.get("trip_id", nil)

    if trip_id != nil do
      [
        %__MODULE__{
          id: Map.get(vehicle, "id"),
          trip_id: trip_id,
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
    else
      []
    end
  end
end
