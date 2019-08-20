defmodule Gtfs.Route do
  alias Gtfs.{Csv, Data}

  @type id :: String.t()
  @type by_id(value) :: %{id() => value}

  @type t :: %__MODULE__{
          id: id(),
          description: String.t(),
          direction_names: direction_names(),
          name: String.t()
        }

  @type direction_names :: %{
          0 => String.t(),
          1 => String.t()
        }

  @enforce_keys [
    :id,
    :description,
    :direction_names,
    :name
  ]

  @derive Jason.Encoder

  defstruct [
    :id,
    :description,
    :direction_names,
    :name
  ]

  @spec from_csv_row(Csv.row(), Data.directions_by_route_and_id()) :: t()
  def from_csv_row(row, directions_by_route_id) do
    id = row["route_id"]
    description = row["route_desc"]
    route_directions = Map.get(directions_by_route_id, id)

    name = name(row)

    %__MODULE__{
      id: id,
      description: description,
      direction_names: %{
        0 => route_directions[0] && route_directions[0].direction_name,
        1 => route_directions[1] && route_directions[1].direction_name
      },
      name: name
    }
  end

  @spec name(Csv.row()) :: String.t()
  defp name(%{"route_short_name" => "", "route_long_name" => long_name}) do
    long_name
  end

  defp name(%{"route_short_name" => short_name}) do
    short_name
  end

  @spec bus_route_row?(Csv.row()) :: boolean
  def bus_route_row?(row) do
    # Verify that "route_type" exists on the row, especially to prevent issues while testing
    if row["route_type"] == nil do
      raise ArgumentError, message: "route_type is required on route rows"
    end

    row["route_type"] == "3"
  end

  @spec shuttle_route?(t) :: boolean
  def shuttle_route?(%__MODULE__{description: "Rail Replacement Bus"}), do: true
  def shuttle_route?(%__MODULE__{}), do: false
end
