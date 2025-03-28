defmodule Swiftly.Api.Requests do
  @moduledoc """
  Module for constructing request objects for swiftly api requests.
  """

  alias Skate.Detours.Db.Detour
  alias Swiftly.Api.Requests.{CreateAdjustmentRequestV1, DetourV0CreationDetailsV1}

  require Logger

  @spec to_swiftly(Detour.t()) :: {:ok, DetourV0CreationDetailsV1.t()} | :error
  def to_swiftly(%Detour{status: :active} = detour) do
    {:ok,
     %CreateAdjustmentRequestV1{
       feedId: "TEMP_FEED_ID",
       feedName: "TEMP_FEED_NAME",
       notes: Integer.to_string(detour.id),
       details: %DetourV0CreationDetailsV1{
         adjustmentType: :DETOUR_V0,
         beginTime: parse_begin_time(detour),
         detourRouteDirectionDetails: [
           %{
             routeShortName: detour.route_name,
             direction: Integer.to_string(detour.direction_id),
             shape: parse_shape(detour)
           }
         ]
       }
     }}
  end

  def to_swiftly(detour) do
    Logger.warning(
      "detour_not_active_to_swiftly detour_id=#{detour.id} status=#{inspect(detour.status)}"
    )

    :error
  end

  defp parse_begin_time(%Detour{activated_at: activated_at}) do
    activated_at |> DateTime.shift_zone!("America/New_York") |> DateTime.to_iso8601()
  end

  defp parse_shape(%Detour{coordinates: coordinates}) when not is_nil(coordinates) do
    map_coordinates(coordinates)
  end

  defp parse_shape(%Detour{state: state}) do
    coordinates = Map.get(state["context"]["detourShape"]["ok"], "coordinates")
    map_coordinates(coordinates)
  end

  defp map_coordinates(coordinates) do
    Enum.map(coordinates, fn %{"lat" => lat, "lon" => lon} -> [lat, lon] end)
  end
end
