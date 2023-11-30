defmodule Schedule.Garage do
  @moduledoc false

  alias Schedule.Gtfs.Route
  alias Schedule.Trip
  require Logger

  @type id :: String.t()

  @block_code_mapping %{
    "A" => "Albany",
    "B" => "Arborway",
    "C" => "Cabot",
    "D" => "Cabot / Albany",
    "F" => "Fellsway",
    "G" => "Charlestown",
    "H" => "Charlestown / Fellsway",
    "L" => "Lynn",
    "N" => "North Cambridge",
    "Q" => "Quincy",
    "S" => "Southampton",
    "T" => "Somerville"
  }

  @spec garage_for_block_code(String.t()) :: id() | nil
  # Ignore privately-operated routes and empty block IDs
  defp garage_for_block_code(block_code) when block_code in ["P", "J", "", nil] do
    nil
  end

  defp garage_for_block_code(block_code) do
    garage = @block_code_mapping[block_code]

    if is_nil(garage) do
      Logger.warn("#{__MODULE__}: Unrecognized block code: #{inspect(block_code)}")
    end

    garage
  end

  @spec add_garages_to_routes([Route.t()], Trip.by_id()) :: [Route.t()]
  def add_garages_to_routes(routes, trips_by_id) do
    routes_by_id = Map.new(routes, fn route -> {route.id, route} end)

    updated_routes_by_id =
      trips_by_id
      |> Map.values()
      |> Enum.reduce(routes_by_id, fn trip, acc ->
        route = acc[trip.route_id]

        with false <- is_nil(route),
             garage <- trip.block_id |> String.at(0) |> garage_for_block_code(),
             false <- is_nil(garage) do
          Map.put(acc, route.id, %Route{route | garages: MapSet.put(route.garages, garage)})
        else
          _ -> acc
        end
      end)

    Enum.map(routes, fn route -> updated_routes_by_id[route.id] end)
  end
end
