defmodule Skate.Detours.Request do
  @moduledoc """
  Module for constructing request objects for detours.
  """

  defmodule Swiftly.CreateDetour do
    @moduledoc """
    Module to represent a DetourV0CreationDetailsV1 request for swiftly
    """
    defstruct [
      :adjustmentType,
      :detourRouteDirectionDetails
    ]

    @typedoc """
    "DETOUR_V0"
    """
    @type adjustment_type :: String.t()
    @typedoc """
    "0" | "1"
    """
    @type direction_id :: String.t()

    @type shape :: [[float()]]

    @type t :: %__MODULE__{
            adjustmentType: adjustment_type(),
            detourRouteDirectionDetails: %{
              routeShortName: String.t(),
              direction: direction_id(),
              shape: shape()
            }
          }
  end

  alias Skate.Detours.Db.Detour

  require Logger

  @spec to_swiftly(Detour.t()) :: {:ok, Swiftly.CreateDetour.t()} | :error
  def to_swiftly(%Detour{status: :active} = detour) do
    {:ok,
     %Swiftly.CreateDetour{
       adjustmentType: "DETOUR_V0",
       detourRouteDirectionDetails: [
         %{
           routeShortName: detour.route_id,
           direction: Integer.to_string(detour.direction_id),
           shape: parse_shape(detour)
         }
       ]
     }}
  end

  def to_swiftly(detour) do
    Logger.warning(
      "detour_not_active_to_swiftly detour_id=#{detour.id} status=#{inspect(detour.status)}"
    )

    :error
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
