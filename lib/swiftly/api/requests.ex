defmodule Swiftly.API.Requests do
  @moduledoc """
  Module for constructing request objects for swiftly api requests.
  """

  alias Skate.Detours.Db.Detour

  alias Swiftly.API.ServiceAdjustments.{
    CreateAdjustmentRequestV1,
    DetourRouteDirectionCreationDetails,
    DetourV0CreationDetailsV1
  }

  require Logger

  @spec to_swiftly(Detour.t()) :: {:ok, CreateAdjustmentRequestV1.t()}
  def to_swiftly(detour) do
    {:ok,
     %CreateAdjustmentRequestV1{
       notes: Integer.to_string(detour.id),
       details: %DetourV0CreationDetailsV1{
         adjustmentType: :DETOUR_V0,
         beginTime: parse_begin_time(detour),
         detourRouteDirectionDetails: [
           %DetourRouteDirectionCreationDetails{
             routeShortName: detour.state["context"]["route"]["name"],
             direction: Integer.to_string(detour.state["context"]["routePattern"]["directionId"]),
             shape: parse_shape(detour),
             skippedStops: map_skipped_stops(detour)
           }
         ]
       }
     }}
  end

  defp parse_begin_time(%Detour{activated_at: activated_at}) when not is_nil(activated_at) do
    activated_at
    |> DateTime.shift_zone!("America/New_York")
    |> DateTime.to_iso8601()
  end

  defp parse_begin_time(_), do: nil

  defp parse_shape(%Detour{coordinates: coordinates}) when not is_nil(coordinates) do
    map_coordinates(coordinates)
  end

  defp parse_shape(%Detour{
         state: %{"context" => %{"detourShape" => %{"ok" => %{"coordinates" => coordinates}}}}
       })
       when not is_nil(coordinates) do
    map_coordinates(coordinates)
  end

  defp parse_shape(_), do: []

  defp map_coordinates(coordinates) do
    Enum.map(coordinates, fn %{"lat" => lat, "lon" => lon} -> [lat, lon] end)
  end

  defp map_skipped_stops(%Detour{state: %{"context" => %{"finishedDetour" => %{"missedStops" => [_ | _] = missed_stops}}}}) do
    Enum.map(missed_stops, fn missed_stop -> Map.get(missed_stop, "id") end)
  end

  defp map_skipped_stops(_), do: []
end
