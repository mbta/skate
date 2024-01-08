defmodule Skate.OpenRouteServiceAPI.Client do
  @moduledoc """
  An HTTP Client that reaches out to Open Route Service
  """

  def get_directions(request) do
    response =
      HTTPoison.post(
        directions_api(),
        Jason.encode!(request),
        Authorization: api_key(),
        "Content-Type": "application/json"
      )

    case response do
      {:ok, %HTTPoison.Response{body: body, status_code: 200}} ->
        {:ok, Jason.decode(body, strings: :copy)}

      {:ok, %HTTPoison.Response{status_code: 400, body: body}} ->
        {:error, Jason.decode!(body)["error"]}

      {:error, %HTTPoison.Error{}} ->
        {:error, nil}
    end
  end

  defp directions_api do
    api_url()
    |> URI.merge("/v2/directions/driving-hgv/geojson")
    |> URI.to_string()
  end

  defp api_url, do: Application.get_env(:skate, Skate.OpenRouteServiceAPI)[:api_base_url]

  defp api_key, do: Application.get_env(:skate, Skate.OpenRouteServiceAPI)[:api_key]
end
