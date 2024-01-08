defmodule Skate.OpenRouteServiceAPI do
  @moduledoc """
  The OpenRouteServiceAPI context.
  """

  alias Skate.OpenRouteServiceAPI.DirectionsRequest
  alias Skate.OpenRouteServiceAPI.DirectionsResponse
  alias Skate.OpenRouteServiceAPI.Client

  def directions(coordinates) when is_list(coordinates) do
    directions(%DirectionsRequest{
      coordinates: Enum.map(coordinates, fn %{"lat" => lat, "lon" => lon} -> [lon, lat] end)
    })
  end

  def directions(%DirectionsRequest{} = request) do
    response = Client.get_directions(request)

    case response do
      {:ok, payload} ->
        parse_directions(payload)

      error ->
        error
    end
  end

  defp parse_directions({:ok, payload}) do
    %{"features" => [%{"geometry" => %{"coordinates" => coordinates}}]} = payload

    {:ok,
     %DirectionsResponse{
       coordinates: Enum.map(coordinates, fn [lon, lat] -> %{"lat" => lat, "lon" => lon} end)
     }}
  end
end
