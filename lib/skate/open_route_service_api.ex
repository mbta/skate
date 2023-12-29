defmodule Skate.OpenRouteServiceAPI do
  @moduledoc """
  The OpenRouteServiceAPI context.
  """

  alias Skate.OpenRouteServiceAPI.DirectionsRequest
  alias Skate.OpenRouteServiceAPI.DirectionsResponse

  def directions(coordinates) when is_list(coordinates) do
    directions(%DirectionsRequest{
      coordinates: Enum.map(coordinates, fn %{"lat" => lat, "lon" => lon} -> [lon, lat] end)
    })
  end

  def directions(%DirectionsRequest{} = request) do
    response =
      HTTPoison.post(
        directions_api(),
        Jason.encode!(request),
        Authorization: api_key(),
        "Content-Type": "application/json"
      )

    case response do
      {:ok, %HTTPoison.Response{body: body, status_code: 200}} ->
        parse_directions(Jason.decode(body, strings: :copy))

      {:ok, %HTTPoison.Response{status_code: 400, body: body}} ->
        {:error, Jason.decode!(body)["error"]}

      {:error, %HTTPoison.Error{}} ->
        nil
    end
  end

  defp parse_directions({:ok, payload}) do
    %{"features" => [%{"geometry" => %{"coordinates" => coordinates}}]} = payload

    {:ok,
     %DirectionsResponse{
       coordinates: Enum.map(coordinates, fn [lon, lat] -> %{"lat" => lat, "lon" => lon} end)
     }}
  end

  defp directions_api do
    api_url()
    |> URI.merge("/v2/directions/driving-hgv/geojson")
    |> URI.to_string()
  end

  defp api_url, do: Application.get_env(:skate, __MODULE__)[:api_base_url]

  defp api_key, do: Application.get_env(:skate, __MODULE__)[:api_key]
end
