defmodule Skate.OpenRouteServiceAPI do
  @moduledoc """
  The OpenRouteServiceAPI context.
  """

  alias Skate.OpenRouteServiceAPI.DirectionsRequest
  alias Skate.OpenRouteServiceAPI.DirectionsResponse

  @doc """
  Returns a response from OpenRouteService containing coordinates of a route shape.

  The coordinates in both the input and the output for `directions/1` are formatted
  as maps with keys `lat` and `lon`.

  ## Example (with some fake API data)
      iex> Skate.OpenRouteServiceAPI.directions([%{"lat" => 0, "lon" => 0}, %{"lat" => 0, "lon" => 1}])
      {
        :ok,
        %Skate.OpenRouteServiceAPI.DirectionsResponse{
          coordinates: [
            %{"lat" => 0, "lon" => 0},
            %{"lat" => 0.5, "lon" => 0.1},
            %{"lat" => 1, "lon" => 0}
          ]
        }
      }

  If no coordinates are given, or only one is, then `directions/1` will bypass the actual
  API call and just return a response with an empty route shape.

  ## Examples
      iex> Skate.OpenRouteServiceAPI.directions([])
      {:ok, %Skate.OpenRouteServiceAPI.DirectionsResponse{coordinates: []}}

      iex> Skate.OpenRouteServiceAPI.directions([%{"lat" => 0, "lon" => 0}])
      {:ok, %Skate.OpenRouteServiceAPI.DirectionsResponse{coordinates: []}}

  If anything goes wrong, then this returns an error instead.

  ## Examples
      iex> Skate.OpenRouteServiceAPI.directions([%{"lat" => 0, "lon" => 10}, %{"lat" => 1, "lon" => 10}])
      {:error, %{"message" => "Invalid API Key"}}
  """
  @spec directions(list()) :: {:ok, DirectionsResponse.t()} | {:error, any()}
  def directions([]), do: {:ok, %DirectionsResponse{}}
  def directions([_]), do: {:ok, %DirectionsResponse{}}

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

      error ->
        error
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
