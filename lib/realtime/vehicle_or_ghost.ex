defmodule Realtime.VehicleOrGhost do
  alias Realtime.{Ghost, Server, Vehicle}

  @type t :: Vehicle.t() | Ghost.t()

  @spec find_by([t()], Server.search_params()) :: [t()]
  def find_by(vehicles, %{text: text, property: search_property, limit: limit}) do
    search_terms = text |> clean_for_matching |> Enum.reject(&(String.length(&1) < 2))

    if search_terms == [] do
      []
    else
      take_by_props_matching(
        vehicles,
        prop_names_for_search_prop(search_property),
        search_terms,
        limit,
        []
      )
    end
  end

  def find_by(vehicles, %{text: text, property: search_property}) do
    filter_by_prop_matching(
      vehicles,
      prop_names_for_search_prop(search_property),
      text
    )
  end

  @spec prop_names_for_search_prop(Server.search_property()) :: [atom()]
  defp prop_names_for_search_prop(:operator),
    do: [:operator_id, :operator_first_name, :operator_last_name]

  defp prop_names_for_search_prop(:vehicle), do: [:label]
  defp prop_names_for_search_prop(:run), do: [:run_id]

  defp prop_names_for_search_prop(:all),
    do: [:operator_id, :operator_first_name, :operator_last_name, :label, :run_id]

  @spec take_by_props_matching([t()], [atom()], [String.t()], pos_integer(), [t()]) :: [t()]
  defp take_by_props_matching(vehicles, _prop_names, _search_terms, limit, acc_matching_vehicles)
       when limit <= 0 or vehicles == [] do
    Enum.reverse(acc_matching_vehicles)
  end

  defp take_by_props_matching(
         [first_vehicle | remaining_vehicles],
         prop_names,
         search_terms,
         limit,
         acc_matching_vehicles
       ) do
    vehicle_matches = vehicle_matches_all_search_terms(first_vehicle, prop_names, search_terms)

    if vehicle_matches do
      take_by_props_matching(remaining_vehicles, prop_names, search_terms, limit - 1, [
        first_vehicle | acc_matching_vehicles
      ])
    else
      take_by_props_matching(
        remaining_vehicles,
        prop_names,
        search_terms,
        limit,
        acc_matching_vehicles
      )
    end
  end

  @spec filter_by_prop_matching([t()], [atom()], String.t()) :: [t()]
  defp filter_by_prop_matching(vehicles, prop_names, text) when is_list(prop_names) do
    search_terms = text |> clean_for_matching |> Enum.reject(&(String.length(&1) < 2))

    if search_terms == [] do
      []
    else
      Enum.filter(vehicles, &vehicle_matches_all_search_terms(&1, prop_names, search_terms))
    end
  end

  defp vehicle_matches_all_search_terms(vehicle, prop_names, search_terms) do
    Enum.all?(search_terms, fn search_term ->
      Enum.any?(prop_names, fn prop_name ->
        vehicle_matches?(vehicle, prop_name, search_term)
      end)
    end)
  end

  @spec vehicle_matches?(t(), atom(), String.t()) :: boolean()
  defp vehicle_matches?(vehicle, prop_name, text) do
    vehicle
    |> Map.get(prop_name, "")
    |> matches?(text)
  end

  @spec matches?(String.t() | nil, String.t()) :: boolean()
  defp matches?(nil, _text), do: false

  defp matches?("999-0" <> shuttle_run, text) do
    # special case to match shuttle runs even without the leading 0
    matches?("999" <> shuttle_run, text) || matches?("9990" <> shuttle_run, text)
  end

  defp matches?(prop, text) do
    prop_values = clean_for_matching(prop)

    text
    |> clean_for_matching
    |> Enum.all?(fn search_term ->
      Enum.any?(prop_values, fn prop_value -> String.contains?(prop_value, search_term) end)
    end)
  end

  @spec clean_for_matching(String.t()) :: [String.t()]
  defp clean_for_matching(str) do
    str
    |> String.downcase()
    |> String.replace("-", "")
    |> String.split(~r/[^\w]/)
  end
end
