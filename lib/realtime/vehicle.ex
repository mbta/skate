defmodule Realtime.Vehicle do
  @type current_status() :: :in_transit_to | :stopped_at

  @type t() :: %__MODULE__{
          id: String.t(),
          label: String.t(),
          timestamp: integer(),
          direction_id: Gtfs.Direction.id(),
          route_id: Gtfs.Route.id(),
          trip_id: Gtfs.Trip.id(),
          current_status: current_status(),
          stop_id: Gtfs.Stop.id()
        }

  @enforce_keys [
    :id,
    :label,
    :timestamp,
    :direction_id,
    :route_id,
    :trip_id,
    :current_status,
    :stop_id
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :label,
    :timestamp,
    :direction_id,
    :route_id,
    :trip_id,
    :current_status,
    :stop_id
  ]

  @doc """
    Argument is an Elixir object. Pass it through Jason before this function.
    json format for vehicles:
    {
      "id": "y0507",
      "vehicle": {
        "current_status": "IN_TRANSIT_TO",
        "current_stop_sequence": 3,
        "position": {
          "bearing": 0,
          "latitude": 42.35277354,
          "longitude": -71.0593878
        },
        "stop_id": "6555",
        "timestamp": 1554927574,
        "trip": {
          "direction_id": 0,
          "route_id": "505",
          "schedule_relationship": "SCHEDULED",
          "start_date": "20190410",
          "trip_id": "39984755"
        },
        "vehicle": { "id": "y0507", "label": "0507" }
      }
    }
  """
  @spec decode(term()) :: t()
  def decode(%{} = json) do
    %__MODULE__{
      id: json["id"],
      label: json["vehicle"]["vehicle"]["label"],
      timestamp: json["vehicle"]["timestamp"],
      direction_id: json["vehicle"]["trip"]["direction_id"],
      route_id: json["vehicle"]["trip"]["route_id"],
      trip_id: json["vehicle"]["trip"]["trip_id"],
      current_status: decode_current_status(json["vehicle"]["current_status"]),
      stop_id: json["vehicle"]["stop_id"]
    }
  end

  @spec decode_current_status(String.t()) :: current_status()
  defp decode_current_status("IN_TRANSIT_TO"), do: :in_transit_to
  defp decode_current_status("INCOMING_AT"), do: :in_transit_to
  defp decode_current_status("STOPPED_AT"), do: :stopped_at
end
