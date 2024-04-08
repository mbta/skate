defmodule Skate.OpenRouteServiceAPI.Client do
  @behaviour Skate.OpenRouteServiceAPI.Client
  @moduledoc """
  An HTTP Client that reaches out to Open Route Service
  """

  require Logger
  alias Skate.OpenRouteServiceAPI.DirectionsRequest

  @callback get_directions(DirectionsRequest.t()) :: {:ok, map()} | {:error, any()}

  @doc """
  Sends `request` to the OpenRouteService API and then sends the response through
  `parse_response/1` before returning it
  """
  @spec get_directions(DirectionsRequest.t()) :: {:ok, map()} | {:error, any()}
  def get_directions(request) do
    url = directions_api()
    Logger.info("ORS Directions URL: #{url}")

    response =
      HTTPoison.post(
        url,
        Jason.encode!(request),
        Authorization: api_key(),
        "Content-Type": "application/json"
      )

    parse_response(response)
  end

  @doc """
  Parses the HTTPoison response into something that's a little more HTTP-client agnostic.

  If the request was successful, it returns a tuple that includes the response parsed as JSON.

  ## Example
      iex> Skate.OpenRouteServiceAPI.Client.parse_response(
      ...>   {
      ...>     :ok,
      ...>     %HTTPoison.Response{
      ...>       body: "{\\"data\\": \\"foobar\\"}",
      ...>       status_code: 200
      ...>     }
      ...>   }
      ...> )
      {:ok, %{"data" => "foobar"}}

  If the request was unsuccessful, then it returns an error indicating what went wrong.

  ## Examples
      iex> Skate.OpenRouteServiceAPI.Client.parse_response(
      ...>   {
      ...>     :ok,
      ...>     %HTTPoison.Response{
      ...>       body: "{\\"error\\": \\"nope\\"}",
      ...>       status_code: 400
      ...>     }
      ...>   }
      ...> )
      {:error, "nope"}

      iex> Skate.OpenRouteServiceAPI.Client.parse_response(
      ...>   {
      ...>     :error,
      ...>     %HTTPoison.Error{}
      ...>   }
      ...> )
      {:error, "unknown"}
  """
  @spec parse_response({:ok, HTTPoison.Response.t()} | {:error, HTTPoison.Error.t()}) ::
          {:ok, map()} | {:error, any()}
  def parse_response(response) do
    case response do
      {:ok, %HTTPoison.Response{body: body, status_code: 200}} ->
        Jason.decode(body, strings: :copy)

      {:ok, %HTTPoison.Response{status_code: 400, body: body}} ->
        {:error, Jason.decode!(body)["error"]}

      {:ok, %HTTPoison.Response{status_code: 404, body: body}} ->
        {:error, Jason.decode!(body)["error"]}

      {:error, %HTTPoison.Error{}} ->
        Logger.error(response)
        {:error, "unknown"}
    end
  end

  defp directions_api do
    api_base_url()
    |> URI.merge(directions_path())
    |> URI.to_string()
  end

  defp api_base_url, do: Application.get_env(:skate, Skate.OpenRouteServiceAPI)[:api_base_url]

  defp directions_path,
    do: "v2/directions/driving-hgv/geojson"

  defp api_key, do: Application.get_env(:skate, Skate.OpenRouteServiceAPI)[:api_key]
end
