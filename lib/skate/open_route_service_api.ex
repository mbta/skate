defmodule Skate.OpenRouteServiceAPI do
  @moduledoc """
  The OpenRouteServiceAPI context.
  """

  defmodule Skate.OpenRouteServiceAPI.DirectionsRequest do
    @moduledoc """
    The `Skate.DetourRoutes.directions/1` API struct
    """
    @derive Jason.Encoder
    defstruct coordinates: []
  end

  alias Skate.OpenRouteServiceAPI.DirectionsRequest

  def directions(coordinates) when is_list(coordinates) do
    directions(%DirectionsRequest{
      coordinates: coordinates
    })
  end

  def directions(%DirectionsRequest{} = request) do
    case HTTPoison.post(
           directions_api(),
           Jason.encode!(request),
           Authorization: api_key(),
           "Content-Type": "application/json"
         ) do
      {:ok, %HTTPoison.Response{body: body, status_code: 200}} ->
        Jason.decode(body, strings: :copy)

      {:ok, %HTTPoison.Response{status_code: 400, body: body}} ->
        {:error, Jason.decode!(body)["error"]}

      {:error, %HTTPoison.Error{}} ->
        nil
    end
  end

  defp directions_api do
    api_url()
    |> URI.merge("/v2/directions/driving-hgv/geojson")
    |> URI.to_string()
  end

  defp api_url, do: Application.get_env(:skate, __MODULE__)[:api_base_url]

  defp api_key, do: Application.get_env(:skate, __MODULE__)[:api_key]
end
