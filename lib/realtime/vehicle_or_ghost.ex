defmodule Realtime.VehicleOrGhost do
  alias Realtime.{Ghost, Server, Vehicle}

  @type t :: Vehicle.t() | Ghost.t()

  @spec find_by([t()], Server.search_params()) :: [t()]
  def find_by(vehicles, %{
        text: text,
        property: :all
      }),
      do:
        filter_by_prop_matching(
          vehicles,
          [:run_id, :label, :operator_id, :operator_first_name, :operator_last_name],
          text
        )

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
      do:
        filter_by_prop_matching(
          vehicles,
          [:operator_id, :operator_first_name, :operator_last_name],
          text
        )

  @spec filter_by_prop_matching([t()], atom() | [atom()], String.t()) :: [t()]
  defp filter_by_prop_matching(vehicles, prop_names, text) when is_list(prop_names) do
    search_terms = text |> clean_for_matching |> Enum.reject(&(String.length(&1) < 1))

    if search_terms == [] do
      []
    else
      Enum.filter(vehicles, fn vehicle ->
        Enum.all?(search_terms, fn search_term ->
          Enum.any?(prop_names, fn prop_name ->
            vehicle_matches?(vehicle, prop_name, search_term)
          end)
        end)
      end)
    end
  end

  defp filter_by_prop_matching(vehicles, prop_name, text) do
    filter_by_prop_matching(vehicles, [prop_name], text)
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
