defmodule Realtime.VehicleOrGhost do
  alias Realtime.{Ghost, Server, Vehicle}

  @type t :: Vehicle.t() | Ghost.t()

  @spec find_by([t()], Server.search_params()) :: [t()]
  def find_by(vehicles, %{
        text: text,
        property: :all
      }),
      do: filter_by_prop_matching(vehicles, [:run_id, :id, :operator_id, :operator_name], text)

  def find_by(vehicles, %{
        text: text,
        property: :run
      }),
      do: filter_by_prop_matching(vehicles, :run_id, text)

  def find_by(vehicles, %{
        text: text,
        property: :vehicle
      }),
      do: filter_by_prop_matching(vehicles, :id, text)

  def find_by(vehicles, %{
        text: text,
        property: :operator
      }),
      do: filter_by_prop_matching(vehicles, [:operator_id, :operator_name], text)

  def find_by(vehicles, _), do: vehicles

  @spec filter_by_prop_matching([t()], atom() | [atom()], String.t()) :: [t()]
  defp filter_by_prop_matching(vehicles, prop_names, text) when is_list(prop_names) do
    Enum.filter(vehicles, fn vehicle ->
      Enum.any?(prop_names, fn prop_name ->
        vehicle_matches?(vehicle, prop_name, text)
      end)
    end)
  end

  defp filter_by_prop_matching(vehicles, prop_name, text) do
    Enum.filter(vehicles, &vehicle_matches?(&1, prop_name, text))
  end

  @spec vehicle_matches?(t(), atom(), String.t()) :: boolean()
  defp vehicle_matches?(vehicle, prop_name, text) do
    vehicle
    |> Map.get(prop_name, "")
    |> matches?(text)
  end

  @spec matches?(String.t(), String.t()) :: boolean()
  defp matches?(prop, text),
    do: String.contains?(clean_for_matching(prop), clean_for_matching(text))

  @spec clean_for_matching(String.t()) :: String.t()
  defp clean_for_matching(str) do
    str
    |> String.downcase()
    |> String.replace("-", "")
  end
end
