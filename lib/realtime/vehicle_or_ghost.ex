defmodule Realtime.VehicleOrGhost do
  alias Realtime.{Ghost, Server, Vehicle}

  @type t :: Vehicle.t() | Ghost.t()

  @spec find_by([t()], Server.search_params()) :: [t()]
  def find_by(vehicles, %{
        text: text,
        property: :all
      }),
      do: filter_by_prop_matching(vehicles, [:run_id, :label, :operator_id, :operator_name], text)

  def find_by(vehicles, %{
        text: text,
        property: :run
      }),
      do: filter_by_prop_matching(vehicles, :run_id, text)

  def find_by(vehicles, %{
        text: text,
        property: :vehicle
      }),
      do: filter_by_prop_matching(vehicles, :label, text)

  def find_by(vehicles, %{
        text: text,
        property: :operator
      }),
      do: filter_by_prop_matching(vehicles, [:operator_id, :operator_name], text)

  @spec filter_by_prop_matching([t()], atom() | [atom()], String.t()) :: [t()]
  defp filter_by_prop_matching(vehicles, prop_names, text) when is_list(prop_names) do
    if String.length(clean_for_matching(text)) < 2 do
      []
    else
      Enum.filter(vehicles, fn vehicle ->
        Enum.any?(prop_names, fn prop_name ->
          vehicle_matches?(vehicle, prop_name, text)
        end)
      end)
    end
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
  defp matches?("999-0" <> shuttle_run, text) do
    # special case to match shuttle runs even without the leading 0
    matches?("999" <> shuttle_run, text) || matches?("9990" <> shuttle_run, text)
  end

  defp matches?(prop, text) do
    String.contains?(clean_for_matching(prop), clean_for_matching(text))
  end

  @spec clean_for_matching(String.t()) :: String.t()
  defp clean_for_matching(str) do
    str
    |> String.downcase()
    |> String.replace(" ", "")
    |> String.replace("-", "")
  end
end
