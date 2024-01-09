defmodule Skate.OpenRouteServiceAPI do
  @moduledoc """
  The OpenRouteServiceAPI context.
  """

  alias Skate.OpenRouteServiceAPI.DirectionsRequest
  alias Skate.OpenRouteServiceAPI.DirectionsResponse

  def directions([_]) do
    {:ok, %DirectionsResponse{}}
  end

  def directions(coordinates) when is_list(coordinates) do
    request = %DirectionsRequest{
      coordinates:
        Enum.map(coordinates, fn
          %{"lat" => lat, "lon" => lon} -> [lon, lat]
        end)
    }

    case client().get_directions(request) do
      {:ok, payload} ->
        parse_directions(payload)

        #     error ->
        #       error
    end
  end

  defp parse_directions(payload) do
    %{"features" => [%{"geometry" => %{"coordinates" => coordinates}}]} = payload

    {:ok,
     %DirectionsResponse{
       coordinates: Enum.map(coordinates, fn [lon, lat] -> %{"lat" => lat, "lon" => lon} end)
     }}
  end

  defp client(), do: Application.get_env(:skate, Skate.OpenRouteServiceAPI)[:client]
end
