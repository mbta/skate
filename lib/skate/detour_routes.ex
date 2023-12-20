defmodule Skate.DetourRoutes do
  @moduledoc """
  The DetourRoutes context.
  """

  defmodule Skate.DetourRoutes.DirectionsRequest do
    @moduledoc """
    The `Skate.DetourRoutes.directions/1` API struct
    """
    @derive Jason.Encoder
    defstruct coordinates: []
  end

  def directions(coordinates) when is_list(coordinates) do
    directions(%Skate.DetourRoutes.DirectionsRequest{
      coordinates: coordinates
    })
  end

  def directions(%Skate.DetourRoutes.DirectionsRequest{} = request) do
    with {:ok, %HTTPoison.Response{body: body}} <-
           HTTPoison.post(
             directions_api(),
             Jason.encode!(request),
             Authorization: api_key(),
             "Content-Type": "application/json"
           ) do
      Jason.decode(body)
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
